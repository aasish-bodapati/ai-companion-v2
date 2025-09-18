'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PlusIcon, 
  PlayIcon, 
  PauseIcon, 
  PencilIcon, 
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  FireIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import nutritionRoutineApi, { NutritionRoutine, NutritionUserRoutineProgress, NutritionRoutineWithMealPlans } from '@/lib/nutritionRoutineApi';
import { SimpleNutritionRoutineBuilder } from './SimpleNutritionRoutineBuilder';

interface NutritionRoutineManagerProps {
  onRoutineSelect?: (routine: NutritionRoutine) => void;
}

export function NutritionRoutineManager({ onRoutineSelect }: NutritionRoutineManagerProps) {
  const [routines, setRoutines] = useState<NutritionRoutine[]>([]);
  const [routinesWithMeals, setRoutinesWithMeals] = useState<NutritionRoutineWithMealPlans[]>([]);
  const [activeProgress, setActiveProgress] = useState<NutritionUserRoutineProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<NutritionRoutineWithMealPlans | null>(null);

  const loadRoutines = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading nutrition routines...');
      
      const [routinesData, progressData] = await Promise.all([
        nutritionRoutineApi.getRoutines(true), // Only user-created routines
        nutritionRoutineApi.getActiveRoutine()
      ]);
      
      console.log('Basic routines loaded:', routinesData);
      console.log('Active progress:', progressData);
      
      setRoutines(routinesData);
      setActiveProgress(progressData);
      
      // Load detailed meal data for each routine
      console.log('Loading detailed meal data for each routine...');
      const routinesWithMealsData = await Promise.all(
        routinesData.map(async (routine) => {
          try {
            console.log(`Loading detailed data for routine: ${routine.name} (${routine.id})`);
            const detailedRoutine = await nutritionRoutineApi.getRoutine(routine.id);
            console.log(`Successfully loaded detailed data for ${routine.name}:`, detailedRoutine);
            return detailedRoutine;
          } catch (error) {
            console.error(`Failed to load meals for routine ${routine.id} (${routine.name}):`, error);
            console.error('Error details:', {
              message: (error as any).message,
              status: (error as any).status,
              data: (error as any).data
            });
            return { ...routine, meal_plans: [] };
          }
        })
      );
      
      console.log('Routines with meals loaded:', routinesWithMealsData);
      setRoutinesWithMeals(routinesWithMealsData);
    } catch (error) {
      console.error('Failed to load nutrition routines:', error);
      toast.error('Failed to load nutrition routines');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoutines();
  }, [loadRoutines]);

  const handleStartRoutine = async (routineId: string) => {
    try {
      await nutritionRoutineApi.startRoutine(routineId);
      toast.success('Nutrition routine set as active successfully!');
      loadRoutines();
    } catch (error) {
      console.error('Failed to start routine:', error);
      toast.error('Failed to set routine as active');
    }
  };

  const handleStopRoutine = async (routineId: string) => {
    try {
      await nutritionRoutineApi.stopRoutine(routineId);
      toast.success('Nutrition routine set as inactive successfully!');
      loadRoutines();
    } catch (error) {
      console.error('Failed to stop routine:', error);
      toast.error('Failed to set routine as inactive');
    }
  };

  const handleLogMeal = async (routineId: string) => {
    try {
      await nutritionRoutineApi.logMeal(routineId);
      toast.success('Meal logged successfully!');
      loadRoutines();
    } catch (error) {
      console.error('Failed to log meal:', error);
      toast.error('Failed to log meal');
    }
  };

  const handleDeleteRoutine = async (routineId: string) => {
    if (!confirm('Are you sure you want to delete this nutrition routine?')) {
      return;
    }

    try {
      await nutritionRoutineApi.deleteRoutine(routineId);
      toast.success('Nutrition routine deleted successfully!');
      loadRoutines();
    } catch (error) {
      console.error('Failed to delete routine:', error);
      toast.error('Failed to delete routine');
    }
  };

  const handleEditRoutine = async (routine: NutritionRoutine) => {
    try {
      // Try to fetch the full routine data with meal plans for editing
      try {
        const fullRoutine = await nutritionRoutineApi.getRoutine(routine.id);
        setEditingRoutine(fullRoutine);
        setShowBuilder(true);
      } catch (apiError) {
        console.warn('Failed to load full routine data, using basic data:', apiError);
        // Fallback: use the basic routine data and let the component handle it
        setEditingRoutine(routine as any);
        setShowBuilder(true);
      }
    } catch (error) {
      console.error('Failed to load routine details:', error);
      toast.error('Failed to load routine details');
    }
  };

  const handleBuilderSuccess = () => {
    setShowBuilder(false);
    setEditingRoutine(null);
    loadRoutines();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-100';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-100';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-100';
    }
  };

  const isRoutineActive = (routineId: string) => {
    return activeProgress?.routine_id === routineId && activeProgress?.is_active;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nutrition Routines</h2>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nutrition Routines</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage your personalized nutrition plans
          </p>
        </div>
        <Button onClick={() => setShowBuilder(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Routine
        </Button>
      </div>

      {activeProgress && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center">
              <PlayIcon className="h-5 w-5 mr-2" />
              Active Routine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  {routines.find(r => r.id === activeProgress.routine_id)?.name || 'Unknown Routine'}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Meals completed: {activeProgress.meals_completed} | 
                  Days completed: {activeProgress.days_completed}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleLogMeal(activeProgress.routine_id)}
                  className="border-2 border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 font-medium"
                >
                  Log Meal
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStopRoutine(activeProgress.routine_id)}
                  className="border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium"
                >
                  <PauseIcon className="h-4 w-4 mr-2" />
                  Set as Inactive
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {routines.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChartBarIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Nutrition Routines Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first nutrition routine to start tracking your meals and macros.
            </p>
            <Button onClick={() => setShowBuilder(true)}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Your First Routine
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routines.map((routine) => (
            <Card key={routine.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{routine.name}</CardTitle>
                  <Badge className={getDifficultyColor(routine.difficulty)}>
                    {routine.difficulty}
                  </Badge>
                </div>
                {routine.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {routine.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {routine.duration_weeks} weeks
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <FireIcon className="h-4 w-4 mr-2" />
                    {routine.target_calories} cal/day
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Target:</span>
                    <div className="flex gap-4 mt-1">
                      <span className="text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-100 px-2 py-1 rounded">
                        {routine.target_calories} cal/day
                      </span>
                    </div>
                  </div>
                  
                  {/* Meal Summary */}
                  {(() => {
                    const routineWithMeals = routinesWithMeals.find(r => r.id === routine.id);
                    const totalMeals = routineWithMeals?.meal_plans?.[0]?.meals?.length || 0;
                    const mealTypes = routineWithMeals?.meal_plans?.[0]?.meals?.map(m => m.meal_type) || [];
                    
                    if (totalMeals > 0) {
                      return (
                        <div className="text-sm">
                          <span className="font-medium">Meals:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {mealTypes.map((mealType, index) => (
                              <span key={index} className="text-xs bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-100 px-2 py-1 rounded capitalize">
                                {mealType}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium">Meals:</span> No meals defined
                      </div>
                    );
                  })()}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditRoutine(routine)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteRoutine(routine.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {isRoutineActive(routine.id) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStopRoutine(routine.id)}
                      className="border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium"
                    >
                      <PauseIcon className="h-4 w-4 mr-2" />
                      Set as Inactive
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleStartRoutine(routine.id)}
                      className="bg-orange-600 hover:bg-orange-700 text-white border-2 border-orange-700 hover:border-orange-800 font-medium shadow-md"
                    >
                      <PlayIcon className="h-4 w-4 mr-2" />
                      Set as Active
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SimpleNutritionRoutineBuilder
        isOpen={showBuilder}
        onClose={() => {
          setShowBuilder(false);
          setEditingRoutine(null);
        }}
        onSuccess={handleBuilderSuccess}
        editingRoutine={editingRoutine || undefined}
      />
    </div>
  );
}
