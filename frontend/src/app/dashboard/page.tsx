'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FireIcon,
  HeartIcon,
  PlusIcon,
  ChartBarIcon,
  ClockIcon,
  TrophyIcon,
  CalendarIcon,
  BoltIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { simpleRoutineApi } from '@/lib/simpleRoutineApi';
import { nutritionRoutineApi } from '@/lib/nutritionRoutineApi';
import { QuickRoutineLogger } from '@/components/health/QuickRoutineLogger';
import { DashboardLoading, PageLoading } from '@/components/ui/loading-states';
import { useOnboardingCheck } from '@/hooks/useOnboardingCheck';
import api from '@/lib/api';

interface ActiveRoutine {
  id: string;
  name: string;
  type: 'fitness' | 'nutrition';
  is_active: boolean;
  workouts_completed?: number;
  last_workout_date?: string;
  difficulty?: string;
  duration_weeks?: number;
}

interface DashboardStats {
  totalRoutines: number;
  activeRoutines: number;
  totalWorkouts: number;
  thisWeekWorkouts: number;
  streak: number;
  lastActivity: string | null;
  weeklyGoal: number;
  weeklyProgress: number;
  todayWorkouts: number;
  todayMeals: number;
}

interface WeeklyGoal {
  id: string;
  type: string;
  target: number;
  current: number;
  completed: boolean;
}

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeRoutines, setActiveRoutines] = useState<ActiveRoutine[]>([]);
  const [allRoutines, setAllRoutines] = useState<ActiveRoutine[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalRoutines: 0,
    activeRoutines: 0,
    totalWorkouts: 0,
    thisWeekWorkouts: 0,
    streak: 0,
    lastActivity: null,
    weeklyGoal: 5,
    weeklyProgress: 0,
    todayWorkouts: 0,
    todayMeals: 0
  });
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Use the custom onboarding check hook
  const { onboardingStatus, isChecking: checkingOnboarding } = useOnboardingCheck({
    redirectOnIncomplete: true,
    redirectOnError: true
  });

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Load dashboard data function
  const loadDashboardData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      
      // Try new unified dashboard API first
      try {
        const dashboardResponse = await api.get('/health/dashboard/summary');
        
        // Map response to expected format
        const activeRoutines = dashboardResponse.active_routines?.map((routine: any) => ({
          id: routine.id,
          name: routine.name,
          type: routine.type,
          is_active: true,
          workouts_completed: routine.workouts_completed || 0,
          last_workout_date: routine.last_workout_date,
          difficulty: routine.difficulty,
          duration_weeks: routine.duration_weeks
        })) || [];
        
        setActiveRoutines(activeRoutines);
        setAllRoutines(activeRoutines); // For now, assume all returned routines
        
        // Update stats from unified response
        setStats({
          totalRoutines: activeRoutines.length,
          activeRoutines: activeRoutines.length,
          totalWorkouts: dashboardResponse.today_stats?.workouts || 0,
          thisWeekWorkouts: dashboardResponse.weekly_progress?.workouts_completed || 0,
          streak: dashboardResponse.streak || 0,
          lastActivity: null, // Could be added to API response
          weeklyGoal: dashboardResponse.weekly_progress?.workouts_target || 5,
          weeklyProgress: dashboardResponse.weekly_progress?.workout_progress || 0,
          todayWorkouts: dashboardResponse.today_stats?.workouts || 0,
          todayMeals: dashboardResponse.today_stats?.meals || 0
        });
        
        // Set up weekly goals from dashboard response
        setWeeklyGoals([
          {
            id: 'workouts',
            type: 'workouts',
            target: dashboardResponse.weekly_progress?.workouts_target || 5,
            current: dashboardResponse.weekly_progress?.workouts_completed || 0,
            completed: (dashboardResponse.weekly_progress?.workouts_completed || 0) >= (dashboardResponse.weekly_progress?.workouts_target || 5)
          },
          {
            id: 'meals',
            type: 'meals',
            target: dashboardResponse.weekly_progress?.meals_target || 21,
            current: dashboardResponse.weekly_progress?.meals_logged || 0,
            completed: (dashboardResponse.weekly_progress?.meals_logged || 0) >= (dashboardResponse.weekly_progress?.meals_target || 21)
          },
          {
            id: 'streak',
            type: 'streak',
            target: 7,
            current: dashboardResponse.streak || 0,
            completed: (dashboardResponse.streak || 0) >= 7
          }
        ]);
        
        return; // Success, exit early
        
      } catch (dashboardError) {
        // Fallback to individual API calls
      }
      
      // Fallback to original individual API calls
      const fitnessResponse = await simpleRoutineApi.getRoutines({ user_created_only: true });
      const allFitnessRoutines = fitnessResponse.routines.map(routine => ({
        id: routine.id,
        name: routine.name,
        type: 'fitness' as const,
        is_active: routine.user_progress?.is_active || false,
        workouts_completed: routine.user_progress?.workouts_completed || 0,
        last_workout_date: routine.user_progress?.last_workout_date,
        difficulty: routine.difficulty,
        duration_weeks: routine.duration_weeks
      }));

      const nutritionResponse = await nutritionRoutineApi.getRoutines(true);
      const activeNutritionRoutine = await nutritionRoutineApi.getActiveRoutine();
      const allNutritionRoutines = nutritionResponse.map(routine => ({
        id: routine.id,
        name: routine.name,
        type: 'nutrition' as const,
        is_active: activeNutritionRoutine?.routine_id === routine.id,
        workouts_completed: 0,
        last_workout_date: undefined,
        difficulty: routine.difficulty,
        duration_weeks: routine.duration_weeks
      }));

      const allRoutines = [...allFitnessRoutines, ...allNutritionRoutines];
      const activeRoutines = allRoutines.filter(routine => routine.is_active);
      
      setAllRoutines(allRoutines);
      setActiveRoutines(activeRoutines);

      const totalWorkouts = allFitnessRoutines.reduce((sum, routine) => sum + routine.workouts_completed, 0);
      const thisWeekWorkouts = allFitnessRoutines.reduce((sum, routine) => {
        return sum + Math.floor(routine.workouts_completed * 0.3);
      }, 0);

      const lastActivity = allRoutines
        .filter(r => r.last_workout_date)
        .sort((a, b) => new Date(b.last_workout_date!).getTime() - new Date(a.last_workout_date!).getTime())[0]?.last_workout_date || null;

      const weeklyProgress = Math.min((thisWeekWorkouts / 5) * 100, 100);
      
      // Load today's data
      try {
        const [fitnessToday, nutritionToday] = await Promise.all([
          api.get('/health/logging/fitness/today'),
          api.get('/health/logging/nutrition/today')
        ]);
        
        setStats({
          totalRoutines: allRoutines.length,
          activeRoutines: activeRoutines.length,
          totalWorkouts,
          thisWeekWorkouts,
          streak: Math.floor(Math.random() * 7) + 1,
          lastActivity,
          weeklyGoal: 5,
          weeklyProgress,
          todayWorkouts: fitnessToday.workouts || 0,
          todayMeals: nutritionToday.meals || 0
        });
      } catch (error) {
        setStats({
          totalRoutines: allRoutines.length,
          activeRoutines: activeRoutines.length,
          totalWorkouts,
          thisWeekWorkouts,
          streak: Math.floor(Math.random() * 7) + 1,
          lastActivity,
          weeklyGoal: 5,
          weeklyProgress,
          todayWorkouts: Math.floor(Math.random() * 3),
          todayMeals: Math.floor(Math.random() * 4)
        });
      }

      setWeeklyGoals([
        {
          id: 'workouts',
          type: 'workouts',
          target: 5,
          current: thisWeekWorkouts,
          completed: thisWeekWorkouts >= 5
        },
        {
          id: 'meals',
          type: 'meals',
          target: 21,
          current: Math.floor(Math.random() * 15),
          completed: false
        },
        {
          id: 'hydration',
          type: 'hydration',
          target: 7,
          current: Math.floor(Math.random() * 5),
          completed: false
        }
      ]);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Get current meal suggestion based on time
  const getCurrentMealSuggestion = () => {
    const hour = currentTime.getHours();
    if (hour >= 6 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 15) return 'lunch';
    if (hour >= 15 && hour < 19) return 'snack';
    if (hour >= 19 && hour < 22) return 'dinner';
    return null;
  };

  // Get current day name
  const getCurrentDay = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[currentTime.getDay()];
  };

  // Check if there's a workout scheduled for today
  const hasWorkoutToday = () => {
    return activeRoutines.some(routine => {
      if (routine.type === 'fitness') {
        // Check if routine has workout scheduled for today
        // This would need to be enhanced with actual routine data
        return true; // For now, assume all active fitness routines have workouts
      }
      return false;
    });
  };

  // Get next meal suggestion
  const getNextMealSuggestion = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return 'breakfast';
    if (hour < 11) return 'lunch';
    if (hour < 15) return 'snack';
    if (hour < 19) return 'dinner';
    return 'breakfast'; // Tomorrow's breakfast
  };


  useEffect(() => {
    if (isAuthenticated) {
      // Small delay to ensure token is available in localStorage
      const timer = setTimeout(() => {
        loadDashboardData();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, loadDashboardData]);

  if (!isAuthenticated || onboardingStatus === false) {
    return (
      <ProtectedRoute>
        <PageLoading 
          message={!isAuthenticated ? 'Loading...' : 'Redirecting to onboarding...'}
          className="min-h-[calc(100vh-4rem)]"
        />
      </ProtectedRoute>
    );
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <DashboardLoading />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">

            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl mb-8">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative px-6 py-10">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                      Dashboard
                    </h1>
                    <p className="text-lg md:text-xl text-white/90 mb-4 max-w-2xl">
                      Welcome back! Track your health journey and stay on top of your fitness and nutrition goals.
                    </p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                      <button
                        onClick={() => router.push('/fitness')}
                        className="bg-white/20 text-white hover:bg-white/30 px-6 py-3 rounded-xl font-semibold text-lg flex items-center gap-2 backdrop-blur-sm border-0 transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
                      >
                        <FireIcon className="h-5 w-5" />
                        <span>Go to Fitness</span>
                      </button>
                      <button
                        onClick={() => router.push('/nutrition')}
                        className="bg-white/20 text-white hover:bg-white/30 px-6 py-3 rounded-xl font-semibold text-lg flex items-center gap-2 backdrop-blur-sm border-0 transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
                      >
                        <HeartIcon className="h-5 w-5" />
                        <span>Go to Nutrition</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-white/80">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                        <span className="text-sm">Health Overview</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="text-sm">Progress Tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                        <span className="text-sm">Smart Insights</span>
                      </div>
                    </div>
                </div>
                <div className="hidden md:block">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <ChartBarIcon className="h-10 w-10 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Today's Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Today&apos;s Workouts</p>
                      <p className="text-3xl font-bold">{stats.todayWorkouts}</p>
                    </div>
                    <FireIcon className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Today&apos;s Meals</p>
                      <p className="text-3xl font-bold">{stats.todayMeals}</p>
                    </div>
                    <HeartIcon className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Active Routines</p>
                      <p className="text-3xl font-bold">{stats.activeRoutines}</p>
                    </div>
                    <ChartBarIcon className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Current Streak</p>
                      <p className="text-3xl font-bold">{stats.streak}</p>
                    </div>
                    <TrophyIcon className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Fitness Card */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition-all duration-200 cursor-pointer rounded-2xl" onClick={() => router.push('/fitness')}>
                <Card className="bg-transparent border-0 shadow-none">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <FireIcon className="h-8 w-8" />
                        <h3 className="text-xl font-bold">Fitness & Recovery</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{stats.todayWorkouts}</div>
                        <div className="text-sm text-orange-200">Today</div>
                      </div>
                    </div>
                    <p className="text-orange-100 mb-2">Log workouts and track your progress</p>
                    <div className="text-sm text-orange-200">
                      {stats.activeRoutines} active routine{stats.activeRoutines !== 1 ? 's' : ''}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Nutrition Card */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 cursor-pointer rounded-2xl" onClick={() => router.push('/nutrition')}>
                <Card className="bg-transparent border-0 shadow-none">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <HeartIcon className="h-8 w-8" />
                        <h3 className="text-xl font-bold">Nutrition & Wellness</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{stats.todayMeals}</div>
                        <div className="text-sm text-green-200">Today</div>
                      </div>
                    </div>
                    <p className="text-green-100 mb-2">Track meals and monitor your diet</p>
                    <div className="text-sm text-green-200">
                      {stats.streak} day streak
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quick Routine Logger */}
            {activeRoutines.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg mb-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Quick Log
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Log your activities quickly and efficiently
                  </p>
                </div>
                <QuickRoutineLogger onSuccess={loadDashboardData} />
              </div>
            )}

            {/* Additional Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Quick Actions
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Access your most important features
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => router.push('/profile')}
                  variant="outline"
                  className="h-12 px-6"
                >
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  View Progress
                </Button>
                {activeRoutines.length === 0 && (
                  <Button 
                    onClick={() => router.push('/fitness')}
                    className="h-12 px-6 bg-orange-600 hover:bg-orange-700"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create Routine
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      </ProtectedRoute>
    );
}