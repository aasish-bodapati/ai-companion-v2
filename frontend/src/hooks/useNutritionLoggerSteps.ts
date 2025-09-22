import { useState, useCallback } from 'react';
import { MealData } from '@/services/nutritionLoggerService';

export interface MealStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  isComplete: boolean;
  isOptional?: boolean;
}

export interface UseNutritionLoggerStepsOptions {
  mealData: MealData;
  steps: MealStep[];
}

export interface UseNutritionLoggerStepsReturn {
  currentStep: number;
  currentStepData: MealStep;
  progressPercentage: number;
  canProceed: boolean;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export function useNutritionLoggerSteps({
  mealData,
  steps
}: UseNutritionLoggerStepsOptions): UseNutritionLoggerStepsReturn {
  const [currentStep, setCurrentStep] = useState(0);

  const currentStepData = steps[currentStep];
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  const canProceed = useCallback(() => {
    const step = steps[currentStep];
    return step.isComplete || !!step.isOptional;
  }, [steps, currentStep]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1 && canProceed()) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, steps.length, canProceed]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step);
    }
  }, [steps.length]);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return {
    currentStep,
    currentStepData,
    progressPercentage,
    canProceed: canProceed(),
    nextStep,
    prevStep,
    goToStep,
    isFirstStep,
    isLastStep
  };
}
