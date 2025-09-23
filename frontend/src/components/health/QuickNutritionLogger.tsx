'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  FireIcon,
  HeartIcon,
  TrophyIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { nutritionLoggerService } from '@/services/nutritionLoggerService';

interface Food {
  id: string;
  name: string;
  brand?: string;
  calories_per_100g: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  user_avg_serving_grams?: number;
}

interface QuickNutritionLoggerProps {
  onSuccess: () => void;
}

export function QuickNutritionLogger({ onSuccess }: QuickNutritionLoggerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [recentFoods, setRecentFoods] = useState<Food[]>([]);
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);


  // Get suggested meal type based on current time
  const getSuggestedMealType = (): string => {
    const currentHour = new Date().getHours();
    if (currentHour >= 6 && currentHour < 11) return 'breakfast';
    if (currentHour >= 11 && currentHour < 16) return 'lunch';
    if (currentHour >= 16 && currentHour < 22) return 'dinner';
    return 'snack';
  };

  // Get default serving size for a food
  const getDefaultServing = (food: Food): number => {
    if (food.user_avg_serving_grams) return food.user_avg_serving_grams;
    return 100; // Default to 100g
  };

  // Load recent foods
  useEffect(() => {
    const loadRecentFoods = async () => {
      try {
        const foods = await nutritionLoggerService.getRecentFoods(5);
        setRecentFoods(foods);
      } catch (error) {
        console.error('Failed to load recent foods:', error);
      }
    };
    loadRecentFoods();
  }, []);

  // Set initial meal type
  useEffect(() => {
    setSelectedMealType(getSuggestedMealType());
  }, []);

  // Search for foods
  const searchFoods = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      logger.debug('Searching foods:', { query });
      const foods = await nutritionLoggerService.searchFoods(query, 8);
      setSearchResults(foods);
      logger.debug('Food search results:', { count: foods.length });
    } catch (error) {
      logger.error('Food search failed:', error);
      toast.error('Search failed', {
        description: 'Could not search for foods. Please try again.'
      });
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchFoods(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchFoods]);

  // Log a meal with a single food
  const logQuickMeal = async (food: Food) => {
    setLoading(true);
    try {
      const servingGrams = getDefaultServing(food);
      const nutrition = await nutritionLoggerService.getFoodNutrition(food.id, servingGrams);
      
      const mealData = {
        meal_type: selectedMealType,
        meal_name: food.name,
        food_items: [{
          food,
          serving_grams: servingGrams,
          calories: nutrition.calories,
          protein_g: nutrition.protein_g,
          carbs_g: nutrition.carbs_g,
          fat_g: nutrition.fat_g,
          fiber_g: nutrition.fiber_g,
          sugar_g: nutrition.sugar_g,
          sodium_mg: nutrition.sodium_mg
        }],
        total_calories: Math.round(nutrition.calories),
        protein_g: Math.round(nutrition.protein_g * 10) / 10,
        carbs_g: Math.round(nutrition.carbs_g * 10) / 10,
        fat_g: Math.round(nutrition.fat_g * 10) / 10,
        fiber_g: Math.round(nutrition.fiber_g * 10) / 10,
        sugar_g: Math.round(nutrition.sugar_g * 10) / 10,
        sodium_mg: Math.round(nutrition.sodium_mg),
        meal_date: new Date().toISOString(),
        use_smart_defaults: true
      };

      await nutritionLoggerService.logMeal(mealData);
      
      toast.success('Meal logged!', {
        description: `${food.name} has been successfully logged.`
      });
      onSuccess();
      
      // Reset form
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      logger.error('Failed to log meal:', error);
      toast.error('Logging failed', {
        description: 'Could not log your meal. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Log Your Meal
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Search for foods and log your meal quickly
        </p>
      </div>

      {/* Search Input and Meal Type */}
      <div className="flex gap-4 items-end">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search for foods (e.g., chicken, rice, apple)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Meal:</Label>
          <Select value={selectedMealType} onValueChange={setSelectedMealType}>
            <SelectTrigger className="w-32 h-12">
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
      </div>

      {/* Recent Foods */}
      {!searchQuery && recentFoods.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Foods</h3>
          <div className="flex flex-wrap gap-2">
            {recentFoods.map((food) => (
              <Button
                key={food.id}
                variant="outline"
                size="sm"
                onClick={() => logQuickMeal(food)}
                className="text-sm h-8"
                disabled={loading}
              >
                {food.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchQuery && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Search Results</h3>
          {searching ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
              <span className="ml-3 text-sm text-gray-600">Searching...</span>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {searchResults.map((food) => (
                <button
                  key={food.id}
                  onClick={() => logQuickMeal(food)}
                  disabled={loading}
                  className="w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:shadow-lg transition-all duration-300 p-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {food.name}
                      </h4>
                      {food.brand && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {food.brand}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                          {Math.round(food.calories_per_100g)} cal/100g
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <span>P: {Math.round((food.protein_per_100g || 0) * 10) / 10}g</span>
                          <span>•</span>
                          <span>C: {Math.round((food.carbs_per_100g || 0) * 10) / 10}g</span>
                          <span>•</span>
                          <span>F: {Math.round((food.fat_per_100g || 0) * 10) / 10}g</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                        {loading ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                        ) : (
                          <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No foods found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Try searching for "{searchQuery}" with different terms
              </p>
            </div>
          )}
        </div>
      )}


      {/* Instructions */}
      {!searchQuery && searchResults.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FireIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Quick Meal Logging
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Search for any food to log your meal instantly
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <p>• Type food names to search our database</p>
            <p>• Click any food to log it immediately</p>
            <p>• Meal type is auto-suggested by time</p>
          </div>
        </div>
      )}
    </div>
  );
}
