import { RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { Select } from '../../ui/Select';
import { NumberInput } from '../../ui/NumberInput';
import { DynamicProductForm } from '../DynamicProductForm';
import { BLIND_TYPES, BLIND_MATERIALS, CONTROL_TYPES, UNIT_TYPES } from '../../../config/constants';
import type { ProductTypeEntity, Brand, Category, BlindType, BlindMaterial, ControlType, UnitType, ProductType } from '../../../types';
import type { WizardState } from '../../../hooks/useAddProductWizard';

interface BasicInfoStepProps {
  productType: ProductTypeEntity | null;
  productTypeCode: ProductType | null;
  basicInfo: WizardState['basicInfo'];
  customAttributes: Record<string, unknown>;
  brands: Brand[];
  categories: Category[];
  errors: Record<string, string>;
  onUpdateBasicInfo: <K extends keyof WizardState['basicInfo']>(
    field: K,
    value: WizardState['basicInfo'][K]
  ) => void;
  onUpdateCustomAttributes: (attrs: Record<string, unknown>) => void;
  onGenerateSku: () => void;
  disabled?: boolean;
}

export function BasicInfoStep({
  productType,
  productTypeCode,
  basicInfo,
  customAttributes,
  brands,
  categories,
  errors,
  onUpdateBasicInfo,
  onUpdateCustomAttributes,
  onGenerateSku,
  disabled = false,
}: BasicInfoStepProps) {
  const isFinishedProduct = productTypeCode === 'FINISHED_PRODUCT';
  const isRawMaterial = productTypeCode === 'RAW_MATERIAL';
  const isAccessory = productTypeCode === 'ACCESSORY';

  return (
    <div className="space-y-6">
      {/* Section: Basic info */}
      <div className="surface-soft rounded-xl p-4 sm:p-6 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
          Asosiy ma'lumotlar
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
          {/* SKU with generate button */}
          <div className="sm:col-span-4">
            <label className="form-control">
              <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                SKU *
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  className={clsx(
                    'input input-bordered flex-1',
                    errors.sku && 'input-error'
                  )}
                  value={basicInfo.sku}
                  onChange={(e) => onUpdateBasicInfo('sku', e.target.value)}
                  placeholder="JAL-001"
                  disabled={disabled}
                />
                <button
                  type="button"
                  onClick={onGenerateSku}
                  disabled={disabled}
                  className="btn btn-square btn-ghost"
                  title="SKU yaratish"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              {errors.sku && (
                <span className="label-text-alt text-error mt-1">{errors.sku}</span>
              )}
            </label>
          </div>

          {/* Name */}
          <div className="sm:col-span-5">
            <label className="form-control">
              <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                Nomi *
              </span>
              <input
                type="text"
                className={clsx(
                  'input input-bordered w-full',
                  errors.name && 'input-error'
                )}
                value={basicInfo.name}
                onChange={(e) => onUpdateBasicInfo('name', e.target.value)}
                placeholder="Roletka Premium Oq"
                disabled={disabled}
              />
              {errors.name && (
                <span className="label-text-alt text-error mt-1">{errors.name}</span>
              )}
            </label>
          </div>

          {/* Brand */}
          <div className="sm:col-span-3">
            <Select
              label="Brend"
              value={basicInfo.brandId || ''}
              onChange={(value) => onUpdateBasicInfo('brandId', value ? Number(value) : undefined)}
              placeholder="Tanlang..."
              options={brands.map((brand) => ({ value: brand.id, label: brand.name }))}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
          {/* Category */}
          <div className="sm:col-span-3">
            <Select
              label="Kategoriya"
              value={basicInfo.categoryId || ''}
              onChange={(value) => onUpdateBasicInfo('categoryId', value ? Number(value) : undefined)}
              placeholder="Tanlang..."
              options={categories.map((category) => ({ value: category.id, label: category.name }))}
              disabled={disabled}
            />
          </div>

          {/* Unit type */}
          <div className="sm:col-span-3">
            <Select
              label="O'lchov birligi"
              value={basicInfo.unitType || 'PIECE'}
              onChange={(value) => onUpdateBasicInfo('unitType', (value as UnitType) || 'PIECE')}
              options={Object.entries(UNIT_TYPES).map(([key, { label }]) => ({ value: key, label }))}
              disabled={disabled}
            />
          </div>

          {/* Color */}
          <div className="sm:col-span-3">
            <label className="form-control">
              <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                Rang
              </span>
              <input
                type="text"
                className="input input-bordered w-full"
                value={basicInfo.color || ''}
                onChange={(e) => onUpdateBasicInfo('color', e.target.value || undefined)}
                placeholder="Oq"
                disabled={disabled}
              />
            </label>
          </div>

          {/* Description */}
          <div className="sm:col-span-3">
            <label className="form-control">
              <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
                Tavsif
              </span>
              <input
                type="text"
                className="input input-bordered w-full"
                value={basicInfo.description || ''}
                onChange={(e) => onUpdateBasicInfo('description', e.target.value || undefined)}
                placeholder="Qo'shimcha ma'lumot..."
                disabled={disabled}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Section: Type-specific fields for FINISHED_PRODUCT */}
      {isFinishedProduct && (
        <div className="surface-soft rounded-xl p-4 sm:p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
            Jalyuzi xususiyatlari
          </p>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Select
              label="Jalyuzi turi"
              value={basicInfo.blindType || ''}
              onChange={(value) => onUpdateBasicInfo('blindType', (value as BlindType) || undefined)}
              placeholder="Tanlang..."
              options={Object.entries(BLIND_TYPES).map(([key, { label }]) => ({ value: key, label }))}
              disabled={disabled}
            />
            <Select
              label="Material"
              value={basicInfo.material || ''}
              onChange={(value) => onUpdateBasicInfo('material', (value as BlindMaterial) || undefined)}
              placeholder="Tanlang..."
              options={Object.entries(BLIND_MATERIALS).map(([key, { label }]) => ({ value: key, label }))}
              disabled={disabled}
            />
            <Select
              label="Boshqaruv"
              value={basicInfo.controlType || ''}
              onChange={(value) => onUpdateBasicInfo('controlType', (value as ControlType) || undefined)}
              placeholder="Tanlang..."
              options={Object.entries(CONTROL_TYPES).map(([key, { label }]) => ({ value: key, label }))}
              disabled={disabled}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <NumberInput
              label="Min kenglik (mm)"
              value={basicInfo.minWidth ?? ''}
              onChange={(val) => onUpdateBasicInfo('minWidth', val === '' ? undefined : Number(val))}
              placeholder="300"
              showButtons={false}
              min={100}
              disabled={disabled}
            />
            <NumberInput
              label="Max kenglik (mm)"
              value={basicInfo.maxWidth ?? ''}
              onChange={(val) => onUpdateBasicInfo('maxWidth', val === '' ? undefined : Number(val))}
              placeholder="3000"
              showButtons={false}
              min={100}
              disabled={disabled}
            />
            <NumberInput
              label="Min balandlik (mm)"
              value={basicInfo.minHeight ?? ''}
              onChange={(val) => onUpdateBasicInfo('minHeight', val === '' ? undefined : Number(val))}
              placeholder="300"
              showButtons={false}
              min={100}
              disabled={disabled}
            />
            <NumberInput
              label="Max balandlik (mm)"
              value={basicInfo.maxHeight ?? ''}
              onChange={(val) => onUpdateBasicInfo('maxHeight', val === '' ? undefined : Number(val))}
              placeholder="3000"
              showButtons={false}
              min={100}
              disabled={disabled}
            />
          </div>
        </div>
      )}

      {/* Section: Type-specific fields for RAW_MATERIAL */}
      {isRawMaterial && (
        <div className="surface-soft rounded-xl p-4 sm:p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
            Xomashyo xususiyatlari
          </p>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <NumberInput
              label="Rulon kengligi (m)"
              value={basicInfo.rollWidth ?? ''}
              onChange={(val) => onUpdateBasicInfo('rollWidth', val === '' ? undefined : Number(val))}
              placeholder="1.5"
              showButtons={false}
              min={0}
              step={0.01}
              disabled={disabled}
            />
            <NumberInput
              label="Rulon uzunligi (m)"
              value={basicInfo.rollLength ?? ''}
              onChange={(val) => onUpdateBasicInfo('rollLength', val === '' ? undefined : Number(val))}
              placeholder="50"
              showButtons={false}
              min={0}
              step={0.01}
              disabled={disabled}
            />
            <NumberInput
              label="Profil uzunligi (m)"
              value={basicInfo.profileLength ?? ''}
              onChange={(val) => onUpdateBasicInfo('profileLength', val === '' ? undefined : Number(val))}
              placeholder="6"
              showButtons={false}
              min={0}
              step={0.01}
              disabled={disabled}
            />
            <NumberInput
              label="Birlik og'irligi (kg)"
              value={basicInfo.weightPerUnit ?? ''}
              onChange={(val) => onUpdateBasicInfo('weightPerUnit', val === '' ? undefined : Number(val))}
              placeholder="0.5"
              showButtons={false}
              min={0}
              step={0.001}
              disabled={disabled}
            />
          </div>
        </div>
      )}

      {/* Section: Type-specific fields for ACCESSORY */}
      {isAccessory && (
        <div className="surface-soft rounded-xl p-4 sm:p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
            Aksessuar xususiyatlari
          </p>

          <label className="form-control">
            <span className="label-text mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
              Mos jalyuzi turlari
            </span>
            <input
              type="text"
              className="input input-bordered w-full"
              value={basicInfo.compatibleBlindTypes || ''}
              onChange={(e) => onUpdateBasicInfo('compatibleBlindTypes', e.target.value || undefined)}
              placeholder="ROLLER, VERTICAL, HORIZONTAL"
              disabled={disabled}
            />
            <span className="label-text-alt text-xs text-base-content/50 mt-1">
              Vergul bilan ajrating: ROLLER, VERTICAL, HORIZONTAL, ROMAN, CELLULAR, MOTORIZED
            </span>
          </label>
        </div>
      )}

      {/* Section: Custom attributes from schema */}
      {productType?.attributeSchema?.attributes && productType.attributeSchema.attributes.length > 0 && (
        <div className="surface-soft rounded-xl p-4 sm:p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
            Qo'shimcha xususiyatlar ({productType.name})
          </p>
          <DynamicProductForm
            schema={productType.attributeSchema}
            values={customAttributes}
            onChange={onUpdateCustomAttributes}
            disabled={disabled}
            showGroupHeaders={true}
            columns={2}
          />
        </div>
      )}
    </div>
  );
}
