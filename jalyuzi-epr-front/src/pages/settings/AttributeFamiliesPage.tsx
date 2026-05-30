import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, X, Network, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { attributeFamiliesApi } from '../../api/attribute-families.api';
import { productTypesApi } from '../../api/product-types.api';
import { ModalPortal } from '../../components/common/Modal';
import { PermissionGate } from '../../components/common/PermissionGate';
import { PermissionCode, usePermission } from '../../hooks/usePermission';
import { FamilyTreeView } from '../../components/products/attribute-families/FamilyTreeView';
import { FamilyNodeEditorPanel } from '../../components/products/attribute-families/FamilyNodeEditorPanel';
import { AttributeOverrideModal } from '../../components/products/attribute-families/AttributeOverrideModal';
import type {
  AttributeFamily, AttributeFamilyRequest, AttributeDefinition,
  EffectiveSchema, ProductTypeEntity, ResolvedAttributeDefinition,
} from '../../types';

const COLOR_OPTIONS = ['primary', 'secondary', 'accent', 'info', 'success', 'warning', 'error', 'neutral'];

const emptyNode: AttributeFamilyRequest = {
  code: '', name: '', description: '', color: 'primary',
  parentId: null, productTypeId: null, displayOrder: 0,
};

function flatten(nodes: AttributeFamily[], depth = 0, acc: { node: AttributeFamily; depth: number }[] = []) {
  for (const n of nodes) {
    acc.push({ node: n, depth });
    if (n.children?.length) flatten(n.children, depth + 1, acc);
  }
  return acc;
}

export function AttributeFamiliesPage() {
  const { hasPermission } = usePermission();
  const canEdit = hasPermission(PermissionCode.ATTRIBUTE_FAMILIES_UPDATE);

  const [tree, setTree] = useState<AttributeFamily[]>([]);
  const [productTypes, setProductTypes] = useState<ProductTypeEntity[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AttributeFamily | null>(null);
  const [effective, setEffective] = useState<EffectiveSchema | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  // Node modal
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [editingNode, setEditingNode] = useState<AttributeFamily | null>(null);
  const [nodeForm, setNodeForm] = useState<AttributeFamilyRequest>(emptyNode);
  const [nodeSaving, setNodeSaving] = useState(false);
  const [deletingNode, setDeletingNode] = useState<AttributeFamily | null>(null);

  // Override modal
  const [overrideAttr, setOverrideAttr] = useState<ResolvedAttributeDefinition | null>(null);

  const flat = useMemo(() => flatten(tree), [tree]);

  const loadTree = useCallback(async () => {
    try {
      const data = await attributeFamiliesApi.getTree();
      setTree(data);
    } catch (e) {
      console.error(e);
      toast.error('Daraxtni yuklashda xatolik');
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [t, pts] = await Promise.all([attributeFamiliesApi.getTree(), productTypesApi.getAll().catch(() => [])]);
        setTree(t);
        setProductTypes(pts as ProductTypeEntity[]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadDetail = useCallback(async (id: number) => {
    setDetailLoading(true);
    try {
      const [d, eff] = await Promise.all([
        attributeFamiliesApi.getById(id),
        attributeFamiliesApi.getEffectiveSchema(id),
      ]);
      setDetail(d);
      setEffective(eff);
    } catch (e) {
      console.error(e);
      toast.error("Tugun ma'lumotini yuklashda xatolik");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleSelect = (node: AttributeFamily) => {
    setSelectedId(node.id);
    void loadDetail(node.id);
  };

  const refreshAfterMutation = useCallback(async () => {
    await loadTree();
    if (selectedId) await loadDetail(selectedId);
  }, [loadTree, loadDetail, selectedId]);

  // ---- Node CRUD ----
  const openCreateNode = () => {
    setEditingNode(null);
    setNodeForm({ ...emptyNode, parentId: selectedId ?? null });
    setShowNodeModal(true);
  };
  const openEditNode = (node: AttributeFamily) => {
    setEditingNode(node);
    setNodeForm({
      code: node.code, name: node.name, description: node.description || '',
      color: node.color || 'primary', parentId: node.parentId ?? null,
      productTypeId: node.productTypeId ?? null, displayOrder: node.displayOrder || 0,
      attributeSchema: node.attributeSchema, overrides: node.overrides,
    });
    setShowNodeModal(true);
  };
  const saveNode = async () => {
    if (!nodeForm.code.trim() || !nodeForm.name.trim()) return;
    setNodeSaving(true);
    try {
      if (editingNode) {
        await attributeFamiliesApi.update(editingNode.id, nodeForm);
        toast.success('Tugun yangilandi');
      } else {
        const created = await attributeFamiliesApi.create(nodeForm);
        toast.success('Tugun yaratildi');
        setSelectedId(created.id);
        void loadDetail(created.id);
      }
      setShowNodeModal(false);
      await loadTree();
    } catch (e) {
      handleApiError(e, 'Saqlashda xatolik');
    } finally {
      setNodeSaving(false);
    }
  };
  const deleteNode = async () => {
    if (!deletingNode) return;
    setBusy(true);
    try {
      await attributeFamiliesApi.delete(deletingNode.id);
      toast.success("Tugun o'chirildi");
      if (selectedId === deletingNode.id) { setSelectedId(null); setDetail(null); setEffective(null); }
      setDeletingNode(null);
      await loadTree();
    } catch (e) {
      handleApiError(e, "O'chirishda xatolik");
    } finally {
      setBusy(false);
    }
  };

  // ---- Own attribute CRUD ----
  const addAttribute = async (attr: AttributeDefinition) => {
    if (!selectedId) return;
    setBusy(true);
    try {
      await attributeFamiliesApi.addOwnAttribute(selectedId, attr);
      toast.success("Atribut qo'shildi");
      await refreshAfterMutation();
    } catch (e) { handleApiError(e, 'Saqlashda xatolik'); } finally { setBusy(false); }
  };
  const updateAttribute = async (key: string, attr: AttributeDefinition) => {
    if (!selectedId) return;
    setBusy(true);
    try {
      await attributeFamiliesApi.updateOwnAttribute(selectedId, key, attr);
      toast.success('Atribut yangilandi');
      await refreshAfterMutation();
    } catch (e) { handleApiError(e, 'Saqlashda xatolik'); } finally { setBusy(false); }
  };
  const removeAttribute = async (key: string) => {
    if (!selectedId) return;
    setBusy(true);
    try {
      await attributeFamiliesApi.removeOwnAttribute(selectedId, key);
      toast.success("Atribut o'chirildi");
      await refreshAfterMutation();
    } catch (e) { handleApiError(e, "O'chirishda xatolik"); } finally { setBusy(false); }
  };

  // ---- Override (property-level) ----
  const saveOverride = async (changedProps: Record<string, unknown>) => {
    if (!selectedId || !overrideAttr) return;
    setBusy(true);
    try {
      await attributeFamiliesApi.setOverride(selectedId, overrideAttr.key, changedProps);
      toast.success('Override saqlandi');
      setOverrideAttr(null);
      await refreshAfterMutation();
    } catch (e) { handleApiError(e, 'Saqlashda xatolik'); } finally { setBusy(false); }
  };
  const clearOverride = async () => {
    if (!selectedId || !overrideAttr) return;
    setBusy(true);
    try {
      await attributeFamiliesApi.clearOverride(selectedId, overrideAttr.key);
      toast.success('Merosga qaytarildi');
      setOverrideAttr(null);
      await refreshAfterMutation();
    } catch (e) { handleApiError(e, "O'chirishda xatolik"); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="section-title flex items-center gap-2"><Network className="h-6 w-6" />Atribut oilasi</h1>
          <p className="section-subtitle">Ierarxik atribut daraxti — ildizdagi atributlar barcha avlodlarga meros</p>
        </div>
        <PermissionGate permission={PermissionCode.ATTRIBUTE_FAMILIES_CREATE}>
          <button className="btn btn-primary" onClick={openCreateNode}><Plus className="h-5 w-5" />Yangi tugun</button>
        </PermissionGate>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        {/* Tree */}
        <div className="surface-card h-fit p-3">
          {loading ? (
            <div className="flex h-64 items-center justify-center"><span className="loading loading-spinner loading-lg" /></div>
          ) : (
            <FamilyTreeView nodes={tree} selectedId={selectedId} onSelect={handleSelect} />
          )}
        </div>

        {/* Detail */}
        <div>
          {!selectedId ? (
            <div className="surface-card flex h-64 flex-col items-center justify-center gap-3 text-center text-base-content/50">
              <Network className="h-10 w-10" />
              <p>Chapdan tugun tanlang yoki yangi tugun yarating</p>
            </div>
          ) : detailLoading || !detail ? (
            <div className="surface-card flex h-64 items-center justify-center"><span className="loading loading-spinner loading-lg" /></div>
          ) : (
            <div className="space-y-4">
              {canEdit && (
                <div className="flex items-center justify-end gap-2">
                  <button className="btn btn-ghost btn-sm" onClick={() => openEditNode(detail)}>
                    <Pencil className="h-4 w-4" />Tugunni tahrirlash
                  </button>
                  <button className="btn btn-ghost btn-sm text-error" onClick={() => setDeletingNode(detail)}
                    disabled={detail.isSystem || (detail.productCount || 0) > 0 || (detail.children?.length || 0) > 0}
                    title={detail.isSystem ? 'Tizimiy tugun' : 'O\'chirish'}>
                    <Trash2 className="h-4 w-4" />O'chirish
                  </button>
                </div>
              )}
              <FamilyNodeEditorPanel
                family={detail}
                effective={effective}
                canEdit={canEdit}
                busy={busy}
                onAddAttribute={addAttribute}
                onUpdateAttribute={updateAttribute}
                onRemoveAttribute={removeAttribute}
                onOverrideInherited={setOverrideAttr}
              />
            </div>
          )}
        </div>
      </div>

      {/* Node modal */}
      <ModalPortal isOpen={showNodeModal} onClose={() => setShowNodeModal(false)}>
        <div className="w-full max-w-lg bg-base-100 rounded-2xl shadow-2xl">
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-semibold">{editingNode ? 'Tugunni tahrirlash' : 'Yangi tugun'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNodeModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="form-control">
                  <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">Kod *</span>
                  <input type="text" className="input input-bordered w-full font-mono" value={nodeForm.code}
                    disabled={!!editingNode?.isSystem}
                    onChange={(e) => setNodeForm((p) => ({ ...p, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '').replace(/^[0-9_]+/, '') }))}
                    placeholder="ROLLER_BLIND" />
                </label>
                <label className="form-control">
                  <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">Nomi *</span>
                  <input type="text" className="input input-bordered w-full" value={nodeForm.name}
                    onChange={(e) => setNodeForm((p) => ({ ...p, name: e.target.value }))} placeholder="Roletka" />
                </label>
              </div>

              <label className="form-control">
                <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">Tavsif</span>
                <textarea className="textarea textarea-bordered w-full" rows={2} value={nodeForm.description || ''}
                  onChange={(e) => setNodeForm((p) => ({ ...p, description: e.target.value }))} placeholder="Qisqacha tavsif..." />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="form-control">
                  <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">Ota tugun</span>
                  <select className="select select-bordered w-full" value={nodeForm.parentId ?? ''}
                    onChange={(e) => setNodeForm((p) => ({ ...p, parentId: e.target.value ? Number(e.target.value) : null }))}>
                    <option value="">— Ildiz (root) —</option>
                    {flat.filter((f) => f.node.id !== editingNode?.id).map(({ node, depth }) => (
                      <option key={node.id} value={node.id}>{' '.repeat(depth * 2)}{node.name}</option>
                    ))}
                  </select>
                </label>
                <label className="form-control">
                  <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">Mahsulot turi (ixtiyoriy)</span>
                  <select className="select select-bordered w-full" value={nodeForm.productTypeId ?? ''}
                    onChange={(e) => setNodeForm((p) => ({ ...p, productTypeId: e.target.value ? Number(e.target.value) : null }))}>
                    <option value="">— Yo'q —</option>
                    {productTypes.map((pt) => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                  </select>
                </label>
              </div>

              <div className="form-control">
                <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">Rang</span>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button key={c} type="button" title={c}
                      className={clsx('h-8 w-8 rounded-lg transition-all', `bg-${c}`,
                        nodeForm.color === c ? 'ring-2 ring-offset-2 ring-base-content' : 'opacity-60 hover:opacity-100')}
                      onClick={() => setNodeForm((p) => ({ ...p, color: c }))} />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setShowNodeModal(false)} disabled={nodeSaving}>Bekor qilish</button>
              <button className="btn btn-primary" onClick={saveNode} disabled={nodeSaving || !nodeForm.code.trim() || !nodeForm.name.trim()}>
                {nodeSaving && <span className="loading loading-spinner loading-sm" />}Saqlash
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* Delete confirm */}
      <ModalPortal isOpen={!!deletingNode} onClose={() => setDeletingNode(null)}>
        <div className="w-full max-w-sm bg-base-100 rounded-2xl shadow-2xl p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-error/10"><AlertTriangle className="h-6 w-6 text-error" /></div>
            <div>
              <h3 className="text-lg font-semibold">O'chirishni tasdiqlang</h3>
              <p className="mt-1 text-sm text-base-content/60">"{deletingNode?.name}" tugunini o'chirmoqchimisiz?</p>
            </div>
          </div>
          <div className="mt-6 flex justify-center gap-2">
            <button className="btn btn-ghost" onClick={() => setDeletingNode(null)} disabled={busy}>Bekor qilish</button>
            <button className="btn btn-error" onClick={deleteNode} disabled={busy}>
              {busy && <span className="loading loading-spinner loading-sm" />}O'chirish
            </button>
          </div>
        </div>
      </ModalPortal>

      {/* Override modal */}
      <AttributeOverrideModal
        open={!!overrideAttr}
        attr={overrideAttr}
        existing={detail?.overrides?.find((o) => o.key === overrideAttr?.key)?.changedProps}
        saving={busy}
        onClose={() => setOverrideAttr(null)}
        onSave={saveOverride}
        onClear={clearOverride}
      />
    </div>
  );
}

// Backend field-level / message xatolarini toast qiladi
function handleApiError(e: unknown, fallback: string) {
  const err = e as { response?: { data?: { message?: string; data?: Record<string, string> } } };
  const data = err?.response?.data;
  if (data?.data && typeof data.data === 'object') {
    const first = Object.values(data.data)[0];
    toast.error(first || data.message || fallback);
  } else {
    toast.error(data?.message || fallback);
  }
}
