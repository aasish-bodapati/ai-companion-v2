'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UserIcon, 
  HeartIcon, 
  FlagIcon,
  CheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  SparklesIcon,
  FireIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { SmartForm, SmartFormField } from '@/components/ui/smart-form';
import { MobileOptimizedButton } from '@/components/ui/mobile-optimized-button';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { toast } from 'sonner';
import api from '@/lib/api';

interface OnboardingData {
  // Basic Info
  age?: number;
  gender?: string;
  height_cm?: number;
  current_weight_kg?: number;
  
  // Goals
  primary_goal?: string;
  activity_level?: string;
  
  // Preferences
  preferred_logging_style?: 'quick' | 'detailed';
  focus_areas?: string[];
}

interface ImprovedOnboardingProps {
  onComplete: () => void;
}

const GOAL_OPTIONS = [
  { value: 'lose_weight', label: 'Lose Weight', icon: '📉', description: 'Create a calorie deficit' },
  { value: 'gain_weight', label: 'Gain Weight', icon: '📈', description: 'Build muscle and mass' },
  { value: 'maintain_weight', label: 'Maintain Weight', icon: '⚖️', description: 'Stay at current weight' },
  { value: 'build_muscle', label: 'Build Muscle', icon: '💪', description: 'Focus on strength training' },
  { value: 'improve_fitness', label: 'Improve Fitness', icon: '🏃', description: 'Get more active' },
  { value: 'general_health', label: 'General Health', icon: '❤️', description: 'Overall wellness' }
];

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
  { value: 'light', label: 'Light', description: 'Light exercise 1-3 days/week' },
  { value: 'moderate', label: 'Moderate', description: 'Moderate exercise 3-5 days/week' },
  { value: 'active', label: 'Active', description: 'Heavy exercise 6-7 days/week' }
];

const FOCUS_AREAS = [
  { value: 'nutrition', label: 'Nutrition Tracking', icon: '🍎' },
  { value: 'fitness', label: 'Workout Logging', icon: '💪' },
  { value: 'weight', label: 'Weight Management', icon: '⚖️' },
  { value: 'habits', label: 'Habit Building', icon: '📅' }
];

export function ImprovedOnboarding({ onComplete }: ImprovedOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({});




  const steps = [
    { id: 'welcome', title: 'Welcome', icon: SparklesIcon, description: 'Let\'s get you started' },
    { id: 'basic-info', title: 'Basic Info', icon: UserIcon, description: 'Tell us about yourself' },
    { id: 'goals', title: 'Your Goals', icon: FlagIcon, description: 'What do you want to achieve?' },
    { id: 'complete', title: 'All Set!', icon: CheckIcon, description: 'You\'re ready to go' }
  ];

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
      await api.post('/health/onboarding/complete', data);
      toast.success('Welcome to your health journey!');
      onComplete();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      toast.error('Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
              <SparklesIcon className="h-10 w-10 text-white" />
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to Your Health Journey! 🎉
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                We'll help you track your nutrition and fitness with personalized insights and smart recommendations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <HeartIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Track Nutrition</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Log meals and monitor macros</p>
              </div>
              
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FireIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Log Workouts</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Track exercises and progress</p>
              </div>
              
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Get Insights</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered recommendations</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-6 max-w-2xl mx-auto">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Quick setup:</strong> This will only take 2 minutes and you can always change your preferences later.
              </p>
            </div>
          </motion.div>
        );

      case 1: // Basic Info
        const basicFields: SmartFormField[] = [
          {
            name: 'age',
            label: 'Age',
            type: 'number',
            required: true,
            min: 13,
            max: 120,
            placeholder: '25',
            helpText: 'We use this to calculate your metabolic needs'
          },
          {
            name: 'gender',
            label: 'Gender',
            type: 'select',
            required: true,
            options: [
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
              { value: 'prefer_not_to_say', label: 'Prefer not to say' }
            ],
            helpText: 'Helps us personalize your recommendations'
          },
          {
            name: 'height_cm',
            label: 'Height (cm)',
            type: 'number',
            required: true,
            min: 100,
            max: 250,
            placeholder: '170',
            helpText: 'Used for BMI and calorie calculations'
          },
          {
            name: 'current_weight_kg',
            label: 'Current Weight (kg)',
            type: 'number',
            required: true,
            min: 30,
            max: 300,
            placeholder: '70',
            helpText: 'We\'ll help you track changes over time'
          }
        ];

        return (
          <motion.div
            key="basic-info"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Tell us about yourself
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Basic info to personalize your experience
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Age <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={data.age || ''}
                  onChange={(e) => setData(prev => ({ ...prev, age: parseInt(e.target.value) || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your age"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  We use this to calculate your metabolic needs
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={data.gender || ''}
                  onChange={(e) => setData(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Helps us personalize your recommendations
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Height (cm) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={data.height_cm || ''}
                  onChange={(e) => setData(prev => ({ ...prev, height_cm: parseInt(e.target.value) || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your height"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Used for BMI and calorie calculations
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Weight (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={data.current_weight_kg || ''}
                  onChange={(e) => setData(prev => ({ ...prev, current_weight_kg: parseInt(e.target.value) || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your weight"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  We'll help you track changes over time
                </p>
              </div>
            </div>
          </motion.div>
        );

      case 2: // Goals
        return (
          <motion.div
            key="goals"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                What's your main goal?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose what you'd like to focus on most
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GOAL_OPTIONS.map((goal) => (
                <div
                  key={goal.value}
                  className={`cursor-pointer transition-all duration-200 border-2 rounded-lg p-4 ${
                    data.primary_goal === goal.value
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setData(prev => ({ ...prev, primary_goal: goal.value }));
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{goal.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{goal.label}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{goal.description}</p>
                    </div>
                    {data.primary_goal === goal.value && (
                      <CheckIcon className="h-5 w-5 text-indigo-600 ml-auto" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">How active are you?</h4>
              <div className="grid grid-cols-1 gap-3">
                {ACTIVITY_LEVELS.map((level) => (
                  <div
                    key={level.value}
                    className={`cursor-pointer transition-all duration-200 border-2 rounded-lg p-4 ${
                      data.activity_level === level.value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setData(prev => ({ ...prev, activity_level: level.value }));
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white">{level.label}</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{level.description}</p>
                      </div>
                      {data.activity_level === level.value && (
                        <CheckIcon className="h-5 w-5 text-indigo-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 3: // Complete
        return (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckIcon className="h-10 w-10 text-white" />
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                You're all set! 🎉
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                Your personalized health dashboard is ready. Let's start tracking your progress!
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What's next?</h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>• Start logging your first meal or workout</li>
                <li>• Set up your daily goals</li>
                <li>• Explore your personalized dashboard</li>
              </ul>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isActive 
                      ? 'bg-indigo-500 text-white scale-110' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckIcon className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <span className={`text-xs font-medium text-center ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation */}
        {currentStep < steps.length - 1 && (
          <div className="flex justify-between mt-8">
            <MobileOptimizedButton
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Previous
            </MobileOptimizedButton>

            <MobileOptimizedButton
              variant="outline"
              onClick={handleNext}
              disabled={loading || (currentStep === 1 && (!data.age || !data.gender || !data.height_cm || !data.current_weight_kg)) || (currentStep === 2 && (!data.primary_goal || !data.activity_level))}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRightIcon className="w-4 h-4" />
            </MobileOptimizedButton>
          </div>
        )}

      {/* Final Step - Finish Onboarding */}
      {currentStep === 3 && (
          <div className="flex justify-center mt-8">
            <MobileOptimizedButton
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-4 text-lg bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" color="border-white" />
                  Finishing Setup...
                </>
              ) : (
                <>
                  Finish Onboarding
                  <CheckIcon className="w-5 h-5" />
                </>
              )}
            </MobileOptimizedButton>
          </div>
        )}

      </div>
    </div>
  );
}
