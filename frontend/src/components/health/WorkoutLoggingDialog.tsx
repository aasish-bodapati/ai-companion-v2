'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WORKOUT_CATEGORIES } from '@/components/health/WorkoutCategorySelector';
import { toast } from 'sonner';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { api } from '@/lib/api';

interface Exercise {
  id: number;
  exercise_name: string;
  logging_category?: string;
  sets?: number;
  reps?: string;
  weight?: number;
  weight_unit?: string;
  duration?: number;
  distance?: number;
  distance_unit?: string;
  intensity?: string;
  heart_rate?: number;
  difficulty?: string;
  total_reps?: number;
  time?: number;
  pace?: string;
  weight_notes?: string;
  rest_time?: string;
  order_index: number;
}

interface WorkoutData {
  routine_id: number;
  routine_name: string;
  day_name: string;
  workout_name: string;
  description: string;
  exercises: Exercise[];
}

interface WorkoutLoggingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onNavigateToRoutines?: () => void;
}

// Get form fields based on exercise category
const getFormFieldsForCategory = (category: string) => {
  const categoryConfig = WORKOUT_CATEGORIES.find(cat => cat.id === category);
  if (!categoryConfig) return [];
  
  return [
    ...categoryConfig.loggingAttributes.required,
    ...categoryConfig.loggingAttributes.optional
  ];
};

// Get the display name for a field
const getFieldDisplayName = (fieldName: string): string => {
  const fieldMap: { [key: string]: string } = {
    'sets': 'Sets',
    'reps': 'Reps',
    'weight': 'Weight (kg)',
    'duration': 'Duration (min)',
    'distance': 'Distance',
    'distance_unit': 'Distance Unit',
    'intensity': 'Intensity',
    'heart_rate': 'Heart Rate (bpm)',
    'difficulty': 'Difficulty',
    'total_reps': 'Total Reps',
    'time': 'Time (min)',
    'pace': 'Pace'
  };
  return fieldMap[fieldName] || fieldName;
};

export function WorkoutLoggingDialog({ isOpen, onClose, onSuccess, onNavigateToRoutines }: WorkoutLoggingDialogProps) {
  const [workoutData, setWorkoutData] = useState<WorkoutData | null>(null);
  const [loggedExercises, setLoggedExercises] = useState<{ [key: number]: any }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [skippedExercises, setSkippedExercises] = useState<{ [key: number]: boolean }>({});

  // Load today's workout when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSkippedExercises({}); // Reset skipped exercises when dialog opens
      loadTodayWorkout();
    }
  }, [isOpen]);

  const loadTodayWorkout = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/health/simple-routines/active/previous-week-workout');
      setWorkoutData(response);
      
      // Initialize logged exercises with previous week's data
      const initialLogged: { [key: number]: any } = {};
      response.exercises.forEach((exercise: Exercise) => {
        const previousData = (exercise as any).previous_data || {};
        console.log('Exercise data:', exercise);
        console.log('Previous data:', previousData);
        console.log('Previous data weight:', previousData.weight);
        console.log('Previous data weight_used:', previousData.weight_used);
        
        initialLogged[exercise.id] = {
          sets: previousData.sets !== undefined ? previousData.sets : (exercise.sets || ''),
          reps: previousData.reps !== undefined ? previousData.reps : (exercise.reps || ''),
          weight: previousData.weight !== undefined ? previousData.weight : (previousData.weight_used !== undefined ? previousData.weight_used : (exercise.weight || '')),
          weight_unit: 'kg', // Default to kg
          duration: previousData.duration !== undefined ? previousData.duration : (exercise.duration || ''),
          distance: previousData.distance !== undefined ? previousData.distance : (exercise.distance || ''),
          distance_unit: previousData.distance_unit !== undefined ? previousData.distance_unit : (exercise.distance_unit || ''),
          intensity: previousData.intensity !== undefined ? previousData.intensity : (exercise.intensity || ''),
          heart_rate: previousData.heart_rate !== undefined ? previousData.heart_rate : (exercise.heart_rate || ''),
          difficulty: previousData.difficulty !== undefined ? previousData.difficulty : (exercise.difficulty || ''),
          total_reps: previousData.total_reps !== undefined ? previousData.total_reps : (exercise.total_reps || ''),
          time: previousData.time !== undefined ? previousData.time : (exercise.time || ''),
          pace: previousData.pace !== undefined ? previousData.pace : (exercise.pace || ''),
          weight_notes: previousData.weight_notes !== undefined ? previousData.weight_notes : (exercise.weight_notes || ''),
          rest_time: previousData.rest_time || exercise.rest_time || ''
        };
        
        console.log('Initialized data for exercise', exercise.id, ':', initialLogged[exercise.id]);
      });
      setLoggedExercises(initialLogged);
    } catch (error: any) {
      console.error('Failed to load today\'s workout:', error);
      if (error.status === 404) {
        toast.error('No active routine found', {
          description: 'You need to set an active routine first. Go to "My Routines" to start following a routine.'
        });
      } else {
        toast.error('Failed to load workout', {
          description: 'Could not load today\'s workout. Please try again.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateLoggedExercise = (exerciseId: number, field: string, value: any) => {
    setLoggedExercises(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [field]: value
      }
    }));
  };

  const toggleExerciseSkipped = (exerciseId: number) => {
    setSkippedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };

  const logWorkout = async () => {
    if (!workoutData) return;

    try {
      setIsLogging(true);
      
      // Count skipped vs completed exercises
      const skippedCount = Object.values(skippedExercises).filter(Boolean).length;
      const completedCount = workoutData.exercises.length - skippedCount;
      
      if (skippedCount > 0) {
        // Any exercises skipped - mark entire workout as skipped
        await api.post(`/health/simple-routines/${workoutData.routine_id}/skip-workout`);
        
        const message = skippedCount === workoutData.exercises.length
          ? `Your ${workoutData.workout_name} has been marked as skipped.`
          : `Workout marked as skipped. ${completedCount} exercises completed, ${skippedCount} skipped.`;
        
        toast.success('Workout marked as skipped', {
          description: message
        });
      } else {
        // All exercises completed - log the workout completion
        await api.post(`/health/simple-routines/${workoutData.routine_id}/log-workout`);
        
        // TODO: Save individual exercise logs if needed
        // For now, we just log the workout completion
        
        toast.success('Workout logged successfully!', {
          description: `Great job completing your ${workoutData.workout_name}!`
        });
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to log workout:', error);
      toast.error('Failed to log workout', {
        description: 'Could not save your workout. Please try again.'
      });
    } finally {
      setIsLogging(false);
    }
  };

  const isExerciseLogged = (exerciseId: number) => {
    // If exercise is skipped, consider it "logged" for UI purposes
    if (skippedExercises[exerciseId]) return true;
    
    const logged = loggedExercises[exerciseId];
    if (!logged) return false;
    
    // Check if at least one required field is filled
    const exercise = workoutData?.exercises.find(ex => ex.id === exerciseId);
    if (!exercise?.logging_category) return false;
    
    const categoryConfig = WORKOUT_CATEGORIES.find(cat => cat.id === exercise.logging_category);
    if (!categoryConfig) return false;
    
    return categoryConfig.loggingAttributes.required.some(field => 
      logged[field.name] !== undefined && logged[field.name] !== '' && logged[field.name] !== null
    );
  };

  const allExercisesLogged = () => {
    if (!workoutData) return false;
    return workoutData.exercises.every(exercise => isExerciseLogged(exercise.id));
  };

  const canSubmit = () => {
    if (!workoutData) return false;
    return allExercisesLogged();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] overflow-hidden p-0 bg-white dark:bg-gray-900 border-0 shadow-2xl flex flex-col [&>button]:absolute [&>button]:top-4 [&>button]:right-4 [&>button]:z-30">
        <DialogHeader className="z-10 p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Log Today's Workout
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {workoutData ? `${workoutData.routine_name} - ${workoutData.workout_name}` : 'Loading...'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading today's workout...</p>
              </div>
            </div>
          ) : workoutData ? (
            <div className="space-y-6">
              {/* Workout Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-lg">{workoutData.workout_name}</span>
                    <Badge variant="secondary">{workoutData.day_name}</Badge>
                  </CardTitle>
                  {workoutData.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{workoutData.description}</p>
                  )}
                </CardHeader>
              </Card>

              {/* Exercises */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Exercises ({workoutData.exercises.length})
                </h3>
                
                {workoutData.exercises.map((exercise, index) => {
                  const logged = loggedExercises[exercise.id] || {};
                  const isLogged = isExerciseLogged(exercise.id);
                  const formFields = getFormFieldsForCategory(exercise.logging_category || 'bodyweight');
                  
                  console.log(`Exercise ${exercise.exercise_name}:`);
                  console.log(`  logging_category: ${exercise.logging_category}`);
                  console.log(`  formFields:`, formFields);
                  console.log(`  logged data:`, logged);
                  
                  return (
                    <Card key={exercise.id} className={isLogged ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : ''}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">#{index + 1}</span>
                            <span>{exercise.exercise_name}</span>
                            {isLogged && (
                              <CheckIcon className="h-4 w-4 text-green-500" />
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`skip-exercise-${exercise.id}`}
                                checked={skippedExercises[exercise.id] || false}
                                onChange={() => toggleExerciseSkipped(exercise.id)}
                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`skip-exercise-${exercise.id}`} className="text-xs text-gray-600 dark:text-gray-400">
                                Skip
                              </label>
                            </div>
                            <Badge 
                              variant={isLogged ? 'default' : 'secondary'}
                              className={isLogged 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                              }
                            >
                              {skippedExercises[exercise.id] ? 'Skipped' : (isLogged ? 'Logged' : 'Not Logged')}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {formFields.filter(field => field.name !== 'notes' && field.name !== 'weight_unit').map((field) => {
                            const fieldName = field.name as keyof Exercise;
                            const fieldValue = logged[field.name] || '';
                            
                            return (
                              <div key={field.name}>
                                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                                  {getFieldDisplayName(field.name)}
                                  {field.name === 'sets' || field.name === 'reps' || field.name === 'weight' || field.name === 'duration' || field.name === 'total_reps' || field.name === 'time' || field.name === 'heart_rate' ? ' *' : ''}
                                </Label>
                                
                                {field.type === 'select' ? (
                                  <Select
                                    value={fieldValue as string || ''}
                                    onValueChange={(value) => updateLoggedExercise(exercise.id, field.name, value)}
                                  >
                                    <SelectTrigger className="w-full border border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500 rounded-lg">
                                      <SelectValue placeholder={`Select ${getFieldDisplayName(field.name)}`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {field.options?.map((option) => (
                                        <SelectItem key={option} value={option}>
                                          {option}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : field.type === 'number' ? (
                                  <Input
                                    type="number"
                                    min={'min' in field ? field.min || 0 : 0}
                                    max={'max' in field ? field.max || 9999 : 9999}
                                    value={fieldValue || ''}
                                    onChange={(e) => updateLoggedExercise(exercise.id, field.name, field.name === 'sets' || field.name === 'reps' || field.name === 'weight' || field.name === 'duration' || field.name === 'total_reps' || field.name === 'time' || field.name === 'heart_rate' ? parseInt(e.target.value) || 0 : e.target.value)}
                                    placeholder={field.label}
                                    className="w-full border border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                                  />
                                ) : (
                                  <Input
                                    value={fieldValue as string || ''}
                                    onChange={(e) => updateLoggedExercise(exercise.id, field.name, e.target.value)}
                                    placeholder={field.label}
                                    maxLength={'max_length' in field ? field.max_length || undefined : undefined}
                                    className="w-full border border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏋️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Active Routine
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You need to set an active routine first to log today's workout.
                </p>
                <Button
                  onClick={() => {
                    onClose();
                    onNavigateToRoutines?.();
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Go to My Routines
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {workoutData && (
                <span>
                  {(() => {
                    const loggedCount = workoutData.exercises.filter(ex => isExerciseLogged(ex.id)).length;
                    const skippedCount = Object.values(skippedExercises).filter(Boolean).length;
                    const completedCount = loggedCount - skippedCount;
                    
                    if (skippedCount === workoutData.exercises.length) {
                      return 'All exercises will be skipped - workout will be marked as skipped';
                    } else if (skippedCount > 0) {
                      return `${completedCount} completed, ${skippedCount} skipped - workout will be marked as skipped`;
                    } else {
                      return `${loggedCount} / ${workoutData.exercises.length} exercises logged - workout will be completed`;
                    }
                  })()}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLogging}
              >
                Cancel
              </Button>
              <Button
                onClick={logWorkout}
                disabled={!canSubmit() || isLogging}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isLogging ? 'Saving...' : 'Save Workout'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
