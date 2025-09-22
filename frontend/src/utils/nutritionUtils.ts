/**
 * Utility functions for nutrition calculations and formatting
 */

export interface MacroPercentages {
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Calculate macro percentages from nutrition data
 */
export function calculateMacroPercentages(
  totalCalories: number,
  proteinG: number,
  carbsG: number,
  fatG: number
): MacroPercentages {
  if (totalCalories <= 0) {
    return { protein: 0, carbs: 0, fat: 0 };
  }

  return {
    protein: (proteinG * 4 / totalCalories) * 100,
    carbs: (carbsG * 4 / totalCalories) * 100,
    fat: (fatG * 9 / totalCalories) * 100
  };
}

/**
 * Get suggested meal type based on current time
 */
export function getSuggestedMealType(): string {
  const currentHour = new Date().getHours();
  
  if (currentHour >= 6 && currentHour < 11) return 'breakfast';
  if (currentHour >= 11 && currentHour < 16) return 'lunch';
  if (currentHour >= 16 && currentHour < 22) return 'dinner';
  return 'snack';
}

/**
 * Get current time formatted for display
 */
export function getCurrentTimeFormatted(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Get meal types with metadata
 */
export function getMealTypes() {
  return [
    { 
      id: 'breakfast', 
      name: 'Breakfast', 
      icon: '🌅', 
      description: 'Start your day right',
      time: '6:00 - 11:00 AM'
    },
    { 
      id: 'lunch', 
      name: 'Lunch', 
      icon: '☀️', 
      description: 'Midday fuel',
      time: '11:00 AM - 4:00 PM'
    },
    { 
      id: 'dinner', 
      name: 'Dinner', 
      icon: '🌙', 
      description: 'Evening meal',
      time: '4:00 - 10:00 PM'
    },
    { 
      id: 'snack', 
      name: 'Snack', 
      icon: '🍎', 
      description: 'Quick bite',
      time: 'Anytime'
    }
  ];
}

/**
 * Get mood options
 */
export function getMoodOptions() {
  return ['hungry', 'satisfied', 'full', 'craving', 'energetic', 'tired'];
}

/**
 * Format nutrition value with appropriate decimal places
 */
export function formatNutritionValue(value: number, decimals: number = 1): string {
  return value.toFixed(decimals);
}

/**
 * Format calories with rounding
 */
export function formatCalories(calories: number): number {
  return Math.round(calories);
}

/**
 * Get nutritional insights based on meal data
 */
export function getNutritionalInsights(mealData: {
  protein_g: number;
  fiber_g: number;
  total_calories: number;
  meal_type: string;
}) {
  const insights = [];

  if (mealData.protein_g >= 20) {
    insights.push({
      type: 'positive',
      icon: 'CheckCircleIcon',
      message: 'Great protein content!'
    });
  }

  if (mealData.fiber_g >= 5) {
    insights.push({
      type: 'positive',
      icon: 'CheckCircleIcon',
      message: 'Good source of fiber'
    });
  }

  if (mealData.total_calories < 200 && mealData.meal_type !== 'snack') {
    insights.push({
      type: 'warning',
      icon: 'ClockIcon',
      message: 'Consider adding more calories for a complete meal'
    });
  }

  return insights;
}

/**
 * Validate meal data before submission
 */
export function validateMealData(mealData: {
  meal_type: string;
  food_items: any[];
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!mealData.meal_type) {
    errors.push('Please select a meal type');
  }

  if (mealData.food_items.length === 0) {
    errors.push('Please add at least one food item');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculate serving size multiplier
 */
export function calculateServingMultiplier(servingGrams: number): number {
  return servingGrams / 100;
}

/**
 * Calculate nutrition per serving
 */
export function calculateNutritionPerServing(
  nutritionPer100g: number,
  servingGrams: number
): number {
  return (nutritionPer100g * servingGrams) / 100;
}

/**
 * Get nutrition color based on value and thresholds
 */
export function getNutritionColor(
  value: number,
  goodThreshold: number,
  warningThreshold: number = goodThreshold * 0.5
): 'green' | 'yellow' | 'red' | 'gray' {
  if (value >= goodThreshold) return 'green';
  if (value >= warningThreshold) return 'yellow';
  if (value > 0) return 'red';
  return 'gray';
}

/**
 * Format macro percentage for display
 */
export function formatMacroPercentage(percentage: number): string {
  return `${percentage.toFixed(0)}%`;
}
