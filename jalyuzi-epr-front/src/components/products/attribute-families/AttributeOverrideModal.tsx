import { useEffect, useState } from 'react';
import { X, Plus, RotateCcw } from 'lucide-react';
import clsx from 'clsx';
import { ModalPortal } from '../../common/Modal';
import type { ResolvedAttributeDefinition, SelectOption, ValidationRules } from '../../../types';

interface AttributeOverrideModalProps {
  open: boolean;
  attr: ResolvedAttributeDefinition | null; // inherited attribute (effective values)
  existing?: Record<string, unknown>; // current override changedProps for this key
  saving: boolean;
  onClose: () => void;
  onSave: (changedProps: Record<string, unknown>) => void;
  onClear: () => void;
}

type OnMap = Record<string, boolean>;

export function AttributeOverrideModal({ open, attr, existing, saving, onClose, onSave, onClear }: AttributeOverrideModalProps) {
  const [on, setOn] = useState<OnMap>({});
  const [von, setVon] = useState<OnMap>({});
  const [label, setLabel] = useState('');
  const [required, setRequired] = useState(false);
  const [unit, setUnit] = useState('');
  const [helpText, setHelpText] = useState('');
  const [order, setOrder] = useState(0);
  const [defaultValue, setDefaultValue] = useState<unknown>('');
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [validation, setValidation] = useState<ValidationRules>({});

  const isSelect = attr?.dataType === 'select' || attr?.dataType === 'multiselect';
  const isNumeric = attr?.dataType === 'number' || attr?.dataType === 'decimal' || attr?.dataType === 'currency';
  const isText = attr?.dataType === 'text';

  useEffect(() => {
    if (!open || !attr) return;
    const ex = existing || {};
    const exVal = (ex.validation as ValidationRules) || {};
    setOn({
      label: 'label' in ex, required: 'required' in ex, unit: 'unit' in ex,
      helpText: 'helpText' in ex, order: 'order' in ex, defaultValue: 'defaultValue' in ex,
      options: 'options' in ex, validation: 'validation' in ex,
    });
    setVon({
      min: exVal.min != null, max: exVal.max != null, minLength: exVal.minLength != null,
      maxLength: exVal.maxLength != null, pattern: exVal.pattern != null,
    });
    setLabel((ex.label as string) ?? attr.label ?? '');
    setRequired((ex.required as boolean) ?? attr.required ?? false);
    setUnit((ex.unit as string) ?? attr.unit ?? '');
    setHelpText((ex.helpText as string) ?? attr.helpText ?? '');
    setOrder((ex.order as number) ?? attr.order ?? 0);
    setDefaultValue((ex.defaultValue as unknown) ?? attr.defaultValue ?? '');
    setOptions((ex.options as SelectOption[]) ?? attr.options ?? []);
    setValidation({ ...(attr.validation || {}), ...exVal });
  }, [open, attr, existing]);

  if (!attr) return null;

  const toggle = (k: string) => setOn((p) => ({ ...p, [k]: !p[k] }));
  const toggleV = (k: string) => setVon((p) => ({ ...p, [k]: !p[k] }));

  const handleSave = () => {
    const changed: Record<string, unknown> = {};
    if (on.label) changed.label = label;
    if (on.required) changed.required = required;
    if (on.unit) changed.unit = unit;
    if (on.helpText) changed.helpText = helpText;
    if (on.order) changed.order = order;
    if (on.defaultValue) changed.defaultValue = defaultValue;
    if (on.options) changed.options = options;
    const anyV = von.min || von.max || von.minLength || von.maxLength || von.pattern;
    if (anyV) {
      const v: ValidationRules = {};
      if (von.min) v.min = validation.min;
      if (von.max) v.max = validation.max;
      if (von.minLength) v.minLength = validation.minLength;
      if (von.maxLength) v.maxLength = validation.maxLength;
      if (von.pattern) v.pattern = validation.pattern;
      changed.validation = v;
    }
    onSave(changed);
  };

  const hasExisting = !!existing && Object.keys(existing).length > 0;

  return (
    <ModalPortal isOpen={open} onClose={onClose}>
      <div className="w-full max-w-lg bg-base-100 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">Override: {attr.label}</h3>
              <p className="text-sm text-base-content/60">
                Faqat kerakli xossalarni belgilang — qolgani bazaviy tugundan meros olinadi.
              </p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onClose}><X className="h-4 w-4" /></button>
          </div>

          <div className="mt-5 space-y-2">
            <OverrideRow checked={!!on.label} onToggle={() => toggle('label')} title="Sarlavha" hint={attr.label}>
              <input type="text" className="input input-bordered input-sm w-full" value={label} onChange={(e) => setLabel(e.target.value)} />
            </OverrideRow>

            <OverrideRow checked={!!on.required} onToggle={() => toggle('required')} title="Majburiylik" hint={attr.required ? 'Majburiy' : 'Ixtiyoriy'}>
              <label className="label cursor-pointer justify-start gap-2">
                <input type="checkbox" className="toggle toggle-sm toggle-primary" checked={required} onChange={(e) => setRequired(e.target.checked)} />
                <span className="text-sm">{required ? 'Majburiy' : 'Ixtiyoriy'}</span>
              </label>
            </OverrideRow>

            <OverrideRow checked={!!on.defaultValue} onToggle={() => toggle('defaultValue')} title="Standart qiymat" hint={String(attr.defaultValue ?? '—')}>
              {attr.dataType === 'boolean' ? (
                <select className="select select-bordered select-sm w-full" value={String(defaultValue)} onChange={(e) => setDefaultValue(e.target.value === 'true')}>
                  <option value="true">Ha</option><option value="false">Yo'q</option>
                </select>
              ) : isSelect ? (
                <select className="select select-bordered select-sm w-full" value={String(defaultValue ?? '')} onChange={(e) => setDefaultValue(e.target.value)}>
                  <option value="">—</option>
                  {(attr.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input type={isNumeric ? 'number' : attr.dataType === 'date' ? 'date' : 'text'}
                  className="input input-bordered input-sm w-full" value={String(defaultValue ?? '')}
                  onChange={(e) => setDefaultValue(isNumeric ? Number(e.target.value) : e.target.value)} />
              )}
            </OverrideRow>

            <OverrideRow checked={!!on.unit} onToggle={() => toggle('unit')} title="Birlik" hint={attr.unit || '—'}>
              <input type="text" className="input input-bordered input-sm w-full" value={unit} onChange={(e) => setUnit(e.target.value)} />
            </OverrideRow>

            <OverrideRow checked={!!on.helpText} onToggle={() => toggle('helpText')} title="Yordam matni" hint={attr.helpText || '—'}>
              <input type="text" className="input input-bordered input-sm w-full" value={helpText} onChange={(e) => setHelpText(e.target.value)} />
            </OverrideRow>

            <OverrideRow checked={!!on.order} onToggle={() => toggle('order')} title="Tartib" hint={String(attr.order ?? 0)}>
              <input type="number" className="input input-bordered input-sm w-full" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
            </OverrideRow>

            {isSelect && (
              <OverrideRow checked={!!on.options} onToggle={() => toggle('options')} title="Tanlovlar (almashtiradi)" hint={`${attr.options?.length ?? 0} ta bazaviy`}>
                <div className="space-y-1.5">
                  {options.map((o, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <input type="text" className="input input-bordered input-xs flex-1 font-mono" value={o.value}
                        onChange={(e) => setOptions((p) => p.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x))} placeholder="value" />
                      <input type="text" className="input input-bordered input-xs flex-1" value={o.label}
                        onChange={(e) => setOptions((p) => p.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} placeholder="Label" />
                      <button className="btn btn-ghost btn-xs text-error" onClick={() => setOptions((p) => p.filter((_, idx) => idx !== i))}><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                  <button className="btn btn-ghost btn-xs" onClick={() => setOptions((p) => [...p, { value: '', label: '' }])}><Plus className="h-3 w-3" />Tanlov</button>
                </div>
              </OverrideRow>
            )}

            {(isNumeric || isText) && (
              <div className="rounded-xl border border-base-200 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-base-content/50">Validatsiya qoidalari</p>
                <div className="grid grid-cols-2 gap-2">
                  {isNumeric && <VRow checked={!!von.min} onToggle={() => toggleV('min')} title="Min" hint={attr.validation?.min}>
                    <input type="number" className="input input-bordered input-xs w-full" value={validation.min ?? ''} onChange={(e) => setValidation((v) => ({ ...v, min: e.target.value === '' ? undefined : Number(e.target.value) }))} /></VRow>}
                  {isNumeric && <VRow checked={!!von.max} onToggle={() => toggleV('max')} title="Max" hint={attr.validation?.max}>
                    <input type="number" className="input input-bordered input-xs w-full" value={validation.max ?? ''} onChange={(e) => setValidation((v) => ({ ...v, max: e.target.value === '' ? undefined : Number(e.target.value) }))} /></VRow>}
                  {isText && <VRow checked={!!von.minLength} onToggle={() => toggleV('minLength')} title="Min uzunlik" hint={attr.validation?.minLength}>
                    <input type="number" className="input input-bordered input-xs w-full" value={validation.minLength ?? ''} onChange={(e) => setValidation((v) => ({ ...v, minLength: e.target.value === '' ? undefined : Number(e.target.value) }))} /></VRow>}
                  {isText && <VRow checked={!!von.maxLength} onToggle={() => toggleV('maxLength')} title="Max uzunlik" hint={attr.validation?.maxLength}>
                    <input type="number" className="input input-bordered input-xs w-full" value={validation.maxLength ?? ''} onChange={(e) => setValidation((v) => ({ ...v, maxLength: e.target.value === '' ? undefined : Number(e.target.value) }))} /></VRow>}
                  {isText && <div className="col-span-2"><VRow checked={!!von.pattern} onToggle={() => toggleV('pattern')} title="Pattern (regex)" hint={attr.validation?.pattern}>
                    <input type="text" className="input input-bordered input-xs w-full font-mono" value={validation.pattern ?? ''} onChange={(e) => setValidation((v) => ({ ...v, pattern: e.target.value }))} /></VRow></div>}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between gap-2">
            <button className="btn btn-ghost btn-sm text-error" onClick={onClear} disabled={saving || !hasExisting} title="Override'ni olib tashlab merosga qaytarish">
              <RotateCcw className="h-4 w-4" />Merosga qaytarish
            </button>
            <div className="flex gap-2">
              <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Bekor qilish</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving && <span className="loading loading-spinner loading-sm" />}Saqlash
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

function OverrideRow({ checked, onToggle, title, hint, children }: {
  checked: boolean; onToggle: () => void; title: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className={clsx('rounded-lg border p-2.5 transition-colors', checked ? 'border-primary/40 bg-primary/5' : 'border-base-200')}>
      <label className="flex cursor-pointer items-center gap-2">
        <input type="checkbox" className="checkbox checkbox-sm" checked={checked} onChange={onToggle} />
        <span className="text-sm font-medium">{title}</span>
        {hint !== undefined && <span className="ml-auto text-xs text-base-content/40">bazaviy: {hint || '—'}</span>}
      </label>
      {checked && <div className="mt-2 pl-6">{children}</div>}
    </div>
  );
}

function VRow({ checked, onToggle, title, hint, children }: {
  checked: boolean; onToggle: () => void; title: string; hint?: number | string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex cursor-pointer items-center gap-1.5">
        <input type="checkbox" className="checkbox checkbox-xs" checked={checked} onChange={onToggle} />
        <span className="text-xs font-medium">{title}</span>
        {hint != null && <span className="ml-auto text-[10px] text-base-content/40">{hint}</span>}
      </label>
      {checked && <div className="mt-1">{children}</div>}
    </div>
  );
}
