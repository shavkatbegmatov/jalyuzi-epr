import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  X,
  AlertTriangle,
  Pencil,
  Trash2,
  Settings2,
  Package,
  Lock,
  Layers,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Hash,
  Type,
  ToggleLeft,
  Calendar,
  List,
  ListChecks,
  DollarSign,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { productTypesApi } from '../../api/product-types.api';
import { NumberInput } from '../../components/ui/NumberInput';
import { Select } from '../../components/ui/Select';
import { ModalPortal } from '../../components/common/Modal';
import { PermissionCode } from '../../hooks/usePermission';
import { PermissionGate } from '../../components/common/PermissionGate';
import type {
  ProductTypeEntity,
  ProductTypeRequest,
  AttributeDefinition,
  AttributeDataType,
  UnitType,
  SelectOption,
} from '../../types';

// Icon options for product types
const ICON_OPTIONS = [
  { value: 'Package', label: 'Quti', icon: Package },
  { value: 'Layers', label: 'Qatlamlar', icon: Layers },
  { value: 'Settings2', label: 'Sozlamalar', icon: Settings2 },
];

// Color options for product types
const COLOR_OPTIONS = [
  { value: 'primary', label: 'Asosiy', class: 'bg-primary' },
  { value: 'secondary', label: 'Ikkilamchi', class: 'bg-secondary' },
  { value: 'accent', label: 'Urg\'u', class: 'bg-accent' },
  { value: 'info', label: 'Ma\'lumot', class: 'bg-info' },
  { value: 'success', label: 'Muvaffaqiyat', class: 'bg-success' },
  { value: 'warning', label: 'Ogohlantirish', class: 'bg-warning' },
  { value: 'error', label: 'Xato', class: 'bg-error' },
];

// Unit type options
const UNIT_TYPE_OPTIONS: { value: UnitType; label: string }[] = [
  { value: 'PIECE', label: 'Dona' },
  { value: 'METER', label: 'Metr' },
  { value: 'SQUARE_METER', label: 'Kvadrat metr' },
  { value: 'KILOGRAM', label: 'Kilogram' },
  { value: 'ROLL', label: 'Rulon' },
];

// Data type options with icons
const DATA_TYPE_OPTIONS: { value: AttributeDataType; label: string; icon: React.ReactNode }[] = [
  { value: 'text', label: 'Matn', icon: <Type className="h-4 w-4" /> },
  { value: 'number', label: 'Butun son', icon: <Hash className="h-4 w-4" /> },
  { value: 'decimal', label: "O'nlik son", icon: <Hash className="h-4 w-4" /> },
  { value: 'currency', label: 'Narx', icon: <DollarSign className="h-4 w-4" /> },
  { value: 'boolean', label: 'Ha/Yo\'q', icon: <ToggleLeft className="h-4 w-4" /> },
  { value: 'date', label: 'Sana', icon: <Calendar className="h-4 w-4" /> },
  { value: 'select', label: 'Tanlash', icon: <List className="h-4 w-4" /> },
  { value: 'multiselect', label: 'Ko\'p tanlash', icon: <ListChecks className="h-4 w-4" /> },
];

// Empty form states
const emptyProductTypeForm: ProductTypeRequest = {
  code: '',
  name: '',
  description: '',
  icon: 'Package',
  color: 'primary',
  displayOrder: 0,
  defaultUnitType: 'PIECE',
  attributeSchema: { groups: [], attributes: [] },
};

const emptyAttributeForm: AttributeDefinition = {
  key: '',
  label: '',
  dataType: 'text',
  group: '',
  order: 0,
  required: false,
  placeholder: '',
  helpText: '',
  unit: '',
  options: [],
  validation: {},
  showInList: false,
  showInCard: false,
  searchable: false,
};

export function ProductTypesPage() {
  // Product types state
  const [productTypes, setProductTypes] = useState<ProductTypeEntity[]>([]);
  const [loading, setLoading] = useState(true);

  // Type form state
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingType, setEditingType] = useState<ProductTypeEntity | null>(null);
  const [typeForm, setTypeForm] = useState<ProductTypeRequest>(emptyProductTypeForm);
  const [typeSaving, setTypeSaving] = useState(false);

  // Attribute form state
  const [showAttributeModal, setShowAttributeModal] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<AttributeDefinition | null>(null);
  const [attributeForm, setAttributeForm] = useState<AttributeDefinition>(emptyAttributeForm);
  const [attributeSaving, setAttributeSaving] = useState(false);

  // Delete state
  const [deletingType, setDeletingType] = useState<ProductTypeEntity | null>(null);
  const [typeDeleting, setTypeDeleting] = useState(false);

  // Expanded type for attribute editing
  const [expandedTypeId, setExpandedTypeId] = useState<number | null>(null);

  // Load product types
  const loadProductTypes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productTypesApi.getAllAdmin();
      setProductTypes(data);
    } catch (error) {
      console.error('Failed to load product types:', error);
      toast.error('Mahsulot turlarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProductTypes();
  }, [loadProductTypes]);

  // Type modal handlers
  const handleOpenTypeModal = (type?: ProductTypeEntity) => {
    if (type) {
      setEditingType(type);
      setTypeForm({
        code: type.code,
        name: type.name,
        description: type.description || '',
        icon: type.icon || 'Package',
        color: type.color || 'primary',
        displayOrder: type.displayOrder || 0,
        defaultUnitType: type.defaultUnitType || 'PIECE',
        attributeSchema: type.attributeSchema || { groups: [], attributes: [] },
      });
    } else {
      setEditingType(null);
      setTypeForm(emptyProductTypeForm);
    }
    setShowTypeModal(true);
  };

  const handleCloseTypeModal = () => {
    setShowTypeModal(false);
    setEditingType(null);
    setTypeForm(emptyProductTypeForm);
  };

  const handleSaveType = async () => {
    if (!typeForm.code.trim() || !typeForm.name.trim()) return;
    setTypeSaving(true);
    try {
      if (editingType) {
        await productTypesApi.update(editingType.id, typeForm);
        toast.success('Mahsulot turi yangilandi');
      } else {
        await productTypesApi.create(typeForm);
        toast.success('Mahsulot turi yaratildi');
      }
      handleCloseTypeModal();
      void loadProductTypes();
    } catch (error) {
      console.error('Failed to save product type:', error);
      toast.error('Saqlashda xatolik yuz berdi');
    } finally {
      setTypeSaving(false);
    }
  };

  const handleDeleteType = async () => {
    if (!deletingType) return;
    setTypeDeleting(true);
    try {
      await productTypesApi.delete(deletingType.id);
      toast.success('Mahsulot turi o\'chirildi');
      setDeletingType(null);
      void loadProductTypes();
    } catch (error) {
      console.error('Failed to delete product type:', error);
      toast.error('O\'chirishda xatolik yuz berdi');
    } finally {
      setTypeDeleting(false);
    }
  };

  // Attribute modal handlers
  const handleOpenAttributeModal = (
    typeId: number,
    attribute?: AttributeDefinition
  ) => {
    setExpandedTypeId(typeId);
    if (attribute) {
      setEditingAttribute(attribute);
      setAttributeForm({ ...attribute });
    } else {
      setEditingAttribute(null);
      const type = productTypes.find((t) => t.id === typeId);
      const maxOrder = Math.max(
        0,
        ...(type?.attributeSchema?.attributes?.map((a) => a.order || 0) || [0])
      );
      setAttributeForm({
        ...emptyAttributeForm,
        order: maxOrder + 1,
      });
    }
    setShowAttributeModal(true);
  };

  const handleCloseAttributeModal = () => {
    setShowAttributeModal(false);
    setEditingAttribute(null);
    setAttributeForm(emptyAttributeForm);
  };

  const handleSaveAttribute = async () => {
    if (!expandedTypeId || !attributeForm.key.trim() || !attributeForm.label.trim()) return;
    setAttributeSaving(true);
    try {
      if (editingAttribute) {
        await productTypesApi.updateAttribute(expandedTypeId, editingAttribute.key, attributeForm);
        toast.success('Atribut yangilandi');
      } else {
        await productTypesApi.addAttribute(expandedTypeId, attributeForm);
        toast.success('Atribut qo\'shildi');
      }
      handleCloseAttributeModal();
      void loadProductTypes();
    } catch (error) {
      console.error('Failed to save attribute:', error);
      toast.error('Saqlashda xatolik yuz berdi');
    } finally {
      setAttributeSaving(false);
    }
  };

  const handleRemoveAttribute = async (typeId: number, attributeKey: string) => {
    try {
      await productTypesApi.removeAttribute(typeId, attributeKey);
      toast.success('Atribut o\'chirildi');
      void loadProductTypes();
    } catch (error) {
      console.error('Failed to remove attribute:', error);
      toast.error('O\'chirishda xatolik yuz berdi');
    }
  };

  // Select options change handler
  const handleOptionsChange = (index: number, field: keyof SelectOption, value: string) => {
    const newOptions = [...(attributeForm.options || [])];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setAttributeForm((prev) => ({ ...prev, options: newOptions }));
  };

  const handleAddOption = () => {
    setAttributeForm((prev) => ({
      ...prev,
      options: [...(prev.options || []), { value: '', label: '' }],
    }));
  };

  const handleRemoveOption = (index: number) => {
    setAttributeForm((prev) => ({
      ...prev,
      options: (prev.options || []).filter((_, i) => i !== index),
    }));
  };

  // Get icon component
  const getIconComponent = (iconName?: string) => {
    const found = ICON_OPTIONS.find((opt) => opt.value === iconName);
    return found ? found.icon : Package;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="section-title">Mahsulot Turlari</h1>
          <p className="section-subtitle">
            Mahsulot turlarini va ularning atributlarini boshqaring
          </p>
        </div>
        <PermissionGate permission={PermissionCode.PRODUCT_TYPES_CREATE}>
          <button className="btn btn-primary" onClick={() => handleOpenTypeModal()}>
            <Plus className="h-5 w-5" />
            Yangi tur
          </button>
        </PermissionGate>
      </div>

      {/* Product Types List */}
      <div className="space-y-4">
        {loading ? (
          <div className="surface-card flex items-center justify-center h-64">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : productTypes.length === 0 ? (
          <div className="surface-card flex flex-col items-center justify-center gap-4 p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-base-200">
              <Layers className="h-8 w-8 text-base-content/50" />
            </div>
            <div>
              <p className="text-lg font-semibold">Mahsulot turlari topilmadi</p>
              <p className="text-sm text-base-content/60">Yangi mahsulot turi qo'shing</p>
            </div>
          </div>
        ) : (
          productTypes.map((type) => {
            const IconComponent = getIconComponent(type.icon);
            const isExpanded = expandedTypeId === type.id;
            const attributes = type.attributeSchema?.attributes || [];

            return (
              <div key={type.id} className="surface-card overflow-hidden">
                {/* Type Header */}
                <div
                  className={clsx(
                    'flex items-center gap-4 p-4 cursor-pointer transition-colors',
                    isExpanded ? 'bg-base-200/50' : 'hover:bg-base-200/30'
                  )}
                  onClick={() => setExpandedTypeId(isExpanded ? null : type.id)}
                >
                  {/* Icon */}
                  <div
                    className={clsx(
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                      `bg-${type.color || 'primary'}/10`
                    )}
                  >
                    <IconComponent className={clsx('h-6 w-6', `text-${type.color || 'primary'}`)} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{type.name}</h3>
                      {type.isSystem && (
                        <span className="badge badge-ghost badge-sm gap-1">
                          <Lock className="h-3 w-3" />
                          Tizimiy
                        </span>
                      )}
                      {!type.isActive && (
                        <span className="badge badge-error badge-sm">Nofaol</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-base-content/60">
                      <span className="font-mono">{type.code}</span>
                      <span>•</span>
                      <span>{type.productCount || 0} ta mahsulot</span>
                      <span>•</span>
                      <span>{attributes.length} ta atribut</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <PermissionGate permission={PermissionCode.PRODUCT_TYPES_UPDATE}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleOpenTypeModal(type)}
                        disabled={type.isSystem}
                        title={type.isSystem ? 'Tizimiy turni tahrirlash mumkin emas' : 'Tahrirlash'}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </PermissionGate>
                    <PermissionGate permission={PermissionCode.PRODUCT_TYPES_DELETE}>
                      <button
                        className="btn btn-ghost btn-sm text-error"
                        onClick={() => setDeletingType(type)}
                        disabled={type.isSystem || (type.productCount || 0) > 0}
                        title={
                          type.isSystem
                            ? 'Tizimiy turni o\'chirish mumkin emas'
                            : (type.productCount || 0) > 0
                            ? 'Mahsulotlari bor turni o\'chirish mumkin emas'
                            : 'O\'chirish'
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </PermissionGate>
                    <button className="btn btn-ghost btn-sm">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Attributes Section (Expanded) */}
                {isExpanded && (
                  <div className="border-t border-base-300 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Atributlar</h4>
                      <PermissionGate permission={PermissionCode.PRODUCT_TYPES_UPDATE}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleOpenAttributeModal(type.id)}
                          disabled={type.isSystem}
                        >
                          <Plus className="h-4 w-4" />
                          Atribut qo'shish
                        </button>
                      </PermissionGate>
                    </div>

                    {attributes.length === 0 ? (
                      <div className="text-center py-8 text-base-content/50">
                        <p>Atributlar mavjud emas</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {attributes
                          .sort((a, b) => (a.order || 0) - (b.order || 0))
                          .map((attr) => (
                            <div
                              key={attr.key}
                              className="flex items-center gap-3 p-3 rounded-lg bg-base-200/50"
                            >
                              <GripVertical className="h-4 w-4 text-base-content/30" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{attr.label}</span>
                                  <span className="badge badge-ghost badge-xs font-mono">
                                    {attr.key}
                                  </span>
                                  {attr.required && (
                                    <span className="badge badge-warning badge-xs">Majburiy</span>
                                  )}
                                </div>
                                <div className="text-xs text-base-content/60">
                                  {DATA_TYPE_OPTIONS.find((d) => d.value === attr.dataType)?.label ||
                                    attr.dataType}
                                  {attr.unit && ` (${attr.unit})`}
                                </div>
                              </div>
                              <PermissionGate permission={PermissionCode.PRODUCT_TYPES_UPDATE}>
                                <div className="flex items-center gap-1">
                                  <button
                                    className="btn btn-ghost btn-xs"
                                    onClick={() => handleOpenAttributeModal(type.id, attr)}
                                    disabled={type.isSystem}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    className="btn btn-ghost btn-xs text-error"
                                    onClick={() => handleRemoveAttribute(type.id, attr.key)}
                                    disabled={type.isSystem}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </PermissionGate>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Product Type Modal */}
      <ModalPortal isOpen={showTypeModal} onClose={handleCloseTypeModal}>
        <div className="w-full max-w-lg bg-base-100 rounded-2xl shadow-2xl">
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">
                  {editingType ? 'Mahsulot turini tahrirlash' : 'Yangi mahsulot turi'}
                </h3>
                <p className="text-sm text-base-content/60">
                  {editingType
                    ? 'Mahsulot turi ma\'lumotlarini yangilang'
                    : 'Yangi mahsulot turi yarating'}
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleCloseTypeModal}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {/* Code */}
              <label className="form-control">
                <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                  Kod *
                </span>
                <input
                  type="text"
                  className="input input-bordered w-full font-mono"
                  value={typeForm.code}
                  onChange={(e) => {
                    // Convert to uppercase and remove invalid characters
                    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
                    // Remove leading numbers and underscores (must start with letter)
                    value = value.replace(/^[0-9_]+/, '');
                    setTypeForm((prev) => ({ ...prev, code: value }));
                  }}
                  placeholder="CUSTOM_TYPE"
                  disabled={!!editingType?.isSystem}
                />
                <span className="label-text-alt text-base-content/50 mt-1">
                  Harf bilan boshlanishi shart (A-Z, 0-9, _)
                </span>
              </label>

              {/* Name */}
              <label className="form-control">
                <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                  Nomi *
                </span>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={typeForm.name}
                  onChange={(e) => setTypeForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Mahsulot turi nomi"
                />
              </label>

              {/* Description */}
              <label className="form-control">
                <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                  Tavsif
                </span>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows={2}
                  value={typeForm.description}
                  onChange={(e) =>
                    setTypeForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Qisqacha tavsif..."
                />
              </label>

              {/* Icon and Color */}
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Belgi"
                  value={typeForm.icon}
                  onChange={(val) => setTypeForm((prev) => ({ ...prev, icon: val?.toString() }))}
                  options={ICON_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
                />

                <div className="form-control">
                  <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                    Rang
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={clsx(
                          'h-8 w-8 rounded-lg transition-all',
                          color.class,
                          typeForm.color === color.value
                            ? 'ring-2 ring-offset-2 ring-base-content'
                            : 'opacity-60 hover:opacity-100'
                        )}
                        onClick={() => setTypeForm((prev) => ({ ...prev, color: color.value }))}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Default Unit Type and Display Order */}
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Birlik turi"
                  value={typeForm.defaultUnitType}
                  onChange={(val) =>
                    setTypeForm((prev) => ({
                      ...prev,
                      defaultUnitType: val as UnitType,
                    }))
                  }
                  options={UNIT_TYPE_OPTIONS}
                />

                <NumberInput
                  label="Tartib raqami"
                  value={typeForm.displayOrder || 0}
                  onChange={(val) =>
                    setTypeForm((prev) => ({
                      ...prev,
                      displayOrder: typeof val === 'number' ? val : 0,
                    }))
                  }
                  min={0}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={handleCloseTypeModal} disabled={typeSaving}>
                Bekor qilish
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveType}
                disabled={typeSaving || !typeForm.code.trim() || !typeForm.name.trim()}
              >
                {typeSaving && <span className="loading loading-spinner loading-sm" />}
                Saqlash
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* Attribute Modal */}
      <ModalPortal isOpen={showAttributeModal} onClose={handleCloseAttributeModal}>
        <div className="w-full max-w-lg bg-base-100 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">
                  {editingAttribute ? 'Atributni tahrirlash' : 'Yangi atribut'}
                </h3>
                <p className="text-sm text-base-content/60">
                  {editingAttribute
                    ? 'Atribut ma\'lumotlarini yangilang'
                    : 'Yangi atribut qo\'shing'}
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleCloseAttributeModal}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {/* Key and Label */}
              <div className="grid grid-cols-2 gap-4">
                <label className="form-control">
                  <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                    Kalit *
                  </span>
                  <input
                    type="text"
                    className="input input-bordered w-full font-mono"
                    value={attributeForm.key}
                    onChange={(e) =>
                      setAttributeForm((prev) => ({
                        ...prev,
                        key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                      }))
                    }
                    placeholder="field_key"
                    disabled={!!editingAttribute}
                  />
                </label>

                <label className="form-control">
                  <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                    Sarlavha *
                  </span>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={attributeForm.label}
                    onChange={(e) =>
                      setAttributeForm((prev) => ({ ...prev, label: e.target.value }))
                    }
                    placeholder="Maydon nomi"
                  />
                </label>
              </div>

              {/* Data Type */}
              <div className="form-control">
                <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                  Ma'lumot turi *
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {DATA_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={clsx(
                        'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all',
                        attributeForm.dataType === opt.value
                          ? 'border-primary bg-primary/5'
                          : 'border-base-300 hover:border-primary/50'
                      )}
                      onClick={() =>
                        setAttributeForm((prev) => ({ ...prev, dataType: opt.value }))
                      }
                    >
                      {opt.icon}
                      <span className="text-xs">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Options for select/multiselect */}
              {(attributeForm.dataType === 'select' || attributeForm.dataType === 'multiselect') && (
                <div className="form-control">
                  <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                    Tanlovlar
                  </span>
                  <div className="space-y-2">
                    {(attributeForm.options || []).map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          className="input input-bordered input-sm flex-1 font-mono"
                          value={option.value}
                          onChange={(e) => handleOptionsChange(index, 'value', e.target.value)}
                          placeholder="value"
                        />
                        <input
                          type="text"
                          className="input input-bordered input-sm flex-1"
                          value={option.label}
                          onChange={(e) => handleOptionsChange(index, 'label', e.target.value)}
                          placeholder="Label"
                        />
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-error"
                          onClick={() => handleRemoveOption(index)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={handleAddOption}
                    >
                      <Plus className="h-4 w-4" />
                      Tanlov qo'shish
                    </button>
                  </div>
                </div>
              )}

              {/* Unit and Placeholder */}
              <div className="grid grid-cols-2 gap-4">
                <label className="form-control">
                  <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                    Birlik
                  </span>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={attributeForm.unit || ''}
                    onChange={(e) =>
                      setAttributeForm((prev) => ({ ...prev, unit: e.target.value }))
                    }
                    placeholder="mm, kg, m..."
                  />
                </label>

                <label className="form-control">
                  <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                    Placeholder
                  </span>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={attributeForm.placeholder || ''}
                    onChange={(e) =>
                      setAttributeForm((prev) => ({ ...prev, placeholder: e.target.value }))
                    }
                    placeholder="Misol qiymat..."
                  />
                </label>
              </div>

              {/* Help Text */}
              <label className="form-control">
                <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                  Yordam matni
                </span>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={attributeForm.helpText || ''}
                  onChange={(e) =>
                    setAttributeForm((prev) => ({ ...prev, helpText: e.target.value }))
                  }
                  placeholder="Bu maydon nima uchun kerak..."
                />
              </label>

              {/* Checkboxes */}
              <div className="flex flex-wrap gap-4">
                <label className="label cursor-pointer gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={attributeForm.required || false}
                    onChange={(e) =>
                      setAttributeForm((prev) => ({ ...prev, required: e.target.checked }))
                    }
                  />
                  <span className="label-text">Majburiy</span>
                </label>

                <label className="label cursor-pointer gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={attributeForm.showInList || false}
                    onChange={(e) =>
                      setAttributeForm((prev) => ({ ...prev, showInList: e.target.checked }))
                    }
                  />
                  <span className="label-text">Ro'yxatda</span>
                </label>

                <label className="label cursor-pointer gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={attributeForm.showInCard || false}
                    onChange={(e) =>
                      setAttributeForm((prev) => ({ ...prev, showInCard: e.target.checked }))
                    }
                  />
                  <span className="label-text">Kartada</span>
                </label>

                <label className="label cursor-pointer gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={attributeForm.searchable || false}
                    onChange={(e) =>
                      setAttributeForm((prev) => ({ ...prev, searchable: e.target.checked }))
                    }
                  />
                  <span className="label-text">Qidiruv</span>
                </label>
              </div>

              {/* Order */}
              <NumberInput
                label="Tartib raqami"
                value={attributeForm.order || 0}
                onChange={(val) =>
                  setAttributeForm((prev) => ({
                    ...prev,
                    order: typeof val === 'number' ? val : 0,
                  }))
                }
                min={0}
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                className="btn btn-ghost"
                onClick={handleCloseAttributeModal}
                disabled={attributeSaving}
              >
                Bekor qilish
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveAttribute}
                disabled={
                  attributeSaving || !attributeForm.key.trim() || !attributeForm.label.trim()
                }
              >
                {attributeSaving && <span className="loading loading-spinner loading-sm" />}
                Saqlash
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* Delete Confirmation Modal */}
      <ModalPortal isOpen={!!deletingType} onClose={() => setDeletingType(null)}>
        <div className="w-full max-w-sm bg-base-100 rounded-2xl shadow-2xl relative">
          <div className="p-4 sm:p-6">
            <button
              className="btn btn-circle btn-ghost btn-sm absolute right-3 top-3"
              onClick={() => setDeletingType(null)}
              disabled={typeDeleting}
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
                <AlertTriangle className="h-6 w-6 text-error" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">O'chirishni tasdiqlang</h3>
                <p className="mt-1 text-sm text-base-content/60">
                  "{deletingType?.name}" mahsulot turini o'chirmoqchimisiz?
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-center gap-2">
              <button
                className="btn btn-ghost"
                onClick={() => setDeletingType(null)}
                disabled={typeDeleting}
              >
                Bekor qilish
              </button>
              <button className="btn btn-error" onClick={handleDeleteType} disabled={typeDeleting}>
                {typeDeleting && <span className="loading loading-spinner loading-sm" />}
                O'chirish
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}
