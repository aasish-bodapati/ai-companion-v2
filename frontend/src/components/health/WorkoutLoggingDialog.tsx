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
  notes?: string;
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
    'weight': 'Weight',
    'weight_unit': 'Weight Unit',
    'duration': 'Duration (min)',
    'distance': 'Distance',
    'distance_unit': 'Distance Unit',
    'intensity': 'Intensity',
    'heart_rate': 'Heart Rate (bpm)',
    'difficulty': 'Difficulty',
    'total_reps': 'Total Reps',
    'time': 'Time (min)',
    'pace': 'Pace',
    'notes': 'Notes'
  };
  return fieldMap[fieldName] || fieldName;
};

export function WorkoutLoggingDialog({ isOpen, onClose, onSuccess, onNavigateToRoutines }: WorkoutLoggingDialogProps) {
  const [workoutData, setWorkoutData] = useState<WorkoutData | null>(null);
  const [loggedExercises, setLoggedExercises] = useState<{ [key: number]: any }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  // Load today's workout when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadTodayWorkout();
    }
  }, [isOpen]);

  const loadTodayWorkout = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/health/simple-routines/active/today-workout');
      setWorkoutData(response);
      
      // Initialize logged exercises with empty values
      const initialLogged: { [key: number]: any } = {};
      response.exercises.forEach((exercise: Exercise) => {
        initialLogged[exercise.id] = {};
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

  const logWorkout = async () => {
    if (!workoutData) return;

    try {
      setIsLogging(true);
      
      // Log the workout completion
      await api.post(`/health/simple-routines/${workoutData.routine_id}/log-workout`);
      
      // TODO: Save individual exercise logs if needed
      // For now, we just log the workout completion
      
      toast.success('Workout logged successfully!', {
        description: `Great job completing your ${workoutData.workout_name}!`
      });
      
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
                  const formFields = getFormFieldsForCategory(exercise.logging_category);
                  
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
                          <Badge variant={isLogged ? 'default' : 'secondary'}>
                            {isLogged ? 'Logged' : 'Not Logged'}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {formFields.map((field) => {
                            const fieldName = field.name as keyof Exercise;
                            const fieldValue = logged[field.name] || '';
                            
                            return (
                              <div key={field.name} className={field.name === 'notes' ? 'sm:col-span-2 lg:col-span-3' : ''}>
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
                                    min={field.min || 0}
                                    max={field.max || 9999}
                                    value={fieldValue as number || ''}
                                    onChange={(e) => updateLoggedExercise(exercise.id, field.name, field.name === 'sets' || field.name === 'weight' || field.name === 'duration' || field.name === 'total_reps' || field.name === 'time' || field.name === 'heart_rate' ? parseInt(e.target.value) || 0 : e.target.value)}
                                    placeholder={field.label}
                                    className="w-full border border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                                  />
                                ) : (
                                  <Input
                                    value={fieldValue as string || ''}
                                    onChange={(e) => updateLoggedExercise(exercise.id, field.name, e.target.value)}
                                    placeholder={field.label}
                                    maxLength={field.max_length || undefined}
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
                  {workoutData.exercises.filter(ex => isExerciseLogged(ex.id)).length} / {workoutData.exercises.length} exercises logged
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
                disabled={!allExercisesLogged() || isLogging}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isLogging ? 'Logging...' : 'Log Workout'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
