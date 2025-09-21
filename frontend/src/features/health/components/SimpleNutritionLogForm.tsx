'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { PlusIcon, TrashIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';
import { logger } from '@/lib/logger';

interface SimpleNutritionLogFormProps {
  onSuccess: () => void;
}

interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}

interface NutritionLogData {
  meal_type: string;
  meal_name?: string;
  total_calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  food_items: string; // JSON string as expected by API
  notes?: string;
  mood_before?: string;
  mood_after?: string;
  meal_date: string;
}

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

export function SimpleNutritionLogForm({ onSuccess }: SimpleNutritionLogFormProps) {
  const [loading, setLoading] = useState(false);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([
    { name: '', quantity: '', calories: 0 }
  ]);
  const [formData, setFormData] = useState<NutritionLogData>({
    meal_type: 'breakfast',
    meal_name: '',
    total_calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 0,
    food_items: '[]', // JSON string
    notes: '',
    mood_before: '',
    mood_after: '',
    meal_date: new Date().toISOString().slice(0, 16)
  });

  const handleInputChange = (field: keyof NutritionLogData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addFoodItem = () => {
    setFoodItems(prev => [...prev, { name: '', quantity: '', calories: 0 }]);
  };

  const removeFoodItem = (index: number) => {
    if (foodItems.length > 1) {
      setFoodItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateFoodItem = (index: number, field: keyof FoodItem, value: string | number) => {
    setFoodItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const selectCommonFood = (index: number, food: typeof COMMON_FOODS[0]) => {
    updateFoodItem(index, 'name', food.name);
    updateFoodItem(index, 'calories', food.calories);
    updateFoodItem(index, 'protein_g', food.protein);
    updateFoodItem(index, 'carbs_g', food.carbs);
    updateFoodItem(index, 'fat_g', food.fat);
  };

  const calculateTotals = () => {
    const totals = foodItems.reduce((acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein_g || 0),
      carbs: acc.carbs + (item.carbs_g || 0),
      fat: acc.fat + (item.fat_g || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const validFoodItems = foodItems.filter(item => item.name.trim() !== '');
    
    setFormData(prev => ({
      ...prev,
      total_calories: totals.calories,
      protein_g: totals.protein,
      carbs_g: totals.carbs,
      fat_g: totals.fat,
      food_items: JSON.stringify(validFoodItems) // Convert to JSON string
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.meal_type) {
      toast.error('Please select a meal type');
      return;
    }

    if (foodItems.every(item => item.name.trim() === '')) {
      toast.error('Please add at least one food item');
      return;
    }

    setLoading(true);
    try {
      logger.debug('Submitting nutrition data:', formData);
      const response = await api.post('/health/logging/nutrition', formData);
      logger.debug('Nutrition log response:', response);
      toast.success('Meal logged successfully!');
      onSuccess();
      
      // Reset form
      setFormData({
        meal_type: 'breakfast',
        meal_name: '',
        total_calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fiber_g: 0,
        sugar_g: 0,
        sodium_mg: 0,
        food_items: '[]',
        notes: '',
        mood_before: '',
        mood_after: '',
        meal_date: new Date().toISOString().slice(0, 16)
      });
      setFoodItems([{ name: '', quantity: '', calories: 0 }]);
    } catch (error) {
      console.error('Failed to log meal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to log meal: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="meal_type">Meal Type</Label>
          <Select value={formData.meal_type} onValueChange={(value) => handleInputChange('meal_type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select meal type" />
            </SelectTrigger>
            <SelectContent>
              {MEAL_TYPES.map(meal => (
                <SelectItem key={meal.value} value={meal.value}>
                  {meal.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meal_name">Meal Name (Optional)</Label>
          <Input
            id="meal_name"
            value={formData.meal_name}
            onChange={(e) => handleInputChange('meal_name', e.target.value)}
            placeholder="e.g., Morning Oatmeal"
          />
        </div>
      </div>

      {/* Food Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalculatorIcon className="h-5 w-5" />
            Food Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {foodItems.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>Food Name</Label>
                <Input
                  value={item.name}
                  onChange={(e) => updateFoodItem(index, 'name', e.target.value)}
                  placeholder="Enter food name"
                />
                <div className="text-xs text-gray-500">
                  <Select onValueChange={(value) => selectCommonFood(index, COMMON_FOODS.find(f => f.name === value)!)}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Quick select" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_FOODS.map(food => (
                        <SelectItem key={food.name} value={food.name}>
                          {food.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  value={item.quantity}
                  onChange={(e) => updateFoodItem(index, 'quantity', e.target.value)}
                  placeholder="e.g., 1 cup, 200g"
                />
              </div>

              <div className="space-y-2">
                <Label>Calories</Label>
                <Input
                  type="number"
                  value={item.calories}
                  onChange={(e) => updateFoodItem(index, 'calories', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>

              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  onClick={() => removeFoodItem(index)}
                  variant="outline"
                  size="sm"
                  disabled={foodItems.length === 1}
                  className="text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button
            type="button"
            onClick={addFoodItem}
            variant="outline"
            className="w-full"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Food Item
          </Button>

          <Button
            type="button"
            onClick={calculateTotals}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <CalculatorIcon className="h-4 w-4 mr-2" />
            Calculate Totals
          </Button>
        </CardContent>
      </Card>

      {/* Totals */}
      {formData.total_calories > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Meal Totals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Calories</p>
                <p className="text-2xl font-bold text-orange-600">{formData.total_calories}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Protein</p>
                <p className="text-2xl font-bold text-red-600">{formData.protein_g}g</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Carbs</p>
                <p className="text-2xl font-bold text-yellow-600">{formData.carbs_g}g</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Fat</p>
                <p className="text-2xl font-bold text-green-600">{formData.fat_g}g</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Any additional notes about this meal..."
          rows={3}
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading || formData.total_calories === 0}
          className="bg-green-600 hover:bg-green-700 px-8"
        >
          {loading ? 'Logging Meal...' : 'Log Meal'}
        </Button>
      </div>
    </form>
  );
}
