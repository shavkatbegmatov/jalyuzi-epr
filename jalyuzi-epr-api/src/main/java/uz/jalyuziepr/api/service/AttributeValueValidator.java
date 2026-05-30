package uz.jalyuziepr.api.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import uz.jalyuziepr.api.dto.schema.ResolvedAttributeDefinition;
import uz.jalyuziepr.api.dto.schema.ResolvedAttributeSchema;
import uz.jalyuziepr.api.dto.schema.SelectOption;
import uz.jalyuziepr.api.dto.schema.ValidationRules;
import uz.jalyuziepr.api.exception.AttributeValidationException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.*;

/**
 * Validates a product's {@code customAttributes} against an effective
 * (resolved) attribute schema: required, data type, select membership, and
 * ValidationRules (min/max, length, pattern).
 * <p>
 * Mode (app.attribute-validation.mode):
 * <ul>
 *   <li>STRICT — every violation (required, type, options, range, unknown key) rejects.</li>
 *   <li>LENIENT — only "required" violations reject; type/option/range/unknown are logged
 *       as warnings (migration window).</li>
 * </ul>
 */
@Service
@Slf4j
public class AttributeValueValidator {

    public enum Mode { STRICT, LENIENT }

    private final Mode mode;

    public AttributeValueValidator(@Value("${app.attribute-validation.mode:LENIENT}") String mode) {
        Mode parsed;
        try {
            parsed = Mode.valueOf(mode.trim().toUpperCase());
        } catch (Exception e) {
            parsed = Mode.LENIENT;
        }
        this.mode = parsed;
        log.info("AttributeValueValidator mode = {}", this.mode);
    }

    public void validate(ResolvedAttributeSchema schema, Map<String, Object> rawValues) {
        Map<String, Object> values = rawValues != null ? rawValues : Map.of();
        Map<String, String> hardErrors = new LinkedHashMap<>(); // required — always enforced
        Map<String, String> softErrors = new LinkedHashMap<>(); // type/options/range/unknown

        Set<String> knownKeys = new HashSet<>();

        List<ResolvedAttributeDefinition> attrs =
                schema.getAttributes() != null ? schema.getAttributes() : List.of();

        for (ResolvedAttributeDefinition attr : attrs) {
            String key = attr.getKey();
            if (key == null) continue;
            knownKeys.add(key);
            String label = attr.getLabel() != null ? attr.getLabel() : key;
            Object value = values.get(key);

            boolean required = Boolean.TRUE.equals(attr.getRequired())
                    || (attr.getValidation() != null && Boolean.TRUE.equals(attr.getValidation().getRequired()));
            if (required && isEmpty(value)) {
                hardErrors.put(key, label + " maydoni to'ldirilishi shart");
                continue;
            }
            if (isEmpty(value)) continue; // optional & empty → skip further checks

            String typeError = validateType(attr, label, value);
            if (typeError != null) {
                softErrors.put(key, typeError);
                continue;
            }
            String ruleError = validateRules(attr, label, value);
            if (ruleError != null) {
                softErrors.put(key, ruleError);
            }
        }

        // Unknown keys
        for (String key : values.keySet()) {
            if (!knownKeys.contains(key)) {
                softErrors.put(key, "Noma'lum atribut: " + key);
            }
        }

        if (mode == Mode.LENIENT) {
            if (!softErrors.isEmpty()) {
                log.warn("Attribute validation (LENIENT) ignored {} soft error(s): {}", softErrors.size(), softErrors);
            }
            if (!hardErrors.isEmpty()) {
                throw new AttributeValidationException(hardErrors);
            }
        } else {
            Map<String, String> all = new LinkedHashMap<>();
            all.putAll(hardErrors);
            all.putAll(softErrors);
            if (!all.isEmpty()) {
                throw new AttributeValidationException(all);
            }
        }
    }

    // -------------------------------------------------------------------

    private String validateType(ResolvedAttributeDefinition attr, String label, Object value) {
        String dt = attr.getDataType() != null ? attr.getDataType() : "text";
        switch (dt) {
            case "number" -> {
                BigDecimal n = toBigDecimal(value);
                if (n == null) return label + ": butun son kiriting";
                if (n.stripTrailingZeros().scale() > 0) return label + ": butun son kiriting (kasrsiz)";
            }
            case "decimal", "currency" -> {
                if (toBigDecimal(value) == null) return label + ": raqam kiriting";
            }
            case "boolean" -> {
                if (toBoolean(value) == null) return label + ": ha/yo'q qiymati kerak";
            }
            case "date" -> {
                if (!isValidDate(value)) return label + ": sana formati noto'g'ri (YYYY-MM-DD)";
            }
            case "select" -> {
                if (!optionValues(attr).contains(String.valueOf(value)))
                    return label + ": ruxsat etilmagan qiymat";
            }
            case "multiselect" -> {
                if (!(value instanceof Collection<?> col)) return label + ": ro'yxat kerak";
                Set<String> allowed = optionValues(attr);
                for (Object item : col) {
                    if (!allowed.contains(String.valueOf(item)))
                        return label + ": ruxsat etilmagan qiymat — " + item;
                }
            }
            default -> { /* text — checked in rules */ }
        }
        return null;
    }

    private String validateRules(ResolvedAttributeDefinition attr, String label, Object value) {
        ValidationRules v = attr.getValidation();
        if (v == null) return null;
        String dt = attr.getDataType() != null ? attr.getDataType() : "text";
        String custom = v.getMessage();

        if (("number".equals(dt) || "decimal".equals(dt) || "currency".equals(dt))) {
            BigDecimal n = toBigDecimal(value);
            if (n != null) {
                if (v.getMin() != null && n.compareTo(BigDecimal.valueOf(v.getMin())) < 0)
                    return custom != null ? custom : label + ": qiymat " + fmt(v.getMin()) + " dan kam bo'lmasligi kerak";
                if (v.getMax() != null && n.compareTo(BigDecimal.valueOf(v.getMax())) > 0)
                    return custom != null ? custom : label + ": qiymat " + fmt(v.getMax()) + " dan oshmasligi kerak";
            }
        }
        if ("text".equals(dt)) {
            String s = String.valueOf(value);
            if (v.getMinLength() != null && s.length() < v.getMinLength())
                return custom != null ? custom : label + ": kamida " + v.getMinLength() + " ta belgi";
            if (v.getMaxLength() != null && s.length() > v.getMaxLength())
                return custom != null ? custom : label + ": ko'pi bilan " + v.getMaxLength() + " ta belgi";
            if (v.getPattern() != null && !v.getPattern().isBlank()) {
                try {
                    if (!s.matches(v.getPattern()))
                        return custom != null ? custom : label + ": format noto'g'ri";
                } catch (Exception ignored) { /* invalid pattern config — skip */ }
            }
        }
        return null;
    }

    private Set<String> optionValues(ResolvedAttributeDefinition attr) {
        if (attr.getOptions() == null) return Set.of();
        Set<String> set = new HashSet<>();
        for (SelectOption o : attr.getOptions()) {
            if (o.getValue() != null) set.add(o.getValue());
        }
        return set;
    }

    private boolean isEmpty(Object value) {
        if (value == null) return true;
        if (value instanceof String s) return s.isBlank();
        if (value instanceof Collection<?> c) return c.isEmpty();
        return false;
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value instanceof Number num) return new BigDecimal(num.toString());
        if (value instanceof String s) {
            try {
                return new BigDecimal(s.trim());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private Boolean toBoolean(Object value) {
        if (value instanceof Boolean b) return b;
        if (value instanceof String s) {
            if (s.equalsIgnoreCase("true")) return Boolean.TRUE;
            if (s.equalsIgnoreCase("false")) return Boolean.FALSE;
        }
        return null;
    }

    private boolean isValidDate(Object value) {
        if (!(value instanceof String s)) return false;
        try {
            LocalDate.parse(s.trim());
            return true;
        } catch (DateTimeParseException e) {
            return false;
        }
    }

    private String fmt(Double d) {
        if (d == null) return "";
        if (d == Math.floor(d)) return String.valueOf(d.longValue());
        return String.valueOf(d);
    }
}
