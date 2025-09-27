'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  PlusIcon, 
  FireIcon,
  HeartIcon,
  ChartBarIcon,
  ClockIcon,
  TrophyIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  SparklesIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MobileOptimizedButton } from '@/components/ui/mobile-optimized-button';
import { MobileOptimizedInput } from '@/components/ui/mobile-optimized-input';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { SmartForm, SmartFormField } from '@/components/ui/smart-form';
import { useSuccessToast, useErrorToast } from '@/components/ui/toast';
import { simpleRoutineApi } from '@/lib/simpleRoutineApi';
import { nutritionRoutineApi } from '@/lib/nutritionRoutineApi';

interface UnifiedRoutineWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface RoutineTemplate {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_weeks: number;
  type: 'fitness' | 'nutrition';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  features: string[];
}

const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  // Fitness Templates
  {
    id: 'beginner-strength',
    name: 'Beginner Strength',
    description: 'Perfect for starting your fitness journey with basic strength exercises',
    difficulty: 'beginner',
    duration_weeks: 4,
    type: 'fitness',
    icon: FireIcon,
    color: 'from-orange-500 to-red-500',
    features: ['3 workouts per week', 'Basic exercises', '30-45 min sessions']
  },
  {
    id: 'intermediate-hybrid',
    name: 'Intermediate Hybrid',
    description: 'Mix of strength and cardio for balanced fitness',
    difficulty: 'intermediate',
    duration_weeks: 6,
    type: 'fitness',
    icon: BoltIcon,
    color: 'from-purple-500 to-pink-500',
    features: ['4-5 workouts per week', 'Strength + Cardio', '45-60 min sessions']
  },
  {
    id: 'advanced-powerlifting',
    name: 'Advanced Powerlifting',
    description: 'Serious strength training for experienced lifters',
    difficulty: 'advanced',
    duration_weeks: 8,
    type: 'fitness',
    icon: TrophyIcon,
    color: 'from-gray-700 to-gray-900',
    features: ['5-6 workouts per week', 'Heavy lifting focus', '60-90 min sessions']
  },
  // Nutrition Templates
  {
    id: 'beginner-balanced',
    name: 'Balanced Nutrition',
    description: 'Simple, balanced meals for healthy eating habits',
    difficulty: 'beginner',
    duration_weeks: 4,
    type: 'nutrition',
    icon: HeartIcon,
    color: 'from-green-500 to-emerald-500',
    features: ['3 meals + 2 snacks', 'Basic macro tracking', 'Simple recipes']
  },
  {
    id: 'intermediate-macro',
    name: 'Macro Tracking',
    description: 'Precise macro tracking for body composition goals',
    difficulty: 'intermediate',
    duration_weeks: 6,
    type: 'nutrition',
    icon: ChartBarIcon,
    color: 'from-blue-500 to-cyan-500',
    features: ['Precise macro targets', 'Meal prep friendly', 'Flexible timing']
  },
  {
    id: 'advanced-keto',
    name: 'Advanced Keto',
    description: 'Strict ketogenic diet for advanced users',
    difficulty: 'advanced',
    duration_weeks: 8,
    type: 'nutrition',
    icon: SparklesIcon,
    color: 'from-indigo-500 to-purple-500',
    features: ['Strict carb limits', 'Ketone tracking', 'Advanced meal planning']
  }
];

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'Perfect for getting started', color: 'green' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some experience required', color: 'blue' },
  { value: 'advanced', label: 'Advanced', description: 'For experienced users', color: 'purple' }
];

const DURATION_OPTIONS = [
  { value: 2, label: '2 weeks' },
  { value: 4, label: '4 weeks' },
  { value: 6, label: '6 weeks' },
  { value: 8, label: '8 weeks' },
  { value: 12, label: '12 weeks' }
];

export function UnifiedRoutineWizard({ isOpen, onClose, onSuccess }: UnifiedRoutineWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [routineType, setRoutineType] = useState<'fitness' | 'nutrition' | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<RoutineTemplate | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [targetCalories, setTargetCalories] = useState(2000);
  const [loading, setLoading] = useState(false);
  
  const successToast = useSuccessToast();
  const errorToast = useErrorToast();

  const steps = [
    { id: 'type', title: 'Choose Type', description: 'Fitness or Nutrition?' },
    { id: 'template', title: 'Select Template', description: 'Pick a starting point' },
    { id: 'customize', title: 'Customize', description: 'Adjust to your needs' },
    { id: 'preview', title: 'Preview', description: 'Review and create' }
  ];

  const filteredTemplates = routineType 
    ? ROUTINE_TEMPLATES.filter(t => t.type === routineType)
    : ROUTINE_TEMPLATES;

  const resetWizard = () => {
    setCurrentStep(0);
    setRoutineType(null);
    setSelectedTemplate(null);
    setCustomMode(false);
    setRoutineName('');
    setRoutineDescription('');
    setDifficulty('beginner');
    setDurationWeeks(4);
    setTargetCalories(2000);
  };

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTypeSelect = (type: 'fitness' | 'nutrition') => {
    setRoutineType(type);
    nextStep();
  };

  const handleTemplateSelect = (template: RoutineTemplate) => {
    setSelectedTemplate(template);
    setDifficulty(template.difficulty);
    setDurationWeeks(template.duration_weeks);
    setRoutineName(template.name);
    setRoutineDescription(template.description);
    nextStep();
  };

  const handleCustomMode = () => {
    setCustomMode(true);
    setSelectedTemplate(null);
    nextStep();
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return routineType !== null;
      case 1: return selectedTemplate !== null || customMode;
      case 2: return routineName.trim() !== '';
      case 3: return true;
      default: return false;
    }
  };

  const createRoutine = async () => {
    if (!routineType || !routineName.trim()) return;

    try {
      setLoading(true);

      const routineData = {
        name: routineName,
        description: routineDescription || `Custom ${routineType} routine`,
        difficulty,
        duration_weeks: durationWeeks,
        target_calories: routineType === 'nutrition' ? targetCalories : 0
      };

      let savedRoutine;
      
      if (routineType === 'fitness') {
        // Create a simple fitness routine with basic structure
        const workoutDays = [
          { day: 'monday', workouts: [{ activity_name: 'Push-ups', activity_type: 'strength', sets: 3, reps: '10' }] },
          { day: 'wednesday', workouts: [{ activity_name: 'Squats', activity_type: 'strength', sets: 3, reps: '15' }] },
          { day: 'friday', workouts: [{ activity_name: 'Planks', activity_type: 'strength', sets: 3, reps: '30 seconds' }] }
        ];
        
        savedRoutine = await simpleRoutineApi.createRoutineWithWorkoutPlan(routineData, workoutDays);
      } else {
        // Create a simple nutrition routine
        const mealPlans = Array.from({ length: 7 }, (_, i) => {
          const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          return {
            day_name: days[i],
            day_order: i,
            plan_name: `${days[i].charAt(0).toUpperCase() + days[i].slice(1)} Plan`,
            description: `Nutrition plan for ${days[i]}`,
            daily_calories: targetCalories,
            meals: [
              { meal_type: 'breakfast' as const, meal_name: 'Breakfast', description: 'Healthy breakfast', order_index: 0, target_calories: targetCalories * 0.3, food_items: [] },
              { meal_type: 'lunch' as const, meal_name: 'Lunch', description: 'Balanced lunch', order_index: 1, target_calories: targetCalories * 0.4, food_items: [] },
              { meal_type: 'dinner' as const, meal_name: 'Dinner', description: 'Light dinner', order_index: 2, target_calories: targetCalories * 0.3, food_items: [] }
            ]
          };
        });
        
        savedRoutine = await nutritionRoutineApi.createRoutineWithMealPlans({
          routine_data: routineData,
          meal_plans: mealPlans
        });
      }

      successToast(`${routineType} routine "${routineName}" created successfully!`);
      onSuccess?.();
      handleClose();
      
    } catch (error) {
      console.error('Failed to create routine:', error);
      errorToast('Failed to create routine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Type Selection
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                What would you like to create?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose the type of routine you want to build
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.button
                onClick={() => handleTypeSelect('fitness')}
                className="p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200 text-left group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-800/40 transition-colors">
                    <FireIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">Fitness Routine</h4>
                    <p className="text-gray-600 dark:text-gray-400">Workouts, exercises, and training plans</p>
                  </div>
                </div>
              </motion.button>
              
              <motion.button
                onClick={() => handleTypeSelect('nutrition')}
                className="p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 text-left group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-800/40 transition-colors">
                    <HeartIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">Nutrition Routine</h4>
                    <p className="text-gray-600 dark:text-gray-400">Meal plans, recipes, and nutrition tracking</p>
                  </div>
                </div>
              </motion.button>
            </div>
          </div>
        );

      case 1: // Template Selection
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Choose a starting point
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Pick a template or start from scratch
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => {
                const IconComponent = template.icon;
                return (
                  <motion.button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 text-left group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 bg-gradient-to-r ${template.color} rounded-lg`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{template.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {template.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {template.features.map((feature, index) => (
                          <span key={index} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
              
              <motion.button
                onClick={handleCustomMode}
                className="p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 text-left group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="space-y-3 text-center">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mx-auto w-fit">
                    <PlusIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Start from Scratch</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Create a completely custom routine</p>
                </div>
              </motion.button>
            </div>
          </div>
        );

      case 2: // Customize
        const customizeFields: SmartFormField[] = [
          {
            name: 'routineName',
            label: 'Routine Name',
            type: 'text' as const,
            placeholder: 'Enter routine name',
            required: true,
            maxLength: 50,
            showCharacterCount: true,
            helpText: 'Choose a descriptive name for your routine'
          },
          {
            name: 'routineDescription',
            label: 'Description',
            type: 'textarea' as const,
            placeholder: 'Describe your routine',
            rows: 3,
            maxLength: 200,
            showCharacterCount: true,
            helpText: 'Optional description to help you remember the routine'
          },
          {
            name: 'difficulty',
            label: 'Difficulty Level',
            type: 'select' as const,
            required: true,
            options: DIFFICULTY_LEVELS.map(level => ({
              value: level.value,
              label: level.label
            })),
            helpText: 'Choose the difficulty level that matches your experience'
          },
          {
            name: 'durationWeeks',
            label: 'Duration',
            type: 'select' as const,
            required: true,
            options: DURATION_OPTIONS.map(option => ({
              value: option.value.toString(),
              label: option.label
            })),
            helpText: 'How long do you want to follow this routine?'
          },
          ...(routineType === 'nutrition' ? [{
            name: 'targetCalories',
            label: 'Target Daily Calories',
            type: 'number' as const,
            required: true,
            min: 1000,
            max: 5000,
            placeholder: '2000',
            helpText: 'Your daily calorie target for this nutrition routine'
          }] : [])
        ];

        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Customize your routine
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Adjust the details to fit your needs
              </p>
            </div>
            
            <SmartForm
              fields={customizeFields}
              initialValues={{
                routineName,
                routineDescription,
                difficulty,
                durationWeeks: durationWeeks.toString(),
                targetCalories: routineType === 'nutrition' ? targetCalories : undefined
              }}
              onSubmit={(values) => {
                setRoutineName(values.routineName);
                setRoutineDescription(values.routineDescription);
                setDifficulty(values.difficulty);
                setDurationWeeks(parseInt(values.durationWeeks));
                if (routineType === 'nutrition') {
                  setTargetCalories(parseInt(values.targetCalories) || 2000);
                }
                nextStep();
              }}
              submitLabel="Continue"
              variant="minimal"
              columns={2}
              validationRules={{
                routineName: {
                  required: true,
                  minLength: 3,
                  maxLength: 50
                },
                targetCalories: routineType === 'nutrition' ? {
                  required: true,
                  min: 1000,
                  max: 5000
                } : {
                  required: false
                }
              }}
            />
          </div>
        );

      case 3: // Preview
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Review your routine
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Everything looks good? Let's create it!
              </p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {routineType === 'fitness' ? (
                    <FireIcon className="h-6 w-6 text-orange-600" />
                  ) : (
                    <HeartIcon className="h-6 w-6 text-green-600" />
                  )}
                  <span>{routineName}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {routineDescription && (
                  <p className="text-gray-600 dark:text-gray-400">{routineDescription}</p>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                    <p className="font-semibold capitalize">{routineType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Difficulty</p>
                    <p className="font-semibold capitalize">{difficulty}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                    <p className="font-semibold">{durationWeeks} weeks</p>
                  </div>
                  {routineType === 'nutrition' && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Calories</p>
                      <p className="font-semibold">{targetCalories}/day</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[90vh] overflow-hidden p-0 bg-white dark:bg-gray-900 border-0 shadow-2xl flex flex-col">
        <div className="flex flex-col h-full min-h-0">
          {/* Header */}
          <DialogHeader className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  Create New Routine
                </DialogTitle>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.title}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8"
              >
                <XMarkIcon className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center space-x-2">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index <= currentStep
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-12 h-1 mx-2 ${
                        index < currentStep ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center space-x-2"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span>Previous</span>
              </Button>
              
              <div className="flex items-center space-x-2">
                {currentStep === steps.length - 1 ? (
                  <MobileOptimizedButton
                    onClick={createRoutine}
                    disabled={!canProceed() || loading}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" text="Creating..." />
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Create Routine
                      </>
                    )}
                  </MobileOptimizedButton>
                ) : (
                  <MobileOptimizedButton
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  >
                    <span>Next</span>
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </MobileOptimizedButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
