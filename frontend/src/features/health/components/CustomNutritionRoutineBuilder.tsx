'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { nutritionRoutineApi, NutritionRoutine } from '@/lib/nutritionRoutineApi';
import { logger } from '@/lib/logger';

interface DayMeals {
  day: string;
  meals: Meal[];
}

interface Meal {
  id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_name: string;
  description?: string;
  order_index: number;
  target_calories: number;
  food_items: FoodItem[];
}

interface FoodItem {
  id: string;
  food_name: string;
  quantity: string;
  order_index: number;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}

interface CustomNutritionRoutineBuilderProps {
  onRoutineCreated?: (routine: NutritionRoutine) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export function CustomNutritionRoutineBuilder({ onRoutineCreated }: CustomNutritionRoutineBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [targetCalories, setTargetCalories] = useState(2000);
  const [dayMeals, setDayMeals] = useState<DayMeals[]>([]);
  const [loading, setLoading] = useState(false);

  const addDayMeals = (day: string) => {
    const newDayMeals: DayMeals = {
      day: day,
      meals: []
    };
    setDayMeals(prev => [...prev, newDayMeals]);
  };

  const removeDayMeals = (day: string) => {
    setDayMeals(prev => prev.filter(dayMeal => dayMeal.day !== day));
  };

  const addMeal = (day: string) => {
    const newMeal: Meal = {
      id: `meal-${Date.now()}`,
      meal_type: 'breakfast',
      meal_name: 'New Meal',
      description: '',
      order_index: 0,
      target_calories: Math.floor(targetCalories / 4), // Distribute calories across meals
      food_items: []
    };

    setDayMeals(prev => prev.map(dayMeal => 
      dayMeal.day === day 
        ? { ...dayMeal, meals: [...dayMeal.meals, newMeal] }
        : dayMeal
    ));
  };

  const removeMeal = (day: string, mealId: string) => {
    setDayMeals(prev => prev.map(dayMeal => 
      dayMeal.day === day 
        ? { ...dayMeal, meals: dayMeal.meals.filter(meal => meal.id !== mealId) }
        : dayMeal
    ));
  };

  const updateMeal = (day: string, mealId: string, updates: Partial<Meal>) => {
    setDayMeals(prev => prev.map(dayMeal => 
      dayMeal.day === day 
        ? { 
            ...dayMeal, 
            meals: dayMeal.meals.map(meal => 
              meal.id === mealId ? { ...meal, ...updates } : meal
            )
          }
        : dayMeal
    ));
  };

  const addFoodItem = (day: string, mealId: string) => {
    const newFoodItem: FoodItem = {
      id: `food-${Date.now()}`,
      food_name: 'New Food',
      quantity: '1 serving',
      order_index: 0,
      calories: 100,
      protein_g: 10,
      carbs_g: 15,
      fat_g: 5
    };

    setDayMeals(prev => prev.map(dayMeal => 
      dayMeal.day === day 
        ? { 
            ...dayMeal, 
            meals: dayMeal.meals.map(meal => 
              meal.id === mealId 
                ? { ...meal, food_items: [...meal.food_items, newFoodItem] }
                : meal
            )
          }
        : dayMeal
    ));
  };

  const removeFoodItem = (day: string, mealId: string, foodId: string) => {
    setDayMeals(prev => prev.map(dayMeal => 
      dayMeal.day === day 
        ? { 
            ...dayMeal, 
            meals: dayMeal.meals.map(meal => 
              meal.id === mealId 
                ? { ...meal, food_items: meal.food_items.filter(food => food.id !== foodId) }
                : meal
            )
          }
        : dayMeal
    ));
  };

  const updateFoodItem = (day: string, mealId: string, foodId: string, updates: Partial<FoodItem>) => {
    setDayMeals(prev => prev.map(dayMeal => 
      dayMeal.day === day 
        ? { 
            ...dayMeal, 
            meals: dayMeal.meals.map(meal => 
              meal.id === mealId 
                ? { 
                    ...meal, 
                    food_items: meal.food_items.map(food => 
                      food.id === foodId ? { ...food, ...updates } : food
                    )
                  }
                : meal
            )
          }
        : dayMeal
    ));
  };

  const saveRoutine = async () => {
    if (!routineName.trim()) {
      toast.error('Please enter a routine name');
      return;
    }

    if (dayMeals.length === 0) {
      toast.error('Please add at least one day');
      return;
    }

    try {
      setLoading(true);
      
      const routineData = {
        name: routineName,
        description: routineDescription || `Custom nutrition routine with ${dayMealPlans.length} day plans`,
        difficulty,
        duration_weeks: durationWeeks,
        target_calories: targetCalories
      };

      const mealPlansData = dayMeals.map(dayMeal => ({
        day_name: dayMeal.day.toLowerCase(),
        day_order: DAYS.indexOf(dayMeal.day),
        plan_name: `${dayMeal.day} Plan`,
        description: `Nutrition plan for ${dayMeal.day}`,
        daily_calories: targetCalories,
        meals: dayMeal.meals.map((meal, index) => ({
          meal_type: meal.meal_type,
          meal_name: meal.meal_name,
          description: meal.description,
          order_index: index,
          target_calories: meal.target_calories,
          food_items: meal.food_items.map((food, foodIndex) => ({
            food_name: food.food_name,
            quantity: food.quantity,
            order_index: foodIndex,
            calories: food.calories,
            protein_g: food.protein_g,
            carbs_g: food.carbs_g,
            fat_g: food.fat_g
          }))
        }))
      }));

      logger.debug('Creating nutrition routine:', routineData);
      logger.debug('Meal plans data:', mealPlansData);
      
      const savedRoutine = await nutritionRoutineApi.createRoutineWithMealPlans({
        routine_data: routineData,
        meal_plans: mealPlansData
      });
      
      logger.info('Nutrition routine created successfully:', savedRoutine);
      toast.success(`Nutrition routine "${routineName}" created successfully!`);
      
      // Reset form
      setRoutineName('');
      setRoutineDescription('');
      setDifficulty('beginner');
      setDurationWeeks(4);
      setTargetCalories(2000);
      setDayMeals([]);
      setIsOpen(false);
      
      onRoutineCreated?.(savedRoutine);
      
    } catch (error) {
      console.error('Failed to create nutrition routine:', error);
      toast.error('Failed to create nutrition routine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Custom Routine
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden p-0 bg-white dark:bg-gray-900 border-0 shadow-2xl flex flex-col">
        <div className="flex flex-col h-full min-h-0">
          <DialogHeader className="p-6 border-b border-gray-200 dark:border-gray-700">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Create Custom Nutrition Routine
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Design your personalized nutrition plan with detailed meal plans and food items.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="routineName">Routine Name *</Label>
                  <Input
                    id="routineName"
                    value={routineName}
                    onChange={(e) => setRoutineName(e.target.value)}
                    placeholder="e.g., My Custom Nutrition Plan"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={difficulty} onValueChange={(value: any) => setDifficulty(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="durationWeeks">Duration (weeks)</Label>
                  <Input
                    id="durationWeeks"
                    type="number"
                    value={durationWeeks}
                    onChange={(e) => setDurationWeeks(parseInt(e.target.value) || 4)}
                    min="1"
                    max="52"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="targetCalories">Target Calories (per day)</Label>
                  <Input
                    id="targetCalories"
                    type="number"
                    value={targetCalories}
                    onChange={(e) => setTargetCalories(parseInt(e.target.value) || 2000)}
                    min="500"
                    max="10000"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="routineDescription">Description</Label>
                <Textarea
                  id="routineDescription"
                  value={routineDescription}
                  onChange={(e) => setRoutineDescription(e.target.value)}
                  placeholder="Describe your nutrition routine..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>

            {/* Day Plans */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Day Plans</h3>
                <Select onValueChange={addDayMeals}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Add Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map(day => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {dayMeals.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No days added yet. Select a day to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {dayMeals.map((dayMeal) => (
                    <div key={dayMeal.day} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-gray-900 dark:text-white">{dayMeal.day}</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeDayMeals(dayMeal.day)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Meals */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h5 className="font-medium text-gray-700 dark:text-gray-300">Meals</h5>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addMeal(dayMeal.day)}
                          >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            Add Meal
                          </Button>
                        </div>

                        {dayMeal.meals.map((meal) => (
                          <div key={meal.id} className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-600 p-3">
                            <div className="flex justify-between items-center mb-2">
                              <h6 className="font-medium text-gray-600 dark:text-gray-400">{meal.meal_name}</h6>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeMeal(dayMeal.day, meal.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <TrashIcon className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                              <div>
                                <Label className="text-xs">Meal Name</Label>
                                <Input
                                  value={meal.meal_name}
                                  onChange={(e) => updateMeal(dayMeal.day, meal.id, { meal_name: e.target.value })}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Type</Label>
                                <Select 
                                  value={meal.meal_type} 
                                  onValueChange={(value: any) => updateMeal(dayMeal.day, meal.id, { meal_type: value })}
                                >
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {MEAL_TYPES.map(type => (
                                      <SelectItem key={type} value={type}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Calories</Label>
                                <Input
                                  type="number"
                                  value={meal.target_calories}
                                  onChange={(e) => updateMeal(dayMeal.day, meal.id, { target_calories: parseInt(e.target.value) || 0 })}
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>

                            {/* Food Items */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <Label className="text-xs text-gray-500">Food Items</Label>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => addFoodItem(dayMeal.day, meal.id)}
                                  className="h-6 text-xs"
                                >
                                  <PlusIcon className="h-3 w-3 mr-1" />
                                  Add Food
                                </Button>
                              </div>

                              {meal.food_items.map((food) => (
                                <div key={food.id} className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{food.food_name}</span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => removeFoodItem(dayMeal.day, meal.id, food.id)}
                                      className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
                                    >
                                      <TrashIcon className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                                    <div>
                                      <Label className="text-xs">Food Name</Label>
                                      <Input
                                        value={food.food_name}
                                        onChange={(e) => updateFoodItem(dayMeal.day, meal.id, food.id, { food_name: e.target.value })}
                                        className="h-6 text-xs"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Quantity</Label>
                                      <Input
                                        value={food.quantity}
                                        onChange={(e) => updateFoodItem(dayMeal.day, meal.id, food.id, { quantity: e.target.value })}
                                        className="h-6 text-xs"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Calories</Label>
                                      <Input
                                        type="number"
                                        value={food.calories}
                                        onChange={(e) => updateFoodItem(dayMeal.day, meal.id, food.id, { calories: parseInt(e.target.value) || 0 })}
                                        className="h-6 text-xs"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Protein (g)</Label>
                                      <Input
                                        type="number"
                                        value={food.protein_g || 0}
                                        onChange={(e) => updateFoodItem(dayMeal.day, meal.id, food.id, { protein_g: parseFloat(e.target.value) || 0 })}
                                        className="h-6 text-xs"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex gap-4">
              <Button
                onClick={saveRoutine}
                disabled={loading || !routineName.trim() || dayMeals.length === 0}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </div>
                ) : (
                  'Create Routine'
                )}
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
