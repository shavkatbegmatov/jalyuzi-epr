import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Lock, Star, GitBranch, Layers } from 'lucide-react';
import clsx from 'clsx';
import { OwnAttributeModal } from './OwnAttributeModal';
import type { AttributeDefinition, AttributeFamily, EffectiveSchema, ResolvedAttributeDefinition } from '../../../types';

const DATA_TYPE_LABELS: Record<string, string> = {
  text: 'Matn', number: 'Butun son', decimal: "O'nlik", currency: 'Narx',
  boolean: "Ha/Yo'q", date: 'Sana', select: 'Tanlash', multiselect: "Ko'p tanlash",
};

interface FamilyNodeEditorPanelProps {
  family: AttributeFamily;
  effective: EffectiveSchema | null;
  canEdit: boolean;
  busy: boolean;
  onAddAttribute: (attr: AttributeDefinition) => void;
  onUpdateAttribute: (key: string, attr: AttributeDefinition) => void;
  onRemoveAttribute: (key: string) => void;
  /** F3: meros atributni override qilish tugmasi (ixtiyoriy) */
  onOverrideInherited?: (attr: ResolvedAttributeDefinition) => void;
}

export function FamilyNodeEditorPanel({
  family, effective, canEdit, busy,
  onAddAttribute, onUpdateAttribute, onRemoveAttribute, onOverrideInherited,
}: FamilyNodeEditorPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AttributeDefinition | null>(null);

  const ownAttributes = useMemo(() => family.attributeSchema?.attributes ?? [], [family.attributeSchema?.attributes]);
  const inherited = useMemo<ResolvedAttributeDefinition[]>(
    () => (effective?.attributes ?? []).filter((a) => a.ownerFamilyId !== family.id),
    [effective, family.id]
  );

  const sourceName = (ownerFamilyId?: number) =>
    effective?.resolutionPath.find((p) => p.id === ownerFamilyId)?.name ?? 'meros';

  const allKeys = useMemo(
    () => [...ownAttributes.map((a) => a.key), ...inherited.map((a) => a.key)],
    [ownAttributes, inherited]
  );

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (attr: AttributeDefinition) => { setEditing(attr); setModalOpen(true); };
  const handleSave = (attr: AttributeDefinition) => {
    if (editing) onUpdateAttribute(editing.key, attr);
    else onAddAttribute(attr);
    setModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="surface-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold truncate">{family.name}</h3>
              {family.leaf && <span className="badge badge-success badge-sm gap-1"><Star className="h-3 w-3" />Barg</span>}
              {family.isSystem && <span className="badge badge-ghost badge-sm gap-1"><Lock className="h-3 w-3" />Tizimiy</span>}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-base-content/60">
              <span className="font-mono">{family.code}</span>
              {family.parentName && <span className="flex items-center gap-1"><GitBranch className="h-3.5 w-3.5" />{family.parentName}</span>}
              {family.productTypeName && <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" />{family.productTypeName}</span>}
            </div>
            {family.description && <p className="mt-2 text-sm text-base-content/70">{family.description}</p>}
          </div>
        </div>
      </div>

      {/* Own attributes */}
      <div className="surface-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-medium">Shu tugun atributlari <span className="text-base-content/50">({ownAttributes.length})</span></h4>
          {canEdit && (
            <button className="btn btn-ghost btn-sm" onClick={openNew} disabled={busy}>
              <Plus className="h-4 w-4" /> Atribut qo'shish
            </button>
          )}
        </div>
        {ownAttributes.length === 0 ? (
          <p className="py-4 text-center text-sm text-base-content/50">Bu tugunda atribut yo'q (faqat meros)</p>
        ) : (
          <div className="space-y-2">
            {[...ownAttributes].sort((a, b) => (a.order || 0) - (b.order || 0)).map((attr) => (
              <div key={attr.key} className="flex items-center gap-3 rounded-lg bg-base-200/50 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{attr.label}</span>
                    <span className="badge badge-ghost badge-xs font-mono">{attr.key}</span>
                    {attr.required && <span className="badge badge-warning badge-xs">Majburiy</span>}
                  </div>
                  <div className="text-xs text-base-content/60">
                    {DATA_TYPE_LABELS[attr.dataType] || attr.dataType}{attr.unit ? ` (${attr.unit})` : ''}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1">
                    <button className="btn btn-ghost btn-xs" onClick={() => openEdit(attr)} disabled={busy}><Pencil className="h-3 w-3" /></button>
                    <button className="btn btn-ghost btn-xs text-error" onClick={() => onRemoveAttribute(attr.key)} disabled={busy}><Trash2 className="h-3 w-3" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inherited attributes */}
      <div className="surface-card p-4">
        <h4 className="mb-3 font-medium">Meros atributlar <span className="text-base-content/50">({inherited.length})</span></h4>
        {inherited.length === 0 ? (
          <p className="py-4 text-center text-sm text-base-content/50">Yuqoridan meros olingan atribut yo'q</p>
        ) : (
          <div className="space-y-2">
            {inherited.map((attr) => (
              <div key={attr.key} className={clsx('flex items-center gap-3 rounded-lg border border-dashed border-base-300 p-3',
                attr.origin === 'OVERRIDDEN' ? 'bg-info/5' : 'bg-base-100')}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{attr.label}</span>
                    <span className="badge badge-ghost badge-xs font-mono">{attr.key}</span>
                    {attr.required && <span className="badge badge-warning badge-xs">Majburiy</span>}
                    {attr.origin === 'OVERRIDDEN' && <span className="badge badge-info badge-xs">O'zgartirilgan</span>}
                  </div>
                  <div className="text-xs text-base-content/60">
                    {DATA_TYPE_LABELS[attr.dataType] || attr.dataType}
                    {attr.unit ? ` (${attr.unit})` : ''} · <span className="text-base-content/40">Bazaviy: {sourceName(attr.ownerFamilyId)}</span>
                  </div>
                </div>
                {canEdit && onOverrideInherited && (
                  <button className="btn btn-ghost btn-xs" onClick={() => onOverrideInherited(attr)} disabled={busy} title="Xossalarini override qilish">
                    <Pencil className="h-3 w-3" /> Override
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <OwnAttributeModal
        open={modalOpen}
        initial={editing}
        existingKeys={allKeys}
        saving={busy}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
