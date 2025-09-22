'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { WORKOUT_CATEGORIES } from '@/components/health/WorkoutCategorySelector';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { SimpleRoutineWithProgress } from '@/lib/simpleRoutineApi';
import { simpleRoutineApi } from '@/lib/simpleRoutineApi';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api';

interface Exercise {
  exercise_name: string;
  logging_category?: string;
  // Dynamic attributes based on category
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
}

interface ExerciseOption {
  id: number;
  name: string;
  logging_category: string;
  logging_category_info: {
    id: number;
    name: string;
    display_name: string;
  };
  difficulty: string;
  calories_per_minute: number;
  description: string;
}

interface WorkoutDay {
  day_name: string;
  day_order: number;
  workout_name: string;
  description?: string;
  exercises: Exercise[];
}

interface EditRoutineDialogProps {
  routine: SimpleRoutineWithProgress | null;
  isOpen: boolean;
  onClose: () => void;
  onRoutineUpdated: () => void;
  mode?: 'edit' | 'create';
}

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

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

export function EditRoutineDialog({ routine, isOpen, onClose, onRoutineUpdated, mode = 'edit' }: EditRoutineDialogProps) {
  const [routineName, setRoutineName] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [allExercises, setAllExercises] = useState<ExerciseOption[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);

  // Initialize form data when routine changes or mode changes
  useEffect(() => {
    if (mode === 'create') {
      // Create mode - initialize with empty data
      console.log('🔍 EditRoutineDialog - Create mode, initializing empty');
      setRoutineName('');
      setRoutineDescription('');
      setWorkoutDays([]);
    } else if (routine) {
      // Edit mode - load existing routine data
      console.log('🔍 EditRoutineDialog - Edit mode, loading routine data:', routine);
      console.log('🔍 EditRoutineDialog - workout_days:', routine.workout_days);
      console.log('🔍 EditRoutineDialog - workout_schedule:', routine.workout_schedule);
      
      setRoutineName(routine.name);
      setRoutineDescription(routine.description || '');
      
      // Load existing workout days from the routine
      if (routine.workout_days && Array.isArray(routine.workout_days) && routine.workout_days.length > 0) {
        console.log('🔍 EditRoutineDialog - Processing workout_days with', routine.workout_days.length, 'days');
        
        const loadedWorkoutDays: WorkoutDay[] = routine.workout_days.map((day: any) => ({
          day_name: day.day_name || day.day,
          day_order: day.day_order || 0,
          workout_name: day.workout_name || `${day.day_name || day.day} Workout`,
          description: day.description,
          exercises: day.exercises ? day.exercises.map((ex: any) => ({
            exercise_name: ex.exercise_name || ex.activity_name,
            logging_category: ex.logging_category || 'weighted',
            sets: ex.sets || 3,
            reps: ex.reps || '10',
            weight: ex.weight,
            weight_unit: ex.weight_unit,
            duration: ex.duration,
            distance: ex.distance,
            distance_unit: ex.distance_unit,
            intensity: ex.intensity,
            heart_rate: ex.heart_rate,
            difficulty: ex.difficulty,
            total_reps: ex.total_reps,
            time: ex.time,
            pace: ex.pace,
            weight_notes: ex.weight_notes || '',
            rest_time: ex.rest_time || '2-3 min',
            notes: ex.notes || ''
          })) : []
        }));
        
        console.log('🔍 EditRoutineDialog - Loaded workout days:', loadedWorkoutDays);
        setWorkoutDays(loadedWorkoutDays);
      } else if (routine.workout_schedule && Array.isArray(routine.workout_schedule) && routine.workout_schedule.length > 0) {
        console.log('🔍 EditRoutineDialog - Processing workout_schedule with', routine.workout_schedule.length, 'days');
        
        const loadedWorkoutDays: WorkoutDay[] = routine.workout_schedule.map((day: any, index: number) => ({
          day_name: day.day,
          day_order: day.day_order || index,
          workout_name: day.workout_name || `${day.day} Workout`,
          description: day.description,
          exercises: day.exercises ? day.exercises.map((ex: any) => ({
            exercise_name: ex.exercise_name || ex.activity_name,
            logging_category: ex.logging_category || 'weighted',
            sets: ex.sets || 3,
            reps: ex.reps || '10',
            weight: ex.weight,
            weight_unit: ex.weight_unit,
            duration: ex.duration,
            distance: ex.distance,
            distance_unit: ex.distance_unit,
            intensity: ex.intensity,
            heart_rate: ex.heart_rate,
            difficulty: ex.difficulty,
            total_reps: ex.total_reps,
            time: ex.time,
            pace: ex.pace,
            weight_notes: ex.weight_notes || '',
            rest_time: ex.rest_time || '2-3 min',
            notes: ex.notes || ''
          })) : []
        }));
        
        console.log('🔍 EditRoutineDialog - Loaded from workout_schedule:', loadedWorkoutDays);
        setWorkoutDays(loadedWorkoutDays);
      } else {
        console.log('🔍 EditRoutineDialog - No workout data found, initializing empty');
        setWorkoutDays([]);
      }
    }
  }, [routine, mode]);

  // Debug workoutDays changes
  useEffect(() => {
    console.log('🔍 workoutDays state changed:', workoutDays);
    console.log('🔍 Total exercises:', getTotalExercises());
  }, [workoutDays]);

  // Load exercises on component mount
  useEffect(() => {
    const loadExercises = async () => {
      try {
        setLoadingExercises(true);
        const response = await api.get('/health/exercises/all');
        setAllExercises(response.exercises || []);
        console.log('🔍 Loaded exercises:', response.exercises?.length || 0);
      } catch (error) {
        console.error('Failed to load exercises:', error);
        toast.error('Failed to load exercises');
      } finally {
        setLoadingExercises(false);
      }
    };

    if (isOpen) {
      loadExercises();
    }
  }, [isOpen]);

  const addExerciseToDay = (dayName: string) => {
    console.log('🔍 Adding exercise to day:', dayName);
    console.log('🔍 Current workoutDays:', workoutDays);
    
    setWorkoutDays(prev => {
      // Check if the day already exists
      const existingDay = prev.find(day => day.day_name === dayName);
      console.log('🔍 Existing day found:', existingDay);
      
      if (existingDay) {
        // Day exists, add exercise to it
        const updatedDays = prev.map(day => 
          day.day_name === dayName 
            ? {
                ...day,
                exercises: [
                  ...day.exercises,
                  {
                    exercise_name: '',
                    logging_category: 'weighted', // Default to weighted for new exercises
                    sets: 1,
                    reps: '',
                    weight_notes: '',
                    rest_time: '2-3 min',
                    notes: ''
                  }
                ]
              }
            : day
        );
        console.log('🔍 Updated days after adding exercise:', updatedDays);
        return updatedDays;
      } else {
        // Day doesn't exist, create it with the new exercise
        const newDay: WorkoutDay = {
          day_name: dayName,
          day_order: DAYS_OF_WEEK.indexOf(dayName),
          workout_name: `${dayName} Workout`,
          description: '',
          exercises: [{
            exercise_name: '',
            logging_category: 'weighted', // Default to weighted for new exercises
            sets: 1,
            reps: '',
            weight_notes: '',
            rest_time: '2-3 min',
            notes: ''
          }]
        };
        console.log('🔍 Creating new day:', newDay);
        const updatedDays = [...prev, newDay];
        console.log('🔍 Updated days after creating new day:', updatedDays);
        return updatedDays;
      }
    });
  };

  const updateExercise = (dayName: string, exerciseIndex: number, field: keyof Exercise, value: string | number) => {
    setWorkoutDays(prev => prev.map(day => 
      day.day_name === dayName 
        ? {
            ...day,
            exercises: day.exercises.map((exercise, index) => 
              index === exerciseIndex 
                ? { ...exercise, [field]: value }
                : exercise
            )
          }
        : day
    ));
  };

  const removeExercise = (dayName: string, exerciseIndex: number) => {
    setWorkoutDays(prev => prev.map(day => 
      day.day_name === dayName 
        ? {
            ...day,
            exercises: day.exercises.filter((_, index) => index !== exerciseIndex)
          }
        : day
    ).filter(day => day.exercises.length > 0)); // Remove days with no exercises
  };

  const getTotalExercises = () => {
    return workoutDays.reduce((total, day) => total + day.exercises.length, 0);
  };

  const handleSave = async () => {
    if (mode === 'create' && !routine) {
      // Create mode - create new routine
      if (!routineName.trim()) {
        toast.error('Please enter a routine name');
        return;
      }

      const totalExercises = getTotalExercises();
      if (totalExercises === 0) {
        toast.error('Please add at least one exercise');
        return;
      }

      setLoading(true);
      try {
        // Prepare routine data for creation
        const routineData = {
          name: routineName.trim(),
          description: routineDescription.trim() || `Custom routine with ${totalExercises} exercises across ${workoutDays.filter(d => d.exercises.length > 0).length} days`,
          difficulty: 'intermediate', // Default difficulty for new routines
          duration_weeks: 4 // Default duration for new routines
        };

        // Prepare workout days data
        const workoutDaysData = workoutDays
          .filter(day => day.exercises.length > 0)
          .map((day, index) => ({
            day: day.day_name,
            day_order: day.day_order || index,
            workout_name: day.workout_name,
            description: day.description || `${day.exercises.length} exercises`,
            workouts: day.exercises.map(exercise => ({
              activity_name: exercise.exercise_name,
              sets: exercise.sets,
              reps: exercise.reps.toString()
            }))
          }));

        // Create the routine
        await simpleRoutineApi.createRoutineWithWorkoutPlan({
          routine_data: routineData,
          workout_days: workoutDaysData
        });

        toast.success('Routine created successfully!');
        onRoutineUpdated();
        onClose();
      } catch (error) {
        console.error('Failed to create routine:', error);
        toast.error('Failed to create routine. Please try again.');
      } finally {
        setLoading(false);
      }
    } else if (mode === 'edit' && routine) {
      // Edit mode - update existing routine
      if (!routineName.trim()) {
        toast.error('Please enter a routine name');
        return;
      }

      const totalExercises = getTotalExercises();
      if (totalExercises === 0) {
        toast.error('Please add at least one exercise');
        return;
      }

      setLoading(true);
      try {
        // Prepare routine data
        const routineData = {
          name: routineName.trim(),
          description: routineDescription.trim() || `Custom routine with ${totalExercises} exercises across ${workoutDays.filter(d => d.exercises.length > 0).length} days`,
          difficulty: routine.difficulty,
          duration_weeks: routine.duration_weeks
        };

        // Prepare workout days data
        const workoutDaysData = workoutDays
          .filter(day => day.exercises.length > 0)
          .map((day, index) => ({
            day: day.day_name,
            day_order: day.day_order || index,
            workout_name: day.workout_name,
            description: day.description || `${day.exercises.length} exercises`,
            workouts: day.exercises.map(exercise => ({
              activity_name: exercise.exercise_name,
              sets: exercise.sets,
              reps: exercise.reps.toString()
            }))
          }));

        // Update the routine
        await simpleRoutineApi.updateRoutineWithWorkoutPlan(routine.id, {
          routine_data: routineData,
          workout_days: workoutDaysData
        });

        toast.success('Routine updated successfully!');
        onRoutineUpdated();
        onClose();
      } catch (error) {
        console.error('Failed to update routine:', error);
        toast.error('Failed to update routine. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (mode === 'edit' && !routine) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] overflow-visible p-0 bg-white dark:bg-gray-900 border-0 shadow-2xl flex flex-col [&>button]:absolute [&>button]:top-4 [&>button]:right-4 [&>button]:z-30">
        <div className="flex flex-col h-full min-h-0">
                {/* Clean Header - Fixed at top with proper z-index */}
                <DialogHeader className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-white dark:bg-gray-900 z-10 relative">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                        {mode === 'create' ? 'Create Custom Routine' : `Edit Routine: ${routine?.name}`}
                      </DialogTitle>
                      <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        {mode === 'create' 
                          ? 'Build a personalized workout routine by selecting exercises and planning workouts for each day of the week.'
                          : 'Modify your workout routine by updating the name, description, and daily exercise plans.'
                        }
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
          
          {/* Scrollable content area - Allow dropdown to escape */}
          <div className="flex-1 overflow-y-auto overflow-x-visible min-h-0 relative z-10">
            <div className="p-4">
              <div className="space-y-4">
                {/* Routine Details */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    <Label htmlFor="routineName" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Routine Name</Label>
                    <Input
                      id="routineName"
                      value={routineName}
                      onChange={(e) => setRoutineName(e.target.value)}
                      placeholder="e.g., My Custom Workout"
                      className="border border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                    />
                  </div>
                </div>

                {/* Daily Workout Plan */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Weekly Workout Plan</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Plan your exercises for each day of the week</p>
                    </div>
                    <div className="bg-indigo-100 dark:bg-indigo-900 px-3 py-1.5 rounded-full">
                      <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                        {getTotalExercises()} total workouts
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {DAYS_OF_WEEK.map(day => {
                      const dayData = workoutDays.find(d => d.day_name === day);
                      const exercises = dayData?.exercises || [];
                      console.log(`🔍 Rendering ${day}:`, { dayData, exercises: exercises.length });
                      
                      return (
                        <div key={day} className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm rounded-lg relative z-0">
                          <div className="p-4 pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold text-xs">{day.charAt(0)}</span>
                                </div>
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{day}</h3>
                              </div>
                              <Button 
                                onClick={() => addExerciseToDay(day)} 
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 h-auto"
                              >
                                <PlusIcon className="h-3 w-3 mr-1" />
                                Add Workout
                              </Button>
                            </div>
                          </div>
                          <div className="px-4 pb-4">
                            {exercises.length === 0 ? (
                              <div className="text-center py-2 text-gray-500 text-sm">
                                <p>No workouts planned for {day}</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {exercises.map((exercise, index) => {
                                  console.log(`🔍 Rendering exercise ${index} for ${day}:`, exercise);
                                  console.log(`🔍 Current exercise name: "${exercise.exercise_name}"`);
                                  console.log(`🔍 Available exercises:`, allExercises.slice(0, 5).map(ex => ex.name));
                                  console.log(`🔍 Exercise name matches available:`, allExercises.some(ex => ex.name === exercise.exercise_name));
                                  return (
                                    <div key={index} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 space-y-3 shadow-sm">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                                          <span className="text-white font-bold text-xs">{index + 1}</span>
                                        </div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white">Workout {index + 1}</h4>
                                      </div>
                                      <Button
                                        onClick={() => removeExercise(day, index)}
                                        variant="outline"
                                        size="sm"
                                        className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    
                                    {/* Exercise Details */}
                                    <div className="space-y-4">
                                      {/* Exercise Name - Full Width */}
                                      <div>
                                        <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Exercise Name</Label>
                                        <SearchableDropdown
                                          options={allExercises.map(ex => ({
                                            value: ex.name,
                                            label: ex.name
                                          }))}
                                          value={exercise.exercise_name}
                                          onChange={(option) => {
                                            console.log('🔍 Exercise selected:', option);
                                            if (option) {
                                              // Find the selected exercise to get its logging category
                                              const selectedExercise = allExercises.find(ex => ex.name === option.value);
                                              if (selectedExercise) {
                                                updateExercise(day, index, 'exercise_name', option.value);
                                                updateExercise(day, index, 'logging_category', selectedExercise.logging_category);
                                              }
                                            } else {
                                              updateExercise(day, index, 'exercise_name', '');
                                              updateExercise(day, index, 'logging_category', 'weighted');
                                            }
                                          }}
                                          placeholder={exercise.exercise_name || "Search and select exercise..."}
                                          className="w-full border border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                                        />
                                      </div>
                                      
                                      {/* Dynamic Fields Based on Exercise Category */}
                                      {(() => {
                                        const category = exercise.logging_category || 'weighted';
                                        const formFields = getFormFieldsForCategory(category);
                                        
                                        return (
                                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {formFields.map((field) => {
                                              const fieldName = field.name as keyof Exercise;
                                              const fieldValue = exercise[fieldName];
                                              
                                              return (
                                                <div key={field.name} className={field.name === 'notes' ? 'sm:col-span-2 lg:col-span-3' : ''}>
                                                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                                                    {getFieldDisplayName(field.name)}
                                                    {field.name === 'sets' || field.name === 'reps' || field.name === 'weight' || field.name === 'duration' || field.name === 'total_reps' || field.name === 'time' || field.name === 'heart_rate' ? ' *' : ''}
                                                  </Label>
                                                  
                                                  {field.type === 'select' ? (
                                                    <Select
                                                      value={fieldValue as string || ''}
                                                      onValueChange={(value) => updateExercise(day, index, fieldName, value)}
                                                    >
                                                      <SelectTrigger className="w-full border border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg">
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
                                                      onChange={(e) => updateExercise(day, index, fieldName, field.name === 'sets' || field.name === 'weight' || field.name === 'duration' || field.name === 'total_reps' || field.name === 'time' || field.name === 'heart_rate' ? parseInt(e.target.value) || 0 : e.target.value)}
                                                      placeholder={field.label}
                                                      className="w-full border border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                                                    />
                                                  ) : (
                                                    <Input
                                                      value={fieldValue as string || ''}
                                                      onChange={(e) => updateExercise(day, index, fieldName, e.target.value)}
                                                      placeholder={field.label}
                                                      maxLength={field.max_length || undefined}
                                                      className="w-full border border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                                                    />
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions - Aligned with other containers */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button onClick={onClose} variant="outline" disabled={loading} className="px-6 py-2">
                    Cancel
                  </Button>
                         <Button 
                           onClick={handleSave} 
                           disabled={loading || !routineName.trim() || getTotalExercises() === 0}
                           className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2"
                         >
                           {loading 
                             ? (mode === 'create' ? 'Creating...' : 'Updating...') 
                             : (mode === 'create' ? 'Create Routine' : 'Update Routine')
                           }
                         </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
