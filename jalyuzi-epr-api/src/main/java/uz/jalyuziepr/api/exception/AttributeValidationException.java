package uz.jalyuziepr.api.exception;

import lombok.Getter;

import java.util.Map;

/**
 * Thrown when a product's custom attribute values fail validation against the
 * effective (resolved) attribute schema. Carries field-level messages keyed by
 * attribute key, mirroring the bean-validation error shape so the frontend can
 * render per-field errors without changes.
 */
@Getter
public class AttributeValidationException extends RuntimeException {

    private final transient Map<String, String> fieldErrors;

    public AttributeValidationException(Map<String, String> fieldErrors) {
        super("Atribut validatsiya xatosi");
        this.fieldErrors = fieldErrors;
    }
}
