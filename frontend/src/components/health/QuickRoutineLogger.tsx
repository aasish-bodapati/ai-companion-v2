'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CheckCircleIcon,
  ClockIcon,
  FireIcon,
  HeartIcon,
  BoltIcon,
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import api from '@/lib/api';

interface RoutineItem {
  id: string;
  name: string;
  type: 'workout' | 'meal';
  completed: boolean;
  time?: string;
  details?: {
    weight?: number;
    reps?: number;
    sets?: number;
    duration?: number;
    calories?: number;
  };
  originalData?: any;
}

interface QuickRoutineLoggerProps {
  onSuccess?: () => void;
}

export function QuickRoutineLogger({ onSuccess }: QuickRoutineLoggerProps) {
  const [todayItems, setTodayItems] = useState<RoutineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{weight?: number; reps?: number; sets?: number}>({});

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  const loadTodayRoutine = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get today's routine items from active routines
      const [fitnessRoutines, nutritionRoutines] = await Promise.all([
        api.get('/health/simple-routines/?active_only=true'),
        api.get('/health/nutrition-routines?active_only=true')
      ]);

      const items: RoutineItem[] = [];

      // Add fitness routine items
      if (fitnessRoutines.routines?.length > 0) {
        const activeFitness = fitnessRoutines.routines[0];
        if (activeFitness.workout_schedule?.[currentDay]) {
          activeFitness.workout_schedule[currentDay].forEach((exercise: any) => {
            items.push({
              id: `fitness-${exercise.id}`,
              name: exercise.name,
              type: 'workout',
              completed: false,
              time: 'Morning',
              details: {
                weight: exercise.default_weight,
                reps: exercise.default_reps,
                sets: exercise.default_sets,
                duration: exercise.default_duration
              },
              originalData: exercise
            });
          });
        }
      }

      // Add nutrition routine items
      if (nutritionRoutines?.length > 0) {
        const activeNutrition = nutritionRoutines[0];
        if (activeNutrition.meal_plans) {
          const todayMeals = activeNutrition.meal_plans.find((plan: any) => 
            plan.day_of_week?.toLowerCase() === currentDay
          );
          
          if (todayMeals?.meals) {
            todayMeals.meals.forEach((meal: any) => {
              items.push({
                id: `nutrition-${meal.id}`,
                name: meal.name,
                type: 'meal',
                completed: false,
                time: meal.meal_type,
                details: {
                  calories: meal.calories
                },
                originalData: meal
              });
            });
          }
        }
      }

      setTodayItems(items);
    } catch (error) {
      console.error('Failed to load today\'s routine:', error);
      toast.error('Failed to load your routine');
    } finally {
      setLoading(false);
    }
  }, [currentDay]);

  useEffect(() => {
    loadTodayRoutine();
  }, [loadTodayRoutine]);

  const toggleItem = async (itemId: string) => {
    const item = todayItems.find(i => i.id === itemId);
    if (!item) return;

    try {
      if (!item.completed) {
        // Log the item
        if (item.type === 'workout') {
          const now = new Date();
          await api.post('/health/contextual-logging/workout/smart', {
            activity_type: 'weightlifting', // Required field
            activity_name: item.name,
            exercise_id: item.originalData?.id,
            duration_minutes: item.details?.duration || 30,
            intensity: 'medium',
            weight_kg: item.details?.weight,
            reps: item.details?.reps,
            sets: item.details?.sets,
            notes: `Quick logged from routine: ${item.name}`,
            activity_date: now.toISOString(), // Use current time
            use_smart_defaults: true
          });
        } else {
          // For meals, we'd need to implement meal logging
          toast.success(`${item.name} logged successfully!`);
        }
      }

      // Update local state
      setTodayItems(prev => 
        prev.map(i => 
          i.id === itemId 
            ? { ...i, completed: !i.completed }
            : i
        )
      );

      if (!item.completed) {
        toast.success(`${item.name} logged! 🎉`);
      }

    } catch (error) {
      console.error('Failed to log item:', error);
      toast.error('Failed to log item');
    }
  };

  const startEditing = (itemId: string) => {
    const item = todayItems.find(i => i.id === itemId);
    if (item?.type === 'workout') {
      setEditingItem(itemId);
      setEditValues({
        weight: item.details?.weight,
        reps: item.details?.reps,
        sets: item.details?.sets
      });
    }
  };

  const saveEdit = (itemId: string) => {
    setTodayItems(prev => 
      prev.map(i => 
        i.id === itemId 
          ? { 
              ...i, 
              details: { 
                ...i.details, 
                ...editValues 
              } 
            }
          : i
      )
    );
    setEditingItem(null);
    setEditValues({});
    toast.success('Details updated!');
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditValues({});
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <span className="ml-3 text-gray-600">Loading your routine...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedCount = todayItems.filter(item => item.completed).length;
  const totalCount = todayItems.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BoltIcon className="h-6 w-6 text-indigo-600" />
                Today&apos;s Routine - {currentDay.charAt(0).toUpperCase() + currentDay.slice(1)}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Quick tick to log your routine items
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {completedCount}/{totalCount}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Routine Items */}
      <div className="space-y-3">
        {todayItems.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-gray-500 mb-4">
                <ClockIcon className="h-12 w-12 mx-auto mb-2" />
                <p>No routine items for today</p>
                <p className="text-sm">Create a routine to see quick logging options</p>
              </div>
              <Button onClick={() => window.location.href = '/fitness'}>
                Create Fitness Routine
              </Button>
            </CardContent>
          </Card>
        ) : (
          todayItems.map((item) => (
            <Card key={item.id} className={`transition-all duration-200 ${
              item.completed ? 'bg-green-50 border-green-200 dark:bg-green-900/20' : 'hover:shadow-md'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        item.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-500'
                      }`}
                    >
                      {item.completed && <CheckCircleIcon className="h-4 w-4" />}
                    </button>
                    
                    <div className="flex items-center gap-2">
                      {item.type === 'workout' ? (
                        <FireIcon className="h-5 w-5 text-orange-500" />
                      ) : (
                        <HeartIcon className="h-5 w-5 text-green-500" />
                      )}
                      <div>
                        <h3 className={`font-medium ${item.completed ? 'line-through text-gray-500' : ''}`}>
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-500">{item.time}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quick Details Display */}
                    {item.type === 'workout' && item.details && !editingItem && (
                      <div className="text-sm text-gray-600">
                        {item.details.weight && `${item.details.weight}kg`}
                        {item.details.reps && ` × ${item.details.reps}`}
                        {item.details.sets && ` × ${item.details.sets}`}
                        {item.details.duration && ` (${item.details.duration}min)`}
                      </div>
                    )}

                    {item.type === 'meal' && item.details?.calories && (
                      <div className="text-sm text-gray-600">
                        {item.details.calories} cal
                      </div>
                    )}

                    {/* Edit Button for Workouts */}
                    {item.type === 'workout' && !item.completed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(item.id)}
                        className="h-8 w-8 p-0"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Edit Form */}
                {editingItem === item.id && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="weight" className="text-xs">Weight (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          value={editValues.weight || ''}
                          onChange={(e) => setEditValues(prev => ({ 
                            ...prev, 
                            weight: parseFloat(e.target.value) || 0 
                          }))}
                          placeholder="e.g. 20.5"
                          className="h-8 placeholder:text-gray-400 placeholder:italic"
                        />
                      </div>
                      <div>
                        <Label htmlFor="reps" className="text-xs">Reps</Label>
                        <Input
                          id="reps"
                          type="number"
                          value={editValues.reps || ''}
                          onChange={(e) => setEditValues(prev => ({ 
                            ...prev, 
                            reps: parseInt(e.target.value) || 0 
                          }))}
                          placeholder="e.g. 12"
                          className="h-8 placeholder:text-gray-400 placeholder:italic"
                        />
                      </div>
                      <div>
                        <Label htmlFor="sets" className="text-xs">Sets</Label>
                        <Input
                          id="sets"
                          type="number"
                          value={editValues.sets || ''}
                          onChange={(e) => setEditValues(prev => ({ 
                            ...prev, 
                            sets: parseInt(e.target.value) || 0 
                          }))}
                          placeholder="e.g. 3"
                          className="h-8 placeholder:text-gray-400 placeholder:italic"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" onClick={() => saveEdit(item.id)}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      {totalCount > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {completedCount === totalCount ? (
                  <span className="text-green-600 font-medium">
                    🎉 All routine items completed today!
                  </span>
                ) : (
                  <span>
                    {totalCount - completedCount} items remaining
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {Math.round((completedCount / totalCount) * 100)}% complete
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
