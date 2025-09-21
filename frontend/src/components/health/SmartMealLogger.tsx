'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  XMarkIcon, 
  PlusIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  PencilIcon,
  HeartIcon,
  FireIcon,
  TrophyIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import api from '@/lib/api';
import { nutritionRoutineApi } from '@/lib/nutritionRoutineApi';
import { useSuccessToast, useErrorToast, useInfoToast } from '@/components/ui/toast';
import { logger } from '@/lib/logger';

interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  notes?: string;
  completed?: boolean;
}

interface NutritionRoutine {
  id: string;
  name: string;
  meals: Meal[];
  day_of_week: string;
}

interface SmartMealLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SmartMealLogger({ isOpen, onClose, onSuccess }: SmartMealLoggerProps) {
  const [activeTab, setActiveTab] = useState<'routine' | 'manual'>('routine');
  const [loading, setLoading] = useState(false);
  const [todayMeals, setTodayMeals] = useState<Meal[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [editingMeal, setEditingMeal] = useState<string | null>(null);
  
  // Toast notifications
  const successToast = useSuccessToast();
  const errorToast = useErrorToast();
  const infoToast = useInfoToast();
  
  // Manual entry state
  const [manualMealName, setManualMealName] = useState('');
  const [manualMealType, setManualMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');
  const [manualFiber, setManualFiber] = useState('');
  const [manualSugar, setManualSugar] = useState('');
  const [manualSodium, setManualSodium] = useState('');
  const [manualNotes, setManualNotes] = useState('');

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  const loadTodayMeals = useCallback(async () => {
    setLoading(true);
    try {
      logger.debug('Loading today\'s meals from active nutrition routine...');
      
      // Get active nutrition routine
      const activeProgress = await nutritionRoutineApi.getActiveRoutine();
      logger.debug('Active nutrition routine progress:', activeProgress);
      
      if (!activeProgress) {
        logger.debug('❌ No active nutrition routine found');
        setTodayMeals([]);
        return;
      }

      // Load detailed routine with meal plans
      const detailedRoutine = await nutritionRoutineApi.getRoutine(activeProgress.routine_id);
      logger.debug('🔍 Detailed nutrition routine:', detailedRoutine);

      // Find today's meal plan
      logger.debug('🔍 Available meal plans:', detailedRoutine.meal_plans?.map((plan: any) => ({
        day_name: plan.day_name,
        day_name_lower: plan.day_name?.toLowerCase(),
        currentDay: currentDay,
        matches: plan.day_name?.toLowerCase() === currentDay
      })));
      
      const todayMealPlan = detailedRoutine.meal_plans?.find((plan: any) => {
        const planDay = plan.day_name?.toLowerCase().trim();
        const searchDay = currentDay.toLowerCase().trim();
        
        // Try exact match first
        if (planDay === searchDay) return true;
        
        // Try partial matches for common variations
        const dayVariations = {
          'monday': ['mon', 'monday'],
          'tuesday': ['tue', 'tues', 'tuesday'],
          'wednesday': ['wed', 'wednesday'],
          'thursday': ['thu', 'thur', 'thurs', 'thursday'],
          'friday': ['fri', 'friday'],
          'saturday': ['sat', 'saturday'],
          'sunday': ['sun', 'sunday']
        };
        
        const currentVariations = dayVariations[searchDay as keyof typeof dayVariations] || [searchDay];
        return currentVariations.some(variation => planDay?.includes(variation));
      });
      
      logger.debug('📅 Today\'s meal plan:', todayMealPlan);
      logger.debug('📅 Current day being searched:', currentDay);
      
      if (!todayMealPlan?.meals) {
        logger.debug('❌ No meals found for today');
        logger.debug('📋 Available meal plan days:', detailedRoutine.meal_plans?.map(p => p.day_name));
        
        // Temporary fallback: use the first available meal plan for testing
        const firstMealPlan = detailedRoutine.meal_plans?.[0];
        if (firstMealPlan?.meals) {
          logger.debug('🔄 Using first available meal plan as fallback:', firstMealPlan.day_name);
          const fallbackMeals = firstMealPlan.meals.map((meal: any) => {
            const totals = meal.food_items?.reduce((acc: any, food: any) => ({
              calories: acc.calories + (food.calories || 0),
              protein: acc.protein + (food.protein_g || 0),
              carbs: acc.carbs + (food.carbs_g || 0),
              fat: acc.fat + (food.fat_g || 0),
              fiber: acc.fiber + (food.fiber_g || 0),
              sugar: acc.sugar + (food.sugar_g || 0),
              sodium: acc.sodium + (food.sodium_mg || 0)
            }), {
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
              fiber: 0,
              sugar: 0,
              sodium: 0
            }) || {
              calories: meal.target_calories || 0,
              protein: meal.target_protein_g || 0,
              carbs: meal.target_carbs_g || 0,
              fat: meal.target_fat_g || 0,
              fiber: meal.target_fiber_g || 0,
              sugar: meal.target_sugar_g || 0,
              sodium: meal.target_sodium_mg || 0
            };

            return {
              id: meal.id,
              name: meal.meal_name,
              calories: Math.round(totals.calories),
              protein: Math.round(totals.protein),
              carbs: Math.round(totals.carbs),
              fat: Math.round(totals.fat),
              fiber: Math.round(totals.fiber),
              sugar: Math.round(totals.sugar),
              sodium: Math.round(totals.sodium),
              meal_type: meal.meal_type,
              notes: meal.description,
              completed: false
            };
          });
          
          logger.debug('🍽️ Fallback meals loaded:', fallbackMeals);
          setTodayMeals(fallbackMeals);
          return;
        }
        
        setTodayMeals([]);
        return;
      }

      // Transform meals to include completion status and calculate totals from food items
      const mealsWithStatus = todayMealPlan.meals.map((meal: any) => {
        // Calculate totals from food items
        const totals = meal.food_items?.reduce((acc: any, food: any) => ({
          calories: acc.calories + (food.calories || 0),
          protein: acc.protein + (food.protein_g || 0),
          carbs: acc.carbs + (food.carbs_g || 0),
          fat: acc.fat + (food.fat_g || 0),
          fiber: acc.fiber + (food.fiber_g || 0),
          sugar: acc.sugar + (food.sugar_g || 0),
          sodium: acc.sodium + (food.sodium_mg || 0)
        }), {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0
        }) || {
          calories: meal.target_calories || 0,
          protein: meal.target_protein_g || 0,
          carbs: meal.target_carbs_g || 0,
          fat: meal.target_fat_g || 0,
          fiber: meal.target_fiber_g || 0,
          sugar: meal.target_sugar_g || 0,
          sodium: meal.target_sodium_mg || 0
        };

        return {
          id: meal.id,
          name: meal.meal_name,
          calories: Math.round(totals.calories),
          protein: Math.round(totals.protein),
          carbs: Math.round(totals.carbs),
          fat: Math.round(totals.fat),
          fiber: Math.round(totals.fiber),
          sugar: Math.round(totals.sugar),
          sodium: Math.round(totals.sodium),
          meal_type: meal.meal_type,
          notes: meal.description,
          completed: false
        };
      });

      logger.debug('🍽️ Processed meals for today:', mealsWithStatus);
      setTodayMeals(mealsWithStatus);
      
      // Show success toast when meals are loaded
      if (mealsWithStatus.length > 0) {
        successToast(
          'Routine meals loaded! 📋', 
          `Found ${mealsWithStatus.length} meal${mealsWithStatus.length !== 1 ? 's' : ''} for today from your active routine`
        );
      }
    } catch (error) {
      console.error('Failed to load today meals:', error);
      errorToast(
        'Failed to load routine meals', 
        'Could not load your nutrition routine. Please try again.'
      );
      // Fallback to empty array instead of mock data
      setTodayMeals([]);
    } finally {
      setLoading(false);
    }
  }, [currentDay, errorToast, successToast]);

  useEffect(() => {
    if (isOpen) {
      loadTodayMeals();
    }
  }, [isOpen, loadTodayMeals]);

  useEffect(() => {
    const completed = todayMeals.filter(meal => meal.completed).length;
    setCompletedCount(completed);
    setTotalCount(todayMeals.length);
  }, [todayMeals]);

  const toggleCompleted = (mealId: string) => {
    setTodayMeals(prev => 
      prev.map(meal => 
        meal.id === mealId 
          ? { ...meal, completed: !meal.completed }
          : meal
      )
    );
  };

  const startEditing = (mealId: string) => {
    setEditingMeal(mealId);
  };

  const saveEdit = (mealId: string, updatedMeal: Partial<Meal>) => {
    setTodayMeals(prev => 
      prev.map(meal => 
        meal.id === mealId 
          ? { ...meal, ...updatedMeal }
          : meal
      )
    );
    setEditingMeal(null);
  };

  const logMeals = async () => {
    if (completedCount === 0) return;
    
    setLoading(true);
    infoToast('Logging meals...', 'Please wait while we save your nutrition data');
    
    try {
      const completedMeals = todayMeals.filter(meal => meal.completed);
      
      for (const meal of completedMeals) {
        await api.post('/health/logging/nutrition', {
          meal_name: meal.name,
          total_calories: meal.calories,
          protein_g: meal.protein,
          carbs_g: meal.carbs,
          fat_g: meal.fat,
          fiber_g: meal.fiber,
          sugar_g: meal.sugar,
          sodium_mg: meal.sodium,
          meal_type: meal.meal_type,
          notes: meal.notes,
          meal_date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format
          food_items: [
            {
              name: meal.name,
              quantity: "1 serving",
              calories: meal.calories,
              protein_g: meal.protein,
              carbs_g: meal.carbs,
              fat_g: meal.fat,
              fiber_g: meal.fiber,
              sodium_mg: meal.sodium
            }
          ]
        });
      }
      
      successToast(
        'Meals logged successfully! 🎉', 
        `Successfully logged ${completedCount} meal${completedCount !== 1 ? 's' : ''} to your nutrition tracker`
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to log meals:', error);
      errorToast(
        'Failed to log meals', 
        'There was an error saving your meals. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const logManualMeal = async () => {
    if (!manualMealName.trim()) return;
    
    setLoading(true);
    infoToast('Logging meal...', 'Please wait while we save your custom meal');
    
    try {
      await api.post('/health/logging/nutrition', {
        meal_name: manualMealName,
        total_calories: parseInt(manualCalories) || 0,
        protein_g: parseInt(manualProtein) || 0,
        carbs_g: parseInt(manualCarbs) || 0,
        fat_g: parseInt(manualFat) || 0,
        fiber_g: parseInt(manualFiber) || 0,
        sugar_g: parseInt(manualSugar) || 0,
        sodium_mg: parseInt(manualSodium) || 0,
        meal_type: manualMealType,
        notes: manualNotes,
        meal_date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format
        food_items: [
          {
            name: manualMealName,
            quantity: "1 serving",
            calories: parseInt(manualCalories) || 0,
            protein_g: parseInt(manualProtein) || 0,
            carbs_g: parseInt(manualCarbs) || 0,
            fat_g: parseInt(manualFat) || 0,
            fiber_g: parseInt(manualFiber) || 0,
            sodium_mg: parseInt(manualSodium) || 0
          }
        ]
      });
      
      successToast(
        'Meal logged successfully! 🍽️', 
        `"${manualMealName}" has been added to your nutrition tracker`
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to log manual meal:', error);
      errorToast(
        'Failed to log meal', 
        'There was an error saving your meal. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetManualForm = () => {
    setManualMealName('');
    setManualMealType('breakfast');
    setManualCalories('');
    setManualProtein('');
    setManualCarbs('');
    setManualFat('');
    setManualFiber('');
    setManualSugar('');
    setManualSodium('');
    setManualNotes('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 w-[90vw]">
        <div className="flex flex-col h-full">
          {/* Clean Header */}
          <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                Today&apos;s Meals
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {currentDay.charAt(0).toUpperCase() + currentDay.slice(1)} • Track your nutrition progress
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'routine' | 'manual')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger 
                  value="routine" 
                  className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white"
                >
                  <ClockIcon className="h-4 w-4" />
                  Routine Meals
                </TabsTrigger>
                <TabsTrigger 
                  value="manual" 
                  className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white"
                >
                  <PlusIcon className="h-4 w-4" />
                  Manual Log
                </TabsTrigger>
              </TabsList>

              <TabsContent value="routine" className="space-y-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading your routine meals...</p>
                  </div>
                ) : todayMeals.length === 0 ? (
                  <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <CardContent className="p-8 text-center">
                      <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Routine Meals</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        You don&apos;t have any meals scheduled for {currentDay}.
                      </p>
                      <Button onClick={() => setActiveTab('manual')} className="bg-green-600 hover:bg-green-700 text-white">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Log Manual Meal
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Clean Progress Header */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Progress</h3>
                        <span className="text-xl font-bold text-green-600 dark:text-green-400">
                          {completedCount}/{totalCount}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Clean Meal List - Grouped by Meal Type */}
                    <div className="space-y-4">
                      {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
                        const mealsOfType = todayMeals.filter(meal => meal.meal_type === mealType);
                        if (mealsOfType.length === 0) return null;
                        
                        return (
                          <div key={mealType} className="space-y-2">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-1.5 h-6 bg-green-600 rounded-full"></div>
                              <h3 className="text-base font-semibold text-gray-900 dark:text-white capitalize">
                                {mealType}
                              </h3>
                              <Badge variant="outline" className="text-xs px-2 py-0.5">
                                {mealsOfType.length} meal{mealsOfType.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            
                            {mealsOfType.map((meal) => (
                              <Card key={meal.id} className={`transition-all duration-200 ${
                                meal.completed 
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                  : 'hover:shadow-md border-gray-200 dark:border-gray-700'
                              }`}>
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => toggleCompleted(meal.id)}
                                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                        meal.completed
                                          ? 'bg-green-600 border-green-600 text-white'
                                          : 'border-gray-300 hover:border-green-500'
                                      }`}
                                    >
                                      {meal.completed && <CheckCircleIcon className="h-3 w-3" />}
                                    </button>
                                    
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between mb-2">
                                        <h4 className={`text-base font-semibold ${
                                          meal.completed 
                                            ? 'line-through text-gray-500' 
                                            : 'text-gray-900 dark:text-white'
                                        }`}>
                                          {meal.name}
                                        </h4>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => startEditing(meal.id)}
                                          className="h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        >
                                          <PencilIcon className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                      
                                      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                                        <span><strong>{meal.calories}</strong> cal</span>
                                        <span><strong>{meal.protein}g</strong> protein</span>
                                        <span><strong>{meal.carbs}g</strong> carbs</span>
                                        <span><strong>{meal.fat}g</strong> fat</span>
                                        {meal.fiber && meal.fiber > 0 && <span><strong>{meal.fiber}g</strong> fiber</span>}
                                      </div>
                                      
                                      {meal.notes && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                                          {meal.notes}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Edit Form */}
                                  {editingMeal === meal.id && (
                                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div>
                                          <Label htmlFor={`calories-${meal.id}`}>Calories</Label>
                                          <Input
                                            id={`calories-${meal.id}`}
                                            type="number"
                                            value={meal.calories}
                                            onChange={(e) => saveEdit(meal.id, { calories: parseInt(e.target.value) || 0 })}
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor={`protein-${meal.id}`}>Protein (g)</Label>
                                          <Input
                                            id={`protein-${meal.id}`}
                                            type="number"
                                            value={meal.protein}
                                            onChange={(e) => saveEdit(meal.id, { protein: parseInt(e.target.value) || 0 })}
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor={`carbs-${meal.id}`}>Carbs (g)</Label>
                                          <Input
                                            id={`carbs-${meal.id}`}
                                            type="number"
                                            value={meal.carbs}
                                            onChange={(e) => saveEdit(meal.id, { carbs: parseInt(e.target.value) || 0 })}
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor={`fat-${meal.id}`}>Fat (g)</Label>
                                          <Input
                                            id={`fat-${meal.id}`}
                                            type="number"
                                            value={meal.fat}
                                            onChange={(e) => saveEdit(meal.id, { fat: parseInt(e.target.value) || 0 })}
                                          />
                                        </div>
                                      </div>
                                      <div className="flex gap-2 mt-3">
                                        <Button 
                                          size="sm" 
                                          onClick={() => setEditingMeal(null)}
                                          className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                          Save
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          onClick={() => setEditingMeal(null)}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        );
                      })}
                    </div>

                    {/* Clean Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        onClick={logMeals}
                        disabled={completedCount === 0 || loading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                        data-testid="log-meals-button"
                      >
                        {loading ? (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                        ) : (
                          <CheckCircleIcon className="h-3 w-3 mr-2" />
                        )}
                        Log {completedCount} Meal{completedCount !== 1 ? 's' : ''}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={onClose}
                        className="text-sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Manual Meal Entry</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Create a custom meal log for today</p>
                      </div>

                      {/* Meal Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="manual-meal-name" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                            Meal Name
                          </Label>
                          <Input
                            id="manual-meal-name"
                            value={manualMealName}
                            onChange={(e) => setManualMealName(e.target.value)}
                            placeholder="e.g., Grilled Chicken Breast with Rice"
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label htmlFor="manual-meal-type" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                            Meal Type
                          </Label>
                          <select
                            id="manual-meal-type"
                            value={manualMealType}
                            onChange={(e) => setManualMealType(e.target.value as any)}
                            className="w-full h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            <option value="breakfast">Breakfast</option>
                            <option value="lunch">Lunch</option>
                            <option value="dinner">Dinner</option>
                            <option value="snack">Snack</option>
                          </select>
                        </div>
                      </div>

                      {/* Macronutrients */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="manual-calories">Calories</Label>
                          <Input
                            id="manual-calories"
                            type="number"
                            value={manualCalories}
                            onChange={(e) => setManualCalories(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="manual-protein">Protein (g)</Label>
                          <Input
                            id="manual-protein"
                            type="number"
                            value={manualProtein}
                            onChange={(e) => setManualProtein(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="manual-carbs">Carbs (g)</Label>
                          <Input
                            id="manual-carbs"
                            type="number"
                            value={manualCarbs}
                            onChange={(e) => setManualCarbs(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="manual-fat">Fat (g)</Label>
                          <Input
                            id="manual-fat"
                            type="number"
                            value={manualFat}
                            onChange={(e) => setManualFat(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Additional Nutrients */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="manual-fiber">Fiber (g)</Label>
                          <Input
                            id="manual-fiber"
                            type="number"
                            value={manualFiber}
                            onChange={(e) => setManualFiber(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="manual-sugar">Sugar (g)</Label>
                          <Input
                            id="manual-sugar"
                            type="number"
                            value={manualSugar}
                            onChange={(e) => setManualSugar(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="manual-sodium">Sodium (mg)</Label>
                          <Input
                            id="manual-sodium"
                            type="number"
                            value={manualSodium}
                            onChange={(e) => setManualSodium(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <Label htmlFor="manual-notes">Notes (Optional)</Label>
                        <Textarea
                          id="manual-notes"
                          value={manualNotes}
                          onChange={(e) => setManualNotes(e.target.value)}
                          placeholder="Any additional notes about this meal..."
                          rows={3}
                        />
                      </div>

                      {/* Clean Log Button */}
                      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button 
                          variant="outline" 
                          onClick={onClose}
                          className="text-sm"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={logManualMeal} 
                          disabled={loading || !manualMealName.trim()}
                          className="bg-green-600 hover:bg-green-700 text-white text-sm"
                        >
                          {loading ? (
                            <>
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                              Logging...
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="h-3 w-3 mr-2" />
                              Log Meal
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
