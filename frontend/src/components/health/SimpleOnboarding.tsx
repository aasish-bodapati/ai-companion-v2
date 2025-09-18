'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  UserIcon, 
  HeartIcon, 
  FlagIcon,
  CheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import api from '@/lib/api';

interface SimpleOnboardingData {
  height_cm?: number;
  age?: number;
  gender?: string;
  current_weight_kg?: number;
  activity_level?: string;
  primary_goal?: string;
}

interface SimpleOnboardingProps {
  onComplete: () => void;
}

export function SimpleOnboarding({ onComplete }: SimpleOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SimpleOnboardingData>({});

  const steps = [
    { id: 'basic-info', title: 'Basic Info', icon: UserIcon },
    { id: 'health-status', title: 'Health Status', icon: HeartIcon },
    { id: 'goals', title: 'Your Goals', icon: FlagIcon }
  ];

  const handleInputChange = (field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      // Send simplified data directly to the new onboarding endpoint
      await api.post('/health/onboarding/complete', data);
      onComplete();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Let&apos;s get to know you
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Just a few basic details to personalize your experience
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age" className="text-gray-700 dark:text-gray-300">
                  Age
                </Label>
                <Input
                  id="age"
                  type="number"
                  value={data.age || ''}
                  onChange={(e) => handleInputChange('age', parseInt(e.target.value) || '')}
                  placeholder="25"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="gender" className="text-gray-700 dark:text-gray-300">
                  Gender
                </Label>
                <Select value={data.gender || ''} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="height" className="text-gray-700 dark:text-gray-300">
                  Height (cm)
                </Label>
                <Input
                  id="height"
                  type="number"
                  value={data.height_cm || ''}
                  onChange={(e) => handleInputChange('height_cm', parseInt(e.target.value) || '')}
                  placeholder="170"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="weight" className="text-gray-700 dark:text-gray-300">
                  Current Weight (kg)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  value={data.current_weight_kg || ''}
                  onChange={(e) => handleInputChange('current_weight_kg', parseFloat(e.target.value) || '')}
                  placeholder="70"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );

      case 1: // Health Status
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Your activity level
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This helps us recommend the right goals for you
              </p>
            </div>

            <div>
              <Label htmlFor="activity" className="text-gray-700 dark:text-gray-300">
                How active are you?
              </Label>
              <Select value={data.activity_level || ''} onValueChange={(value) => handleInputChange('activity_level', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your activity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary - Little to no exercise</SelectItem>
                  <SelectItem value="light">Light - Light exercise 1-3 days/week</SelectItem>
                  <SelectItem value="moderate">Moderate - Moderate exercise 3-5 days/week</SelectItem>
                  <SelectItem value="active">Active - Heavy exercise 6-7 days/week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Don&apos;t worry!</strong> You can always adjust your goals later in the app. 
                This just helps us get you started with reasonable targets.
              </p>
            </div>
          </div>
        );

      case 2: // Goals
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                What&apos;s your main goal?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose what you&apos;d like to focus on most
              </p>
            </div>

            <div>
              <Label htmlFor="goal" className="text-gray-700 dark:text-gray-300">
                Primary Goal
              </Label>
              <Select value={data.primary_goal || ''} onValueChange={(value) => handleInputChange('primary_goal', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your main goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lose_weight">Lose Weight</SelectItem>
                  <SelectItem value="gain_weight">Gain Weight</SelectItem>
                  <SelectItem value="maintain_weight">Maintain Weight</SelectItem>
                  <SelectItem value="build_muscle">Build Muscle</SelectItem>
                  <SelectItem value="improve_fitness">Improve Fitness</SelectItem>
                  <SelectItem value="general_health">General Health & Wellness</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Perfect!</strong> We&apos;ll set up some initial goals based on your preferences. 
                You can always add, edit, or remove goals later.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isActive 
                    ? 'bg-blue-500 text-white scale-110' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-xs font-medium ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Step Content */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            {(() => {
              const Icon = steps[currentStep].icon;
              return <Icon className="w-5 h-5" />;
            })()}
            {steps[currentStep].title}
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Step {currentStep + 1} of {steps.length}
          </p>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center gap-2 hover:scale-105 transition-transform duration-200"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Previous
        </Button>

        {currentStep === steps.length - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white hover:scale-105 transition-all duration-200"
          >
            {loading ? 'Setting up...' : 'Complete Setup'}
            <CheckIcon className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 transition-all duration-200"
          >
            Next
            <ArrowRightIcon className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
