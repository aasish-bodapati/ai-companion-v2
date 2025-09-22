import React, { useState } from 'react';
import { MultiStepWizard } from './multi-step-wizard';
import { useMultiStepWizard } from '@/hooks/useMultiStepWizard';
import { WizardStep } from './multi-step-wizard';

// Example step components
function Step1({ data, updateData }: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Step 1: Basic Info</h3>
      <div>
        <label className="block text-sm font-medium mb-2">Name</label>
        <input
          type="text"
          value={data.name || ''}
          onChange={(e) => updateData({ name: e.target.value })}
          className="w-full p-2 border rounded"
          placeholder="Enter your name"
        />
      </div>
    </div>
  );
}

function Step2({ data, updateData }: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Step 2: Details</h3>
      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <input
          type="email"
          value={data.email || ''}
          onChange={(e) => updateData({ email: e.target.value })}
          className="w-full p-2 border rounded"
          placeholder="Enter your email"
        />
      </div>
    </div>
  );
}

function Step3({ data, updateData }: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Step 3: Preferences</h3>
      <div>
        <label className="block text-sm font-medium mb-2">Theme</label>
        <select
          value={data.theme || ''}
          onChange={(e) => updateData({ theme: e.target.value })}
          className="w-full p-2 border rounded"
        >
          <option value="">Select theme</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
    </div>
  );
}

// Example usage of the wizard components
export function WizardExample() {
  const [data, setData] = useState<{ name?: string; email?: string; theme?: string }>({});

  const steps: WizardStep[] = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Tell us about yourself',
      component: Step1,
      isComplete: !!data.name
    },
    {
      id: 'details',
      title: 'Contact Details',
      description: 'How can we reach you?',
      component: Step2,
      isComplete: !!data.email
    },
    {
      id: 'preferences',
      title: 'Preferences',
      description: 'Customize your experience',
      component: Step3,
      isComplete: true,
      isOptional: true
    }
  ];

  const {
    currentStep,
    currentStepData,
    progressPercentage,
    canProceed,
    isFirstStep,
    isLastStep,
    nextStep,
    prevStep
  } = useMultiStepWizard({ steps });

  const updateData = (updates: any) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = () => {
    console.log('Form submitted with data:', data);
    alert('Form submitted successfully!');
  };

  const StepComponent = currentStepData.component;

  return (
    <MultiStepWizard
      steps={steps}
      currentStep={currentStep}
      onStepChange={() => {}}
      onNext={nextStep}
      onPrevious={prevStep}
      onSubmit={handleSubmit}
      canProceed={canProceed}
      submitLabel="Complete Setup"
    >
      <StepComponent data={data} updateData={updateData} />
    </MultiStepWizard>
  );
}
