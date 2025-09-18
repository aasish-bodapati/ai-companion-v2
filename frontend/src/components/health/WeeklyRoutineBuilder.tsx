'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  PlusIcon,
  TrashIcon,
  CheckIcon,
  ClockIcon,
  FireIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface Exercise {
  id: string;
  name: string;
  weight?: number;
  reps?: number;
  sets?: number;
  duration?: number;
}

interface Meal {
  id: string;
  name: string;
  meal_type: string;
  calories?: number;
}

interface DayRoutine {
  day: string;
  workouts: Exercise[];
  meals: Meal[];
}

interface WeeklyRoutineBuilderProps {
  onSave: (routine: any) => void;
  onCancel: () => void;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

const SAMPLE_EXERCISES = [
  'Push-ups', 'Squats', 'Plank', 'Burpees', 'Lunges', 'Mountain Climbers',
  'Jumping Jacks', 'Crunches', 'Deadlifts', 'Bench Press', 'Pull-ups', 'Dips'
];

const SAMPLE_MEALS = [
  'Oatmeal with berries', 'Grilled chicken salad', 'Salmon with vegetables',
  'Greek yogurt', 'Protein smoothie', 'Quinoa bowl', 'Turkey sandwich',
  'Eggs and toast', 'Rice and beans', 'Pasta with vegetables'
];

export function WeeklyRoutineBuilder({ onSave, onCancel }: WeeklyRoutineBuilderProps) {
  const [routineName, setRoutineName] = useState('');
  const [currentDay, setCurrentDay] = useState('monday');
  const [weeklyRoutine, setWeeklyRoutine] = useState<DayRoutine[]>(
    DAYS.map(day => ({ day, workouts: [], meals: [] }))
  );

  const addWorkout = (day: string) => {
    const newExercise: Exercise = {
      id: `exercise-${Date.now()}`,
      name: '',
      weight: 0,
      reps: 10,
      sets: 3,
      duration: 30
    };

    setWeeklyRoutine(prev => 
      prev.map(dayRoutine => 
        dayRoutine.day === day 
          ? { ...dayRoutine, workouts: [...dayRoutine.workouts, newExercise] }
          : dayRoutine
      )
    );
  };

  const addMeal = (day: string) => {
    const newMeal: Meal = {
      id: `meal-${Date.now()}`,
      name: '',
      meal_type: 'breakfast',
      calories: 300
    };

    setWeeklyRoutine(prev => 
      prev.map(dayRoutine => 
        dayRoutine.day === day 
          ? { ...dayRoutine, meals: [...dayRoutine.meals, newMeal] }
          : dayRoutine
      )
    );
  };

  const updateWorkout = (day: string, exerciseId: string, field: string, value: any) => {
    setWeeklyRoutine(prev => 
      prev.map(dayRoutine => 
        dayRoutine.day === day 
          ? {
              ...dayRoutine,
              workouts: dayRoutine.workouts.map(exercise =>
                exercise.id === exerciseId 
                  ? { ...exercise, [field]: value }
                  : exercise
              )
            }
          : dayRoutine
      )
    );
  };

  const updateMeal = (day: string, mealId: string, field: string, value: any) => {
    setWeeklyRoutine(prev => 
      prev.map(dayRoutine => 
        dayRoutine.day === day 
          ? {
              ...dayRoutine,
              meals: dayRoutine.meals.map(meal =>
                meal.id === mealId 
                  ? { ...meal, [field]: value }
                  : meal
              )
            }
          : dayRoutine
      )
    );
  };

  const removeWorkout = (day: string, exerciseId: string) => {
    setWeeklyRoutine(prev => 
      prev.map(dayRoutine => 
        dayRoutine.day === day 
          ? {
              ...dayRoutine,
              workouts: dayRoutine.workouts.filter(exercise => exercise.id !== exerciseId)
            }
          : dayRoutine
      )
    );
  };

  const removeMeal = (day: string, mealId: string) => {
    setWeeklyRoutine(prev => 
      prev.map(dayRoutine => 
        dayRoutine.day === day 
          ? {
              ...dayRoutine,
              meals: dayRoutine.meals.filter(meal => meal.id !== mealId)
            }
          : dayRoutine
      )
    );
  };

  const handleSave = () => {
    if (!routineName.trim()) {
      toast.error('Please enter a routine name');
      return;
    }

    const hasContent = weeklyRoutine.some(day => 
      day.workouts.length > 0 || day.meals.length > 0
    );

    if (!hasContent) {
      toast.error('Please add at least one workout or meal to your routine');
      return;
    }

    onSave({
      name: routineName,
      weeklyRoutine,
      type: 'weekly'
    });
  };

  const currentDayRoutine = weeklyRoutine.find(day => day.day === currentDay) || { day: currentDay, workouts: [], meals: [] };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClockIcon className="h-6 w-6 text-indigo-600" />
            Create Your Weekly Routine
          </CardTitle>
          <p className="text-sm text-gray-600">
            Set up your Monday-Saturday routine for quick daily logging
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="routineName">Routine Name</Label>
              <Input
                id="routineName"
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                placeholder="e.g., My Weekly Fitness & Nutrition Plan"
                className="mt-1"
              />
            </div>

            {/* Day Selector */}
            <div>
              <Label>Select Day to Edit</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DAYS.map(day => (
                  <Button
                    key={day}
                    variant={currentDay === day ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentDay(day)}
                    className="capitalize"
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Day Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="capitalize flex items-center gap-2">
            {currentDay === 'sunday' ? 'Sunday (Manual Logging)' : `${currentDay} Routine`}
          </CardTitle>
          <p className="text-sm text-gray-600">
            {currentDay === 'sunday' 
              ? 'Sunday is for manual logging or rest day'
              : 'Add your workouts and meals for this day'
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Workouts Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <FireIcon className="h-5 w-5 text-orange-500" />
                Workouts
              </h3>
              {currentDay !== 'sunday' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addWorkout(currentDay)}
                  className="flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Workout
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {currentDayRoutine.workouts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FireIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No workouts scheduled for {currentDay}</p>
                  {currentDay !== 'sunday' && (
                        <p className="text-sm">Click &quot;Add Workout&quot; to get started</p>
                  )}
                </div>
              ) : (
                currentDayRoutine.workouts.map((exercise) => (
                  <div key={exercise.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div className="md:col-span-2">
                        <Label className="text-xs">Exercise Name</Label>
                        <Input
                          value={exercise.name}
                          onChange={(e) => updateWorkout(currentDay, exercise.id, 'name', e.target.value)}
                          placeholder="e.g., Push-ups"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Weight (kg)</Label>
                        <Input
                          type="number"
                          value={exercise.weight || ''}
                          onChange={(e) => updateWorkout(currentDay, exercise.id, 'weight', parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Reps</Label>
                        <Input
                          type="number"
                          value={exercise.reps || ''}
                          onChange={(e) => updateWorkout(currentDay, exercise.id, 'reps', parseInt(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Sets</Label>
                        <Input
                          type="number"
                          value={exercise.sets || ''}
                          onChange={(e) => updateWorkout(currentDay, exercise.id, 'sets', parseInt(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWorkout(currentDay, exercise.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Meals Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <HeartIcon className="h-5 w-5 text-green-500" />
                Meals
              </h3>
              {currentDay !== 'sunday' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addMeal(currentDay)}
                  className="flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Meal
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {currentDayRoutine.meals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <HeartIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No meals scheduled for {currentDay}</p>
                  {currentDay !== 'sunday' && (
                        <p className="text-sm">Click &quot;Add Meal&quot; to get started</p>
                  )}
                </div>
              ) : (
                currentDayRoutine.meals.map((meal) => (
                  <div key={meal.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2">
                        <Label className="text-xs">Meal Name</Label>
                        <Input
                          value={meal.name}
                          onChange={(e) => updateMeal(currentDay, meal.id, 'name', e.target.value)}
                          placeholder="e.g., Grilled chicken salad"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Meal Type</Label>
                        <select
                          value={meal.meal_type}
                          onChange={(e) => updateMeal(currentDay, meal.id, 'meal_type', e.target.value)}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {MEAL_TYPES.map(type => (
                            <option key={type} value={type} className="capitalize">
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Calories</Label>
                        <Input
                          type="number"
                          value={meal.calories || ''}
                          onChange={(e) => updateMeal(currentDay, meal.id, 'calories', parseInt(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMeal(currentDay, meal.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Routine Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Workouts per Week</h4>
              <div className="space-y-1">
                {DAYS.map(day => {
                  const dayRoutine = weeklyRoutine.find(d => d.day === day);
                  const workoutCount = dayRoutine?.workouts.length || 0;
                  return (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="capitalize">{day}</span>
                      <Badge variant={workoutCount > 0 ? "default" : "outline"}>
                        {workoutCount} workout{workoutCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Meals per Week</h4>
              <div className="space-y-1">
                {DAYS.map(day => {
                  const dayRoutine = weeklyRoutine.find(d => d.day === day);
                  const mealCount = dayRoutine?.meals.length || 0;
                  return (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="capitalize">{day}</span>
                      <Badge variant={mealCount > 0 ? "default" : "outline"}>
                        {mealCount} meal{mealCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <CheckIcon className="h-4 w-4" />
          Save Routine
        </Button>
      </div>
    </div>
  );
}
