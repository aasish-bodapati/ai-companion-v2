'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { SimpleRoutineWithProgress } from '@/lib/simpleRoutineApi';
import { simpleRoutineApi } from '@/lib/simpleRoutineApi';
import { logger } from '@/lib/logger';

interface Workout {
  activity_type: string;
  activity_name: string;
  sets: number;
  reps: number;
}

interface DayWorkouts {
  day: string;
  workouts: Workout[];
}

interface EditRoutineDialogProps {
  routine: SimpleRoutineWithProgress | null;
  isOpen: boolean;
  onClose: () => void;
  onRoutineUpdated: () => void;
}

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const ACTIVITY_TYPES = [
  'weightlifting', 'cardio', 'yoga', 'pilates', 'swimming', 'running', 
  'cycling', 'dancing', 'martial_arts', 'sports', 'stretching', 'other'
];

export function EditRoutineDialog({ routine, isOpen, onClose, onRoutineUpdated }: EditRoutineDialogProps) {
  const [routineName, setRoutineName] = useState('');
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>([]);
  const [dayWorkouts, setDayWorkouts] = useState<DayWorkouts[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize form data when routine changes
  useEffect(() => {
    if (routine) {
      logger.debug('🔍 EditRoutineDialog - Routine data received:', routine);
      logger.debug('🔍 EditRoutineDialog - workout_schedule:', routine.workout_schedule);
      
      setRoutineName(routine.name);
      
      // Extract activity types from existing workouts
      const activityTypes = new Set<string>();
      if (routine.workout_schedule && Array.isArray(routine.workout_schedule)) {
        logger.debug('🔍 EditRoutineDialog - Processing workout_schedule with', routine.workout_schedule.length, 'days');
        routine.workout_schedule.forEach((day: any, dayIndex: number) => {
          logger.debug(`🔍 EditRoutineDialog - Processing day ${dayIndex}:`, day);
          if (day.exercises && Array.isArray(day.exercises)) {
            logger.debug(`🔍 EditRoutineDialog - Day ${day.day} has ${day.exercises.length} exercises`);
            day.exercises.forEach((exercise: any, exerciseIndex: number) => {
              logger.debug(`🔍 EditRoutineDialog - Exercise ${exerciseIndex}:`, exercise);
              // Map exercise names to activity types (simplified mapping)
              if (exercise.exercise_name.toLowerCase().includes('press') || 
                  exercise.exercise_name.toLowerCase().includes('squat') ||
                  exercise.exercise_name.toLowerCase().includes('deadlift')) {
                activityTypes.add('weightlifting');
              } else {
                activityTypes.add('weightlifting'); // Default for now
              }
            });
          }
        });
      }
      logger.debug('🔍 EditRoutineDialog - Activity types extracted:', Array.from(activityTypes));
      setSelectedActivityTypes(Array.from(activityTypes));

      // Convert workout_schedule to dayWorkouts format
      const convertedDayWorkouts: DayWorkouts[] = DAYS_OF_WEEK.map(day => {
        const existingDay = routine.workout_schedule?.find((d: any) => d.day === day);
        logger.debug(`🔍 EditRoutineDialog - Looking for ${day}:`, existingDay);
        if (existingDay && existingDay.exercises) {
          logger.debug(`🔍 EditRoutineDialog - Found exercises for ${day}:`, existingDay.exercises);
          return {
            day,
            workouts: existingDay.exercises.map((ex: any) => ({
              activity_type: 'weightlifting', // Default mapping
              activity_name: ex.exercise_name,
              sets: ex.sets,
              reps: parseInt(ex.reps) || 10
            }))
          };
        }
        return { day, workouts: [] };
      });
      logger.debug('🔍 EditRoutineDialog - Converted dayWorkouts:', convertedDayWorkouts);
      setDayWorkouts(convertedDayWorkouts);
    }
  }, [routine]);

  const toggleActivityType = (activityType: string) => {
    setSelectedActivityTypes(prev => 
      prev.includes(activityType) 
        ? prev.filter(type => type !== activityType)
        : [...prev, activityType]
    );
  };

  const addWorkoutToDay = (day: string) => {
    if (selectedActivityTypes.length === 0) return;
    
    setDayWorkouts(prev => prev.map(dayWorkout => 
      dayWorkout.day === day 
        ? {
            ...dayWorkout,
            workouts: [
              ...dayWorkout.workouts,
              {
                activity_type: selectedActivityTypes[0],
                activity_name: 'New Exercise',
                sets: 3,
                reps: 10
              }
            ]
          }
        : dayWorkout
    ));
  };

  const updateWorkout = (day: string, workoutIndex: number, field: keyof Workout, value: string | number) => {
    setDayWorkouts(prev => prev.map(dayWorkout => 
      dayWorkout.day === day 
        ? {
            ...dayWorkout,
            workouts: dayWorkout.workouts.map((workout, index) => 
              index === workoutIndex 
                ? { ...workout, [field]: value }
                : workout
            )
          }
        : dayWorkout
    ));
  };

  const removeWorkout = (day: string, workoutIndex: number) => {
    setDayWorkouts(prev => prev.map(dayWorkout => 
      dayWorkout.day === day 
        ? {
            ...dayWorkout,
            workouts: dayWorkout.workouts.filter((_, index) => index !== workoutIndex)
          }
        : dayWorkout
    ));
  };

  const getTotalWorkouts = () => {
    return dayWorkouts.reduce((total, dayWorkout) => total + dayWorkout.workouts.length, 0);
  };

  const handleSave = async () => {
    if (!routine) return;
    
    if (!routineName.trim()) {
      toast.error('Please enter a routine name');
      return;
    }

    if (selectedActivityTypes.length === 0) {
      toast.error('Please select at least one activity type');
      return;
    }

    const totalWorkouts = getTotalWorkouts();
    if (totalWorkouts === 0) {
      toast.error('Please add at least one workout');
      return;
    }

    setLoading(true);
    try {
      // Prepare routine data
      const routineData = {
        name: routineName.trim(),
        description: `Custom routine with ${totalWorkouts} workouts across ${dayWorkouts.filter(d => d.workouts.length > 0).length} days`,
        difficulty: 'intermediate',
        duration_weeks: 4,
        tags: ['custom', 'weightlifting']
      };

      // Prepare workout days data
      const workoutDays = dayWorkouts
        .filter(dayWorkout => dayWorkout.workouts.length > 0)
        .map((dayWorkout, index) => ({
          day: dayWorkout.day,
          day_order: index,
          workout_name: `${dayWorkout.day} Workout`,
          description: `${dayWorkout.workouts.length} exercises`,
          workouts: dayWorkout.workouts.map(workout => ({
            activity_name: workout.activity_name,
            sets: workout.sets,
            reps: workout.reps.toString()
          }))
        }));

      // Update the routine
      await simpleRoutineApi.updateRoutineWithWorkoutPlan(routine.id, {
        routine_data: routineData,
        workout_days: workoutDays
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
  };

  if (!routine) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Routine: {routine.name}</DialogTitle>
          <DialogDescription>
            Modify your workout routine by updating the name, activity types, and daily workout plans.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Routine Name */}
          <div className="space-y-2">
            <Label htmlFor="routine-name">Routine Name</Label>
            <Input
              id="routine-name"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              placeholder="Enter routine name"
            />
          </div>

          {/* Activity Type Selection */}
          <div className="space-y-3">
            <Label>Activity Types</Label>
            <div className="grid grid-cols-3 gap-2">
              {ACTIVITY_TYPES.map(activityType => (
                <label key={activityType} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedActivityTypes.includes(activityType)}
                    onChange={() => toggleActivityType(activityType)}
                    className="rounded"
                  />
                  <span className="text-sm capitalize">{activityType.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Weekly Workout Plan */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Weekly Workout Plan</h3>
            {DAYS_OF_WEEK.map(day => {
              const dayWorkout = dayWorkouts.find(d => d.day === day);
              return (
                <Card key={day} className="border-solid border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      {day}
                      <Button
                        onClick={() => addWorkoutToDay(day)}
                        disabled={selectedActivityTypes.length === 0}
                        size="sm"
                        variant="outline"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Workout
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dayWorkout?.workouts.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedActivityTypes.length === 0 
                          ? 'Select activity types above to add workouts'
                          : 'No workouts added for this day'
                        }
                      </p>
                    ) : (
                      dayWorkout?.workouts.map((workout, workoutIndex) => (
                        <div key={workoutIndex} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <Label className="text-xs">Activity Type</Label>
                            <Select
                              value={workout.activity_type}
                              onValueChange={(value) => updateWorkout(day, workoutIndex, 'activity_type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedActivityTypes.map(type => (
                                  <SelectItem key={type} value={type}>
                                    {type.replace('_', ' ')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Exercise Name</Label>
                            <Input
                              value={workout.activity_name}
                              onChange={(e) => updateWorkout(day, workoutIndex, 'activity_name', e.target.value)}
                              placeholder="Exercise name"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Sets</Label>
                            <Input
                              type="number"
                              min="1"
                              max="20"
                              value={workout.sets || ''}
                              onChange={(e) => updateWorkout(day, workoutIndex, 'sets', parseInt(e.target.value) || 1)}
                              placeholder="e.g. 3"
                              className="placeholder:text-gray-400 placeholder:italic"
                            />
                          </div>
                          <div className="flex items-end gap-1">
                            <div className="flex-1">
                              <Label className="text-xs">Reps</Label>
                              <Input
                                type="number"
                                min="1"
                                max="100"
                                value={workout.reps || ''}
                                onChange={(e) => updateWorkout(day, workoutIndex, 'reps', parseInt(e.target.value) || 1)}
                                placeholder="e.g. 12"
                                className="placeholder:text-gray-400 placeholder:italic"
                              />
                            </div>
                            <Button
                              onClick={() => removeWorkout(day, workoutIndex)}
                              size="sm"
                              variant="outline"
                              className="px-2 text-red-600 hover:text-red-700"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <div className="font-medium mb-2">Routine Summary:</div>
              <div>• Name: {routineName || 'Untitled'}</div>
              <div>• Activity Types: {selectedActivityTypes.length}</div>
              <div>• Total Workouts: {getTotalWorkouts()}</div>
              <div>• Active Days: {dayWorkouts.filter(d => d.workouts.length > 0).length}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button onClick={onClose} variant="outline" disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || !routineName.trim() || selectedActivityTypes.length === 0 || getTotalWorkouts() === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Updating...' : 'Update Routine'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
