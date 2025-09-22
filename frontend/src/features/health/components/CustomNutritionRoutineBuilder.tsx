'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { nutritionRoutineApi, NutritionRoutine } from '@/lib/nutritionRoutineApi';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api';

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

// Meal type categories with their attributes
const MEAL_CATEGORIES = [
  {
    id: 'breakfast',
    displayName: 'Breakfast',
    description: 'Morning meal to start your day',
    icon: '🌅',
    loggingAttributes: {
      required: [
        { name: 'meal_name', type: 'text', label: 'Meal Name' },
        { name: 'target_calories', type: 'number', label: 'Target Calories' }
      ],
      optional: [
        { name: 'description', type: 'text', label: 'Description' }
      ]
    }
  },
  {
    id: 'lunch',
    displayName: 'Lunch',
    description: 'Midday meal for energy',
    icon: '☀️',
    loggingAttributes: {
      required: [
        { name: 'meal_name', type: 'text', label: 'Meal Name' },
        { name: 'target_calories', type: 'number', label: 'Target Calories' }
      ],
      optional: [
        { name: 'description', type: 'text', label: 'Description' }
      ]
    }
  },
  {
    id: 'dinner',
    displayName: 'Dinner',
    description: 'Evening meal to end your day',
    icon: '🌙',
    loggingAttributes: {
      required: [
        { name: 'meal_name', type: 'text', label: 'Meal Name' },
        { name: 'target_calories', type: 'number', label: 'Target Calories' }
      ],
      optional: [
        { name: 'description', type: 'text', label: 'Description' }
      ]
    }
  },
  {
    id: 'snack',
    displayName: 'Snack',
    description: 'Light meal between main meals',
    icon: '🍎',
    loggingAttributes: {
      required: [
        { name: 'meal_name', type: 'text', label: 'Meal Name' },
        { name: 'target_calories', type: 'number', label: 'Target Calories' }
      ],
      optional: [
        { name: 'description', type: 'text', label: 'Description' }
      ]
    }
  }
];

interface FoodOption {
  id: number;
  name: string;
  calories_per_100g: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  category: string;
}

export function CustomNutritionRoutineBuilder({ onRoutineCreated }: CustomNutritionRoutineBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [targetCalories, setTargetCalories] = useState(2000);
  const [dayMeals, setDayMeals] = useState<DayMeals[]>(() => 
    DAYS.map(day => ({
      day: day,
      meals: [
        {
          id: `meal-${day}-breakfast`,
          meal_type: 'breakfast' as const,
          meal_name: 'Breakfast',
          description: '',
          order_index: 0,
          target_calories: 500,
          food_items: []
        },
        {
          id: `meal-${day}-lunch`,
          meal_type: 'lunch' as const,
          meal_name: 'Lunch',
          description: '',
          order_index: 1,
          target_calories: 500,
          food_items: []
        },
        {
          id: `meal-${day}-dinner`,
          meal_type: 'dinner' as const,
          meal_name: 'Dinner',
          description: '',
          order_index: 2,
          target_calories: 500,
          food_items: []
        }
      ]
    }))
  );
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [allFoods, setAllFoods] = useState<FoodOption[]>([]);

  // Load foods from API
  useEffect(() => {
    const loadFoods = async () => {
      try {
        const response = await api.get('/health/foods/all');
        setAllFoods(response.data.foods || []);
      } catch (error) {
        console.error('Failed to load foods:', error);
        // Fallback to some common foods if API fails
        setAllFoods([
          { id: 1, name: 'Chicken Breast', calories_per_100g: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, category: 'protein' },
          { id: 2, name: 'Brown Rice', calories_per_100g: 111, protein_g: 2.6, carbs_g: 23, fat_g: 0.9, category: 'carbs' },
          { id: 3, name: 'Broccoli', calories_per_100g: 34, protein_g: 2.8, carbs_g: 7, fat_g: 0.4, category: 'vegetables' },
          { id: 4, name: 'Banana', calories_per_100g: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3, category: 'fruits' },
          { id: 5, name: 'Almonds', calories_per_100g: 579, protein_g: 21, carbs_g: 22, fat_g: 50, category: 'nuts' }
        ]);
      }
    };
    loadFoods();
  }, []);

  // Helper functions
  const getFormFieldsForMealType = (mealType: string) => {
    const categoryConfig = MEAL_CATEGORIES.find(cat => cat.id === mealType);
    if (!categoryConfig) return [];
    
    return [
      ...categoryConfig.loggingAttributes.required.filter(field => field.name !== 'meal_name' && field.name !== 'target_calories'),
      ...categoryConfig.loggingAttributes.optional.filter(field => field.name !== 'description')
    ];
  };

  const getFieldDisplayName = (fieldName: string): string => {
    const fieldMap: { [key: string]: string } = {
      'meal_name': 'Meal Name',
      'target_calories': 'Target Calories',
      'description': 'Description'
    };
    return fieldMap[fieldName] || fieldName;
  };

  // Days are now always present, no need to add/remove them

  const addMeal = (day: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'breakfast') => {
    const mealConfig = MEAL_CATEGORIES.find(cat => cat.id === mealType);
    const newMeal: Meal = {
      id: `meal-${Date.now()}`,
      meal_type: mealType,
      meal_name: mealConfig?.displayName || 'New Meal',
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

  const addAllMainMeals = (day: string) => {
    const mainMeals: ('breakfast' | 'lunch' | 'dinner')[] = ['breakfast', 'lunch', 'dinner'];
    const newMeals: Meal[] = mainMeals.map((mealType, index) => {
      const mealConfig = MEAL_CATEGORIES.find(cat => cat.id === mealType);
      return {
        id: `meal-${Date.now()}-${index}`,
        meal_type: mealType,
        meal_name: mealConfig?.displayName || 'New Meal',
        description: '',
        order_index: index,
        target_calories: Math.floor(targetCalories / 4),
        food_items: []
      };
    });

    setDayMeals(prev => prev.map(dayMeal => 
      dayMeal.day === day 
        ? { ...dayMeal, meals: [...dayMeal.meals, ...newMeals] }
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
      food_name: '',
      quantity: '',
      order_index: 0,
      calories: '',
      protein_g: '',
      carbs_g: '',
      fat_g: ''
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

    // No need to check for empty days since we always have all 7 days

    try {
      setLoading(true);
      
      const routineData = {
        name: routineName,
        description: routineDescription || `Custom nutrition routine with ${dayMeals.length} day plans`,
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
          description: meal.description || null,
          order_index: index,
          target_calories: meal.target_calories,
          food_items: meal.food_items.map((food, foodIndex) => ({
            food_name: food.food_name,
            quantity: food.quantity || null,
            order_index: foodIndex,
            calories: food.calories || null,
            protein_g: food.protein_g || null,
            carbs_g: food.carbs_g || null,
            fat_g: food.fat_g || null
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
      setSelectedDay(0);
      setIsOpen(false);
      
      onRoutineCreated?.(savedRoutine);
      
    } catch (error) {
      console.error('Failed to create nutrition routine:', error);
      toast.error('Failed to create nutrition routine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTotalMeals = () => {
    return dayMeals.reduce((total, day) => total + day.meals.length, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Custom Routine
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[600px] h-[80vh] overflow-hidden p-0 bg-white dark:bg-gray-900 border-0 shadow-2xl flex flex-col [&>button]:absolute [&>button]:top-4 [&>button]:right-4 [&>button]:z-30">
        <div className="flex flex-col h-full min-h-0">
          {/* Clean Header - Fixed at top with proper z-index */}
          <DialogHeader className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-white dark:bg-gray-900 z-10 relative">
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Create Custom Routine</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Build a personalized nutrition plan by selecting meals and planning nutrition for each day of the week.
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
                      placeholder="e.g., My Custom Nutrition Plan"
                      className="border border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                  </div>
                </div>

                {/* Daily Nutrition Plan */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Weekly Nutrition Plan</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Plan your meals for each day of the week</p>
                    </div>
                    <div className="bg-indigo-100 dark:bg-indigo-900 px-3 py-1.5 rounded-full">
                      <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                        {getTotalMeals()} total meals
                      </span>
                    </div>
                  </div>

                  {/* Day Navigation */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center justify-center">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedDay(prev => prev > 0 ? prev - 1 : DAYS.length - 1)}
                          className="rounded-lg"
                        >
                          <ChevronLeftIcon className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">{dayMeals[selectedDay]?.day?.charAt(0) || 'M'}</span>
                          </div>
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            {dayMeals[selectedDay]?.day || 'Monday'}
                          </span>
                        </div>
                        
                        <Button
                          variant="outline"
                          onClick={() => setSelectedDay(prev => prev < DAYS.length - 1 ? prev + 1 : 0)}
                          className="rounded-lg"
                        >
                          <ChevronRightIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Selected Day Content */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="h-full">
                      {/* Current Day Content */}
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 h-full">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {dayMeals[selectedDay]?.day?.charAt(0) || 'M'}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {dayMeals[selectedDay]?.day || 'Monday'}
                            </h3>
                          </div>
                        </div>

                        {dayMeals[selectedDay]?.meals.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <p>No meals planned for {dayMeals[selectedDay]?.day}. Click any meal button above to get started.</p>
                          </div>
                        ) : (
                          <div className="space-y-4 h-full">
                            {dayMeals[selectedDay]?.meals.map((meal, index) => (
                                <Card key={meal.id} className="border border-gray-200 dark:border-gray-700 flex-1">
                                  <CardHeader className="pb-2 pt-3">
                                    <div className="flex items-center justify-between">
                                      <CardTitle className="text-base">{meal.meal_name}</CardTitle>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addFoodItem(dayMeals[selectedDay].day, meal.id)}
                                        className="h-8"
                                      >
                                        <PlusIcon className="h-4 w-4 mr-1" />
                                        Add Meal
                                      </Button>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="pt-0 pb-6">
                                    {/* Dynamic Form Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {getFormFieldsForMealType(meal.meal_type).map((field) => (
                                        <div key={field.name}>
                                          <Label className="text-sm font-medium">
                                            {getFieldDisplayName(field.name)}
                                            {field.name === 'meal_name' || field.name === 'target_calories' ? ' *' : ''}
                                          </Label>
                                          {field.type === 'text' ? (
                                            <Input
                                              value={meal[field.name as keyof Meal] as string || ''}
                                              onChange={(e) => updateMeal(dayMeals[selectedDay].day, meal.id, { [field.name]: e.target.value })}
                                              className="mt-1 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                              placeholder="0"
                                            />
                                          ) : field.type === 'number' ? (
                                            <Input
                                              type="number"
                                              value={meal[field.name as keyof Meal] as number || ''}
                                              onChange={(e) => updateMeal(dayMeals[selectedDay].day, meal.id, { [field.name]: parseInt(e.target.value) || 0 })}
                                              className="mt-1 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                              placeholder="0"
                                            />
                                          ) : (
                                            <Textarea
                                              value={meal[field.name as keyof Meal] as string || ''}
                                              onChange={(e) => updateMeal(dayMeals[selectedDay].day, meal.id, { [field.name]: e.target.value })}
                                              className="mt-1 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                              placeholder="0"
                                              rows={2}
                                            />
                                          )}
                                        </div>
                                      ))}
                                    </div>

                                    {/* Food Items */}
                                    <div className="space-y-2 mt-3">

                                      {meal.food_items.map((food) => (
                                        <div key={food.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                                          <div className="flex items-center justify-between mb-3">
                                            <Input
                                              value={food.food_name || ''}
                                              onChange={(e) => updateFoodItem(dayMeals[selectedDay].day, meal.id, food.id, { food_name: e.target.value })}
                                              className="font-medium text-gray-900 dark:text-white text-base h-8 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                              placeholder="Food name"
                                            />
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => removeFoodItem(dayMeals[selectedDay].day, meal.id, food.id)}
                                              className="text-red-600 hover:text-red-700"
                                            >
                                              <TrashIcon className="h-4 w-4" />
                                            </Button>
                                          </div>

                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div>
                                              <Label className="text-xs font-medium">Quantity (g)</Label>
                                              <Input
                                                value={food.quantity}
                                                onChange={(e) => updateFoodItem(dayMeals[selectedDay].day, meal.id, food.id, { quantity: e.target.value })}
                                                className="mt-1 h-8 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                                placeholder="0"
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-xs font-medium">Calories</Label>
                                              <Input
                                                type="number"
                                                value={food.calories || ''}
                                                onChange={(e) => updateFoodItem(dayMeals[selectedDay].day, meal.id, food.id, { calories: e.target.value })}
                                                className="mt-1 h-8 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                                placeholder="0"
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-xs font-medium">Protein (g)</Label>
                                              <Input
                                                type="number"
                                                value={food.protein_g || ''}
                                                onChange={(e) => updateFoodItem(dayMeals[selectedDay].day, meal.id, food.id, { protein_g: e.target.value })}
                                                className="mt-1 h-8 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                                placeholder="0"
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-xs font-medium">Carbs (g)</Label>
                                              <Input
                                                type="number"
                                                value={food.carbs_g || ''}
                                                onChange={(e) => updateFoodItem(dayMeals[selectedDay].day, meal.id, food.id, { carbs_g: e.target.value })}
                                                className="mt-1 h-8 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                                placeholder="0"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-white dark:bg-gray-900">
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={loading}
                className="border-gray-300 dark:border-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={saveRoutine}
                disabled={loading || !routineName.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Routine'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}