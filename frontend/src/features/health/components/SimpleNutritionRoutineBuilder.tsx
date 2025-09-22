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

interface FoodItem {
  id: string;
  food_name: string;
  quantity: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}

interface Meal {
  id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  food_items: FoodItem[];
}

interface SimpleNutritionRoutineBuilderProps {
  onRoutineCreated?: (routine: NutritionRoutine) => void;
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const;

export function SimpleNutritionRoutineBuilder({ onRoutineCreated }: SimpleNutritionRoutineBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [targetCalories, setTargetCalories] = useState(2000);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);

  const calculateMealCalories = (meal: Meal): number => {
    return meal.food_items.reduce((total, food) => total + food.calories, 0);
  };

  const calculateTotalDailyCalories = (): number => {
    return meals.reduce((total, meal) => total + calculateMealCalories(meal), 0);
  };

  const addMeal = (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    const newMeal: Meal = {
      id: `meal-${Date.now()}`,
      meal_type: mealType,
      food_items: []
    };
    setMeals(prev => [...prev, newMeal]);
  };

  const removeMeal = (mealId: string) => {
    setMeals(prev => prev.filter(meal => meal.id !== mealId));
  };

  const updateMeal = (mealId: string, updates: Partial<Meal>) => {
    setMeals(prev => prev.map(meal => 
      meal.id === mealId ? { ...meal, ...updates } : meal
    ));
  };

  const addFoodItem = (mealId: string) => {
    const newFoodItem: FoodItem = {
      id: `food-${Date.now()}`,
      food_name: 'New Food',
      quantity: '1 serving',
      calories: 100,
      protein_g: 10,
      carbs_g: 15,
      fat_g: 5
    };

    setMeals(prev => prev.map(meal => 
      meal.id === mealId 
        ? { ...meal, food_items: [...meal.food_items, newFoodItem] }
        : meal
    ));
  };

  const removeFoodItem = (mealId: string, foodId: string) => {
    setMeals(prev => prev.map(meal => 
      meal.id === mealId 
        ? { ...meal, food_items: meal.food_items.filter(food => food.id !== foodId) }
        : meal
    ));
  };

  const updateFoodItem = (mealId: string, foodId: string, updates: Partial<FoodItem>) => {
    setMeals(prev => prev.map(meal => 
      meal.id === mealId 
        ? { 
            ...meal, 
            food_items: meal.food_items.map(food => 
              food.id === foodId ? { ...food, ...updates } : food
            )
          }
        : meal
    ));
  };

  const saveRoutine = async () => {
    if (!routineName.trim()) {
      toast.error('Please enter a routine name');
      return;
    }

    if (meals.length === 0) {
      toast.error('Please add at least one meal');
      return;
    }

    try {
      setLoading(true);
      
      const routineData = {
        name: routineName,
        description: routineDescription || `Custom nutrition routine with ${meals.length} meals`,
        difficulty,
        duration_weeks: durationWeeks,
        target_calories: targetCalories
      };

      // Create meal plans for each day of the week with the same meals
      const mealPlansData = Array.from({ length: 7 }, (_, dayIndex) => {
        const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        return {
          day_name: dayNames[dayIndex],
          day_order: dayIndex,
          plan_name: `${dayNames[dayIndex].charAt(0).toUpperCase() + dayNames[dayIndex].slice(1)} Plan`,
          description: `Nutrition plan for ${dayNames[dayIndex]}`,
          daily_calories: targetCalories,
          meals: meals.map((meal, index) => ({
            meal_type: meal.meal_type,
            meal_name: meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1),
            description: '',
            order_index: index,
            target_calories: calculateMealCalories(meal),
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
        };
      });

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
      setMeals([]);
      setIsOpen(false);
      
      onRoutineCreated?.(savedRoutine);
      
    } catch (error) {
      console.error('Failed to create nutrition routine:', error);
      toast.error('Failed to create nutrition routine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMealsByType = (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    return meals.filter(meal => meal.meal_type === mealType);
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
              Design your personalized nutrition plan with breakfast, lunch, and dinner.
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

            {/* Daily Calories Summary */}
            {meals.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Daily Total</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Total calories from all meals
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {calculateTotalDailyCalories()}
                    </div>
                    <div className="text-sm text-blue-500 dark:text-blue-300">
                      calories
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Meals by Type */}
            {MEAL_TYPES.map((mealType) => (
              <div key={mealType} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {mealType}
                  </h3>
                  
                  {/* Calories Display in Header */}
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Calories</span>
                        <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                          {getMealsByType(mealType).reduce((total, meal) => total + calculateMealCalories(meal), 0)}
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addMeal(mealType)}
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                    </Button>
                  </div>
                </div>

                {getMealsByType(mealType).length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No {mealType} meals added yet. Click "Add {mealType.charAt(0).toUpperCase() + mealType.slice(1)}" to get started.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getMealsByType(mealType).map((meal, index) => (
                      <div key={meal.id} className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-600 p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-600 dark:text-gray-400">
                            {mealType.charAt(0).toUpperCase() + mealType.slice(1)} {index + 1}
                          </h4>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeMeal(meal.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-3 w-3" />
                          </Button>
                        </div>


                        {/* Food Items */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs text-gray-500">Food Items</Label>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addFoodItem(meal.id)}
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
                                  onClick={() => removeFoodItem(meal.id, food.id)}
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
                                    onChange={(e) => updateFoodItem(meal.id, food.id, { food_name: e.target.value })}
                                    className="h-6 text-xs"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Quantity</Label>
                                  <Input
                                    value={food.quantity}
                                    onChange={(e) => updateFoodItem(meal.id, food.id, { quantity: e.target.value })}
                                    className="h-6 text-xs"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Calories</Label>
                                  <Input
                                    type="number"
                                    value={food.calories}
                                    onChange={(e) => updateFoodItem(meal.id, food.id, { calories: parseInt(e.target.value) || 0 })}
                                    className="h-6 text-xs"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Protein (g)</Label>
                                  <Input
                                    type="number"
                                    value={food.protein_g || 0}
                                    onChange={(e) => updateFoodItem(meal.id, food.id, { protein_g: parseFloat(e.target.value) || 0 })}
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
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex gap-4">
              <Button
                onClick={saveRoutine}
                disabled={loading || !routineName.trim() || meals.length === 0}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </div>
                ) : (
                  'Create Nutrition Routine'
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
