import { useState, useCallback, useEffect } from 'react';
import type { ProductTypeEntity, Supplier, ProductType, UnitType, BlindType, BlindMaterial, ControlType } from '../types';

// Wizard state interface
export interface WizardState {
  currentStep: 1 | 2 | 3;

  // Step 1
  selectedProductTypeId: number | null;
  selectedProductType: ProductTypeEntity | null;

  // Step 2
  basicInfo: {
    sku: string;
    name: string;
    brandId?: number;
    categoryId?: number;
    unitType: UnitType;
    color?: string;
    description?: string;
    // Finished product specific
    blindType?: BlindType;
    material?: BlindMaterial;
    controlType?: ControlType;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    // Raw material specific
    rollWidth?: number;
    rollLength?: number;
    profileLength?: number;
    weightPerUnit?: number;
    // Accessory specific
    compatibleBlindTypes?: string;
  };
  customAttributes: Record<string, unknown>;

  // Step 3
  pricing: {
    purchasePrice?: number;
    sellingPrice: number;
    pricePerSquareMeter?: number;
    installationPrice?: number;
    quantity: number;
    minStockLevel: number;
  };

  // Supplier integration
  selectedSupplier: Supplier | null;
  createPurchase: boolean;
  purchaseQuantity: number;

  // Validation
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

const STORAGE_KEY = 'add-product-wizard-draft';

const initialState: WizardState = {
  currentStep: 1,
  selectedProductTypeId: null,
  selectedProductType: null,
  basicInfo: {
    sku: '',
    name: '',
    unitType: 'PIECE',
  },
  customAttributes: {},
  pricing: {
    sellingPrice: 0,
    quantity: 0,
    minStockLevel: 5,
  },
  selectedSupplier: null,
  createPurchase: false,
  purchaseQuantity: 10,
  errors: {},
  touched: {},
};

// Load draft from localStorage
const loadDraft = (): WizardState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check if draft is not too old (24 hours)
      if (parsed.savedAt && Date.now() - parsed.savedAt < 24 * 60 * 60 * 1000) {
        return { ...initialState, ...parsed.state };
      }
    }
  } catch (e) {
    console.error('Failed to load draft:', e);
  }
  return null;
};

// Save draft to localStorage
const saveDraft = (state: WizardState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      state,
      savedAt: Date.now(),
    }));
  } catch (e) {
    console.error('Failed to save draft:', e);
  }
};

// Clear draft from localStorage
const clearDraft = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear draft:', e);
  }
};

export function useAddProductWizard() {
  const [state, setState] = useState<WizardState>(() => {
    const draft = loadDraft();
    return draft || initialState;
  });

  // Auto-save draft on state change
  useEffect(() => {
    if (state.currentStep > 1 || state.selectedProductTypeId) {
      saveDraft(state);
    }
  }, [state]);

  // Navigation
  const goToStep = useCallback((step: 1 | 2 | 3) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, 3) as 1 | 2 | 3,
    }));
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1) as 1 | 2 | 3,
    }));
  }, []);

  // Step 1: Product type selection
  const selectProductType = useCallback((productType: ProductTypeEntity) => {
    setState(prev => ({
      ...prev,
      selectedProductTypeId: productType.id,
      selectedProductType: productType,
      basicInfo: {
        ...prev.basicInfo,
        unitType: productType.defaultUnitType || 'PIECE',
      },
      customAttributes: {},
      errors: {},
    }));
  }, []);

  // Step 2: Basic info updates
  const updateBasicInfo = useCallback(<K extends keyof WizardState['basicInfo']>(
    field: K,
    value: WizardState['basicInfo'][K]
  ) => {
    setState(prev => ({
      ...prev,
      basicInfo: { ...prev.basicInfo, [field]: value },
      touched: { ...prev.touched, [field]: true },
    }));
  }, []);

  const updateCustomAttributes = useCallback((attrs: Record<string, unknown>) => {
    setState(prev => ({
      ...prev,
      customAttributes: attrs,
    }));
  }, []);

  // Step 3: Pricing updates
  const updatePricing = useCallback(<K extends keyof WizardState['pricing']>(
    field: K,
    value: WizardState['pricing'][K]
  ) => {
    setState(prev => ({
      ...prev,
      pricing: { ...prev.pricing, [field]: value },
      touched: { ...prev.touched, [`pricing.${field}`]: true },
    }));
  }, []);

  // Supplier selection
  const selectSupplier = useCallback((supplier: Supplier | null) => {
    setState(prev => ({
      ...prev,
      selectedSupplier: supplier,
    }));
  }, []);

  const toggleCreatePurchase = useCallback((value: boolean) => {
    setState(prev => ({
      ...prev,
      createPurchase: value,
    }));
  }, []);

  const setPurchaseQuantity = useCallback((quantity: number) => {
    setState(prev => ({
      ...prev,
      purchaseQuantity: quantity,
    }));
  }, []);

  // Validation
  const validateStep1 = useCallback((): boolean => {
    return state.selectedProductTypeId !== null;
  }, [state.selectedProductTypeId]);

  const validateStep2 = useCallback((): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    if (!state.basicInfo.sku.trim()) {
      errors.sku = 'SKU majburiy';
    } else if (state.basicInfo.sku.length < 2) {
      errors.sku = 'SKU kamida 2 ta belgi bo\'lishi kerak';
    }

    if (!state.basicInfo.name.trim()) {
      errors.name = 'Nom majburiy';
    } else if (state.basicInfo.name.length < 2) {
      errors.name = 'Nom kamida 2 ta belgi bo\'lishi kerak';
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  }, [state.basicInfo]);

  const validateStep3 = useCallback((): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    if (state.pricing.sellingPrice <= 0) {
      errors.sellingPrice = 'Sotish narxi 0 dan katta bo\'lishi kerak';
    }

    if (state.createPurchase) {
      if (!state.selectedSupplier) {
        errors.supplier = 'Xarid uchun ta\'minotchi tanlang';
      }
      if (state.purchaseQuantity <= 0) {
        errors.purchaseQuantity = 'Xarid miqdori 0 dan katta bo\'lishi kerak';
      }
      if (!state.pricing.purchasePrice || state.pricing.purchasePrice <= 0) {
        errors.purchasePrice = 'Kelish narxi majburiy';
      }
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  }, [state.pricing, state.createPurchase, state.selectedSupplier, state.purchaseQuantity]);

  const setErrors = useCallback((errors: Record<string, string>) => {
    setState(prev => ({ ...prev, errors }));
  }, []);

  // Get product type code for conditional rendering
  const getProductTypeCode = useCallback((): ProductType | null => {
    return state.selectedProductType?.code as ProductType || null;
  }, [state.selectedProductType]);

  // Generate SKU
  const generateSku = useCallback((prefix?: string) => {
    const typePrefix = prefix || state.selectedProductType?.code?.substring(0, 3) || 'PRD';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const sku = `${typePrefix}-${timestamp}-${random}`;
    updateBasicInfo('sku', sku);
    return sku;
  }, [state.selectedProductType, updateBasicInfo]);

  // Calculate profit margin
  const calculateProfitMargin = useCallback((): { amount: number; percent: number } => {
    const { purchasePrice, sellingPrice } = state.pricing;
    if (!purchasePrice || purchasePrice <= 0 || sellingPrice <= 0) {
      return { amount: 0, percent: 0 };
    }
    const amount = sellingPrice - purchasePrice;
    const percent = (amount / purchasePrice) * 100;
    return { amount, percent };
  }, [state.pricing]);

  // Calculate total purchase amount
  const calculatePurchaseTotal = useCallback((): number => {
    if (!state.pricing.purchasePrice || !state.purchaseQuantity) {
      return 0;
    }
    return state.pricing.purchasePrice * state.purchaseQuantity;
  }, [state.pricing.purchasePrice, state.purchaseQuantity]);

  // Reset wizard
  const resetWizard = useCallback(() => {
    setState(initialState);
    clearDraft();
  }, []);

  // Check if draft exists
  const hasDraft = useCallback((): boolean => {
    const draft = loadDraft();
    return draft !== null && (draft.currentStep > 1 || draft.selectedProductTypeId !== null);
  }, []);

  // Clear draft
  const discardDraft = useCallback(() => {
    clearDraft();
    setState(initialState);
  }, []);

  // Build final product request
  const buildProductRequest = useCallback(() => {
    const productTypeEntity = state.selectedProductType;
    // productType enum faqat standart turlar uchun (FINISHED_PRODUCT, RAW_MATERIAL, ACCESSORY)
    // Agar kod bu enumlardan biri bo'lsa, uni ishlatamiz, aks holda undefined
    const standardTypes: ProductType[] = ['FINISHED_PRODUCT', 'RAW_MATERIAL', 'ACCESSORY'];
    const productTypeCode = productTypeEntity?.code as ProductType;
    const isStandardType = standardTypes.includes(productTypeCode);

    return {
      sku: state.basicInfo.sku,
      name: state.basicInfo.name,
      brandId: state.basicInfo.brandId,
      categoryId: state.basicInfo.categoryId,
      // Faqat standart enum qiymatlarni yuboramiz
      productType: isStandardType ? productTypeCode : undefined,
      productTypeId: state.selectedProductTypeId || undefined,
      unitType: state.basicInfo.unitType,
      color: state.basicInfo.color,
      description: state.basicInfo.description,
      // Finished product specific
      blindType: state.basicInfo.blindType,
      material: state.basicInfo.material,
      controlType: state.basicInfo.controlType,
      minWidth: state.basicInfo.minWidth,
      maxWidth: state.basicInfo.maxWidth,
      minHeight: state.basicInfo.minHeight,
      maxHeight: state.basicInfo.maxHeight,
      // Raw material specific
      rollWidth: state.basicInfo.rollWidth,
      rollLength: state.basicInfo.rollLength,
      profileLength: state.basicInfo.profileLength,
      weightPerUnit: state.basicInfo.weightPerUnit,
      // Accessory specific
      compatibleBlindTypes: state.basicInfo.compatibleBlindTypes,
      // Pricing
      purchasePrice: state.pricing.purchasePrice,
      sellingPrice: state.pricing.sellingPrice,
      pricePerSquareMeter: state.pricing.pricePerSquareMeter,
      installationPrice: state.pricing.installationPrice,
      quantity: state.pricing.quantity,
      minStockLevel: state.pricing.minStockLevel,
      // Custom attributes
      customAttributes: Object.keys(state.customAttributes).length > 0 ? state.customAttributes : undefined,
    };
  }, [state]);

  // Build purchase request (if creating purchase)
  const buildPurchaseRequest = useCallback(() => {
    if (!state.createPurchase || !state.selectedSupplier) {
      return null;
    }

    return {
      supplierId: state.selectedSupplier.id,
      orderDate: new Date().toISOString().split('T')[0],
      paidAmount: 0, // Default to unpaid
      notes: `Boshlang'ich zaxira - ${state.basicInfo.name}`,
      // items will be added after product is created
    };
  }, [state.createPurchase, state.selectedSupplier, state.basicInfo.name]);

  return {
    state,
    // Navigation
    goToStep,
    nextStep,
    prevStep,
    // Step 1
    selectProductType,
    validateStep1,
    // Step 2
    updateBasicInfo,
    updateCustomAttributes,
    validateStep2,
    generateSku,
    getProductTypeCode,
    // Step 3
    updatePricing,
    selectSupplier,
    toggleCreatePurchase,
    setPurchaseQuantity,
    validateStep3,
    calculateProfitMargin,
    calculatePurchaseTotal,
    // Validation
    setErrors,
    // Build requests
    buildProductRequest,
    buildPurchaseRequest,
    // Reset
    resetWizard,
    hasDraft,
    discardDraft,
  };
}
