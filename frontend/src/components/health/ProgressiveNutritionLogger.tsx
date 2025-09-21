'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CheckCircleIcon,
  ClockIcon,
  FireIcon,
  SparklesIcon,
  PlusIcon,
  MinusIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { InstantFeedback } from './InstantFeedback';
import api from '@/lib/api';

interface Food {
  id: string;
  name: string;
  brand?: string;
  category: string;
  calories_per_100g: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  fiber_per_100g?: number;
  sugar_per_100g?: number;
  sodium_per_100g?: number;
  common_serving_sizes?: Array<{name: string; grams: number}>;
  user_times_logged?: number;
  user_avg_serving_grams?: number;
}

interface FoodItem {
  food: Food;
  serving_grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface MealStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  isComplete: boolean;
  isOptional?: boolean;
}

interface MealData {
  // Step 1: Meal Type & Time
  meal_type: string;
  meal_name?: string;
  meal_time?: string;
  
  // Step 2: Food Selection
  food_items: FoodItem[];
  
  // Step 3: Nutritional Review
  total_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  
  // Step 4: Context & Notes
  routineId?: string;
  notes?: string;
  mood_before?: string;
  mood_after?: string;
}

interface ProgressiveNutritionLoggerProps {
  onSuccess?: () => void;
  initialData?: Partial<MealData>;
  routineContext?: {
    id: string;
    name: string;
    todaysMeals?: any[];
  };
}

export function ProgressiveNutritionLogger({
  onSuccess,
  initialData,
  routineContext
}: ProgressiveNutritionLoggerProps) {
  const [currentStep, setCurrentStep] = useState(0);
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
  const [loading, setLoading] = useState(false);
  const [foodSuggestions, setFoodSuggestions] = useState<Food[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastLogId, setLastLogId] = useState<string | null>(null);

  // Define steps
  const steps: MealStep[] = [
    {
      id: 'meal_type',
      title: 'Meal Type',
      description: 'What meal are you logging?',
      component: MealTypeStep,
      isComplete: !!mealData.meal_type
    },
    {
      id: 'food_selection',
      title: 'Add Foods',
      description: 'What did you eat?',
      component: FoodSelectionStep,
      isComplete: mealData.food_items.length > 0
    },
    {
      id: 'nutrition_review',
      title: 'Nutrition Review',
      description: 'Check your macros',
      component: NutritionReviewStep,
      isComplete: true
    },
    {
      id: 'context',
      title: 'Finish Up',
      description: 'Notes and mood',
      component: ContextStep,
      isComplete: true,
      isOptional: true
    }
  ];

  const currentStepData = steps[currentStep];
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  const loadFoodSuggestions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (mealData.meal_type) {
        params.append('meal_type', mealData.meal_type);
      }
      params.append('limit', '8');

      const response = await api.get(`/health/foods/suggestions?${params}`);
      setFoodSuggestions(response.suggestions?.map((s: any) => s.food) || []);
    } catch (error) {
      console.error('Failed to load food suggestions:', error);
    }
  }, [mealData.meal_type]);

  const searchFoods = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await api.get(`/health/foods/search?query=${encodeURIComponent(query)}&limit=10`);
      setSearchResults(response.foods || []);
    } catch (error) {
      console.error('Failed to search foods:', error);
    }
  };

  const calculateNutrition = useCallback(() => {
    const totals = mealData.food_items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein_g: acc.protein_g + item.protein_g,
        carbs_g: acc.carbs_g + item.carbs_g,
        fat_g: acc.fat_g + item.fat_g,
        fiber_g: acc.fiber_g + (item.food.fiber_per_100g || 0) * (item.serving_grams / 100),
        sugar_g: acc.sugar_g + (item.food.sugar_per_100g || 0) * (item.serving_grams / 100),
        sodium_mg: acc.sodium_mg + (item.food.sodium_per_100g || 0) * (item.serving_grams / 100)
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 0 }
    );

    setMealData(prev => ({ ...prev, ...totals }));
  }, [mealData.food_items]);

  useEffect(() => {
    loadFoodSuggestions();
  }, [mealData.meal_type, loadFoodSuggestions]);

  useEffect(() => {
    calculateNutrition();
  }, [mealData.food_items, calculateNutrition]);

  const updateMealData = (updates: Partial<MealData>) => {
    setMealData(prev => ({ ...prev, ...updates }));
  };

  const addFoodItem = (food: Food, servingGrams: number = food.user_avg_serving_grams || 100) => {
    const multiplier = servingGrams / 100;
    const foodItem: FoodItem = {
      food,
      serving_grams: servingGrams,
      calories: food.calories_per_100g * multiplier,
      protein_g: (food.protein_per_100g || 0) * multiplier,
      carbs_g: (food.carbs_per_100g || 0) * multiplier,
      fat_g: (food.fat_per_100g || 0) * multiplier
    };

    setMealData(prev => ({
      ...prev,
      food_items: [...prev.food_items, foodItem]
    }));
  };

  const removeFoodItem = (index: number) => {
    setMealData(prev => ({
      ...prev,
      food_items: prev.food_items.filter((_, i) => i !== index)
    }));
  };

  const updateFoodItem = (index: number, updates: Partial<FoodItem>) => {
    setMealData(prev => ({
      ...prev,
      food_items: prev.food_items.map((item, i) => 
        i === index ? { ...item, ...updates } : item
      )
    }));
  };

  const canProceed = () => {
    const step = steps[currentStep];
    return step.isComplete || step.isOptional;
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1 && canProceed()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) {
      toast.error('Please add at least one food item');
      return;
    }

    setLoading(true);
    try {
      const logData = {
        meal_type: mealData.meal_type,
        meal_name: mealData.meal_name,
        total_calories: Math.round(mealData.total_calories),
        protein_g: Math.round(mealData.protein_g * 10) / 10,
        carbs_g: Math.round(mealData.carbs_g * 10) / 10,
        fat_g: Math.round(mealData.fat_g * 10) / 10,
        fiber_g: Math.round(mealData.fiber_g * 10) / 10,
        sugar_g: Math.round(mealData.sugar_g * 10) / 10,
        sodium_mg: Math.round(mealData.sodium_mg),
        food_items: JSON.stringify(mealData.food_items.map(item => ({
          name: item.food.name,
          brand: item.food.brand,
          serving_grams: item.serving_grams,
          calories: item.calories,
          protein_g: item.protein_g,
          carbs_g: item.carbs_g,
          fat_g: item.fat_g
        }))),
        food_ids: mealData.food_items.map(item => item.food.id),
        routine_id: mealData.routineId || routineContext?.id,
        notes: mealData.notes,
        mood_before: mealData.mood_before,
        mood_after: mealData.mood_after,
        meal_date: new Date().toISOString(),
        use_smart_defaults: true
      };

      const response = await api.post('/health/contextual-logging/meal/smart', logData);
      
      toast.success('Meal logged successfully! 🍽️');
      
      // Show instant feedback
      if (response.log_id) {
        setLastLogId(response.log_id);
        setShowFeedback(true);
      }

      onSuccess?.();
    } catch (error) {
      console.error('Failed to log meal:', error);
      toast.error('Failed to log meal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Instant Feedback Modal */}
      {showFeedback && lastLogId && (
        <InstantFeedback
          logType="nutrition"
          logId={lastLogId}
          onClose={() => setShowFeedback(false)}
        />
      )}
      
      <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {currentStepData.description}
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          <currentStepData.component
            mealData={mealData}
            updateMealData={updateMealData}
            addFoodItem={addFoodItem}
            removeFoodItem={removeFoodItem}
            updateFoodItem={updateFoodItem}
            foodSuggestions={foodSuggestions}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            onSearch={searchFoods}
            routineContext={routineContext}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`w-2 h-2 rounded-full ${
                    index < currentStep
                      ? 'bg-green-500'
                      : index === currentStep
                      ? 'bg-blue-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Logging...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    Log Meal
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
}

// Step Components

function MealTypeStep({ mealData, updateMealData, routineContext }: any) {
  const currentHour = new Date().getHours();
  let suggestedMealType = 'snack';
  
  if (currentHour >= 6 && currentHour < 11) suggestedMealType = 'breakfast';
  else if (currentHour >= 11 && currentHour < 16) suggestedMealType = 'lunch';
  else if (currentHour >= 16 && currentHour < 22) suggestedMealType = 'dinner';

  const mealTypes = [
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
          Based on the current time ({new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}), 
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

function FoodSelectionStep({
  mealData,
  addFoodItem,
  removeFoodItem,
  updateFoodItem,
  foodSuggestions,
  searchQuery,
  setSearchQuery,
  searchResults,
  onSearch
}: any) {
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
    const multiplier = newGrams / 100;
    
    updateFoodItem(index, {
      serving_grams: newGrams,
      calories: item.food.calories_per_100g * multiplier,
      protein_g: (item.food.protein_per_100g || 0) * multiplier,
      carbs_g: (item.food.carbs_per_100g || 0) * multiplier,
      fat_g: (item.food.fat_per_100g || 0) * multiplier
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
                {Math.round((selectedFood.calories_per_100g * servingAmount) / 100)}
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

function NutritionReviewStep({ mealData }: any) {
  const macroPercentages = {
    protein: mealData.total_calories > 0 ? (mealData.protein_g * 4 / mealData.total_calories * 100) : 0,
    carbs: mealData.total_calories > 0 ? (mealData.carbs_g * 4 / mealData.total_calories * 100) : 0,
    fat: mealData.total_calories > 0 ? (mealData.fat_g * 9 / mealData.total_calories * 100) : 0
  };

  return (
    <div className="space-y-6">
      {/* Calorie Summary */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-lg">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {Math.round(mealData.total_calories)}
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
              {mealData.protein_g.toFixed(1)}g
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Protein</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {macroPercentages.protein.toFixed(0)}%
            </div>
          </div>
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {mealData.carbs_g.toFixed(1)}g
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Carbs</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {macroPercentages.carbs.toFixed(0)}%
            </div>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {mealData.fat_g.toFixed(1)}g
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
            <span className="font-medium">{mealData.fiber_g.toFixed(1)}g</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Sugar:</span>
            <span className="font-medium">{mealData.sugar_g.toFixed(1)}g</span>
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
          {mealData.protein_g >= 20 && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircleIcon className="h-4 w-4" />
              <span>Great protein content!</span>
            </div>
          )}
          {mealData.fiber_g >= 5 && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircleIcon className="h-4 w-4" />
              <span>Good source of fiber</span>
            </div>
          )}
          {mealData.total_calories < 200 && mealData.meal_type !== 'snack' && (
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <ClockIcon className="h-4 w-4" />
              <span>Consider adding more calories for a complete meal</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ContextStep({ mealData, updateMealData }: any) {
  const moods = ['hungry', 'satisfied', 'full', 'craving', 'energetic', 'tired'];

  return (
    <div className="space-y-6">
      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <textarea
          id="notes"
          className="w-full p-3 border border-gray-300 rounded-md resize-none"
          rows={3}
          placeholder="How was the meal? Any thoughts about taste, satisfaction, or preparation?"
          value={mealData.notes || ''}
          onChange={(e) => updateMealData({ notes: e.target.value })}
        />
      </div>

      {/* Mood Before */}
      <div>
        <Label>How did you feel before eating?</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {moods.map((mood) => (
            <Button
              key={mood}
              variant={mealData.mood_before === mood ? "default" : "outline"}
              size="sm"
              onClick={() => updateMealData({ mood_before: mood })}
              className="capitalize"
            >
              {mood}
            </Button>
          ))}
        </div>
      </div>

      {/* Mood After */}
      <div>
        <Label>How do you feel after eating?</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {moods.map((mood) => (
            <Button
              key={mood}
              variant={mealData.mood_after === mood ? "default" : "outline"}
              size="sm"
              onClick={() => updateMealData({ mood_after: mood })}
              className="capitalize"
            >
              {mood}
            </Button>
          ))}
        </div>
      </div>

      {/* Meal Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-medium mb-3">Meal Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Meal Type:</span>
            <span className="font-medium capitalize">{mealData.meal_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Total Calories:</span>
            <span className="font-medium">{Math.round(mealData.total_calories)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Protein:</span>
            <span className="font-medium">{mealData.protein_g.toFixed(1)}g</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Food Items:</span>
            <span className="font-medium">{mealData.food_items.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
