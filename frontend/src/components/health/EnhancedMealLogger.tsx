'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  XMarkIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  ClockIcon, 
  CheckCircleIcon, 
  PencilIcon,
  HeartIcon,
  FireIcon,
  TrophyIcon,
  ChartBarIcon,
  TrashIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { useSuccessToast, useErrorToast, useInfoToast } from '@/components/ui/toast';
import { logger } from '@/lib/logger';
import { nutritionLoggerService } from '@/services/nutritionLoggerService';

interface Food {
  id: string;
  name: string;
  brand?: string;
  description?: string;
  source?: 'local';
  category: string;
  calories_per_100g: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
}

interface FoodItem {
  food: Food;
  serving_grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
}

interface MealData {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_name: string;
  food_items: FoodItem[];
  total_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  notes?: string;
  mood_before?: string;
  mood_after?: string;
}

interface EnhancedMealLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EnhancedMealLogger({ isOpen, onClose, onSuccess }: EnhancedMealLoggerProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'manual'>('search');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  
  // Food search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<FoodItem[]>([]);
  
  
  // Meal details
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [mealName, setMealName] = useState('');
  const [notes, setNotes] = useState('');
  const [moodBefore, setMoodBefore] = useState('');
  const [moodAfter, setMoodAfter] = useState('');
  
  // Toast notifications
  const successToast = useSuccessToast();
  const errorToast = useErrorToast();
  const infoToast = useInfoToast();

  // Search for foods using local database
  const searchFoods = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      logger.debug('Searching foods:', { query });
      const foods = await nutritionLoggerService.searchFoods(query, 10);
      setSearchResults(foods);
      logger.debug('Food search results:', { count: foods.length });
    } catch (error) {
      logger.error('Food search failed:', error);
      errorToast('Search failed', 'Could not search for foods. Please try again.');
    } finally {
      setSearching(false);
    }
  }, [errorToast]);

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

  // Add food to meal
  const addFoodToMeal = async (food: Food) => {
    try {
      logger.debug('Adding food to meal:', { foodId: food.id, foodName: food.name });
      
      // Get nutrition data for 100g serving
      const nutrition = await nutritionLoggerService.getFoodNutrition(food.id, 100);
      
      logger.debug('Nutrition data received:', nutrition);
      
      // Ensure food has required properties
      const foodWithDefaults = {
        ...food,
        category: food.category || 'General',
        source: food.source || 'local',
        calories_per_100g: food.calories_per_100g || 0,
        protein_per_100g: food.protein_per_100g || 0,
        carbs_per_100g: food.carbs_per_100g || 0,
        fat_per_100g: food.fat_per_100g || 0
      };
      
      const foodItem: FoodItem = {
        food: foodWithDefaults,
        serving_grams: 100,
        calories: nutrition.calories,
        protein_g: nutrition.protein_g,
        carbs_g: nutrition.carbs_g,
        fat_g: nutrition.fat_g,
        fiber_g: nutrition.fiber_g,
        sugar_g: nutrition.sugar_g,
        sodium_mg: nutrition.sodium_mg
      };

      setSelectedFoods(prev => [...prev, foodItem]);
      setSearchQuery('');
      setSearchResults([]);
      
      successToast('Food added!', `${food.name} added to your meal`);
    } catch (error) {
      logger.error('Failed to add food:', error);
      console.error('Add food error details:', error);
      errorToast('Failed to add food', `Could not get nutrition data for ${food.name}. Please try again.`);
    }
  };

  // Update food serving size
  const updateFoodServing = async (index: number, servingGrams: number) => {
    const foodItem = selectedFoods[index];
    if (!foodItem) return;

    try {
      const nutrition = await nutritionLoggerService.getFoodNutrition(foodItem.food.id, servingGrams);
      
      setSelectedFoods(prev => prev.map((item, i) => 
        i === index 
          ? {
              ...item,
              serving_grams: servingGrams,
              calories: nutrition.calories,
              protein_g: nutrition.protein_g,
              carbs_g: nutrition.carbs_g,
              fat_g: nutrition.fat_g,
              fiber_g: nutrition.fiber_g,
              sugar_g: nutrition.sugar_g,
              sodium_mg: nutrition.sodium_mg
            }
          : item
      ));
    } catch (error) {
      logger.error('Failed to update serving:', error);
      errorToast('Update failed', 'Could not update nutrition data. Please try again.');
    }
  };

  // Remove food from meal
  const removeFoodFromMeal = (index: number) => {
    setSelectedFoods(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate total nutrition
  const totalNutrition = selectedFoods.reduce((acc, item) => ({
    calories: acc.calories + item.calories,
    protein_g: acc.protein_g + item.protein_g,
    carbs_g: acc.carbs_g + item.carbs_g,
    fat_g: acc.fat_g + item.fat_g,
    fiber_g: acc.fiber_g + (item.fiber_g || 0),
    sugar_g: acc.sugar_g + (item.sugar_g || 0),
    sodium_mg: acc.sodium_mg + (item.sodium_mg || 0)
  }), {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 0
  });

  // Log meal
  const logMeal = async () => {
    if (selectedFoods.length === 0) {
      errorToast('No foods selected', 'Please add at least one food to your meal.');
      return;
    }

    if (!mealName.trim()) {
      errorToast('Meal name required', 'Please enter a name for your meal.');
      return;
    }

    setLoading(true);
    try {
      const mealData: MealData = {
        meal_type: mealType,
        meal_name: mealName,
        food_items: selectedFoods,
        total_calories: Math.round(totalNutrition.calories),
        protein_g: Math.round(totalNutrition.protein_g * 10) / 10,
        carbs_g: Math.round(totalNutrition.carbs_g * 10) / 10,
        fat_g: Math.round(totalNutrition.fat_g * 10) / 10,
        fiber_g: Math.round(totalNutrition.fiber_g * 10) / 10,
        sugar_g: Math.round(totalNutrition.sugar_g * 10) / 10,
        sodium_mg: Math.round(totalNutrition.sodium_mg),
        notes: notes.trim() || undefined,
        mood_before: moodBefore.trim() || undefined,
        mood_after: moodAfter.trim() || undefined
      };

      await nutritionLoggerService.logMeal(mealData);
      
      successToast('Meal logged!', `${mealName} has been successfully logged.`);
      onSuccess();
      handleClose();
    } catch (error) {
      logger.error('Failed to log meal:', error);
      errorToast('Logging failed', 'Could not log your meal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleClose = () => {
    setActiveTab('search');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedFoods([]);
    setMealType('breakfast');
    setMealName('');
    setNotes('');
    setMoodBefore('');
    setMoodAfter('');
    onClose();
  };

  return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-[800px] max-h-[90vh] overflow-hidden p-0 w-[800px] bg-white dark:bg-gray-800">
        <div className="flex flex-col h-full bg-white dark:bg-gray-800">
          {/* Header */}
          <DialogHeader className="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  Log Meal
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400 mt-1">
                  Search for foods and build your meal with accurate nutrition data
                </DialogDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'search' | 'manual')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger 
                  value="search" 
                  className="flex items-center gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                >
                  <MagnifyingGlassIcon className="h-4 w-4" />
                  Search Foods
                </TabsTrigger>
                <TabsTrigger 
                  value="manual" 
                  className="flex items-center gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                >
                  <PencilIcon className="h-4 w-4" />
                  Manual Entry
                </TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Food Search */}
                  <div className="space-y-6">
                    <Card className="hover:shadow-lg transition-all duration-300">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                          Search Foods
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Find foods from our comprehensive database
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Search Input */}
                        <div className="relative">
                          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search for foods (e.g., chicken, rice, apple)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>


                        {/* Search Results */}
                        {searching && (
                          <div className="flex items-center justify-center py-4">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                            <span className="ml-2 text-sm text-gray-600">Searching...</span>
                          </div>
                        )}

                        {!searching && searchResults.length > 0 && (
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {searchResults.map((food) => (
                              <Card key={food.id} className="hover:shadow-lg transition-all duration-300 group border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors duration-300 truncate">
                                        {food.name}
                                      </h4>
                                      {food.brand && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">{food.brand}</p>
                                      )}
                                      
                                      {/* Nutrition Info - Better Layout */}
                                      <div className="mt-3 space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700">
                                            {food.source}
                                          </Badge>
                                          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                            {Math.round(food.calories_per_100g || 0)} cal/100g
                                          </span>
                                        </div>
                                        
                                        {/* Macros in a grid layout */}
                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                          <div className="text-center p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded">
                                            <div className="text-blue-600 dark:text-blue-400 font-medium">
                                              {Math.round((food.protein_per_100g || 0) * 10) / 10}g
                                            </div>
                                            <div className="text-blue-500 dark:text-blue-300 text-xs">Protein</div>
                                          </div>
                                          <div className="text-center p-1.5 bg-orange-50 dark:bg-orange-900/20 rounded">
                                            <div className="text-orange-600 dark:text-orange-400 font-medium">
                                              {Math.round((food.carbs_per_100g || 0) * 10) / 10}g
                                            </div>
                                            <div className="text-orange-500 dark:text-orange-300 text-xs">Carbs</div>
                                          </div>
                                          <div className="text-center p-1.5 bg-red-50 dark:bg-red-900/20 rounded">
                                            <div className="text-red-600 dark:text-red-400 font-medium">
                                              {Math.round((food.fat_per_100g || 0) * 10) / 10}g
                                            </div>
                                            <div className="text-red-500 dark:text-red-300 text-xs">Fat</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Add Button */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addFoodToMeal(food);
                                      }}
                                      className="flex-shrink-0 p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors duration-300 cursor-pointer"
                                    >
                                      <PlusIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    </button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}

                        {!searching && searchQuery && searchResults.length === 0 && (
                          <div className="text-center py-8">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                              <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No foods found</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try searching for "{searchQuery}" with different terms</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column - Selected Foods & Meal Details */}
                  <div className="space-y-6">
                    {/* Selected Foods */}
                    <Card className="hover:shadow-lg transition-all duration-300">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                          Selected Foods
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Build your meal by adding foods
                        </p>
                      </CardHeader>
                      <CardContent>
                        {selectedFoods.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <BeakerIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                            <p>No foods selected yet</p>
                            <p className="text-sm">Search and add foods to build your meal</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {selectedFoods.map((item, index) => (
                              <Card key={index} className="p-4 border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">{item.food.name}</h4>
                                    {item.food.brand && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.food.brand}</p>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFoodFromMeal(index)}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                                
                                <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Serving (g):</Label>
                                  <Input
                                    type="number"
                                    value={item.serving_grams}
                                    onChange={(e) => updateFoodServing(index, parseFloat(e.target.value) || 0)}
                                    className="h-8 w-24 text-sm"
                                    min="1"
                                  />
                                  <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                    {Math.round(item.calories)} cal
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Meal Details */}
                    <Card className="hover:shadow-lg transition-all duration-300">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                          Meal Details
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Complete your meal information
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Meal Type</Label>
                            <Select value={mealType} onValueChange={(value: any) => setMealType(value)}>
                              <SelectTrigger>
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
                            <Label>Meal Name</Label>
                            <Input
                              placeholder="e.g., Grilled Chicken with Rice"
                              value={mealName}
                              onChange={(e) => setMealName(e.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Notes (Optional)</Label>
                          <Textarea
                            placeholder="Any additional notes about this meal..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Nutrition Summary */}
                {selectedFoods.length > 0 && (
                  <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-emerald-800 dark:text-emerald-200 flex items-center">
                        <ChartBarIcon className="h-5 w-5 mr-2" />
                        Nutrition Summary
                      </CardTitle>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300">
                        Total nutrition for your meal
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{Math.round(totalNutrition.calories)}</div>
                          <div className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Calories</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{Math.round(totalNutrition.protein_g)}g</div>
                          <div className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Protein</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{Math.round(totalNutrition.carbs_g)}g</div>
                          <div className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Carbs</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{Math.round(totalNutrition.fat_g)}g</div>
                          <div className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Fat</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="manual" className="space-y-6">
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                      Manual Entry
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Quick manual nutrition entry
                    </p>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PencilIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Manual Entry</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Manual entry coming soon. Use the Search Foods tab for now.
                      </p>
                      <Button onClick={() => setActiveTab('search')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        Go to Search Foods
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="px-6 py-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedFoods.length > 0 && (
                  <span className="font-medium">{selectedFoods.length} food{selectedFoods.length !== 1 ? 's' : ''} selected</span>
                )}
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  className="border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium"
                >
                  Cancel
                </Button>
                <Button
                  onClick={logMeal}
                  disabled={selectedFoods.length === 0 || !mealName.trim() || loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-700 hover:border-emerald-800 font-medium shadow-md"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  ) : (
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                  )}
                  Log Meal
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
