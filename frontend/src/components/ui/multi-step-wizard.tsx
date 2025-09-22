import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StepProgressHeader } from './step-progress-header';
import { StepNavigation } from './step-navigation';

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  isComplete: boolean;
  isOptional?: boolean;
}

export interface MultiStepWizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  canProceed: boolean;
  loading?: boolean;
  submitLabel?: string;
  className?: string;
  children?: React.ReactNode; // For step content
}

export function MultiStepWizard({
  steps,
  currentStep,
  onStepChange,
  onNext,
  onPrevious,
  onSubmit,
  canProceed,
  loading = false,
  submitLabel = 'Submit',
  className = '',
  children
}: MultiStepWizardProps) {
  const currentStepData = steps[currentStep];
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className={`max-w-2xl mx-auto space-y-6 ${className}`}>
      {/* Progress Header */}
      <StepProgressHeader
        currentStepData={currentStepData}
        currentStep={currentStep}
        totalSteps={steps.length}
        progressPercentage={progressPercentage}
      />

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {children}
        </CardContent>
      </Card>

      {/* Navigation */}
      <StepNavigation
        steps={steps}
        currentStep={currentStep}
        canProceed={canProceed}
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        loading={loading}
        submitLabel={submitLabel}
        onPrevious={onPrevious}
        onNext={onNext}
        onSubmit={onSubmit}
      />
    </div>
  );
}
