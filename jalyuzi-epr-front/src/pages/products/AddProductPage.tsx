import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, AlertTriangle } from 'lucide-react';
import { productTypesApi } from '../../api/product-types.api';
import { productsApi, brandsApi, categoriesApi } from '../../api/products.api';
import { suppliersApi } from '../../api/suppliers.api';
import { purchasesApi } from '../../api/purchases.api';
import { useAddProductWizard } from '../../hooks/useAddProductWizard';
import {
  StepIndicator,
  WizardNavigation,
  ProductTypeStep,
  BasicInfoStep,
  PricingStep,
} from '../../components/products/add-product';
import { ModalPortal } from '../../components/common/Modal';
import type { ProductTypeEntity, Brand, Category, Supplier } from '../../types';

export function AddProductPage() {
  const navigate = useNavigate();
  const wizard = useAddProductWizard();

  // Data states
  const [productTypes, setProductTypes] = useState<ProductTypeEntity[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Loading states
  const [loadingProductTypes, setLoadingProductTypes] = useState(true);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [saving, setSaving] = useState(false);

  // Error states
  const [loadError, setLoadError] = useState<string | null>(null);

  // Draft restore modal
  const [showDraftModal, setShowDraftModal] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingProductTypes(true);
        setLoadError(null);

        const [typesData, brandsData, categoriesData] = await Promise.all([
          productTypesApi.getAll(),
          brandsApi.getAll(),
          categoriesApi.getAll(),
        ]);

        setProductTypes(typesData);
        setBrands(brandsData);
        setCategories(categoriesData);

        // Check for draft
        if (wizard.hasDraft()) {
          setShowDraftModal(true);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setLoadError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoadingProductTypes(false);
      }
    };

    void loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load suppliers when needed (step 3)
  useEffect(() => {
    if (wizard.state.currentStep === 3 && suppliers.length === 0) {
      const loadSuppliers = async () => {
        try {
          setLoadingSuppliers(true);
          const data = await suppliersApi.getActive();
          setSuppliers(data);
        } catch (error) {
          console.error('Failed to load suppliers:', error);
        } finally {
          setLoadingSuppliers(false);
        }
      };
      void loadSuppliers();
    }
  }, [wizard.state.currentStep, suppliers.length]);

  // Handle draft modal
  const handleRestoreDraft = () => {
    setShowDraftModal(false);
  };

  const handleDiscardDraft = () => {
    wizard.discardDraft();
    setShowDraftModal(false);
  };

  // Navigation handlers
  const handleNext = useCallback(() => {
    const { currentStep } = wizard.state;

    if (currentStep === 1) {
      if (wizard.validateStep1()) {
        wizard.nextStep();
      }
    } else if (currentStep === 2) {
      const { isValid, errors } = wizard.validateStep2();
      if (isValid) {
        wizard.nextStep();
      } else {
        wizard.setErrors(errors);
      }
    }
  }, [wizard]);

  const handlePrev = useCallback(() => {
    wizard.prevStep();
  }, [wizard]);

  const canGoNext = useCallback((): boolean => {
    const { currentStep } = wizard.state;

    if (currentStep === 1) {
      return wizard.validateStep1();
    }
    if (currentStep === 2) {
      return wizard.validateStep2().isValid;
    }
    return false;
  }, [wizard]);

  const canSave = useCallback((): boolean => {
    const { isValid } = wizard.validateStep3();
    return wizard.validateStep1() && wizard.validateStep2().isValid && isValid;
  }, [wizard]);

  // Save handlers
  const handleSave = async (withPurchase: boolean = false) => {
    // Validate step 3
    const { isValid, errors } = wizard.validateStep3();
    if (!isValid) {
      wizard.setErrors(errors);
      return;
    }

    try {
      setSaving(true);

      // Create product
      const productRequest = wizard.buildProductRequest();
      const createdProduct = await productsApi.create(productRequest);

      // Create purchase if requested
      if (withPurchase && wizard.state.createPurchase && wizard.state.selectedSupplier) {
        const purchaseRequest = {
          supplierId: wizard.state.selectedSupplier.id,
          orderDate: new Date().toISOString().split('T')[0],
          paidAmount: 0,
          notes: `Boshlang'ich zaxira - ${createdProduct.name}`,
          items: [
            {
              productId: createdProduct.id,
              quantity: wizard.state.purchaseQuantity,
              unitPrice: wizard.state.pricing.purchasePrice || 0,
            },
          ],
        };

        await purchasesApi.create(purchaseRequest);
      }

      // Clear draft and navigate
      wizard.resetWizard();
      navigate('/products', {
        state: { highlightId: createdProduct.id },
      });
    } catch (error) {
      console.error('Failed to save product:', error);
      wizard.setErrors({
        general: 'Mahsulotni saqlashda xatolik yuz berdi. Qaytadan urinib ko\'ring.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGoBack = () => {
    navigate('/products');
  };

  return (
    <div className="min-h-screen bg-base-200/50">
      {/* Header */}
      <div className="bg-base-100 border-b border-base-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleGoBack}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Yangi mahsulot qo'shish</h1>
              <p className="text-sm text-base-content/60">
                3 bosqichli wizard orqali mahsulot yarating
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Step indicator */}
          <div className="bg-base-100 rounded-2xl p-4 sm:p-6 shadow-sm mb-6">
            <StepIndicator
              currentStep={wizard.state.currentStep}
              onStepClick={(step) => {
                // Only allow going back to completed steps
                if (step < wizard.state.currentStep) {
                  wizard.goToStep(step);
                }
              }}
              canNavigateTo={(step) => step <= wizard.state.currentStep}
            />
          </div>

          {/* Step content */}
          <div className="bg-base-100 rounded-2xl p-4 sm:p-6 shadow-sm">
            {/* General error */}
            {wizard.state.errors.general && (
              <div className="alert alert-error mb-6">
                <AlertTriangle className="h-5 w-5" />
                <span>{wizard.state.errors.general}</span>
              </div>
            )}

            {/* Step 1: Product Type Selection */}
            {wizard.state.currentStep === 1 && (
              <ProductTypeStep
                productTypes={productTypes}
                selectedProductTypeId={wizard.state.selectedProductTypeId}
                onSelect={wizard.selectProductType}
                loading={loadingProductTypes}
                error={loadError || undefined}
              />
            )}

            {/* Step 2: Basic Info */}
            {wizard.state.currentStep === 2 && (
              <BasicInfoStep
                productType={wizard.state.selectedProductType}
                productTypeCode={wizard.getProductTypeCode()}
                basicInfo={wizard.state.basicInfo}
                customAttributes={wizard.state.customAttributes}
                brands={brands}
                categories={categories}
                errors={wizard.state.errors}
                onUpdateBasicInfo={wizard.updateBasicInfo}
                onUpdateCustomAttributes={wizard.updateCustomAttributes}
                onGenerateSku={wizard.generateSku}
                disabled={saving}
              />
            )}

            {/* Step 3: Pricing & Stock */}
            {wizard.state.currentStep === 3 && (
              <PricingStep
                productTypeCode={wizard.getProductTypeCode()}
                pricing={wizard.state.pricing}
                selectedSupplier={wizard.state.selectedSupplier}
                createPurchase={wizard.state.createPurchase}
                purchaseQuantity={wizard.state.purchaseQuantity}
                suppliers={suppliers}
                suppliersLoading={loadingSuppliers}
                errors={wizard.state.errors}
                onUpdatePricing={wizard.updatePricing}
                onSelectSupplier={wizard.selectSupplier}
                onToggleCreatePurchase={wizard.toggleCreatePurchase}
                onSetPurchaseQuantity={wizard.setPurchaseQuantity}
                calculatePurchaseTotal={wizard.calculatePurchaseTotal}
                disabled={saving}
              />
            )}

            {/* Navigation */}
            <WizardNavigation
              currentStep={wizard.state.currentStep}
              onPrev={handlePrev}
              onNext={handleNext}
              onSave={() => handleSave(false)}
              onSaveWithPurchase={() => handleSave(true)}
              canGoNext={canGoNext()}
              canSave={canSave()}
              showPurchaseOption={wizard.state.createPurchase && !!wizard.state.selectedSupplier}
              saving={saving}
            />
          </div>
        </div>
      </div>

      {/* Draft Restore Modal */}
      <ModalPortal isOpen={showDraftModal} onClose={handleDiscardDraft}>
        <div className="w-full max-w-md bg-base-100 rounded-2xl shadow-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10 text-info">
              <FileText className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Qoralama topildi</h3>
              <p className="text-base-content/60 mb-4">
                Oldin saqlangan qoralama topildi. Davom etmoqchimisiz?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleRestoreDraft}
                  className="btn btn-primary flex-1"
                >
                  Davom etish
                </button>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="btn btn-ghost flex-1"
                >
                  Yangidan boshlash
                </button>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}
