package uz.jalyuziepr.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.jalyuziepr.api.dto.request.AttributeFamilyRequest;
import uz.jalyuziepr.api.dto.response.AttributeFamilyResponse;
import uz.jalyuziepr.api.dto.schema.*;
import uz.jalyuziepr.api.entity.AttributeFamily;
import uz.jalyuziepr.api.entity.ProductType;
import uz.jalyuziepr.api.entity.User;
import uz.jalyuziepr.api.exception.BadRequestException;
import uz.jalyuziepr.api.exception.ResourceNotFoundException;
import uz.jalyuziepr.api.repository.AttributeFamilyRepository;
import uz.jalyuziepr.api.repository.ProductTypeRepository;
import uz.jalyuziepr.api.repository.UserRepository;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for the hierarchical attribute family tree.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AttributeFamilyService {

    private static final int MAX_DEPTH = 6;

    private final AttributeFamilyRepository familyRepository;
    private final ProductTypeRepository productTypeRepository;
    private final UserRepository userRepository;
    private final AttributeSchemaResolver schemaResolver;

    // ============================ READ ============================

    @Transactional(readOnly = true)
    public List<AttributeFamilyResponse> getTree() {
        List<AttributeFamily> all = familyRepository.findByIsActiveTrueOrderByDepthAscDisplayOrderAscIdAsc();
        List<AttributeFamilyResponse> responses = all.stream().map(AttributeFamilyResponse::from).toList();

        Map<Long, List<AttributeFamilyResponse>> childrenByParent = new LinkedHashMap<>();
        for (AttributeFamilyResponse r : responses) {
            if (r.getParentId() != null) {
                childrenByParent.computeIfAbsent(r.getParentId(), k -> new ArrayList<>()).add(r);
            }
        }
        for (AttributeFamilyResponse r : responses) {
            List<AttributeFamilyResponse> ch = childrenByParent.get(r.getId());
            r.setLeaf(ch == null || ch.isEmpty());
            r.setChildren(ch);
        }
        return responses.stream().filter(r -> r.getParentId() == null).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AttributeFamilyResponse> getLeaves() {
        List<AttributeFamily> all = familyRepository.findByIsActiveTrueOrderByDepthAscDisplayOrderAscIdAsc();
        Set<Long> parents = all.stream()
                .filter(f -> f.getParent() != null)
                .map(f -> f.getParent().getId())
                .collect(Collectors.toSet());
        return all.stream()
                .filter(f -> !parents.contains(f.getId()))
                .map(f -> {
                    AttributeFamilyResponse r = AttributeFamilyResponse.from(f);
                    r.setLeaf(true);
                    return r;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AttributeFamilyResponse getById(Long id) {
        AttributeFamily f = find(id);
        AttributeFamilyResponse r = AttributeFamilyResponse.from(f);
        r.setLeaf(familyRepository.isLeaf(id));
        r.setProductCount(familyRepository.countProductsByAttributeFamilyId(id));
        List<AttributeFamilyResponse> children = familyRepository
                .findByParentIdAndIsActiveTrueOrderByDisplayOrderAscIdAsc(id)
                .stream().map(AttributeFamilyResponse::from).toList();
        r.setChildren(children.isEmpty() ? null : children);
        return r;
    }

    @Transactional(readOnly = true)
    public ResolvedAttributeSchema getEffectiveSchema(Long id) {
        AttributeFamily f = find(id);
        return schemaResolver.resolveEffective(f);
    }

    // ============================ CREATE / UPDATE ============================

    @Transactional
    public AttributeFamilyResponse create(AttributeFamilyRequest request) {
        if (familyRepository.existsByCode(request.getCode())) {
            throw new BadRequestException("Bu kod allaqachon mavjud: " + request.getCode());
        }

        AttributeFamily parent = resolveParent(request.getParentId());
        int depth = parent != null ? parent.getDepth() + 1 : 0;
        if (depth > MAX_DEPTH) {
            throw new BadRequestException("Daraxt juda chuqur (maksimal " + MAX_DEPTH + " daraja)");
        }

        AttributeFamily family = AttributeFamily.builder()
                .code(request.getCode())
                .name(request.getName())
                .description(request.getDescription())
                .icon(request.getIcon())
                .color(request.getColor())
                .parent(parent)
                .productType(resolveProductType(request.getProductTypeId()))
                .attributeSchema(request.getAttributeSchema() != null ? request.getAttributeSchema() : new AttributeSchema())
                .overrides(request.getOverrides() != null ? request.getOverrides() : new ArrayList<>())
                .depth(depth)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .isSystem(false)
                .isActive(true)
                .createdBy(getCurrentUser())
                .build();

        family = familyRepository.save(family); // assigns id
        family.setPath(buildPath(parent, family.getId()));
        family = familyRepository.save(family);

        log.info("Created attribute family: {} ({}), depth={}", family.getName(), family.getCode(), depth);
        return getById(family.getId());
    }

    @Transactional
    public AttributeFamilyResponse update(Long id, AttributeFamilyRequest request) {
        AttributeFamily family = find(id);

        if (!family.getCode().equals(request.getCode())) {
            if (Boolean.TRUE.equals(family.getIsSystem())) {
                throw new BadRequestException("Tizimiy tugun kodini o'zgartirib bo'lmaydi");
            }
            if (familyRepository.existsByCode(request.getCode())) {
                throw new BadRequestException("Bu kod allaqachon mavjud: " + request.getCode());
            }
            family.setCode(request.getCode());
        }

        family.setName(request.getName());
        family.setDescription(request.getDescription());
        family.setIcon(request.getIcon());
        family.setColor(request.getColor());
        if (request.getDisplayOrder() != null) family.setDisplayOrder(request.getDisplayOrder());
        family.setProductType(resolveProductType(request.getProductTypeId()));
        if (request.getAttributeSchema() != null) family.setAttributeSchema(request.getAttributeSchema());
        if (request.getOverrides() != null) family.setOverrides(request.getOverrides());

        familyRepository.save(family);
        log.info("Updated attribute family: {} ({})", family.getName(), family.getCode());
        return getById(id);
    }

    @Transactional
    public AttributeFamilyResponse move(Long id, Long newParentId) {
        AttributeFamily node = find(id);
        if (Objects.equals(id, newParentId)) {
            throw new BadRequestException("Tugun o'ziga ota bo'la olmaydi");
        }
        AttributeFamily newParent = resolveParent(newParentId);
        if (newParent != null && newParent.getPath() != null && newParent.getPath().contains("/" + id + "/")) {
            throw new BadRequestException("Siklik bog'lanish: tanlangan ota joriy tugunning avlodi");
        }

        String oldPath = node.getPath();
        int newDepth = newParent != null ? newParent.getDepth() + 1 : 0;
        int depthDelta = newDepth - node.getDepth();
        String newPath = buildPath(newParent, id);

        List<AttributeFamily> subtree = oldPath != null
                ? familyRepository.findByPathStartingWith(oldPath)
                : List.of(node);

        int maxDescendantDepth = subtree.stream().mapToInt(AttributeFamily::getDepth).max().orElse(node.getDepth());
        if (maxDescendantDepth + depthDelta > MAX_DEPTH) {
            throw new BadRequestException("Ko'chirish daraxtni juda chuqur qiladi (maksimal " + MAX_DEPTH + ")");
        }

        for (AttributeFamily d : subtree) {
            if (oldPath != null && d.getPath() != null && d.getPath().startsWith(oldPath)) {
                d.setPath(newPath + d.getPath().substring(oldPath.length()));
            }
            d.setDepth(d.getDepth() + depthDelta);
        }
        node.setParent(newParent);
        familyRepository.saveAll(subtree);
        if (!subtree.contains(node)) familyRepository.save(node);

        log.info("Moved attribute family {} under {}", id, newParentId);
        return getById(id);
    }

    @Transactional
    public AttributeFamilyResponse updateSchema(Long id, AttributeSchema schema) {
        AttributeFamily family = find(id);
        family.setAttributeSchema(schema != null ? schema : new AttributeSchema());
        familyRepository.save(family);
        return getById(id);
    }

    // ============================ OWN ATTRIBUTES ============================

    @Transactional
    public AttributeFamilyResponse addAttribute(Long id, AttributeDefinition attribute) {
        AttributeFamily family = find(id);
        AttributeSchema schema = ensureSchema(family);
        if (schema.findAttribute(attribute.getKey()) != null) {
            throw new BadRequestException("Bu atribut kaliti allaqachon mavjud: " + attribute.getKey());
        }
        if (schema.getAttributes() == null) schema.setAttributes(new ArrayList<>());
        schema.getAttributes().add(attribute);
        family.setAttributeSchema(schema);
        familyRepository.save(family);
        return getById(id);
    }

    @Transactional
    public AttributeFamilyResponse updateAttribute(Long id, String key, AttributeDefinition attribute) {
        AttributeFamily family = find(id);
        AttributeSchema schema = ensureSchema(family);
        List<AttributeDefinition> attrs = schema.getAttributes();
        if (attrs == null) throw new BadRequestException("Atribut topilmadi: " + key);
        boolean found = false;
        for (int i = 0; i < attrs.size(); i++) {
            if (key.equals(attrs.get(i).getKey())) {
                attrs.set(i, attribute);
                found = true;
                break;
            }
        }
        if (!found) throw new BadRequestException("Atribut topilmadi: " + key);
        family.setAttributeSchema(schema);
        familyRepository.save(family);
        return getById(id);
    }

    @Transactional
    public AttributeFamilyResponse removeAttribute(Long id, String key) {
        AttributeFamily family = find(id);
        AttributeSchema schema = ensureSchema(family);
        if (schema.getAttributes() == null || !schema.getAttributes().removeIf(a -> key.equals(a.getKey()))) {
            throw new BadRequestException("Atribut topilmadi: " + key);
        }
        family.setAttributeSchema(schema);
        familyRepository.save(family);
        return getById(id);
    }

    // ============================ OVERRIDES ============================

    @Transactional
    public AttributeFamilyResponse setOverride(Long id, String key, Map<String, Object> changedProps) {
        AttributeFamily family = find(id);
        if (changedProps == null || changedProps.isEmpty()) {
            throw new BadRequestException("Override uchun o'zgartiriladigan xossa kiritilmagan");
        }
        if (changedProps.containsKey("dataType")) {
            throw new BadRequestException("Ma'lumot turini (dataType) override qilib bo'lmaydi");
        }
        changedProps.remove("key");

        // The key must exist as an INHERITED attribute (not own) of this node.
        boolean ownHasKey = family.getAttributeSchema() != null
                && family.getAttributeSchema().findAttribute(key) != null;
        if (ownHasKey) {
            throw new BadRequestException("Bu atribut shu tugunning o'ziniki — override emas, balki to'g'ridan-to'g'ri tahrirlang");
        }
        ResolvedAttributeSchema effective = schemaResolver.resolveEffective(family);
        if (effective.findAttribute(key) == null) {
            throw new BadRequestException("Meros olingan bunday atribut yo'q: " + key);
        }

        List<AttributeOverride> overrides = family.getOverrides() != null ? family.getOverrides() : new ArrayList<>();
        AttributeOverride existing = overrides.stream().filter(o -> key.equals(o.getKey())).findFirst().orElse(null);
        if (existing != null) {
            existing.setChangedProps(changedProps);
        } else {
            overrides.add(AttributeOverride.builder().key(key).changedProps(changedProps).build());
        }
        family.setOverrides(overrides);
        familyRepository.save(family);
        log.info("Set override '{}' on family {}", key, family.getCode());
        return getById(id);
    }

    @Transactional
    public AttributeFamilyResponse clearOverride(Long id, String key) {
        AttributeFamily family = find(id);
        List<AttributeOverride> overrides = family.getOverrides();
        if (overrides == null || !overrides.removeIf(o -> key.equals(o.getKey()))) {
            throw new BadRequestException("Override topilmadi: " + key);
        }
        family.setOverrides(overrides);
        familyRepository.save(family);
        return getById(id);
    }

    // ============================ DELETE ============================

    @Transactional
    public void delete(Long id) {
        AttributeFamily family = find(id);
        if (Boolean.TRUE.equals(family.getIsSystem())) {
            throw new BadRequestException("Tizimiy tugunni o'chirib bo'lmaydi");
        }
        long children = familyRepository.countByParentIdAndIsActiveTrue(id);
        if (children > 0) {
            throw new BadRequestException(String.format("Bu tugunda %d ta avlod bor. Avval ularni ko'chiring yoki o'chiring.", children));
        }
        long products = familyRepository.countProductsByAttributeFamilyId(id);
        if (products > 0) {
            throw new BadRequestException(String.format("Bu tugunda %d ta mahsulot bor.", products));
        }
        family.setIsActive(false);
        familyRepository.save(family);
        log.info("Deleted (deactivated) attribute family: {} ({})", family.getName(), family.getCode());
    }

    // ============================ HELPERS ============================

    private AttributeFamily find(Long id) {
        return familyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Atribut oilasi", "id", id));
    }

    private AttributeFamily resolveParent(Long parentId) {
        if (parentId == null) return null;
        return familyRepository.findById(parentId)
                .orElseThrow(() -> new ResourceNotFoundException("Ota tugun", "id", parentId));
    }

    private ProductType resolveProductType(Long productTypeId) {
        if (productTypeId == null) return null;
        return productTypeRepository.findById(productTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("Mahsulot turi", "id", productTypeId));
    }

    private AttributeSchema ensureSchema(AttributeFamily family) {
        AttributeSchema schema = family.getAttributeSchema();
        return schema != null ? schema : new AttributeSchema();
    }

    private String buildPath(AttributeFamily parent, Long id) {
        return (parent != null && parent.getPath() != null ? parent.getPath() : "/") + id + "/";
    }

    private User getCurrentUser() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            return userRepository.findByUsername(username).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
}
