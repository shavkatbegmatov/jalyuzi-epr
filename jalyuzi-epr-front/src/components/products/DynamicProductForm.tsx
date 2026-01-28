import { useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { DynamicField } from './DynamicField';
import { useDynamicValidation } from '../../hooks/useDynamicValidation';
import type { AttributeSchema, AttributeDefinition, AttributeGroup } from '../../types';

interface DynamicProductFormProps {
  schema: AttributeSchema | undefined;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  errors?: Record<string, string>;
  onValidate?: (errors: Record<string, string>, isValid: boolean) => void;
  disabled?: boolean;
  showGroupHeaders?: boolean;
  columns?: 1 | 2 | 3;
}

/**
 * Dynamic form component that renders fields based on AttributeSchema.
 * Supports grouping, validation, and various field types.
 */
export function DynamicProductForm({
  schema,
  values,
  onChange,
  errors: externalErrors,
  onValidate,
  disabled = false,
  showGroupHeaders = true,
  columns = 2,
}: DynamicProductFormProps) {
  const { attributes, validateAll, getDefaultValues } = useDynamicValidation(schema);

  // Initialize default values when schema changes
  useEffect(() => {
    if (schema && Object.keys(values).length === 0) {
      const defaults = getDefaultValues();
      if (Object.keys(defaults).length > 0) {
        onChange(defaults);
      }
    }
  }, [schema, values, getDefaultValues, onChange]);

  // Group attributes by their group property
  const groupedAttributes = useMemo(() => {
    const groups = schema?.groups || [];
    const ungroupedKey = '__ungrouped__';

    // Create a map of group key to attributes
    const groupMap = new Map<string, AttributeDefinition[]>();

    // Initialize all groups
    for (const group of groups) {
      groupMap.set(group.key, []);
    }
    groupMap.set(ungroupedKey, []);

    // Assign attributes to groups
    for (const attr of attributes) {
      const groupKey = attr.group || ungroupedKey;
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, []);
      }
      groupMap.get(groupKey)!.push(attr);
    }

    // Sort attributes within each group by order
    for (const attrs of groupMap.values()) {
      attrs.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    // Build ordered result
    const result: { group: AttributeGroup | null; attributes: AttributeDefinition[] }[] = [];

    // Add groups in order
    const sortedGroups = [...groups].sort((a, b) => (a.order || 0) - (b.order || 0));
    for (const group of sortedGroups) {
      const groupAttrs = groupMap.get(group.key) || [];
      if (groupAttrs.length > 0) {
        result.push({ group, attributes: groupAttrs });
      }
    }

    // Add ungrouped attributes at the end
    const ungrouped = groupMap.get(ungroupedKey) || [];
    if (ungrouped.length > 0) {
      result.push({ group: null, attributes: ungrouped });
    }

    return result;
  }, [schema, attributes]);

  // Handle field change
  const handleFieldChange = (key: string, value: unknown) => {
    const newValues = { ...values, [key]: value };
    onChange(newValues);

    // Validate if callback provided
    if (onValidate) {
      const result = validateAll(newValues);
      onValidate(result.errors, result.isValid);
    }
  };

  // Merge external and internal errors
  const mergedErrors = externalErrors || {};

  // No schema - show placeholder
  if (!schema || attributes.length === 0) {
    return (
      <div className="text-center py-8 text-base-content/50">
        <p>Bu mahsulot turi uchun qo'shimcha maydonlar mavjud emas</p>
      </div>
    );
  }

  // Grid classes based on columns
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div className="space-y-6">
      {groupedAttributes.map(({ group, attributes: groupAttrs }, index) => (
        <div key={group?.key || `ungrouped-${index}`}>
          {/* Group header */}
          {showGroupHeaders && group && (
            <div className="flex items-center gap-2 mb-4">
              <ChevronDown className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">
                {group.label}
              </h4>
              {group.description && (
                <span className="text-xs text-base-content/50 ml-2">
                  — {group.description}
                </span>
              )}
            </div>
          )}

          {/* Fields grid */}
          <div className={clsx('grid gap-4', gridClasses[columns])}>
            {groupAttrs.map((attr) => (
              <div
                key={attr.key}
                className={clsx(
                  // Full width for certain field types
                  (attr.dataType === 'multiselect' ||
                    (attr.dataType === 'text' && (attr.validation?.maxLength || 0) > 100)) &&
                    'md:col-span-2 lg:col-span-3'
                )}
              >
                <DynamicField
                  attribute={attr}
                  value={values[attr.key]}
                  onChange={(value) => handleFieldChange(attr.key, value)}
                  error={mergedErrors[attr.key]}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Helper component for section divider
 */
export function DynamicFormDivider({ label }: { label?: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-base-300" />
      </div>
      {label && (
        <div className="relative flex justify-center">
          <span className="bg-base-100 px-3 text-sm text-base-content/50">{label}</span>
        </div>
      )}
    </div>
  );
}
