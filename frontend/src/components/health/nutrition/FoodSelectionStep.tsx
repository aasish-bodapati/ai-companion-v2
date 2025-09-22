import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusIcon, MinusIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { MealData, Food, FoodItem } from '@/services/nutritionLoggerService';
import { calculateServingMultiplier, calculateNutritionPerServing } from '@/utils/nutritionUtils';

interface FoodSelectionStepProps {
  mealData: MealData;
  addFoodItem: (food: Food, servingGrams?: number) => void;
  removeFoodItem: (index: number) => void;
  updateFoodItem: (index: number, updates: Partial<FoodItem>) => void;
  foodSuggestions: Food[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Food[];
  onSearch: (query: string) => Promise<void>;
}

export function FoodSelectionStep({
  mealData,
  addFoodItem,
  removeFoodItem,
  updateFoodItem,
  foodSuggestions,
  searchQuery,
  setSearchQuery,
  searchResults,
  onSearch
}: FoodSelectionStepProps) {
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [servingAmount, setServingAmount] = useState<number>(100);

  const handleFoodSelect = (food: Food) => {
    setSelectedFood(food);
    setServingAmount(food.user_avg_serving_grams || 100);
  };

  const handleAddFood = () => {
    if (selectedFood) {
      addFoodItem(selectedFood, servingAmount);
      setSelectedFood(null);
      setServingAmount(100);
    }
  };

  const updateServingSize = (index: number, newGrams: number) => {
    const item = mealData.food_items[index];
    const multiplier = calculateServingMultiplier(newGrams);
    
    updateFoodItem(index, {
      serving_grams: newGrams,
      calories: calculateNutritionPerServing(item.food.calories_per_100g, newGrams),
      protein_g: calculateNutritionPerServing(item.food.protein_per_100g || 0, newGrams),
      carbs_g: calculateNutritionPerServing(item.food.carbs_per_100g || 0, newGrams),
      fat_g: calculateNutritionPerServing(item.food.fat_per_100g || 0, newGrams)
    });
  };

  return (
    <div className="space-y-6">
      {/* Current Food Items */}
      {mealData.food_items.length > 0 && (
        <div>
          <h3 className="font-medium mb-3">Your {mealData.meal_type}</h3>
          <div className="space-y-3">
            {mealData.food_items.map((item: FoodItem, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{item.food.name}</h4>
                  {item.food.brand && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.food.brand}</p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {Math.round(item.calories)} cal • {item.protein_g.toFixed(1)}g protein
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={item.serving_grams}
                    onChange={(e) => updateServingSize(index, parseFloat(e.target.value) || 0)}
                    className="w-20 text-center"
                  />
                  <span className="text-sm text-gray-600">g</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFoodItem(index)}
                  >
                    <MinusIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Food Suggestions */}
      {foodSuggestions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <SparklesIcon className="h-5 w-5 text-yellow-500" />
            <h3 className="font-medium">Suggested for {mealData.meal_type}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {foodSuggestions.map((food: Food) => (
              <div
                key={food.id}
                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleFoodSelect(food)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{food.name}</h4>
                    {food.brand && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{food.brand}</p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {food.calories_per_100g} cal/100g
                    </p>
                    {food.user_times_logged && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Logged {food.user_times_logged} times
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      addFoodItem(food);
                    }}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Food Search */}
      <div>
        <Label htmlFor="food-search">Search Foods</Label>
        <Input
          id="food-search"
          placeholder="Search for foods..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            onSearch(e.target.value);
          }}
        />
        
        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map((food: Food) => (
              <div
                key={food.id}
                className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => handleFoodSelect(food)}
              >
                <div>
                  <h4 className="font-medium text-sm">{food.name}</h4>
                  {food.brand && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">{food.brand}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    addFoodItem(food);
                  }}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Food Details */}
      {selectedFood && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
            Add {selectedFood.name}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="serving-amount">Serving Size (grams)</Label>
              <Input
                id="serving-amount"
                type="number"
                value={servingAmount}
                onChange={(e) => setServingAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Calories</Label>
              <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                {Math.round(calculateNutritionPerServing(selectedFood.calories_per_100g, servingAmount))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAddFood} size="sm">
              Add to Meal
            </Button>
            <Button variant="outline" onClick={() => setSelectedFood(null)} size="sm">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
