'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RoutineBuilderConfig } from './GenericRoutineBuilder';
import { nutritionRoutineApi } from '@/lib/nutritionRoutineApi';

// Nutrition-specific interfaces
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
  meal_name: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  target_calories: number;
  food_items: FoodItem[];
}

export const nutritionRoutineConfig: RoutineBuilderConfig<Meal, FoodItem> = {
  routineType: 'nutrition',
  itemType: 'meals',
  subItemType: 'food_items',
  itemTypeOptions: ['breakfast', 'lunch', 'dinner'],
  defaultItemName: 'New Meal',
  defaultSubItemName: 'New Food',
  
  createRoutine: async (data) => {
    return await nutritionRoutineApi.createRoutineWithMealPlans(data);
  },
  
  createItem: (mealType: string): Meal => ({
    id: `meal-${Date.now()}`,
    meal_name: 'New Meal',
    meal_type: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    target_calories: 500,
    food_items: []
  }),
  
  createSubItem: (): FoodItem => ({
    id: `food-${Date.now()}`,
    food_name: 'New Food',
    quantity: '1 serving',
    calories: 100,
    protein_g: 10,
    carbs_g: 15,
    fat_g: 5
  }),
  
  updateItem: (item: Meal, updates: Partial<Meal>): Meal => ({
    ...item,
    ...updates
  }),
  
  updateSubItem: (subItem: FoodItem, updates: Partial<FoodItem>): FoodItem => ({
    ...subItem,
    ...updates
  }),
  
  validateItem: (item: Meal): boolean => {
    return !!(item.meal_name && item.meal_type);
  },
  
  validateSubItem: (subItem: FoodItem): boolean => {
    return !!(subItem.food_name && subItem.quantity && subItem.calories);
  },
  
  renderItemForm: (item: Meal, onUpdate: (updates: Partial<Meal>) => void) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
      <div>
        <Label className="text-xs">Meal Name</Label>
        <Input
          value={item.meal_name}
          onChange={(e) => onUpdate({ meal_name: e.target.value })}
          className="h-8 text-sm"
        />
      </div>
      <div>
        <Label className="text-xs">Type</Label>
        <Select 
          value={item.meal_type} 
          onValueChange={(value: string) => onUpdate({ meal_type: value as any })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="breakfast">Breakfast</SelectItem>
            <SelectItem value="lunch">Lunch</SelectItem>
            <SelectItem value="dinner">Dinner</SelectItem>
            <SelectItem value="snack">Snack</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Calories</Label>
        <Input
          type="number"
          value={item.target_calories}
          onChange={(e) => onUpdate({ target_calories: parseInt(e.target.value) || 0 })}
          className="h-8 text-sm"
        />
      </div>
    </div>
  ),
  
  renderSubItemForm: (subItem: FoodItem, onUpdate: (updates: Partial<FoodItem>) => void) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
      <div>
        <Label className="text-xs">Food Name</Label>
        <Input
          value={subItem.food_name}
          onChange={(e) => onUpdate({ food_name: e.target.value })}
          className="h-6 text-xs"
        />
      </div>
      <div>
        <Label className="text-xs">Quantity</Label>
        <Input
          value={subItem.quantity}
          onChange={(e) => onUpdate({ quantity: e.target.value })}
          className="h-6 text-xs"
        />
      </div>
      <div>
        <Label className="text-xs">Calories</Label>
        <Input
          type="number"
          value={subItem.calories}
          onChange={(e) => onUpdate({ calories: parseInt(e.target.value) || 0 })}
          className="h-6 text-xs"
        />
      </div>
      <div>
        <Label className="text-xs">Protein (g)</Label>
        <Input
          type="number"
          value={subItem.protein_g || 0}
          onChange={(e) => onUpdate({ protein_g: parseFloat(e.target.value) || 0 })}
          className="h-6 text-xs"
        />
      </div>
    </div>
  )
};
