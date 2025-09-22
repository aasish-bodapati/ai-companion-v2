import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import { MealStep } from '@/hooks/useNutritionLoggerSteps';

interface NutritionLoggerNavigationProps {
  steps: MealStep[];
  currentStep: number;
  canProceed: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  loading: boolean;
  onPrevStep: () => void;
  onNextStep: () => void;
  onSubmit: () => void;
}

export function NutritionLoggerNavigation({
  steps,
  currentStep,
  canProceed,
  isFirstStep,
  isLastStep,
  loading,
  onPrevStep,
  onNextStep,
  onSubmit
}: NutritionLoggerNavigationProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={onPrevStep}
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
                  Logging...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  Log Meal
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onNextStep}
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
