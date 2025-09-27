'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FireIcon, 
  HeartIcon, 
  ClockIcon, 
  ChartBarIcon,
  PlusIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { SmartForm, SmartFormField } from '@/components/ui/smart-form';
import { useFormValidation } from '@/hooks/useFormValidation';
import { MobileOptimizedButton } from '@/components/ui/mobile-optimized-button';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { toast } from 'sonner';
import api from '@/lib/api';

interface UnifiedLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  type?: 'nutrition' | 'fitness' | null;
  initialData?: any;
}

interface LoggingMode {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  quickFields: SmartFormField[];
  detailedFields: SmartFormField[];
}

const NUTRITION_MODES: LoggingMode[] = [
  {
    id: 'quick-meal',
    name: 'Quick Meal',
    description: 'Log a meal in under 30 seconds',
    icon: ClockIcon,
    color: 'emerald',
    quickFields: [
      {
        name: 'meal_type',
        label: 'Meal Type',
        type: 'select',
        required: true,
        options: [
          { value: 'breakfast', label: 'Breakfast' },
          { value: 'lunch', label: 'Lunch' },
          { value: 'dinner', label: 'Dinner' },
          { value: 'snack', label: 'Snack' }
        ],
        helpText: 'What meal are you logging?'
      },
      {
        name: 'meal_name',
        label: 'Meal Name',
        type: 'text',
        placeholder: 'e.g., Grilled Chicken Salad',
        maxLength: 50,
        helpText: 'Quick description of your meal'
      },
      {
        name: 'calories',
        label: 'Calories',
        type: 'number',
        required: true,
        min: 1,
        max: 5000,
        placeholder: '500',
        helpText: 'Total calories for this meal'
      }
    ],
    detailedFields: [
      {
        name: 'protein_g',
        label: 'Protein (g)',
        type: 'number',
        min: 0,
        max: 200,
        placeholder: '25'
      },
      {
        name: 'carbs_g',
        label: 'Carbs (g)',
        type: 'number',
        min: 0,
        max: 500,
        placeholder: '30'
      },
      {
        name: 'fat_g',
        label: 'Fat (g)',
        type: 'number',
        min: 0,
        max: 200,
        placeholder: '15'
      },
      {
        name: 'notes',
        label: 'Notes',
        type: 'textarea',
        rows: 2,
        placeholder: 'Any additional notes about this meal...',
        maxLength: 200
      }
    ]
  },
  {
    id: 'detailed-meal',
    name: 'Detailed Meal',
    description: 'Log with full nutrition breakdown',
    icon: ChartBarIcon,
    color: 'blue',
    quickFields: [],
    detailedFields: [
      {
        name: 'meal_type',
        label: 'Meal Type',
        type: 'select',
        required: true,
        options: [
          { value: 'breakfast', label: 'Breakfast' },
          { value: 'lunch', label: 'Lunch' },
          { value: 'dinner', label: 'Dinner' },
          { value: 'snack', label: 'Snack' }
        ]
      },
      {
        name: 'meal_name',
        label: 'Meal Name',
        type: 'text',
        required: true,
        placeholder: 'e.g., Grilled Chicken Salad',
        maxLength: 50
      },
      {
        name: 'calories',
        label: 'Calories',
        type: 'number',
        required: true,
        min: 1,
        max: 5000
      },
      {
        name: 'protein_g',
        label: 'Protein (g)',
        type: 'number',
        required: true,
        min: 0,
        max: 200
      },
      {
        name: 'carbs_g',
        label: 'Carbs (g)',
        type: 'number',
        required: true,
        min: 0,
        max: 500
      },
      {
        name: 'fat_g',
        label: 'Fat (g)',
        type: 'number',
        required: true,
        min: 0,
        max: 200
      },
      {
        name: 'fiber_g',
        label: 'Fiber (g)',
        type: 'number',
        min: 0,
        max: 100
      },
      {
        name: 'sugar_g',
        label: 'Sugar (g)',
        type: 'number',
        min: 0,
        max: 200
      },
      {
        name: 'sodium_mg',
        label: 'Sodium (mg)',
        type: 'number',
        min: 0,
        max: 10000
      },
      {
        name: 'notes',
        label: 'Notes',
        type: 'textarea',
        rows: 3,
        placeholder: 'Any additional notes about this meal...',
        maxLength: 500
      }
    ]
  }
];

const FITNESS_MODES: LoggingMode[] = [
  {
    id: 'quick-workout',
    name: 'Quick Workout',
    description: 'Log a workout in under 1 minute',
    icon: ClockIcon,
    color: 'orange',
    quickFields: [
      {
        name: 'workout_name',
        label: 'Workout Name',
        type: 'text',
        required: true,
        placeholder: 'e.g., Morning Run',
        maxLength: 50,
        helpText: 'What did you do?'
      },
      {
        name: 'duration_minutes',
        label: 'Duration (minutes)',
        type: 'number',
        required: true,
        min: 1,
        max: 300,
        placeholder: '30',
        helpText: 'How long did you exercise?'
      },
      {
        name: 'intensity',
        label: 'Intensity',
        type: 'select',
        required: true,
        options: [
          { value: 'low', label: 'Low - Easy pace' },
          { value: 'moderate', label: 'Moderate - Comfortable' },
          { value: 'high', label: 'High - Challenging' }
        ],
        helpText: 'How intense was your workout?'
      }
    ],
    detailedFields: [
      {
        name: 'calories_burned',
        label: 'Calories Burned',
        type: 'number',
        min: 0,
        max: 2000,
        placeholder: '250'
      },
      {
        name: 'notes',
        label: 'Notes',
        type: 'textarea',
        rows: 2,
        placeholder: 'How did it feel? Any notes...',
        maxLength: 200
      }
    ]
  },
  {
    id: 'detailed-workout',
    name: 'Detailed Workout',
    description: 'Log with full exercise breakdown',
    icon: ChartBarIcon,
    color: 'purple',
    quickFields: [],
    detailedFields: [
      {
        name: 'workout_name',
        label: 'Workout Name',
        type: 'text',
        required: true,
        placeholder: 'e.g., Upper Body Strength',
        maxLength: 50
      },
      {
        name: 'workout_type',
        label: 'Workout Type',
        type: 'select',
        required: true,
        options: [
          { value: 'strength', label: 'Strength Training' },
          { value: 'cardio', label: 'Cardio' },
          { value: 'flexibility', label: 'Flexibility' },
          { value: 'sports', label: 'Sports' },
          { value: 'other', label: 'Other' }
        ]
      },
      {
        name: 'duration_minutes',
        label: 'Duration (minutes)',
        type: 'number',
        required: true,
        min: 1,
        max: 300
      },
      {
        name: 'intensity',
        label: 'Intensity',
        type: 'select',
        required: true,
        options: [
          { value: 'low', label: 'Low - Easy pace' },
          { value: 'moderate', label: 'Moderate - Comfortable' },
          { value: 'high', label: 'High - Challenging' }
        ]
      },
      {
        name: 'calories_burned',
        label: 'Calories Burned',
        type: 'number',
        min: 0,
        max: 2000
      },
      {
        name: 'exercises',
        label: 'Exercises',
        type: 'textarea',
        rows: 4,
        placeholder: 'List the exercises you did (one per line)...',
        helpText: 'e.g., Push-ups: 3 sets of 10, Squats: 3 sets of 15'
      },
      {
        name: 'notes',
        label: 'Notes',
        type: 'textarea',
        rows: 3,
        placeholder: 'How did it feel? Any notes...',
        maxLength: 500
      }
    ]
  }
];

export function UnifiedLogger({ isOpen, onClose, onSuccess, type, initialData }: UnifiedLoggerProps) {
  const [currentStep, setCurrentStep] = useState<'select' | 'mode' | 'form'>('select');
  const [selectedType, setSelectedType] = useState<'nutrition' | 'fitness' | null>(type || null);
  const [selectedMode, setSelectedMode] = useState<LoggingMode | null>(null);
  const [isQuickMode, setIsQuickMode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modes = selectedType === 'nutrition' ? NUTRITION_MODES : FITNESS_MODES;

  const handleTypeSelect = (selectedType: 'nutrition' | 'fitness') => {
    setSelectedType(selectedType);
    setCurrentStep('mode');
  };

  const handleModeSelect = (mode: LoggingMode) => {
    setSelectedMode(mode);
    setIsQuickMode(mode.id.includes('quick'));
    setCurrentStep('form');
  };

  const handleSubmit = async (values: any) => {
    if (!selectedType || !selectedMode) return;

    setIsSubmitting(true);
    try {
      const endpoint = selectedType === 'nutrition' 
        ? '/health/logging/nutrition' 
        : '/health/logging/fitness';
      
      const payload = {
        ...values,
        logged_at: new Date().toISOString(),
        mode: selectedMode.id
      };

      await api.post(endpoint, payload);
      
      toast.success(`${selectedMode.name} logged successfully!`);
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Failed to log:', error);
      toast.error('Failed to log. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep('select');
    setSelectedType(type || null);
    setSelectedMode(null);
    setIsQuickMode(true);
    onClose();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'select':
        return (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                What would you like to log?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose what you want to track
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className="cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => handleTypeSelect('nutrition')}
              >
                <Card className="border-2 hover:border-emerald-500">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HeartIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Nutrition</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Log meals, track calories, and monitor nutrition
                  </p>
                </CardContent>
                </Card>
              </div>

              <div
                className="cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => handleTypeSelect('fitness')}
              >
                <Card className="border-2 hover:border-orange-500">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FireIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Fitness</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Log workouts, track exercises, and monitor progress
                  </p>
                </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        );

      case 'mode':
        return (
          <motion.div
            key="mode"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                How would you like to log?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose your preferred logging style
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {modes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <div
                    key={mode.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200"
                    onClick={() => handleModeSelect(mode)}
                  >
                    <Card className="border-2 hover:border-blue-500">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 bg-${mode.color}-100 dark:bg-${mode.color}-900/30 rounded-full flex items-center justify-center`}>
                          <Icon className={`h-6 w-6 text-${mode.color}-600 dark:text-${mode.color}-400`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{mode.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{mode.description}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {mode.quickFields.length > 0 ? 'Quick' : 'Detailed'}
                        </Badge>
                      </div>
                    </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('select')}
                className="flex items-center gap-2"
              >
                <XMarkIcon className="h-4 w-4 rotate-45" />
                Back
              </Button>
            </div>
          </motion.div>
        );

      case 'form':
        if (!selectedMode) return null;

        const fields = isQuickMode ? selectedMode.quickFields : selectedMode.detailedFields;
        
        return (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {selectedMode.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedMode.description}
              </p>
            </div>

            <SmartForm
              fields={fields}
              initialValues={initialData || {}}
              onSubmit={handleSubmit}
              onCancel={() => setCurrentStep('mode')}
              submitLabel={isSubmitting ? 'Logging...' : 'Log Entry'}
              cancelLabel="Back"
              variant="minimal"
              columns={1}
              loading={isSubmitting}
            />
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md sm:max-w-lg md:max-w-xl h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            Log Entry
          </DialogTitle>
          <DialogDescription>
            Quickly log your nutrition or fitness activities
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 py-4">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
