import { useState, useCallback } from 'react';
import { WizardStep } from '@/components/ui/multi-step-wizard';

export interface UseMultiStepWizardOptions {
  steps: WizardStep[];
  initialStep?: number;
}

export interface UseMultiStepWizardReturn {
  currentStep: number;
  currentStepData: WizardStep;
  progressPercentage: number;
  canProceed: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  canProceedToStep: (step: number) => boolean;
}

export function useMultiStepWizard({
  steps,
  initialStep = 0
}: UseMultiStepWizardOptions): UseMultiStepWizardReturn {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const currentStepData = steps[currentStep];
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  const canProceed = useCallback(() => {
    const step = steps[currentStep];
    return step.isComplete || !!step.isOptional;
  }, [steps, currentStep]);

  const canProceedToStep = useCallback((stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= steps.length) return false;
    if (stepIndex <= currentStep) return true; // Can always go back
    
    // Check if all previous steps are complete
    for (let i = 0; i < stepIndex; i++) {
      const step = steps[i];
      if (!step.isComplete && !step.isOptional) {
        return false;
      }
    }
    return true;
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
    if (step >= 0 && step < steps.length && canProceedToStep(step)) {
      setCurrentStep(step);
    }
  }, [steps.length, canProceedToStep]);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return {
    currentStep,
    currentStepData,
    progressPercentage,
    canProceed: canProceed(),
    isFirstStep,
    isLastStep,
    nextStep,
    prevStep,
    goToStep,
    canProceedToStep
  };
}
