"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Apple, Target, TrendingUp, Plus, Calendar, Clock, Utensils } from 'lucide-react';
import { routineService } from '@/services/routineService';

interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  water: number;
}

const nutritionGoals: NutritionGoals = {
  calories: 2500,
  protein: 150,
  carbs: 280,
  fat: 85,
  fiber: 35,
  water: 3000
};

function NutritionOverviewCard() {
  const [currentNutrition, setCurrentNutrition] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0
  });

  useEffect(() => {
    const nutrition = routineService.getDailyNutritionTotals();
    setCurrentNutrition(nutrition);
  }, []);

  const macroData = [
    { name: 'Calories', current: currentNutrition.calories, goal: nutritionGoals.calories, unit: 'kcal', color: 'text-blue-600' },
    { name: 'Protein', current: currentNutrition.protein, goal: nutritionGoals.protein, unit: 'g', color: 'text-green-600' },
    { name: 'Carbs', current: currentNutrition.carbs, goal: nutritionGoals.carbs, unit: 'g', color: 'text-orange-600' },
    { name: 'Fat', current: currentNutrition.fat, goal: nutritionGoals.fat, unit: 'g', color: 'text-purple-600' },
    { name: 'Fiber', current: currentNutrition.fiber, goal: nutritionGoals.fiber, unit: 'g', color: 'text-emerald-600' }
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Today's Nutrition</h2>
        <Target className="h-5 w-5 text-gray-500" />
      </div>
      
      <div className="space-y-4">
        {macroData.map((macro) => {
          const percentage = Math.min((macro.current / macro.goal) * 100, 100);
          const isComplete = macro.current >= macro.goal;
          
          return (
            <div key={macro.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`font-medium ${macro.color}`}>{macro.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {Math.round(macro.current)}/{macro.goal}{macro.unit}
                  </span>
                  {isComplete && <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">✓</Badge>}
                </div>
              </div>
              <Progress value={percentage} className="h-2" />
              <div className="text-xs text-gray-500">
                {percentage.toFixed(0)}% of daily goal
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function NutritionPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] w-full px-4 py-6 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nutrition Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track your daily nutrition and fuel your fitness goals
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/today">
              <Button variant="outline">← Back to Today</Button>
            </Link>
            <Button>
              <Utensils className="h-4 w-4 mr-2" />
              Log Food
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-6">
            <NutritionOverviewCard />
          </section>
        </div>
      </div>
    </div>
  );
}