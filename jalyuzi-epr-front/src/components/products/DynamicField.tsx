import clsx from 'clsx';
import { NumberInput } from '../ui/NumberInput';
import { CurrencyInput } from '../ui/CurrencyInput';
import { Select } from '../ui/Select';
import type { AttributeDefinition } from '../../types';

interface DynamicFieldProps {
  attribute: AttributeDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Renders a form field based on AttributeDefinition schema.
 * Supports: text, number, decimal, currency, boolean, date, select, multiselect
 */
export function DynamicField({
  attribute,
  value,
  onChange,
  error,
  disabled = false,
}: DynamicFieldProps) {
  const { label, dataType, required, placeholder, helpText, unit, options, validation } =
    attribute;

  // Label with required indicator
  const labelElement = (
    <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
      {label} {required && <span className="text-error">*</span>}
      {unit && <span className="ml-1 normal-case tracking-normal">({unit})</span>}
    </span>
  );

  // Help text element
  const helpElement = helpText && (
    <span className="label-text-alt text-base-content/50 mt-1">{helpText}</span>
  );

  // Error element
  const errorElement = error && <span className="label-text-alt text-error mt-1">{error}</span>;

  // Render based on data type
  switch (dataType) {
    case 'text':
      return (
        <div className="form-control">
          {labelElement}
          <input
            type="text"
            className={clsx(
              'input input-bordered w-full h-12',
              error && 'input-error'
            )}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={validation?.maxLength}
          />
          {helpElement}
          {errorElement}
        </div>
      );

    case 'number':
      return (
        <NumberInput
          label={`${label}${required ? ' *' : ''}${unit ? ` (${unit})` : ''}`}
          value={value as number | string}
          onChange={(val) => onChange(typeof val === 'string' ? (val === '' ? null : Number(val)) : val)}
          min={validation?.min}
          max={validation?.max}
          step={1}
          disabled={disabled}
          placeholder={placeholder || '0'}
          showButtons={true}
        />
      );

    case 'decimal':
      return (
        <NumberInput
          label={`${label}${required ? ' *' : ''}${unit ? ` (${unit})` : ''}`}
          value={value as number | string}
          onChange={(val) => onChange(typeof val === 'string' ? (val === '' ? null : Number(val)) : val)}
          min={validation?.min}
          max={validation?.max}
          step={0.01}
          disabled={disabled}
          placeholder={placeholder || '0.00'}
          showButtons={false}
        />
      );

    case 'currency':
      return (
        <CurrencyInput
          label={`${label}${required ? ' *' : ''}`}
          value={(value as number) || 0}
          onChange={(val) => onChange(val)}
          min={validation?.min}
          max={validation?.max}
          disabled={disabled}
          error={error}
        />
      );

    case 'boolean':
      return (
        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
            />
            <span className="label-text font-medium">
              {label} {required && <span className="text-error">*</span>}
            </span>
          </label>
          {helpElement}
          {errorElement}
        </div>
      );

    case 'date':
      return (
        <div className="form-control">
          {labelElement}
          <input
            type="date"
            className={clsx(
              'input input-bordered w-full h-12',
              error && 'input-error'
            )}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
          {helpElement}
          {errorElement}
        </div>
      );

    case 'select':
      return (
        <Select
          label={label}
          value={value as string | number | undefined}
          onChange={(val) => onChange(val)}
          options={
            options?.map((opt) => ({
              value: opt.value,
              label: opt.label,
            })) || []
          }
          placeholder={placeholder || 'Tanlang...'}
          disabled={disabled}
          error={error}
          required={required}
        />
      );

    case 'multiselect':
      // Multi-select as checkbox group
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <div className="form-control">
          {labelElement}
          <div className="flex flex-wrap gap-2 p-3 border border-base-300 rounded-xl bg-base-100">
            {options?.length === 0 ? (
              <span className="text-base-content/50 text-sm">Tanlovlar mavjud emas</span>
            ) : (
              options?.map((opt) => (
                <label
                  key={opt.value}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                    selectedValues.includes(opt.value)
                      ? 'bg-primary/10 text-primary'
                      : 'bg-base-200 hover:bg-base-300'
                  )}
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-primary"
                    checked={selectedValues.includes(opt.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onChange([...selectedValues, opt.value]);
                      } else {
                        onChange(selectedValues.filter((v: string) => v !== opt.value));
                      }
                    }}
                    disabled={disabled}
                  />
                  <span className="text-sm font-medium">{opt.label}</span>
                </label>
              ))
            )}
          </div>
          {helpElement}
          {errorElement}
        </div>
      );

    default:
      // Fallback to text input for unknown types
      return (
        <div className="form-control">
          {labelElement}
          <input
            type="text"
            className={clsx(
              'input input-bordered w-full h-12',
              error && 'input-error'
            )}
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
          />
          {helpElement}
          {errorElement}
        </div>
      );
  }
}
