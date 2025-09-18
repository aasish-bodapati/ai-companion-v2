'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  HeartIcon, 
  BeakerIcon, 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import api from '@/lib/api';

export function SimpleNutritionDashboard() {
  const [todayStats, setTodayStats] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    water: 0,
    meals: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  });
  const [weeklyStats, setWeeklyStats] = useState({
    avgCalories: 0,
    avgProtein: 0,
    avgCarbs: 0,
    avgFat: 0,
    avgWater: 0,
    totalMeals: 0
  });
  const [recentMeals, setRecentMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNutritionData();
  }, []);

  const loadNutritionData = async () => {
    try {
      setLoading(true);
      
      // Load today's nutrition data
      const todayResponse = await api.get('/health/logging/nutrition/today');
      setTodayStats({
        calories: todayResponse.calories || 0,
        protein: todayResponse.protein || 0,
        carbs: todayResponse.carbs || 0,
        fat: todayResponse.fat || 0,
        water: todayResponse.water || 0,
        meals: todayResponse.meals || 0,
        fiber: todayResponse.fiber || 0,
        sugar: todayResponse.sugar || 0,
        sodium: todayResponse.sodium || 0
      });
      
      // Load weekly nutrition data
      const weeklyResponse = await api.get('/health/logging/nutrition/weekly');
      setWeeklyStats({
        avgCalories: weeklyResponse.avgCalories || 0,
        avgProtein: weeklyResponse.avgProtein || 0,
        avgCarbs: weeklyResponse.avgCarbs || 0,
        avgFat: weeklyResponse.avgFat || 0,
        avgWater: weeklyResponse.avgWater || 0,
        totalMeals: weeklyResponse.totalMeals || 0
      });

      // Load recent meals
      const mealsResponse = await api.get('/health/logging/nutrition/recent');
      setRecentMeals(mealsResponse.meals || []);
    } catch (error) {
      console.error('Failed to load nutrition data:', error);
      // Set default values on error
      setTodayStats({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        water: 0,
        meals: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0
      });
      setWeeklyStats({
        avgCalories: 0,
        avgProtein: 0,
        avgCarbs: 0,
        avgFat: 0,
        avgWater: 0,
        totalMeals: 0
      });
      setRecentMeals([]);
    } finally {
      setLoading(false);
    }
  };

  const getCalorieStatus = (calories: number) => {
    // Assuming 2000 calories as daily target
    const target = 2000;
    const percentage = (calories / target) * 100;
    
    if (percentage >= 90 && percentage <= 110) {
      return { label: 'On Track', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-100' };
    } else if (percentage < 90) {
      return { label: 'Under Target', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-100' };
    } else {
      return { label: 'Over Target', color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-100' };
    }
  };

  const getWaterStatus = (water: number) => {
    // Assuming 2000ml as daily target
    const target = 2000;
    const percentage = (water / target) * 100;
    
    if (percentage >= 80) {
      return { label: 'Well Hydrated', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-100' };
    } else if (percentage >= 50) {
      return { label: 'Getting There', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-100' };
    } else {
      return { label: 'Need More', color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-100' };
    }
  };

  const calorieStatus = getCalorieStatus(todayStats.calories);
  const waterStatus = getWaterStatus(todayStats.water);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Nutrition */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <HeartIcon className="h-5 w-5 text-green-500" />
          Today&apos;s Nutrition
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Calories</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayStats.calories}</p>
                  <Badge className={`mt-1 ${calorieStatus.color}`}>
                    {calorieStatus.label}
                  </Badge>
                </div>
                <HeartIcon className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Protein</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayStats.protein}g</p>
                </div>
                <ChartBarIcon className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Carbs</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayStats.carbs}g</p>
                </div>
                <ArrowTrendingUpIcon className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fat</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayStats.fat}g</p>
                </div>
                <BeakerIcon className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Water & Meals */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BeakerIcon className="h-5 w-5 text-blue-500" />
          Hydration & Meals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Water Intake</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayStats.water}ml</p>
                  <Badge className={`mt-1 ${waterStatus.color}`}>
                    {waterStatus.label}
                  </Badge>
                </div>
                <BeakerIcon className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Meals Logged</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayStats.meals}</p>
                </div>
                <HeartIcon className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Weekly Summary */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 text-purple-500" />
          This Week
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Calories</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyStats.avgCalories}</p>
                </div>
                <HeartIcon className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Protein</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyStats.avgProtein}g</p>
                </div>
                <ChartBarIcon className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Water</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyStats.avgWater}ml</p>
                </div>
                <BeakerIcon className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Meals</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyStats.totalMeals}</p>
                </div>
                <HeartIcon className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
