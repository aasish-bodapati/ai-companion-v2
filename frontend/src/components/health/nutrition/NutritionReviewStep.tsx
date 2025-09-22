import React from 'react';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { MealData } from '@/services/nutritionLoggerService';
import { 
  calculateMacroPercentages, 
  formatCalories, 
  formatNutritionValue, 
  getNutritionalInsights 
} from '@/utils/nutritionUtils';

interface NutritionReviewStepProps {
  mealData: MealData;
}

export function NutritionReviewStep({ mealData }: NutritionReviewStepProps) {
  const macroPercentages = calculateMacroPercentages(
    mealData.total_calories,
    mealData.protein_g,
    mealData.carbs_g,
    mealData.fat_g
  );

  const insights = getNutritionalInsights(mealData);

  return (
    <div className="space-y-6">
      {/* Calorie Summary */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-lg">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {formatCalories(mealData.total_calories)}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Total Calories</div>
        </div>
      </div>

      {/* Macronutrient Breakdown */}
      <div>
        <h3 className="font-medium mb-4">Macronutrient Breakdown</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatNutritionValue(mealData.protein_g)}g
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Protein</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {macroPercentages.protein.toFixed(0)}%
            </div>
          </div>
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {formatNutritionValue(mealData.carbs_g)}g
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Carbs</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {macroPercentages.carbs.toFixed(0)}%
            </div>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatNutritionValue(mealData.fat_g)}g
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Fat</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {macroPercentages.fat.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Additional Nutrients */}
      <div>
        <h3 className="font-medium mb-4">Additional Nutrients</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Fiber:</span>
            <span className="font-medium">{formatNutritionValue(mealData.fiber_g)}g</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Sugar:</span>
            <span className="font-medium">{formatNutritionValue(mealData.sugar_g)}g</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Sodium:</span>
            <span className="font-medium">{Math.round(mealData.sodium_mg)}mg</span>
          </div>
        </div>
      </div>

      {/* Nutritional Insights */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-medium mb-3">Quick Insights</h3>
        <div className="space-y-2 text-sm">
          {insights.map((insight, index) => (
            <div 
              key={index} 
              className={`flex items-center gap-2 ${
                insight.type === 'positive' 
                  ? 'text-green-600 dark:text-green-400'
                  : insight.type === 'warning'
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {insight.type === 'positive' ? (
                <CheckCircleIcon className="h-4 w-4" />
              ) : insight.type === 'warning' ? (
                <ClockIcon className="h-4 w-4" />
              ) : null}
              <span>{insight.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
