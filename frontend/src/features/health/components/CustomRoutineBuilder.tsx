'use client';

import { useState, useEffect } from 'react';
// Removed Card imports - using simple divs to avoid stacking context issues
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { simpleRoutineApi } from '@/lib/simpleRoutineApi';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import { WORKOUT_CATEGORIES } from '@/components/health/WorkoutCategorySelector';
import { WorkoutInputComponents } from '@/components/health/WorkoutInputComponents';

interface Exercise {
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

interface Workout {
  id: string;
  activity_type: string;
  selectedExercise?: Exercise; // Selected exercise from database
  sets: number;
  reps: number;
  // Flexible attributes based on exercise type
  weight?: number;
  weight_unit?: 'lbs' | 'kg';
  equipment_type?: 'dumbbell' | 'barbell' | 'machine' | 'bodyweight';
  duration?: number; // for cardio
  distance?: number; // for running
  notes?: string;
  // Additional category-specific fields
  total_reps?: number; // for bodyweight exercises
  difficulty?: string; // for cardio_duration exercises
  intensity?: string; // for cardio_duration
  heart_rate?: number; // for cardio_duration
  time?: number; // for distance_based
  pace?: string; // for distance_based
}

interface DayWorkouts {
  day: string;
  workouts: Workout[];
}

interface CustomRoutineBuilderProps {
  onRoutineCreated?: (routine: any) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function CustomRoutineBuilder({ onRoutineCreated }: CustomRoutineBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [dayWorkouts, setDayWorkouts] = useState<DayWorkouts[]>([]);
  const [loading, setLoading] = useState(false);
  // Exercise selection state
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [workoutCategoryData, setWorkoutCategoryData] = useState<Record<string, any>>({});
  const [exerciseSearchValues, setExerciseSearchValues] = useState<Record<string, string>>({});

  // Load exercises on component mount
  useEffect(() => {
    const loadExercises = async () => {
      try {
        setLoadingExercises(true);
        const response = await api.get('/health/exercises/all');
        setAllExercises(response.exercises || []);
      } catch (error) {
        console.error('Failed to load exercises:', error);
        toast.error('Failed to load exercises');
      } finally {
        setLoadingExercises(false);
      }
    };

    loadExercises();
  }, []);

  // Debug workout state changes
  useEffect(() => {
    console.log('🔄 DayWorkouts state changed:', dayWorkouts);
  }, [dayWorkouts]);


  // Handle exercise search input change
  const handleExerciseSearchChange = (day: string, workoutId: string, value: string) => {
    setExerciseSearchValues(prev => ({
      ...prev,
      [`${day}-${workoutId}`]: value
    }));
  };

  // Handle exercise selection for a specific workout
  const handleWorkoutExerciseSelect = (day: string, workoutId: string, exercise: Exercise) => {
    console.log('🎯 Exercise selected:', { day, workoutId, exercise });
    
    updateWorkout(day, workoutId, 'selectedExercise', exercise);
    updateWorkout(day, workoutId, 'activity_type', exercise.logging_category);
    
    // Update search value to show selected exercise name
    setExerciseSearchValues(prev => ({
      ...prev,
      [`${day}-${workoutId}`]: exercise.name
    }));
    
    // Find the corresponding workout category for the exercise's logging category
    const category = WORKOUT_CATEGORIES.find(cat => cat.id === exercise.logging_category);
    console.log('📋 Found category:', category);
    
    if (category) {
      // Initialize category-specific data
      const categoryData: Record<string, any> = {};
      category.loggingAttributes.required.forEach(attr => {
        categoryData[attr.name] = '';
      });
      category.loggingAttributes.optional.forEach(attr => {
        categoryData[attr.name] = '';
      });
      
      console.log('📝 Category data initialized:', categoryData);
      
      // Store category data for this specific workout
      setWorkoutCategoryData(prev => ({
        ...prev,
        [`${day}-${workoutId}`]: categoryData
      }));
    } else {
      console.error('❌ Category not found for logging_category:', exercise.logging_category);
      console.log('Available categories:', WORKOUT_CATEGORIES.map(cat => cat.id));
    }
  };

  // Handle category data changes for a specific workout
  const handleWorkoutCategoryDataChange = (day: string, workoutId: string, field: string, value: any) => {
    setWorkoutCategoryData(prev => ({
      ...prev,
      [`${day}-${workoutId}`]: {
        ...prev[`${day}-${workoutId}`],
        [field]: value
      }
    }));
  };

  // Remove exercise selection handler - no longer needed for manual input

  const addWorkoutToDay = (day: string) => {
    const workoutId = Date.now().toString();
    const newWorkout: Workout = {
      id: workoutId,
      activity_type: '',
      sets: 3,
      reps: 10
    };

    // Initialize empty search value for the new workout
    setExerciseSearchValues(prev => ({
      ...prev,
      [`${day}-${workoutId}`]: ''
    }));

    setDayWorkouts(prev => {
      const existingDay = prev.find(d => d.day === day);
      if (existingDay) {
        return prev.map(d => 
          d.day === day 
            ? { ...d, workouts: [...d.workouts, newWorkout] }
            : d
        );
      } else {
        return [...prev, { day, workouts: [newWorkout] }];
      }
    });
  };

  const updateWorkout = (day: string, workoutId: string, field: keyof Workout, value: any) => {
    setDayWorkouts(prev => {
      return prev.map(dayWorkout => {
        if (dayWorkout.day === day) {
          const updatedWorkouts = dayWorkout.workouts.map(workout => {
            if (workout.id === workoutId) {
              return { ...workout, [field]: value };
            }
            return workout;
          });
          return { ...dayWorkout, workouts: updatedWorkouts };
        }
        return dayWorkout;
      });
    });
  };

  const removeWorkout = (day: string, workoutId: string) => {
    setDayWorkouts(prev => {
      return prev.map(dayWorkout => {
        if (dayWorkout.day === day) {
          const updatedWorkouts = dayWorkout.workouts.filter(workout => workout.id !== workoutId);
          return { ...dayWorkout, workouts: updatedWorkouts };
        }
        return dayWorkout;
      }).filter(dayWorkout => dayWorkout.workouts.length > 0);
    });
  };

  const saveRoutine = async () => {
    if (!routineName.trim()) {
      toast.error('Please enter a routine name');
      return;
    }

    const totalWorkouts = dayWorkouts.reduce((sum, day) => sum + day.workouts.length, 0);
    if (totalWorkouts === 0) {
      toast.error('Please add at least one workout');
      return;
    }

    try {
      setLoading(true);
      
      // Flatten workouts for API compatibility
      const allWorkouts = dayWorkouts.flatMap(dayWorkout => 
        dayWorkout.workouts.map(workout => ({
          ...workout,
          day: dayWorkout.day,
          activity_name: workout.selectedExercise?.name || 'Unknown Exercise'
        }))
      );

      const routineData = {
        name: routineName,
        workouts: allWorkouts,
        is_custom: true
      };

      // Save routine to backend database with detailed workout plan
      const routineToSave = {
        name: routineName,
        description: `Custom routine with ${totalWorkouts} workouts across ${dayWorkouts.length} days`,
        difficulty: 'intermediate', // Default difficulty
        duration_weeks: 4, // Default duration
        tags: ['Custom'] // Use custom tag for user-created routines
      };
      
      logger.debug('Saving routine with workout plan to database:', routineToSave);
      logger.debug('Workout days data:', dayWorkouts);
      logger.debug('API request payload:', {
        routine_data: routineToSave,
        workout_days: dayWorkouts
      });
      
      // Use the new API endpoint for detailed workout plans
      const savedRoutine = await simpleRoutineApi.createRoutineWithWorkoutPlan(routineToSave, dayWorkouts);
      logger.info('Routine with workout plan saved successfully:', savedRoutine);
      logger.debug('Database routine ID:', savedRoutine.id);
      
      toast.success(`Routine "${routineName}" saved successfully! ${totalWorkouts} workouts planned.`);
      onRoutineCreated?.(savedRoutine);
      
      // Reset form
      setRoutineName('');
      setDayWorkouts([]);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to save routine:', error);
      toast.error('Failed to save routine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Custom Routine
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] overflow-hidden p-0 bg-white dark:bg-gray-900 border-0 shadow-2xl flex flex-col [&>button]:absolute [&>button]:top-4 [&>button]:right-4 [&>button]:z-30">
        <div className="flex flex-col h-full min-h-0">
          {/* Clean Header - Fixed at top with proper z-index */}
          <DialogHeader className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-white dark:bg-gray-900 z-10 relative">
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Create Custom Routine</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Build a personalized workout routine by selecting exercises and planning workouts for each day of the week.
              </DialogDescription>
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
                      {dayWorkouts.reduce((sum, day) => sum + day.workouts.length, 0)} total workouts
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {DAYS.map(day => {
                    const dayData = dayWorkouts.find(d => d.day === day);
                    const workouts = dayData?.workouts || [];
                    
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
                              onClick={() => addWorkoutToDay(day)} 
                              size="sm"
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 h-auto"
                            >
                              <PlusIcon className="h-3 w-3 mr-1" />
                              Add Workout
                            </Button>
                          </div>
                        </div>
                        <div className="px-4 pb-4">
                          {workouts.length === 0 ? (
                            <div className="text-center py-2 text-gray-500 text-sm">
                              <p>No workouts planned for {day}</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {workouts.map((workout, index) => (
                                <div key={workout.id} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 space-y-3 shadow-sm">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-xs">{index + 1}</span>
                                      </div>
                                      <h4 className="font-semibold text-gray-900 dark:text-white">Workout {index + 1}</h4>
                                    </div>
                                    <Button
                                      onClick={() => removeWorkout(day, workout.id)}
                                      variant="outline"
                                      size="sm"
                                      className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  
                                  {/* Exercise Selection */}
                                  <div>
                                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Select Exercise</Label>
                                    <SearchableDropdown
                                      options={allExercises.map(exercise => ({
                                        value: exercise.id.toString(),
                                        label: exercise.name,
                                        description: exercise.logging_category_info.display_name
                                      }))}
                                      value={workout.selectedExercise?.id?.toString() || ''}
                                      onChange={(option) => {
                                        if (option) {
                                          const exercise = allExercises.find(ex => ex.id.toString() === option.value);
                                          if (exercise) {
                                            console.log('🎯 Exercise selected:', exercise);
                                            handleWorkoutExerciseSelect(day, workout.id, exercise);
                                          }
                                        }
                                      }}
                                      placeholder={loadingExercises ? "Loading exercises..." : "Type to search 654 exercises..."}
                                      disabled={loadingExercises}
                                    />
                                  </div>

                                  {/* Dynamic Workout Fields - Show when exercise is selected */}
                                  {(() => {
                                    console.log('🎨 Form render check - workout.selectedExercise:', workout.selectedExercise);
                                    console.log('🎨 Form render check - workout:', workout);
                                    
                                    if (!workout.selectedExercise) {
                                      console.log('❌ No selected exercise, not rendering form');
                                      return null;
                                    }
                                    
                                    console.log('🎨 Rendering form for exercise:', workout.selectedExercise);
                                    const category = WORKOUT_CATEGORIES.find(cat => cat.id === workout.selectedExercise?.logging_category);
                                    const categoryData = workoutCategoryData[`${day}-${workout.id}`] || {};
                                    
                                    console.log('📋 Category found:', category);
                                    console.log('📝 Category data:', categoryData);
                                    
                                    if (!category) {
                                      console.error('❌ Category not found for exercise:', workout.selectedExercise);
                                      return (
                                        <div className="p-4 bg-red-100 dark:bg-red-900 rounded-lg border border-red-200 dark:border-red-700">
                                          <p className="text-red-600 dark:text-red-400">
                                            Category not found for: {workout.selectedExercise.logging_category}
                                          </p>
                                          <p className="text-sm text-red-500 dark:text-red-300 mt-2">
                                            Available categories: {WORKOUT_CATEGORIES.map(cat => cat.id).join(', ')}
                                          </p>
                                        </div>
                                      );
                                    }
                                    
                                    return (
                                      <div className="space-y-4">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                            {workout.selectedExercise.name} - {category.displayName} Details
                                          </h5>
                                          <WorkoutInputComponents
                                            category={category}
                                            values={categoryData}
                                            onChange={(field, value) => handleWorkoutCategoryDataChange(day, workout.id, field, value)}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions - Aligned with other containers */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex gap-4">
                <Button
                  onClick={saveRoutine}
                  disabled={loading || !routineName.trim() || dayWorkouts.reduce((sum, day) => sum + day.workouts.length, 0) === 0}
                  variant="outline"
                  className="flex-1 border-2 border-white dark:border-white hover:bg-white hover:text-gray-900 text-white dark:text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : (
                    'Save Routine'
                  )}
                </Button>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  className="flex-1 border-2 border-white dark:border-white hover:bg-white hover:text-gray-900 text-white dark:text-white font-bold rounded-lg shadow-lg"
                >
                  Cancel
                </Button>
              </div>
            </div>
            </div>
            </div>
          </div>
          
          {/* Removed complex dropdown portal - using simple manual input */}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { CustomRoutineBuilder };
