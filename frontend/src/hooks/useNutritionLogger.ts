import { useState, useEffect, useCallback } from 'react';
import { nutritionLoggerService, MealData, Food, FoodItem } from '@/services/nutritionLoggerService';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface UseNutritionLoggerOptions {
  initialData?: Partial<MealData>;
  routineContext?: {
    id: string;
    name: string;
    todaysMeals?: any[];
  };
  onSuccess?: () => void;
}

export interface UseNutritionLoggerReturn {
  // Data
  mealData: MealData;
  foodSuggestions: Food[];
  searchResults: Food[];
  searchQuery: string;
  loading: boolean;
  lastLogId: string | null;
  showFeedback: boolean;
  
  // Actions
  updateMealData: (updates: Partial<MealData>) => void;
  addFoodItem: (food: Food, servingGrams?: number) => void;
  removeFoodItem: (index: number) => void;
  updateFoodItem: (index: number, updates: Partial<FoodItem>) => void;
  searchFoods: (query: string) => Promise<void>;
  loadFoodSuggestions: () => Promise<void>;
  logMeal: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setShowFeedback: (show: boolean) => void;
  
  // Computed values
  nutritionTotals: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sugar_g: number;
    sodium_mg: number;
  };
}

export function useNutritionLogger(options: UseNutritionLoggerOptions = {}): UseNutritionLoggerReturn {
  const { initialData, routineContext, onSuccess } = options;
  
  const [mealData, setMealData] = useState<MealData>({
    meal_type: '',
    food_items: [],
    total_calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 0,
    ...initialData
  });
  
  const [foodSuggestions, setFoodSuggestions] = useState<Food[]>([]);
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastLogId, setLastLogId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  /**
   * Update meal data
   */
  const updateMealData = useCallback((updates: Partial<MealData>) => {
    setMealData(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Add a food item to the meal
   */
  const addFoodItem = useCallback((food: Food, servingGrams: number = food.user_avg_serving_grams || 100) => {
    const foodItem = nutritionLoggerService.createFoodItem(food, servingGrams);
    
    setMealData(prev => ({
      ...prev,
      food_items: [...prev.food_items, foodItem]
    }));
    
    logger.debug('Food item added:', { food: food.name, servingGrams });
  }, []);

  /**
   * Remove a food item from the meal
   */
  const removeFoodItem = useCallback((index: number) => {
    setMealData(prev => ({
      ...prev,
      food_items: prev.food_items.filter((_, i) => i !== index)
    }));
    
    logger.debug('Food item removed:', { index });
  }, []);

  /**
   * Update a food item in the meal
   */
  const updateFoodItem = useCallback((index: number, updates: Partial<FoodItem>) => {
    setMealData(prev => ({
      ...prev,
      food_items: prev.food_items.map((item, i) => 
        i === index ? { ...item, ...updates } : item
      )
    }));
    
    logger.debug('Food item updated:', { index, updates });
  }, []);

  /**
   * Search for foods
   */
  const searchFoods = useCallback(async (query: string) => {
    try {
      setSearchQuery(query);
      
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      const results = await nutritionLoggerService.searchFoods(query);
      setSearchResults(results);
      
      logger.debug('Food search completed:', { query, count: results.length });
    } catch (error) {
      logger.error('Failed to search foods:', error);
      toast.error('Failed to search foods');
    }
  }, []);

  /**
   * Load food suggestions
   */
  const loadFoodSuggestions = useCallback(async () => {
    try {
      const suggestions = await nutritionLoggerService.getFoodSuggestions(mealData.meal_type);
      setFoodSuggestions(suggestions);
      
      logger.debug('Food suggestions loaded:', { count: suggestions.length });
    } catch (error) {
      logger.error('Failed to load food suggestions:', error);
    }
  }, [mealData.meal_type]);

  /**
   * Log the meal
   */
  const logMeal = useCallback(async () => {
    if (mealData.food_items.length === 0) {
      toast.error('Please add at least one food item');
      return;
    }

    setLoading(true);
    try {
      const response = await nutritionLoggerService.logMeal(mealData, routineContext);
      
      toast.success('Meal logged successfully! 🍽️');
      
      // Show instant feedback
      if (response.log_id) {
        setLastLogId(response.log_id);
        setShowFeedback(true);
      }

      onSuccess?.();
      
      logger.debug('Meal logged successfully:', { logId: response.log_id });
    } catch (error) {
      logger.error('Failed to log meal:', error);
      toast.error('Failed to log meal. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [mealData, routineContext, onSuccess]);

  /**
   * Calculate nutrition totals
   */
  const nutritionTotals = nutritionLoggerService.calculateNutrition(mealData.food_items);

  // Update meal data with calculated nutrition
  useEffect(() => {
    setMealData(prev => ({ ...prev, ...nutritionTotals }));
  }, [nutritionTotals]);

  // Load food suggestions when meal type changes
  useEffect(() => {
    if (mealData.meal_type) {
      loadFoodSuggestions();
    }
  }, [mealData.meal_type, loadFoodSuggestions]);

  return {
    // Data
    mealData,
    foodSuggestions,
    searchResults,
    searchQuery,
    loading,
    lastLogId,
    showFeedback,
    
    // Actions
    updateMealData,
    addFoodItem,
    removeFoodItem,
    updateFoodItem,
    searchFoods,
    loadFoodSuggestions,
    logMeal,
    setSearchQuery,
    setShowFeedback,
    
    // Computed values
    nutritionTotals
  };
}
