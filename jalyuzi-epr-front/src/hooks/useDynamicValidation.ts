import { useMemo, useCallback } from 'react';
import type { AttributeSchema, AttributeDefinition } from '../types';

/**
 * Validation error type
 */
export interface ValidationError {
  key: string;
  message: string;
}

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  errorList: ValidationError[];
}

/**
 * Validate a single value against validation rules
 */
function validateValue(
  value: unknown,
  attribute: AttributeDefinition
): string | null {
  const { label, dataType, required, validation } = attribute;
  const rules = validation || {};

  // Required check
  if (required) {
    if (value === null || value === undefined || value === '') {
      return `${label} kiritilishi shart`;
    }
    if (dataType === 'multiselect' && Array.isArray(value) && value.length === 0) {
      return `Kamida bitta ${label.toLowerCase()} tanlang`;
    }
  }

  // Skip further validation if value is empty and not required
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Type-specific validations
  switch (dataType) {
    case 'text': {
      const strValue = String(value);
      if (rules.minLength !== undefined && strValue.length < rules.minLength) {
        return `${label} kamida ${rules.minLength} ta belgi bo'lishi kerak`;
      }
      if (rules.maxLength !== undefined && strValue.length > rules.maxLength) {
        return `${label} ${rules.maxLength} ta belgidan oshmasligi kerak`;
      }
      if (rules.pattern) {
        const regex = new RegExp(rules.pattern);
        if (!regex.test(strValue)) {
          return rules.patternMessage || `${label} noto'g'ri formatda`;
        }
      }
      break;
    }

    case 'number':
    case 'decimal':
    case 'currency': {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return `${label} raqam bo'lishi kerak`;
      }
      if (rules.min !== undefined && numValue < rules.min) {
        return `${label} kamida ${rules.min} bo'lishi kerak`;
      }
      if (rules.max !== undefined && numValue > rules.max) {
        return `${label} ${rules.max} dan oshmasligi kerak`;
      }
      break;
    }

    case 'date': {
      const dateValue = new Date(value as string);
      if (isNaN(dateValue.getTime())) {
        return `${label} noto'g'ri sana formati`;
      }
      break;
    }

    case 'select': {
      // Check if value is in options
      const validValues = attribute.options?.map((opt) => opt.value) || [];
      if (!validValues.includes(value as string)) {
        return `${label} uchun noto'g'ri qiymat tanlandi`;
      }
      break;
    }

    case 'multiselect': {
      if (!Array.isArray(value)) {
        return `${label} massiv bo'lishi kerak`;
      }
      const validValues = attribute.options?.map((opt) => opt.value) || [];
      const invalidValues = (value as string[]).filter((v) => !validValues.includes(v));
      if (invalidValues.length > 0) {
        return `${label} uchun noto'g'ri qiymatlar: ${invalidValues.join(', ')}`;
      }
      break;
    }
  }

  return null;
}

/**
 * Hook for validating dynamic attributes against a schema
 */
export function useDynamicValidation(schema: AttributeSchema | undefined) {
  // Get all attributes from schema
  const attributes = useMemo(() => {
    return schema?.attributes || [];
  }, [schema]);

  // Get required attribute keys
  const requiredKeys = useMemo(() => {
    return attributes.filter((attr) => attr.required).map((attr) => attr.key);
  }, [attributes]);

  // Get attribute by key
  const getAttributeByKey = useCallback(
    (key: string): AttributeDefinition | undefined => {
      return attributes.find((attr) => attr.key === key);
    },
    [attributes]
  );

  // Validate a single field
  const validateField = useCallback(
    (key: string, value: unknown): string | null => {
      const attribute = getAttributeByKey(key);
      if (!attribute) return null;
      return validateValue(value, attribute);
    },
    [getAttributeByKey]
  );

  // Validate all custom attributes
  const validateAll = useCallback(
    (values: Record<string, unknown>): ValidationResult => {
      const errors: Record<string, string> = {};
      const errorList: ValidationError[] = [];

      for (const attribute of attributes) {
        const value = values[attribute.key];
        const error = validateValue(value, attribute);
        if (error) {
          errors[attribute.key] = error;
          errorList.push({ key: attribute.key, message: error });
        }
      }

      return {
        isValid: errorList.length === 0,
        errors,
        errorList,
      };
    },
    [attributes]
  );

  // Get default values based on schema
  const getDefaultValues = useCallback((): Record<string, unknown> => {
    const defaults: Record<string, unknown> = {};
    for (const attribute of attributes) {
      if (attribute.defaultValue !== undefined) {
        defaults[attribute.key] = attribute.defaultValue;
      } else {
        // Set type-appropriate empty values
        switch (attribute.dataType) {
          case 'boolean':
            defaults[attribute.key] = false;
            break;
          case 'multiselect':
            defaults[attribute.key] = [];
            break;
          case 'number':
          case 'decimal':
          case 'currency':
            defaults[attribute.key] = null;
            break;
          default:
            defaults[attribute.key] = '';
        }
      }
    }
    return defaults;
  }, [attributes]);

  return {
    attributes,
    requiredKeys,
    getAttributeByKey,
    validateField,
    validateAll,
    getDefaultValues,
  };
}
