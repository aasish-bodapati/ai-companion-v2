'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { simpleRoutineApi } from '@/lib/simpleRoutineApi';

interface Workout {
  id: string;
  activity_type: string;
  activity_name: string;
  sets: number;
  reps: number;
}

interface DayWorkouts {
  day: string;
  workouts: Workout[];
}

interface CustomRoutineBuilderProps {
  onRoutineCreated?: (routine: any) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const ACTIVITY_TYPES = [
  'weightlifting', 'cardio', 'running', 'walking', 'cycling', 'swimming', 
  'yoga', 'pilates', 'hiit', 'dancing', 'sports', 'other'
];

function CustomRoutineBuilder({ onRoutineCreated }: CustomRoutineBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [dayWorkouts, setDayWorkouts] = useState<DayWorkouts[]>([]);
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleActivityType = (activityType: string) => {
    setSelectedActivityTypes(prev => {
      if (prev.includes(activityType)) {
        return prev.filter(type => type !== activityType);
      } else {
        return [...prev, activityType];
      }
    });
  };

  const addWorkoutToDay = (day: string) => {
    const defaultActivityType = selectedActivityTypes.length > 0 ? selectedActivityTypes[0] : 'weightlifting';
    const newWorkout: Workout = {
      id: Date.now().toString(),
      activity_type: defaultActivityType,
      activity_name: '',
      sets: 3,
      reps: 10
    };

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
          day: dayWorkout.day
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
        tags: selectedActivityTypes // Use selected activity types as tags
      };
      
      console.log('💾 Saving routine with workout plan to database:', routineToSave);
      console.log('📋 Workout days data:', dayWorkouts);
      console.log('📤 API request payload:', {
        routine_data: routineToSave,
        workout_days: dayWorkouts
      });
      
      // Use the new API endpoint for detailed workout plans
      const savedRoutine = await simpleRoutineApi.createRoutineWithWorkoutPlan(routineToSave, dayWorkouts);
      console.log('✅ Routine with workout plan saved successfully:', savedRoutine);
      console.log('🆔 Database routine ID:', savedRoutine.id);
      
      toast.success(`Routine "${routineName}" saved successfully! ${totalWorkouts} workouts planned.`);
      onRoutineCreated?.(savedRoutine);
      
      // Reset form
      setRoutineName('');
      setDayWorkouts([]);
      setSelectedActivityTypes([]);
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
        <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Custom Routine
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Routine</DialogTitle>
          <DialogDescription>
            Build a personalized workout routine by selecting activity types and planning workouts for each day of the week.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Routine Details */}
          <div>
            <Label htmlFor="routineName">Routine Name</Label>
            <Input
              id="routineName"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              placeholder="e.g., My Custom Workout"
            />
          </div>

          {/* Daily Workout Plan */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Weekly Workout Plan</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {dayWorkouts.reduce((sum, day) => sum + day.workouts.length, 0)} total workouts
              </div>
            </div>

            {/* Activity Type Selection */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Select Activity Types for This Routine</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {ACTIVITY_TYPES.map(activityType => (
                  <label key={activityType} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedActivityTypes.includes(activityType)}
                      onChange={() => toggleActivityType(activityType)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {activityType}
                    </span>
                  </label>
                ))}
              </div>
              {selectedActivityTypes.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Select at least one activity type to add workouts
                </p>
              )}
            </div>

            <div className="space-y-6 max-h-96 overflow-y-auto">
              {DAYS.map(day => {
                const dayData = dayWorkouts.find(d => d.day === day);
                const workouts = dayData?.workouts || [];
                
                return (
                  <Card key={day} className="border-solid border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{day}</CardTitle>
                        <Button 
                          onClick={() => addWorkoutToDay(day)} 
                          size="sm"
                          variant="outline"
                          disabled={selectedActivityTypes.length === 0}
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Add Workout
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {workouts.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          <p>
                            {selectedActivityTypes.length === 0 
                              ? `Select activity types above to add workouts for ${day}`
                              : `No workouts planned for ${day}`
                            }
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {workouts.map((workout, index) => (
                            <div key={workout.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">Workout {index + 1}</h4>
                                <Button
                                  onClick={() => removeWorkout(day, workout.id)}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Activity Type</Label>
                                  <Select
                                    value={workout.activity_type}
                                    onValueChange={(value) => updateWorkout(day, workout.id, 'activity_type', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {selectedActivityTypes.map(type => (
                                        <SelectItem key={type} value={type}>
                                          {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Activity Name</Label>
                                  <Input
                                    value={workout.activity_name}
                                    onChange={(e) => updateWorkout(day, workout.id, 'activity_name', e.target.value)}
                                    placeholder="e.g., Upper Body Strength"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Sets</Label>
                                  <Input
                                    type="number"
                                    value={workout.sets}
                                    onChange={(e) => updateWorkout(day, workout.id, 'sets', Number(e.target.value))}
                                    min="1"
                                    max="20"
                                    placeholder="3"
                                  />
                                </div>
                                <div>
                                  <Label>Reps</Label>
                                  <Input
                                    type="number"
                                    value={workout.reps}
                                    onChange={(e) => updateWorkout(day, workout.id, 'reps', Number(e.target.value))}
                                    min="1"
                                    max="100"
                                    placeholder="10"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4 border-t">
            {/* Status Messages */}
            {(!routineName.trim() || selectedActivityTypes.length === 0 || dayWorkouts.reduce((sum, day) => sum + day.workouts.length, 0) === 0) && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>To save your routine, you need:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {!routineName.trim() && <li>Enter a routine name</li>}
                  {selectedActivityTypes.length === 0 && <li>Select at least one activity type</li>}
                  {dayWorkouts.reduce((sum, day) => sum + day.workouts.length, 0) === 0 && <li>Add at least one workout</li>}
                </ul>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button
                onClick={saveRoutine}
                disabled={loading || !routineName.trim() || selectedActivityTypes.length === 0 || dayWorkouts.reduce((sum, day) => sum + day.workouts.length, 0) === 0}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {loading ? 'Saving...' : 'Save Routine'}
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { CustomRoutineBuilder };
