import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { MealData } from '@/services/nutritionLoggerService';
import { getSuggestedMealType, getCurrentTimeFormatted, getMealTypes } from '@/utils/nutritionUtils';

interface MealTypeStepProps {
  mealData: MealData;
  updateMealData: (updates: Partial<MealData>) => void;
  routineContext?: {
    id: string;
    name: string;
    todaysMeals?: any[];
  };
}

export function MealTypeStep({ mealData, updateMealData, routineContext }: MealTypeStepProps) {
  const suggestedMealType = getSuggestedMealType();
  const currentTime = getCurrentTimeFormatted();
  const mealTypes = getMealTypes();

  const handleMealTypeSelect = (mealType: string) => {
    updateMealData({ 
      meal_type: mealType,
      meal_time: new Date().toTimeString().slice(0, 5)
    });
  };

  return (
    <div className="space-y-6">
      {/* Routine Context */}
      {routineContext && (
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
            {routineContext.name} Plan
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300">
            Following your nutrition routine for optimal results
          </p>
        </div>
      )}

      {/* Smart Suggestion */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <SparklesIcon className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-blue-900 dark:text-blue-100">Smart Suggestion</h3>
        </div>
        <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
          Based on the current time ({currentTime}), 
          we suggest logging <strong>{suggestedMealType}</strong>
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleMealTypeSelect(suggestedMealType)}
          className="text-blue-600 border-blue-300"
        >
          Use Suggestion: {suggestedMealType}
        </Button>
      </div>

      {/* Meal Type Selection */}
      <div>
        <h3 className="font-medium mb-4">Select Meal Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {mealTypes.map((meal) => (
            <div
              key={meal.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors text-center ${
                mealData.meal_type === meal.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => handleMealTypeSelect(meal.id)}
            >
              <div className="text-2xl mb-2">{meal.icon}</div>
              <h4 className="font-medium">{meal.name}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {meal.description}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {meal.time}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Meal Name */}
      {mealData.meal_type && (
        <div>
          <Label htmlFor="meal-name">Meal Name (Optional)</Label>
          <Input
            id="meal-name"
            placeholder={`Enter custom ${mealData.meal_type} name`}
            value={mealData.meal_name || ''}
            onChange={(e) => updateMealData({ meal_name: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
