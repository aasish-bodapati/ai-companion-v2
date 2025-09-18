'use client';

import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import nutritionRoutineApi, { CreateNutritionRoutineRequest } from '@/lib/nutritionRoutineApi';

interface NutritionRoutineBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingRoutine?: any;
}

interface FoodItem {
  food_name: string;
  quantity: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
}

interface Meal {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_name: string;
  description?: string;
  target_calories: number;
  target_protein_g?: number;
  target_carbs_g?: number;
  target_fat_g?: number;
  food_items: FoodItem[];
}

interface MealPlan {
  day_name: string;
  day_order: number;
  plan_name?: string;
  daily_calories: number;
  daily_protein_g?: number;
  daily_carbs_g?: number;
  daily_fat_g?: number;
  meals: Meal[];
}

const DAYS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
];

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' }
];

const COMMON_FOODS = [
  { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, per: '100g' },
  { name: 'Brown Rice', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, per: '100g' },
  { name: 'Eggs', calories: 155, protein: 13, carbs: 1.1, fat: 11, per: '100g' },
  { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, per: '100g' },
  { name: 'Avocado', calories: 160, protein: 2, carbs: 9, fat: 15, per: '100g' },
  { name: 'Oatmeal', calories: 68, protein: 2.4, carbs: 12, fat: 1.4, per: '100g' },
  { name: 'Greek Yogurt', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, per: '100g' },
  { name: 'Almonds', calories: 579, protein: 21, carbs: 22, fat: 50, per: '100g' },
  { name: 'Salmon', calories: 208, protein: 25, carbs: 0, fat: 12, per: '100g' },
  { name: 'Sweet Potato', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, per: '100g' }
];

export function NutritionRoutineBuilder({ isOpen, onClose, onSuccess, editingRoutine }: NutritionRoutineBuilderProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Basic routine info
  const [routineData, setRoutineData] = useState({
    name: editingRoutine?.name || '',
    description: editingRoutine?.description || '',
    difficulty: editingRoutine?.difficulty || 'beginner',
    duration_weeks: editingRoutine?.duration_weeks || 4,
    target_calories: editingRoutine?.target_calories || 2000,
    target_protein_g: editingRoutine?.target_protein_g || 150,
    target_carbs_g: editingRoutine?.target_carbs_g || 250,
    target_fat_g: editingRoutine?.target_fat_g || 67,
    tags: editingRoutine?.tags || []
  });

  // Meal plans
  const [mealPlans, setMealPlans] = useState<MealPlan[]>(
    editingRoutine?.meal_plans || [
      {
        day_name: 'monday',
        day_order: 0,
        plan_name: 'Monday Plan',
        daily_calories: 2000,
        daily_protein_g: 150,
        daily_carbs_g: 250,
        daily_fat_g: 67,
        meals: [
          {
            meal_type: 'breakfast',
            meal_name: 'Breakfast',
            target_calories: 500,
            target_protein_g: 30,
            target_carbs_g: 60,
            target_fat_g: 15,
            food_items: []
          },
          {
            meal_type: 'lunch',
            meal_name: 'Lunch',
            target_calories: 600,
            target_protein_g: 40,
            target_carbs_g: 80,
            target_fat_g: 20,
            food_items: []
          },
          {
            meal_type: 'dinner',
            meal_name: 'Dinner',
            target_calories: 700,
            target_protein_g: 50,
            target_carbs_g: 80,
            target_fat_g: 25,
            food_items: []
          },
          {
            meal_type: 'snack',
            meal_name: 'Snack',
            target_calories: 200,
            target_protein_g: 10,
            target_carbs_g: 30,
            target_fat_g: 7,
            food_items: []
          }
        ]
      }
    ]
  );

  const addMealPlan = () => {
    const newDay = DAYS[mealPlans.length] || DAYS[0];
    const newMealPlan: MealPlan = {
      day_name: newDay.value,
      day_order: mealPlans.length,
      plan_name: `${newDay.label} Plan`,
      daily_calories: routineData.target_calories,
      daily_protein_g: routineData.target_protein_g,
      daily_carbs_g: routineData.target_carbs_g,
      daily_fat_g: routineData.target_fat_g,
      meals: [
        {
          meal_type: 'breakfast',
          meal_name: 'Breakfast',
          target_calories: Math.round(routineData.target_calories * 0.25),
          target_protein_g: routineData.target_protein_g ? Math.round(routineData.target_protein_g * 0.2) : undefined,
          target_carbs_g: routineData.target_carbs_g ? Math.round(routineData.target_carbs_g * 0.25) : undefined,
          target_fat_g: routineData.target_fat_g ? Math.round(routineData.target_fat_g * 0.25) : undefined,
          food_items: []
        },
        {
          meal_type: 'lunch',
          meal_name: 'Lunch',
          target_calories: Math.round(routineData.target_calories * 0.35),
          target_protein_g: routineData.target_protein_g ? Math.round(routineData.target_protein_g * 0.3) : undefined,
          target_carbs_g: routineData.target_carbs_g ? Math.round(routineData.target_carbs_g * 0.35) : undefined,
          target_fat_g: routineData.target_fat_g ? Math.round(routineData.target_fat_g * 0.35) : undefined,
          food_items: []
        },
        {
          meal_type: 'dinner',
          meal_name: 'Dinner',
          target_calories: Math.round(routineData.target_calories * 0.35),
          target_protein_g: routineData.target_protein_g ? Math.round(routineData.target_protein_g * 0.4) : undefined,
          target_carbs_g: routineData.target_carbs_g ? Math.round(routineData.target_carbs_g * 0.35) : undefined,
          target_fat_g: routineData.target_fat_g ? Math.round(routineData.target_fat_g * 0.35) : undefined,
          food_items: []
        },
        {
          meal_type: 'snack',
          meal_name: 'Snack',
          target_calories: Math.round(routineData.target_calories * 0.05),
          target_protein_g: routineData.target_protein_g ? Math.round(routineData.target_protein_g * 0.1) : undefined,
          target_carbs_g: routineData.target_carbs_g ? Math.round(routineData.target_carbs_g * 0.05) : undefined,
          target_fat_g: routineData.target_fat_g ? Math.round(routineData.target_fat_g * 0.05) : undefined,
          food_items: []
        }
      ]
    };
    setMealPlans([...mealPlans, newMealPlan]);
  };

  const removeMealPlan = (index: number) => {
    setMealPlans(mealPlans.filter((_, i) => i !== index));
  };

  const updateMealPlan = (index: number, updates: Partial<MealPlan>) => {
    const updated = [...mealPlans];
    updated[index] = { ...updated[index], ...updates };
    setMealPlans(updated);
  };

  const addMeal = (mealPlanIndex: number) => {
    const mealPlan = mealPlans[mealPlanIndex];
    const newMeal: Meal = {
      meal_type: 'snack',
      meal_name: 'New Meal',
      target_calories: 200,
      food_items: []
    };
    const updated = [...mealPlans];
    updated[mealPlanIndex].meals.push(newMeal);
    setMealPlans(updated);
  };

  const removeMeal = (mealPlanIndex: number, mealIndex: number) => {
    const updated = [...mealPlans];
    updated[mealPlanIndex].meals.splice(mealIndex, 1);
    setMealPlans(updated);
  };

  const updateMeal = (mealPlanIndex: number, mealIndex: number, updates: Partial<Meal>) => {
    const updated = [...mealPlans];
    updated[mealPlanIndex].meals[mealIndex] = { ...updated[mealPlanIndex].meals[mealIndex], ...updates };
    setMealPlans(updated);
  };

  const addFoodItem = (mealPlanIndex: number, mealIndex: number) => {
    const newFood: FoodItem = {
      food_name: '',
      quantity: '100g',
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0
    };
    const updated = [...mealPlans];
    updated[mealPlanIndex].meals[mealIndex].food_items.push(newFood);
    setMealPlans(updated);
  };

  const removeFoodItem = (mealPlanIndex: number, mealIndex: number, foodIndex: number) => {
    const updated = [...mealPlans];
    updated[mealPlanIndex].meals[mealIndex].food_items.splice(foodIndex, 1);
    setMealPlans(updated);
  };

  const updateFoodItem = (mealPlanIndex: number, mealIndex: number, foodIndex: number, updates: Partial<FoodItem>) => {
    const updated = [...mealPlans];
    updated[mealPlanIndex].meals[mealIndex].food_items[foodIndex] = {
      ...updated[mealPlanIndex].meals[mealIndex].food_items[foodIndex],
      ...updates
    };
    setMealPlans(updated);
  };

  const addCommonFood = (mealPlanIndex: number, mealIndex: number, food: any) => {
    const newFood: FoodItem = {
      food_name: food.name,
      quantity: food.per,
      calories: food.calories,
      protein_g: food.protein,
      carbs_g: food.carbs,
      fat_g: food.fat
    };
    const updated = [...mealPlans];
    updated[mealPlanIndex].meals[mealIndex].food_items.push(newFood);
    setMealPlans(updated);
  };

  const saveRoutine = async () => {
    if (!routineData.name.trim()) {
      toast.error('Please enter a routine name');
      return;
    }

    if (mealPlans.length === 0) {
      toast.error('Please add at least one meal plan');
      return;
    }

    setLoading(true);
    try {
      const requestData: CreateNutritionRoutineRequest = {
        routine_data: {
          name: routineData.name,
          description: routineData.description,
          difficulty: routineData.difficulty as 'beginner' | 'intermediate' | 'advanced',
          duration_weeks: routineData.duration_weeks,
          tags: routineData.tags,
          target_calories: routineData.target_calories,
          target_protein_g: routineData.target_protein_g,
          target_carbs_g: routineData.target_carbs_g,
          target_fat_g: routineData.target_fat_g,
          target_fiber_g: routineData.target_protein_g ? routineData.target_protein_g * 0.1 : undefined,
          target_sugar_g: routineData.target_carbs_g ? routineData.target_carbs_g * 0.1 : undefined,
          target_sodium_mg: 2300
        },
        meal_plans: mealPlans.map((plan, index) => ({
          ...plan,
          day_order: index,
          meals: plan.meals.map((meal, mealIndex) => ({
            ...meal,
            order_index: mealIndex,
            food_items: meal.food_items.map((food, foodIndex) => ({
              ...food,
              order_index: foodIndex
            }))
          }))
        }))
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingRoutine ? 'Edit Nutrition Routine' : 'Create Nutrition Routine'}
          </DialogTitle>
          <DialogDescription>
            Build a comprehensive nutrition routine with daily meal plans and detailed food recommendations.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="meal-plans">Meal Plans</TabsTrigger>
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
                    placeholder="e.g., High Protein Diet"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={routineData.description}
                    onChange={(e) => setRoutineData({ ...routineData, description: e.target.value })}
                    placeholder="Brief description of this routine"
                  />
                </div>

                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={routineData.difficulty}
                    onValueChange={(value) => setRoutineData({ ...routineData, difficulty: value })}
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="duration">Duration (weeks)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="52"
                    value={routineData.duration_weeks}
                    onChange={(e) => setRoutineData({ ...routineData, duration_weeks: parseInt(e.target.value) || 4 })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Daily Macro Targets</h3>
                
                <div>
                  <Label htmlFor="calories">Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={routineData.target_calories}
                    onChange={(e) => setRoutineData({ ...routineData, target_calories: parseInt(e.target.value) || 2000 })}
                  />
                </div>

                <div>
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    value={routineData.target_protein_g || ''}
                    onChange={(e) => setRoutineData({ ...routineData, target_protein_g: parseFloat(e.target.value) || undefined })}
                  />
                </div>

                <div>
                  <Label htmlFor="carbs">Carbs (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    value={routineData.target_carbs_g || ''}
                    onChange={(e) => setRoutineData({ ...routineData, target_carbs_g: parseFloat(e.target.value) || undefined })}
                  />
                </div>

                <div>
                  <Label htmlFor="fat">Fat (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    value={routineData.target_fat_g || ''}
                    onChange={(e) => setRoutineData({ ...routineData, target_fat_g: parseFloat(e.target.value) || undefined })}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="meal-plans" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Daily Meal Plans</h3>
              <Button onClick={addMealPlan} >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Day
              </Button>
            </div>

            <div className="space-y-4">
              {mealPlans.map((mealPlan, mealPlanIndex) => (
                <Card key={mealPlanIndex}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">
                        {DAYS.find(d => d.value === mealPlan.day_name)?.label} Plan
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => removeMealPlan(mealPlanIndex)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label>Plan Name</Label>
                        <Input
                          value={mealPlan.plan_name || ''}
                          onChange={(e) => updateMealPlan(mealPlanIndex, { plan_name: e.target.value })}
                          placeholder="e.g., High Protein Day"
                        />
                      </div>
                      <div>
                        <Label>Daily Calories</Label>
                        <Input
                          type="number"
                          value={mealPlan.daily_calories}
                          onChange={(e) => updateMealPlan(mealPlanIndex, { daily_calories: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label>Protein (g)</Label>
                        <Input
                          type="number"
                          value={mealPlan.daily_protein_g || ''}
                          onChange={(e) => updateMealPlan(mealPlanIndex, { daily_protein_g: parseFloat(e.target.value) || undefined })}
                        />
                      </div>
                      <div>
                        <Label>Carbs (g)</Label>
                        <Input
                          type="number"
                          value={mealPlan.daily_carbs_g || ''}
                          onChange={(e) => updateMealPlan(mealPlanIndex, { daily_carbs_g: parseFloat(e.target.value) || undefined })}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Meals</h4>
                        <Button
                          variant="outline"
                          onClick={() => addMeal(mealPlanIndex)}
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Add Meal
                        </Button>
                      </div>

                      {mealPlan.meals.map((meal, mealIndex) => (
                        <Card key={mealIndex} className="border-l-4 border-l-blue-500">
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                              <div>
                                <Label>Meal Type</Label>
                                <Select
                                  value={meal.meal_type}
                                  onValueChange={(value) => updateMeal(mealPlanIndex, mealIndex, { meal_type: value as any })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {MEAL_TYPES.map(type => (
                                      <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Meal Name</Label>
                                <Input
                                  value={meal.meal_name}
                                  onChange={(e) => updateMeal(mealPlanIndex, mealIndex, { meal_name: e.target.value })}
                                  placeholder="e.g., Protein Pancakes"
                                />
                              </div>
                              <div>
                                <Label>Calories</Label>
                                <Input
                                  type="number"
                                  value={meal.target_calories}
                                  onChange={(e) => updateMeal(mealPlanIndex, mealIndex, { target_calories: parseInt(e.target.value) || 0 })}
                                />
                              </div>
                              <div className="flex items-end">
                                <Button
                                  variant="outline"
                                  onClick={() => removeMeal(mealPlanIndex, mealIndex)}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <h5 className="font-medium text-sm">Food Items</h5>
                                <Button
                                  variant="outline"
                                  onClick={() => addFoodItem(mealPlanIndex, mealIndex)}
                                >
                                  <PlusIcon className="h-4 w-4 mr-2" />
                                  Add Food
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                {COMMON_FOODS.map((food, foodIndex) => (
                                  <Button
                                    key={foodIndex}
                                    variant="outline"
                                    onClick={() => addCommonFood(mealPlanIndex, mealIndex, food)}
                                    className="text-xs"
                                  >
                                    {food.name}
                                  </Button>
                                ))}
                              </div>

                              {meal.food_items.map((food, foodIndex) => (
                                <div key={foodIndex} className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
                                  <div>
                                    <Label className="text-xs">Food Name</Label>
                                    <Input
                                      value={food.food_name}
                                      onChange={(e) => updateFoodItem(mealPlanIndex, mealIndex, foodIndex, { food_name: e.target.value })}
                                      placeholder="e.g., Chicken Breast"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Quantity</Label>
                                    <Input
                                      value={food.quantity}
                                      onChange={(e) => updateFoodItem(mealPlanIndex, mealIndex, foodIndex, { quantity: e.target.value })}
                                      placeholder="e.g., 100g"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Calories</Label>
                                    <Input
                                      type="number"
                                      value={food.calories}
                                      onChange={(e) => updateFoodItem(mealPlanIndex, mealIndex, foodIndex, { calories: parseInt(e.target.value) || 0 })}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Protein (g)</Label>
                                    <Input
                                      type="number"
                                      value={food.protein_g || ''}
                                      onChange={(e) => updateFoodItem(mealPlanIndex, mealIndex, foodIndex, { protein_g: parseFloat(e.target.value) || undefined })}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Carbs (g)</Label>
                                    <Input
                                      type="number"
                                      value={food.carbs_g || ''}
                                      onChange={(e) => updateFoodItem(mealPlanIndex, mealIndex, foodIndex, { carbs_g: parseFloat(e.target.value) || undefined })}
                                    />
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="outline"
                                      onClick={() => removeFoodItem(mealPlanIndex, mealIndex, foodIndex)}
                                    >
                                      <TrashIcon className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
    </Dialog>
  );
}
