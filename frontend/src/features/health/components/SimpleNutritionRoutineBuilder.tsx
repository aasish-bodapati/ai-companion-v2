'use client';

import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusIcon, TrashIcon, CheckIcon, PencilIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import nutritionRoutineApi, { CreateNutritionRoutineRequest, NutritionRoutineWithMealPlans } from '@/lib/nutritionRoutineApi';

interface SimpleNutritionRoutineBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingRoutine?: NutritionRoutineWithMealPlans;
}

interface FoodItem {
  food_name: string;
  quantity: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}

interface Meal {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_name: string;
  target_calories: number;
  food_items: FoodItem[];
}

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { value: 'lunch', label: 'Lunch', emoji: '☀️' },
  { value: 'dinner', label: 'Dinner', emoji: '🌙' },
  { value: 'snack', label: 'Snack', emoji: '🍎' }
];

const COMMON_FOODS = [
  { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, per: '100g' },
  { name: 'Brown Rice', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, per: '100g' },
  { name: 'Eggs', calories: 155, protein: 13, carbs: 1.1, fat: 11, per: '100g' },
  { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, per: '100g' },
  { name: 'Avocado', calories: 160, protein: 2, carbs: 9, fat: 15, per: '100g' },
  { name: 'Oatmeal', calories: 68, protein: 2.4, carbs: 12, fat: 1.4, per: '100g' },
  { name: 'Greek Yogurt', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, per: '100g' },
  { name: 'Almonds', calories: 579, protein: 21, carbs: 22, fat: 50, per: '100g' }
];

export function SimpleNutritionRoutineBuilder({ isOpen, onClose, onSuccess, editingRoutine }: SimpleNutritionRoutineBuilderProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [showAddFoodDialog, setShowAddFoodDialog] = useState(false);
  const [selectedMealIndex, setSelectedMealIndex] = useState<number | null>(null);
  const [newFood, setNewFood] = useState({
    food_name: '',
    quantity: '',
    calories: '',
    protein_g: '',
    carbs_g: '',
    fat_g: ''
  });
  
  // Basic routine info
  const [routineData, setRoutineData] = useState(() => {
    console.log('Initializing routineData with editingRoutine:', editingRoutine);
    console.log('editingRoutine.target_calories:', editingRoutine?.target_calories);
    
    return {
      name: editingRoutine?.name || '',
      target_calories: editingRoutine?.target_calories ? String(editingRoutine.target_calories) : '',
      tags: editingRoutine?.tags || []
    };
  });

  // Simplified meal plan - just one day with meals
  const [meals, setMeals] = useState<Meal[]>(() => {
    console.log('Initializing meals with editingRoutine:', editingRoutine);
    
    if (editingRoutine?.meal_plans?.[0]?.meals) {
      // Hydrate with existing meal data
      console.log('Hydrating with existing meal data:', editingRoutine.meal_plans[0].meals);
      return editingRoutine.meal_plans[0].meals.map(meal => {
        const foodItems = meal.food_items || [];
        const calculatedCalories = foodItems.reduce((total, food) => total + (food.calories || 0), 0);
        return {
          meal_type: meal.meal_type,
          meal_name: meal.meal_name,
          target_calories: calculatedCalories,
          food_items: foodItems
        };
      });
    }
    
    // If we have a routine but no meal plans, use default meals with routine's daily targets
    if (editingRoutine) {
      console.log('Using default meals with routine daily targets');
      const dailyCalories = editingRoutine.target_calories || 2000;
      const caloriesPerMeal = Math.round(dailyCalories / 3);
      
      return [
        {
          meal_type: 'breakfast' as const,
          meal_name: 'Breakfast',
          target_calories: Math.round(caloriesPerMeal * 1.2),
          food_items: []
        },
        {
          meal_type: 'lunch' as const,
          meal_name: 'Lunch',
          target_calories: Math.round(caloriesPerMeal * 1.3),
          food_items: []
        },
        {
          meal_type: 'dinner' as const,
          meal_name: 'Dinner',
          target_calories: Math.round(caloriesPerMeal * 1.3),
          food_items: []
        }
      ];
    }
    
    // Default meals for new routine
    console.log('Using default meals for new routine');
    return [
      {
        meal_type: 'breakfast' as const,
        meal_name: 'Breakfast',
        target_calories: 500,
        food_items: []
      },
      {
        meal_type: 'lunch' as const,
        meal_name: 'Lunch',
        target_calories: 600,
        food_items: []
      },
      {
        meal_type: 'dinner' as const,
        meal_name: 'Dinner',
        target_calories: 700,
        food_items: []
      }
    ];
  });

  // Update form data when editingRoutine changes
  React.useEffect(() => {
    if (editingRoutine) {
      console.log('editingRoutine changed, updating form data:', editingRoutine);
      console.log('editingRoutine.target_calories:', editingRoutine.target_calories);
      // Note: Individual macro targets removed during database cleanup
      console.log('editingRoutine.meal_plans:', editingRoutine.meal_plans);
      
      // Reset to Basic Info tab when editing
      setActiveTab('basic');
      
      setRoutineData({
        name: editingRoutine.name || '',
        target_calories: editingRoutine.target_calories ? String(editingRoutine.target_calories) : '',
        // Note: Individual macro targets removed during database cleanup
        tags: editingRoutine.tags || []
      });
      
      // Update meals with the loaded data
      if (editingRoutine.meal_plans?.[0]?.meals) {
        console.log('Updating meals with loaded data:', editingRoutine.meal_plans[0].meals);
        const updatedMeals = editingRoutine.meal_plans[0].meals.map(meal => {
          const foodItems = meal.food_items || [];
          const calculatedCalories = foodItems.reduce((total, food) => total + (food.calories || 0), 0);
          return {
            meal_type: meal.meal_type,
            meal_name: meal.meal_name,
            target_calories: calculatedCalories,
            food_items: foodItems
          };
        });
        console.log('Setting meals to:', updatedMeals);
        setMeals(updatedMeals);
      }
      
      console.log('Updated routineData:', {
        name: editingRoutine.name || '',
        target_calories: editingRoutine.target_calories ? String(editingRoutine.target_calories) : '',
        // Note: Individual macro targets removed during database cleanup
        tags: editingRoutine.tags || []
      });
    }
  }, [editingRoutine]);

  // Recalculate all meal calories when meals change (initial load only)
  React.useEffect(() => {
    const updatedMeals = meals.map(meal => ({
      ...meal,
      target_calories: calculateMealCalories(meal.food_items)
    }));
    setMeals(updatedMeals);
  }, [meals.length]); // Only run when meals array length changes (initial load)

  // Calculate meal calories from food items
  const calculateMealCalories = (foodItems: FoodItem[]) => {
    return foodItems.reduce((total, food) => total + (food.calories || 0), 0);
  };

  // Update meal calories when food items change
  const updateMealCalories = (mealIndex: number) => {
    const updated = [...meals];
    const meal = updated[mealIndex];
    const calculatedCalories = calculateMealCalories(meal.food_items);
    updated[mealIndex] = { ...meal, target_calories: calculatedCalories };
    setMeals(updated);
    
    // Note: Daily targets are independent of meal calories
  };

  const updateMeal = (mealIndex: number, updates: Partial<Meal>) => {
    const updated = [...meals];
    updated[mealIndex] = { ...updated[mealIndex], ...updates };
    setMeals(updated);
    
    // Recalculate calories for this meal if food items changed
    if (updates.food_items !== undefined) {
      updateMealCalories(mealIndex);
    }
  };

  // Update daily targets
  const updateDailyTargets = (field: string, value: number | undefined) => {
    setRoutineData({ ...routineData, [field]: value });
  };

  const addFoodItem = (mealIndex: number) => {
    setSelectedMealIndex(mealIndex);
    setNewFood({
      food_name: '',
      quantity: '',
      calories: '',
      protein_g: '',
      carbs_g: '',
      fat_g: ''
    });
    setShowAddFoodDialog(true);
  };

  const handleAddFood = () => {
    if (selectedMealIndex !== null && newFood.food_name.trim()) {
      const updated = [...meals];
      updated[selectedMealIndex].food_items.push({
        food_name: newFood.food_name.trim(),
        quantity: newFood.quantity || '1 serving',
        calories: parseFloat(newFood.calories) || 0,
        protein_g: parseFloat(newFood.protein_g) || 0,
        carbs_g: parseFloat(newFood.carbs_g) || 0,
        fat_g: parseFloat(newFood.fat_g) || 0
      });
      setMeals(updated);
      
      // Recalculate meal calories after adding food
      updateMealCalories(selectedMealIndex);
      
      // Reset form
      setNewFood({
        food_name: '',
        quantity: '',
        calories: '',
        protein_g: '',
        carbs_g: '',
        fat_g: ''
      });
      
      setShowAddFoodDialog(false);
      setSelectedMealIndex(null);
    }
  };

  const removeFoodItem = (mealIndex: number, foodIndex: number) => {
    const updated = [...meals];
    updated[mealIndex].food_items.splice(foodIndex, 1);
    setMeals(updated);
    
    // Recalculate meal calories after removing food
    updateMealCalories(mealIndex);
  };

  const updateFoodItem = (mealIndex: number, foodIndex: number, updates: Partial<FoodItem>) => {
    const updated = [...meals];
    updated[mealIndex].food_items[foodIndex] = {
      ...updated[mealIndex].food_items[foodIndex],
      ...updates
    };
    setMeals(updated);
    
    // Recalculate meal calories after updating food
    updateMealCalories(mealIndex);
  };

  const addCommonFood = (mealIndex: number, food: any) => {
    const newFood: FoodItem = {
      food_name: food.name,
      quantity: food.per,
      calories: food.calories,
      protein_g: food.protein,
      carbs_g: food.carbs,
      fat_g: food.fat
    };
    const updated = [...meals];
    updated[mealIndex].food_items.push(newFood);
    setMeals(updated);
    
    // Recalculate meal calories after adding common food
    updateMealCalories(mealIndex);
  };

  const setMealFrequency = (frequency: number) => {
    const newMeals = [];
    const caloriesPerMeal = Math.round(parseFloat(routineData.target_calories) / frequency);
    
    // Add main meals (always 3: breakfast, lunch, dinner)
    newMeals.push({
      meal_type: 'breakfast' as const,
      meal_name: 'Breakfast',
      target_calories: Math.round(caloriesPerMeal * 1.2),
      food_items: []
    });
    newMeals.push({
      meal_type: 'lunch' as const,
      meal_name: 'Lunch',
      target_calories: Math.round(caloriesPerMeal * 1.3),
      food_items: []
    });
    newMeals.push({
      meal_type: 'dinner' as const,
      meal_name: 'Dinner',
      target_calories: Math.round(caloriesPerMeal * 1.3),
      food_items: []
    });
    
    setMeals(newMeals);
  };

  const saveRoutine = async () => {
    if (!routineData.name.trim()) {
      toast.error('Please enter a routine name');
      return;
    }

    setLoading(true);
    try {
      const requestData: CreateNutritionRoutineRequest = {
        routine_data: {
          name: routineData.name,
          tags: routineData.tags,
          target_calories: parseFloat(routineData.target_calories) || 0
        },
        meal_plans: [{
          day_name: 'monday',
          day_order: 0,
          plan_name: 'Daily Plan',
          daily_calories: parseFloat(routineData.target_calories) || 0,
          meals: meals.map((meal, mealIndex) => ({
            ...meal,
            order_index: mealIndex,
            food_items: meal.food_items.map((food, foodIndex) => ({
              ...food,
              order_index: foodIndex
            }))
          }))
        }]
      };

      if (editingRoutine) {
        await nutritionRoutineApi.updateRoutineWithMealPlans(editingRoutine.id, requestData);
        toast.success('Nutrition routine updated successfully!');
      } else {
        await nutritionRoutineApi.createRoutineWithMealPlans(requestData);
        toast.success('Nutrition routine created successfully!');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save nutrition routine:', error);
      toast.error('Failed to save nutrition routine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingRoutine ? 'Edit Nutrition Routine' : 'Create Nutrition Routine'}
          </DialogTitle>
          <DialogDescription>
            Build a simple nutrition routine with your preferred meals and foods.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="meals">Meals</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Routine Name *</Label>
                  <Input
                    id="name"
                    value={routineData.name}
                    onChange={(e) => setRoutineData({ ...routineData, name: e.target.value })}
                    placeholder="Enter routine name"
                  />
                </div>

              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Daily Macro Targets</h3>
                
                <div>
                  <Label htmlFor="calories">Daily Calorie Target</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={routineData.target_calories || ''}
                    onChange={(e) => updateDailyTargets('target_calories', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Enter daily calories"
                  />
                  <p className="text-xs text-gray-500 mt-1">Your daily calorie goal (independent of meal foods)</p>
                </div>

                <div className="col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Individual macro targets are not available. Focus on total calories and meal planning.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="meals" className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Meal Setup</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add your foods to breakfast, lunch, and dinner
              </p>
            </div>


            {/* Simplified Meal Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Meal Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {meals.map((meal, mealIndex) => (
                    <Card key={mealIndex} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="mb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                                <span className="text-sm">
                                  {MEAL_TYPES.find(t => t.value === meal.meal_type)?.emoji}
                                </span>
                              </div>
                              <div className="font-medium">{meal.meal_name}</div>
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-6 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 flex items-center justify-center text-white">
                                  {calculateMealCalories(meal.food_items)}
                                </div>
                                <span className="text-sm text-gray-400">calories</span>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => addFoodItem(mealIndex)}
                            >
                              <PlusIcon className="h-4 w-4 mr-2" />
                              Add Food
                            </Button>
                          </div>
                        </div>

                        {/* Food Items */}
                        {meal.food_items.length > 0 && (
                          <div className="space-y-2">
                            {meal.food_items.map((food, foodIndex) => (
                              <div key={foodIndex} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="font-medium text-sm">{food.food_name}</div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const newName = prompt('Edit food name:', food.food_name);
                                        if (newName !== null) {
                                          updateFoodItem(mealIndex, foodIndex, { food_name: newName });
                                        }
                                      }}
                                    >
                                      <PencilIcon className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeFoodItem(mealIndex, foodIndex)}
                                    >
                                      <TrashIcon className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-500">Quantity:</span>
                                    <Input
                                      value={food.quantity}
                                      onChange={(e) => updateFoodItem(mealIndex, foodIndex, { quantity: e.target.value })}
                                      className="h-6 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Calories:</span>
                                    <Input
                                      type="number"
                                      value={food.calories}
                                      onChange={(e) => updateFoodItem(mealIndex, foodIndex, { calories: parseInt(e.target.value) || 0 })}
                                      className="h-6 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Protein (g):</span>
                                    <Input
                                      type="number"
                                      value={food.protein_g || ''}
                                      onChange={(e) => updateFoodItem(mealIndex, foodIndex, { protein_g: parseFloat(e.target.value) || undefined })}
                                      className="h-6 text-xs"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    💡 Pro Tip
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    Start with this basic plan and customize individual meals as needed. 
                    You can always add more specific foods and adjust portions later.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={saveRoutine} disabled={loading}>
            {loading ? 'Saving...' : editingRoutine ? 'Update Routine' : 'Create Routine'}
          </Button>
        </div>
      </DialogContent>

      {/* Add Food Dialog */}
      <Dialog open={showAddFoodDialog} onOpenChange={setShowAddFoodDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Food to {selectedMealIndex !== null ? meals[selectedMealIndex]?.meal_name : 'Meal'}</DialogTitle>
            <DialogDescription>
              Enter the food details to add to your meal plan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="food-name">Food Name</Label>
                <Input
                  id="food-name"
                  value={newFood.food_name}
                  onChange={(e) => setNewFood({ ...newFood, food_name: e.target.value })}
                  placeholder="Enter food name"
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  value={newFood.quantity}
                  onChange={(e) => setNewFood({ ...newFood, quantity: e.target.value })}
                  placeholder="Enter quantity"
                />
              </div>
            </div>

             <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="calories">Calories</Label>
                 <Input
                   id="calories"
                   type="number"
                   value={newFood.calories}
                   onChange={(e) => setNewFood({ ...newFood, calories: e.target.value })}
                   placeholder="Enter calories"
                 />
               </div>
               <div>
                 <Label htmlFor="protein">Protein (g)</Label>
                 <Input
                   id="protein"
                   type="number"
                   value={newFood.protein_g}
                   onChange={(e) => setNewFood({ ...newFood, protein_g: e.target.value })}
                   placeholder="Enter protein"
                 />
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="carbs">Carbs (g)</Label>
                 <Input
                   id="carbs"
                   type="number"
                   value={newFood.carbs_g}
                   onChange={(e) => setNewFood({ ...newFood, carbs_g: e.target.value })}
                   placeholder="Enter carbs"
                 />
               </div>
               <div>
                 <Label htmlFor="fat">Fat (g)</Label>
                 <Input
                   id="fat"
                   type="number"
                   value={newFood.fat_g}
                   onChange={(e) => setNewFood({ ...newFood, fat_g: e.target.value })}
                   placeholder="Enter fat"
                 />
               </div>
             </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddFoodDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFood} disabled={!newFood.food_name.trim()}>
              Add Food
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
