import { ArrowLeft, ArrowRight, Save, ShoppingCart, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface WizardNavigationProps {
  currentStep: 1 | 2 | 3;
  onPrev: () => void;
  onNext: () => void;
  onSave: () => void;
  onSaveWithPurchase: () => void;
  canGoNext: boolean;
  canSave: boolean;
  showPurchaseOption: boolean;
  saving: boolean;
}

export function WizardNavigation({
  currentStep,
  onPrev,
  onNext,
  onSave,
  onSaveWithPurchase,
  canGoNext,
  canSave,
  showPurchaseOption,
  saving,
}: WizardNavigationProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === 3;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-base-200">
      {/* Back button */}
      <div className="w-full sm:w-auto">
        {!isFirstStep && (
          <button
            type="button"
            onClick={onPrev}
            disabled={saving}
            className="btn btn-ghost gap-2 w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Orqaga
          </button>
        )}
      </div>

      {/* Next/Save buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
        {!isLastStep ? (
          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext || saving}
            className="btn btn-primary gap-2 w-full sm:w-auto"
          >
            Davom etish
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <>
            {/* Save only button */}
            <button
              type="button"
              onClick={onSave}
              disabled={!canSave || saving}
              className="btn btn-primary gap-2 w-full sm:w-auto"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Saqlash
            </button>

            {/* Save with purchase button */}
            {showPurchaseOption && (
              <button
                type="button"
                onClick={onSaveWithPurchase}
                disabled={!canSave || saving}
                className={clsx(
                  'btn btn-success gap-2 w-full sm:w-auto',
                  'hover:brightness-105'
                )}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                Saqlash va Xarid
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
