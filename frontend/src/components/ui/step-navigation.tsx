import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import { WizardStep } from './multi-step-wizard';

export interface StepNavigationProps {
  steps: WizardStep[];
  currentStep: number;
  canProceed: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  loading?: boolean;
  submitLabel?: string;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  className?: string;
}

export function StepNavigation({
  steps,
  currentStep,
  canProceed,
  isFirstStep,
  isLastStep,
  loading = false,
  submitLabel = 'Submit',
  onPrevious,
  onNext,
  onSubmit,
  className = ''
}: StepNavigationProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={isFirstStep}
            className="flex items-center gap-2"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`w-2 h-2 rounded-full ${
                  index < currentStep
                    ? 'bg-green-500'
                    : index === currentStep
                    ? 'bg-blue-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {isLastStep ? (
            <Button
              onClick={onSubmit}
              disabled={loading || !canProceed}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {submitLabel}...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  {submitLabel}
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onNext}
              disabled={!canProceed}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
