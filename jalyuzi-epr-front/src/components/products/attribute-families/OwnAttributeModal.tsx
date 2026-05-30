import { useEffect, useState } from 'react';
import {
  X, Plus, Type, Hash, DollarSign, ToggleLeft, Calendar, List, ListChecks,
} from 'lucide-react';
import clsx from 'clsx';
import { ModalPortal } from '../../common/Modal';
import { NumberInput } from '../../ui/NumberInput';
import type { AttributeDefinition, AttributeDataType, SelectOption } from '../../../types';

const DATA_TYPE_OPTIONS: { value: AttributeDataType; label: string; icon: React.ReactNode }[] = [
  { value: 'text', label: 'Matn', icon: <Type className="h-4 w-4" /> },
  { value: 'number', label: 'Butun son', icon: <Hash className="h-4 w-4" /> },
  { value: 'decimal', label: "O'nlik son", icon: <Hash className="h-4 w-4" /> },
  { value: 'currency', label: 'Narx', icon: <DollarSign className="h-4 w-4" /> },
  { value: 'boolean', label: "Ha/Yo'q", icon: <ToggleLeft className="h-4 w-4" /> },
  { value: 'date', label: 'Sana', icon: <Calendar className="h-4 w-4" /> },
  { value: 'select', label: 'Tanlash', icon: <List className="h-4 w-4" /> },
  { value: 'multiselect', label: "Ko'p tanlash", icon: <ListChecks className="h-4 w-4" /> },
];

const emptyForm: AttributeDefinition = {
  key: '', label: '', dataType: 'text', group: '', order: 0, required: false,
  placeholder: '', helpText: '', unit: '', options: [], validation: {},
};

interface OwnAttributeModalProps {
  open: boolean;
  initial: AttributeDefinition | null;
  existingKeys: string[];
  saving: boolean;
  onClose: () => void;
  onSave: (attr: AttributeDefinition) => void;
}

export function OwnAttributeModal({ open, initial, existingKeys, saving, onClose, onSave }: OwnAttributeModalProps) {
  const [form, setForm] = useState<AttributeDefinition>(emptyForm);
  const isEdit = !!initial;

  useEffect(() => {
    if (open) setForm(initial ? { ...initial } : { ...emptyForm });
  }, [open, initial]);

  const keyConflict = !isEdit && form.key.trim() !== '' && existingKeys.includes(form.key.trim());
  const canSave = form.key.trim() !== '' && form.label.trim() !== '' && !keyConflict;

  const setOption = (i: number, field: keyof SelectOption, value: string) => {
    const opts = [...(form.options || [])];
    opts[i] = { ...opts[i], [field]: value };
    setForm((p) => ({ ...p, options: opts }));
  };

  return (
    <ModalPortal isOpen={open} onClose={onClose}>
      <div className="w-full max-w-lg bg-base-100 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-xl font-semibold">{isEdit ? 'Atributni tahrirlash' : 'Yangi atribut'}</h3>
            <button className="btn btn-ghost btn-sm" onClick={onClose}><X className="h-4 w-4" /></button>
          </div>

          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="form-control">
                <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">Kalit *</span>
                <input
                  type="text" className="input input-bordered w-full font-mono"
                  value={form.key} disabled={isEdit}
                  onChange={(e) => setForm((p) => ({ ...p, key: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') }))}
                  placeholder="fieldKey"
                />
                {keyConflict && <span className="label-text-alt text-error mt-1">Bu kalit allaqachon mavjud</span>}
              </label>
              <label className="form-control">
                <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">Sarlavha *</span>
                <input
                  type="text" className="input input-bordered w-full"
                  value={form.label}
                  onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                  placeholder="Maydon nomi"
                />
              </label>
            </div>

            <div className="form-control">
              <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">Ma'lumot turi *</span>
              <div className="grid grid-cols-4 gap-2">
                {DATA_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value} type="button"
                    className={clsx('flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all',
                      form.dataType === opt.value ? 'border-primary bg-primary/5' : 'border-base-300 hover:border-primary/50')}
                    onClick={() => setForm((p) => ({ ...p, dataType: opt.value }))}
                  >
                    {opt.icon}<span className="text-xs">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {(form.dataType === 'select' || form.dataType === 'multiselect') && (
              <div className="form-control">
                <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">Tanlovlar</span>
                <div className="space-y-2">
                  {(form.options || []).map((option, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="text" className="input input-bordered input-sm flex-1 font-mono" value={option.value}
                        onChange={(e) => setOption(i, 'value', e.target.value)} placeholder="value" />
                      <input type="text" className="input input-bordered input-sm flex-1" value={option.label}
                        onChange={(e) => setOption(i, 'label', e.target.value)} placeholder="Label" />
                      <button type="button" className="btn btn-ghost btn-sm text-error"
                        onClick={() => setForm((p) => ({ ...p, options: (p.options || []).filter((_, idx) => idx !== i) }))}>
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-ghost btn-sm"
                    onClick={() => setForm((p) => ({ ...p, options: [...(p.options || []), { value: '', label: '' }] }))}>
                    <Plus className="h-4 w-4" /> Tanlov qo'shish
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <label className="form-control">
                <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">Birlik</span>
                <input type="text" className="input input-bordered w-full" value={form.unit || ''}
                  onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} placeholder="mm, kg, m..." />
              </label>
              <label className="form-control">
                <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">Placeholder</span>
                <input type="text" className="input input-bordered w-full" value={form.placeholder || ''}
                  onChange={(e) => setForm((p) => ({ ...p, placeholder: e.target.value }))} placeholder="Misol qiymat..." />
              </label>
            </div>

            <label className="form-control">
              <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">Yordam matni</span>
              <input type="text" className="input input-bordered w-full" value={form.helpText || ''}
                onChange={(e) => setForm((p) => ({ ...p, helpText: e.target.value }))} placeholder="Bu maydon nima uchun..." />
            </label>

            <div className="flex flex-wrap items-end gap-4">
              <label className="label cursor-pointer gap-2">
                <input type="checkbox" className="checkbox checkbox-sm" checked={form.required || false}
                  onChange={(e) => setForm((p) => ({ ...p, required: e.target.checked }))} />
                <span className="label-text">Majburiy</span>
              </label>
              <div className="w-32">
                <NumberInput label="Tartib" value={form.order || 0} min={0}
                  onChange={(val) => setForm((p) => ({ ...p, order: typeof val === 'number' ? val : 0 }))} />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Bekor qilish</button>
            <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving || !canSave}>
              {saving && <span className="loading loading-spinner loading-sm" />} Saqlash
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
