package uz.jalyuziepr.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import uz.jalyuziepr.api.dto.schema.*;
import uz.jalyuziepr.api.entity.AttributeFamily;

import java.util.*;

/**
 * Resolves the EFFECTIVE attribute schema for a leaf {@link AttributeFamily} by
 * cascading the root-to-leaf chain with CSS-style, property-level merge:
 * a descendant overrides individual properties of a same-key attribute and
 * inherits the rest. Tracks provenance for the UI.
 * <p>
 * Pure read operation — never mutates the persisted JSONB objects (defensive copies).
 * Must be invoked inside a transaction (walks the lazy {@code parent} chain).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AttributeSchemaResolver {

    private static final int MAX_CHAIN = 32; // hard safety cap

    private final ObjectMapper objectMapper;

    public ResolvedAttributeSchema resolveEffective(AttributeFamily leaf) {
        List<AttributeFamily> chain = buildRootToLeafChain(leaf);

        Map<String, ResolvedAttributeGroup> groupAcc = new LinkedHashMap<>();
        Map<String, ResolvedAttributeDefinition> attrAcc = new LinkedHashMap<>();

        for (AttributeFamily node : chain) {
            AttributeSchema delta = node.getAttributeSchema();
            if (delta != null) {
                mergeGroups(groupAcc, delta.getGroups(), node);
                mergeOwnAttributes(attrAcc, delta.getAttributes(), node, leaf.getId());
            }
            applyOverrides(attrAcc, node.getOverrides(), node);
        }

        finalizeOrigin(attrAcc.values(), leaf.getId());

        List<ResolvedAttributeGroup> groups = new ArrayList<>(groupAcc.values());
        groups.sort(Comparator.comparing(g -> g.getOrder() == null ? 0 : g.getOrder()));

        List<ResolvedAttributeDefinition> attrs = new ArrayList<>(attrAcc.values());
        attrs.sort(Comparator
                .comparing((ResolvedAttributeDefinition a) -> a.getGroup() == null ? "" : a.getGroup())
                .thenComparing(a -> a.getOrder() == null ? 0 : a.getOrder()));

        return ResolvedAttributeSchema.builder()
                .leafFamilyId(leaf.getId())
                .groups(groups)
                .attributes(attrs)
                .resolutionPath(buildPath(chain))
                .build();
    }

    // ---------------------------------------------------------------------

    private List<AttributeFamily> buildRootToLeafChain(AttributeFamily leaf) {
        Deque<AttributeFamily> stack = new ArrayDeque<>();
        Set<Long> visited = new HashSet<>();
        AttributeFamily cur = leaf;
        int guard = 0;
        while (cur != null) {
            if (cur.getId() != null && !visited.add(cur.getId())) {
                throw new IllegalStateException("Atribut oilasi daraxtida sikl aniqlandi (id=" + cur.getId() + ")");
            }
            stack.push(cur);
            if (++guard > MAX_CHAIN) {
                throw new IllegalStateException("Atribut oilasi daraxti juda chuqur (>" + MAX_CHAIN + ")");
            }
            cur = cur.getParent();
        }
        return new ArrayList<>(stack); // root -> leaf
    }

    private List<FamilyPathNode> buildPath(List<AttributeFamily> chain) {
        List<FamilyPathNode> path = new ArrayList<>();
        for (AttributeFamily f : chain) {
            path.add(FamilyPathNode.builder().id(f.getId()).code(f.getCode()).name(f.getName()).build());
        }
        return path;
    }

    private void mergeGroups(Map<String, ResolvedAttributeGroup> acc, List<AttributeGroup> groups, AttributeFamily node) {
        if (groups == null) return;
        for (AttributeGroup g : groups) {
            if (g.getKey() == null) continue;
            ResolvedAttributeGroup existing = acc.get(g.getKey());
            if (existing == null) {
                acc.put(g.getKey(), ResolvedAttributeGroup.builder()
                        .key(g.getKey()).label(g.getLabel()).order(g.getOrder())
                        .ownerFamilyId(node.getId()).overridden(false).build());
            } else {
                if (g.getLabel() != null) existing.setLabel(g.getLabel());
                if (g.getOrder() != null) existing.setOrder(g.getOrder());
                existing.setOwnerFamilyId(node.getId());
                existing.setOverridden(true);
            }
        }
    }

    private void mergeOwnAttributes(Map<String, ResolvedAttributeDefinition> acc,
                                    List<AttributeDefinition> attributes,
                                    AttributeFamily node, Long leafId) {
        if (attributes == null) return;
        for (AttributeDefinition a : attributes) {
            if (a.getKey() == null) continue;
            ResolvedAttributeDefinition existing = acc.get(a.getKey());
            if (existing == null) {
                ResolvedAttributeDefinition r = new ResolvedAttributeDefinition();
                copyBaseInto(a, r);
                r.setOwnerFamilyId(node.getId());
                acc.put(a.getKey(), r);
            } else {
                // Same key redeclared deeper as an OWN attribute → treat as full property replace.
                copyNonNullInto(a, existing, node);
                existing.setOwnerFamilyId(node.getId());
            }
        }
    }

    private void applyOverrides(Map<String, ResolvedAttributeDefinition> acc,
                                List<AttributeOverride> overrides, AttributeFamily node) {
        if (overrides == null) return;
        for (AttributeOverride ov : overrides) {
            if (ov.getKey() == null) continue;
            ResolvedAttributeDefinition target = acc.get(ov.getKey());
            if (target == null) {
                log.debug("Override '{}' on family {} targets unknown inherited attribute — ignored",
                        ov.getKey(), node.getCode());
                continue;
            }
            Map<String, Object> props = ov.getChangedProps();
            if (props == null) continue;
            for (Map.Entry<String, Object> e : props.entrySet()) {
                applyProperty(target, e.getKey(), e.getValue(), node);
            }
        }
    }

    /**
     * Apply a single overridden property to the resolved attribute (CSS cascade).
     * {@code dataType} changes are intentionally ignored on the read path
     * (rejected at write time by the service).
     */
    private void applyProperty(ResolvedAttributeDefinition dst, String prop, Object val, AttributeFamily node) {
        boolean handled = true;
        switch (prop) {
            case "label" -> dst.setLabel(asString(val));
            case "group" -> dst.setGroup(asString(val));
            case "unit" -> dst.setUnit(asString(val));
            case "placeholder" -> dst.setPlaceholder(asString(val));
            case "helpText" -> dst.setHelpText(asString(val));
            case "order" -> dst.setOrder(objectMapper.convertValue(val, Integer.class));
            case "defaultValue" -> dst.setDefaultValue(val);
            case "required" -> dst.setRequired(objectMapper.convertValue(val, Boolean.class));
            case "readonly" -> dst.setReadonly(objectMapper.convertValue(val, Boolean.class));
            case "searchable" -> dst.setSearchable(objectMapper.convertValue(val, Boolean.class));
            case "filterable" -> dst.setFilterable(objectMapper.convertValue(val, Boolean.class));
            case "sortable" -> dst.setSortable(objectMapper.convertValue(val, Boolean.class));
            case "options" -> dst.setOptions(convertOptions(val)); // REPLACE
            case "validation" -> dst.setValidation(mergeValidation(dst.getValidation(), convertValidation(val)));
            case "dataType" -> { /* ignored on read path */ }
            default -> handled = false;
        }
        if (handled && !"dataType".equals(prop)) {
            dst.getPropertyProvenance().put(prop,
                    PropertyProvenance.builder()
                            .sourceFamilyId(node.getId())
                            .sourceFamilyCode(node.getCode())
                            .overridden(true)
                            .build());
        }
    }

    /**
     * Property-level merge of validation rules — a fresh object, never mutating the base.
     */
    private ValidationRules mergeValidation(ValidationRules base, ValidationRules override) {
        if (override == null) return base;
        ValidationRules out = new ValidationRules();
        out.setRequired(override.getRequired() != null ? override.getRequired() : (base != null ? base.getRequired() : null));
        out.setMin(override.getMin() != null ? override.getMin() : (base != null ? base.getMin() : null));
        out.setMax(override.getMax() != null ? override.getMax() : (base != null ? base.getMax() : null));
        out.setMinLength(override.getMinLength() != null ? override.getMinLength() : (base != null ? base.getMinLength() : null));
        out.setMaxLength(override.getMaxLength() != null ? override.getMaxLength() : (base != null ? base.getMaxLength() : null));
        out.setPattern(override.getPattern() != null ? override.getPattern() : (base != null ? base.getPattern() : null));
        out.setMessage(override.getMessage() != null ? override.getMessage() : (base != null ? base.getMessage() : null));
        return out;
    }

    private void finalizeOrigin(Collection<ResolvedAttributeDefinition> attrs, Long leafId) {
        for (ResolvedAttributeDefinition a : attrs) {
            boolean anyOverridden = a.getPropertyProvenance().values().stream().anyMatch(PropertyProvenance::isOverridden);
            if (anyOverridden) {
                a.setOrigin(ResolvedAttributeDefinition.ORIGIN_OVERRIDDEN);
            } else if (Objects.equals(a.getOwnerFamilyId(), leafId)) {
                a.setOrigin(ResolvedAttributeDefinition.ORIGIN_OWN);
            } else {
                a.setOrigin(ResolvedAttributeDefinition.ORIGIN_INHERITED);
            }
        }
    }

    // ---- copy helpers (defensive; never mutate the source JSONB objects) ----

    private void copyBaseInto(AttributeDefinition src, ResolvedAttributeDefinition dst) {
        dst.setKey(src.getKey());
        dst.setLabel(src.getLabel());
        dst.setDataType(src.getDataType());
        dst.setGroup(src.getGroup());
        dst.setOrder(src.getOrder());
        dst.setUnit(src.getUnit());
        dst.setPlaceholder(src.getPlaceholder());
        dst.setHelpText(src.getHelpText());
        dst.setDefaultValue(src.getDefaultValue());
        dst.setRequired(src.getRequired());
        dst.setReadonly(src.getReadonly());
        dst.setSearchable(src.getSearchable());
        dst.setFilterable(src.getFilterable());
        dst.setSortable(src.getSortable());
        dst.setOptions(src.getOptions() != null ? new ArrayList<>(src.getOptions()) : null);
        dst.setValidation(src.getValidation());
    }

    private void copyNonNullInto(AttributeDefinition src, ResolvedAttributeDefinition dst, AttributeFamily node) {
        if (src.getLabel() != null) { dst.setLabel(src.getLabel()); mark(dst, "label", node); }
        if (src.getGroup() != null) { dst.setGroup(src.getGroup()); mark(dst, "group", node); }
        if (src.getOrder() != null) { dst.setOrder(src.getOrder()); mark(dst, "order", node); }
        if (src.getUnit() != null) { dst.setUnit(src.getUnit()); mark(dst, "unit", node); }
        if (src.getPlaceholder() != null) { dst.setPlaceholder(src.getPlaceholder()); mark(dst, "placeholder", node); }
        if (src.getHelpText() != null) { dst.setHelpText(src.getHelpText()); mark(dst, "helpText", node); }
        if (src.getDefaultValue() != null) { dst.setDefaultValue(src.getDefaultValue()); mark(dst, "defaultValue", node); }
        if (src.getRequired() != null) { dst.setRequired(src.getRequired()); mark(dst, "required", node); }
        if (src.getOptions() != null) { dst.setOptions(new ArrayList<>(src.getOptions())); mark(dst, "options", node); }
        if (src.getValidation() != null) { dst.setValidation(mergeValidation(dst.getValidation(), src.getValidation())); mark(dst, "validation", node); }
    }

    private void mark(ResolvedAttributeDefinition dst, String prop, AttributeFamily node) {
        dst.getPropertyProvenance().put(prop, PropertyProvenance.builder()
                .sourceFamilyId(node.getId()).sourceFamilyCode(node.getCode()).overridden(true).build());
    }

    private String asString(Object v) {
        return v == null ? null : String.valueOf(v);
    }

    @SuppressWarnings("unchecked")
    private List<SelectOption> convertOptions(Object val) {
        if (val == null) return null;
        return objectMapper.convertValue(val,
                objectMapper.getTypeFactory().constructCollectionType(List.class, SelectOption.class));
    }

    private ValidationRules convertValidation(Object val) {
        if (val == null) return null;
        return objectMapper.convertValue(val, ValidationRules.class);
    }
}
