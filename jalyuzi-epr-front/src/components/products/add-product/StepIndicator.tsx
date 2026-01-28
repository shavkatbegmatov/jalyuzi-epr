import { Check, Layers, FileText, DollarSign } from 'lucide-react';
import clsx from 'clsx';

interface Step {
  number: 1 | 2 | 3;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  {
    number: 1,
    title: 'Tur tanlash',
    description: 'Mahsulot turini tanlang',
    icon: <Layers className="h-5 w-5" />,
  },
  {
    number: 2,
    title: "Ma'lumotlar",
    description: "Asosiy ma'lumotlar",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    number: 3,
    title: 'Narx va zaxira',
    description: "Narxlar va ta'minotchi",
    icon: <DollarSign className="h-5 w-5" />,
  },
];

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
  onStepClick?: (step: 1 | 2 | 3) => void;
  canNavigateTo?: (step: 1 | 2 | 3) => boolean;
}

export function StepIndicator({ currentStep, onStepClick, canNavigateTo }: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Desktop version */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const canClick = canNavigateTo?.(step.number) ?? (step.number <= currentStep);

          return (
            <div key={step.number} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => canClick && onStepClick?.(step.number)}
                disabled={!canClick}
                className={clsx(
                  'flex items-center gap-3 transition-all',
                  canClick ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed',
                )}
              >
                {/* Step circle */}
                <div
                  className={clsx(
                    'flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all',
                    isCompleted && 'border-success bg-success text-success-content',
                    isCurrent && 'border-primary bg-primary text-primary-content',
                    !isCompleted && !isCurrent && 'border-base-300 bg-base-200 text-base-content/50'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    step.icon
                  )}
                </div>

                {/* Step text */}
                <div className="text-left">
                  <p
                    className={clsx(
                      'text-sm font-semibold',
                      isCurrent ? 'text-primary' : isCompleted ? 'text-success' : 'text-base-content/50'
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-base-content/50">{step.description}</p>
                </div>
              </button>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={clsx(
                    'mx-4 h-0.5 flex-1 transition-all',
                    currentStep > step.number ? 'bg-success' : 'bg-base-300'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile version */}
      <div className="sm:hidden">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className={clsx(
                'h-1.5 flex-1 rounded-full transition-all',
                currentStep >= step.number ? 'bg-primary' : 'bg-base-300'
              )}
            />
          ))}
        </div>

        {/* Current step info */}
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'flex h-10 w-10 items-center justify-center rounded-full',
              'bg-primary text-primary-content'
            )}
          >
            {steps[currentStep - 1].icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">
              {currentStep}-bosqich: {steps[currentStep - 1].title}
            </p>
            <p className="text-xs text-base-content/50">
              {steps[currentStep - 1].description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
