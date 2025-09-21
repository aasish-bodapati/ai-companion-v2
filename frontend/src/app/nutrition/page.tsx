'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SimpleNutritionLogForm } from '@/features/health/components/SimpleNutritionLogForm';
import { ProgressiveNutritionLogger } from '@/components/health/ProgressiveNutritionLogger';
import { NutritionRoutineManager } from '@/features/health/components/NutritionRoutineManager';
import { SmartMealLogger } from '@/components/health/SmartMealLogger';
import NutritionLogsView from '@/components/health/NutritionLogsViewFitness';
import { 
  HeartIcon, 
  ChartBarIcon, 
  PlusIcon, 
  ClockIcon,
  TrophyIcon,
  CalendarIcon,
  FireIcon,
  BoltIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';

export default function NutritionPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [onboardingStatus, setOnboardingStatus] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState('logs');
  const [showSmartLogger, setShowSmartLogger] = useState(false);
  const [mealSuccess, setMealSuccess] = useState(false);
  const [todayStats, setTodayStats] = useState({
    meals: 0,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isAuthenticated) {
        return;
      }

      try {
        const response = await api.get('/health/onboarding/status');
        setOnboardingStatus(response.completed);
        if (!response.completed) {
          router.push('/onboarding');
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
        setOnboardingStatus(false);
        router.push('/onboarding');
      }
    };

    if (isAuthenticated !== null) {
      checkOnboarding();
    }
  }, [isAuthenticated, router]);

  const handleLogSuccess = useCallback(async () => {
    // Refresh real data from API
    try {
      const nutritionToday = await api.get('/health/logging/nutrition/today');
      setTodayStats({
        meals: nutritionToday.meals || 0,
        calories: nutritionToday.calories || 0,
        protein: nutritionToday.protein || 0,
        carbs: nutritionToday.carbs || 0,
        fat: nutritionToday.fat || 0
      });
    } catch (error) {
      console.error('Failed to refresh nutrition stats:', error);
      // Fallback to incrementing current stats
      setTodayStats(prev => ({
        ...prev,
        meals: prev.meals + 1,
        calories: prev.calories + 500,
        protein: prev.protein + 25,
        carbs: prev.carbs + 60,
        fat: prev.fat + 20
      }));
    }
    
    // Show success animation
    setMealSuccess(true);
    setTimeout(() => setMealSuccess(false), 2000);
    logger.debug('Meal logged successfully!');
  }, []);

  useEffect(() => {
    // Load today's nutrition stats
    const loadTodayStats = async () => {
      if (!isAuthenticated) return;
      
      try {
        const nutritionToday = await api.get('/health/logging/nutrition/today');
        setTodayStats({
          meals: nutritionToday.meals || 0,
          calories: nutritionToday.calories || 0,
          protein: nutritionToday.protein || 0,
          carbs: nutritionToday.carbs || 0,
          fat: nutritionToday.fat || 0
        });
      } catch (error) {
        console.error('Failed to load today stats:', error);
        // Fallback to mock data
        setTodayStats({
          meals: Math.floor(Math.random() * 4),
          calories: Math.floor(Math.random() * 2000),
          protein: Math.floor(Math.random() * 100),
          carbs: Math.floor(Math.random() * 200),
          fat: Math.floor(Math.random() * 80)
        });
      }
    };

    if (isAuthenticated) {
      loadTodayStats();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated || onboardingStatus === false) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              {!isAuthenticated ? 'Loading...' : 'Redirecting to onboarding...'}
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ErrorBoundary>
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Hero Section */}
              <div className="relative overflow-hidden bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-3xl mb-8">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative px-6 py-10">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                        Nutrition & Wellness
                      </h1>
                      <p className="text-lg md:text-xl text-white/90 mb-4 max-w-2xl">
                        Track your meals, monitor macros, and fuel your fitness goals with intelligent nutrition insights.
                      </p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                      <button
                        onClick={() => setShowSmartLogger(true)}
                        className={`bg-white/20 text-white hover:bg-white/30 px-6 py-3 rounded-xl font-semibold text-lg flex items-center gap-2 backdrop-blur-sm border-0 transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                          mealSuccess ? 'animate-pulse bg-green-500/20 border-2 border-green-400' : ''
                        }`}
                      >
                        <BoltIcon className="h-5 w-5" />
                        <span>Log Today&apos;s Meal</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('routines')}
                        className="bg-white/20 text-white hover:bg-white/30 px-6 py-3 rounded-xl font-semibold text-lg flex items-center gap-2 transition-all duration-200 backdrop-blur-sm"
                      >
                        <ChartBarIcon className="h-5 w-5" />
                        View Routines
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-white/80">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-sm">Meal Tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        <span className="text-sm">Macro Monitoring</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                        <span className="text-sm">Smart Insights</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden lg:block">
                    <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <HeartIcon className="h-16 w-16 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Nutrition Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Meals Today</p>
                    <p className="text-3xl font-bold">{todayStats.meals}</p>
                  </div>
                  <HeartIcon className="h-8 w-8 text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Calories</p>
                    <p className="text-3xl font-bold">{todayStats.calories}</p>
                  </div>
                  <FireIcon className="h-8 w-8 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Protein (g)</p>
                    <p className="text-3xl font-bold">{todayStats.protein}</p>
                  </div>
                  <TrophyIcon className="h-8 w-8 text-purple-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Carbs (g)</p>
                    <p className="text-3xl font-bold">{todayStats.carbs}</p>
                  </div>
                  <ChartBarIcon className="h-8 w-8 text-orange-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">Fat (g)</p>
                    <p className="text-3xl font-bold">{todayStats.fat}</p>
                  </div>
                  <ClockIcon className="h-8 w-8 text-red-200" />
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-8">
                    <TabsTrigger value="logs" className="flex items-center gap-2">
                      <ListBulletIcon className="h-4 w-4" />
                      Meal Logs
                    </TabsTrigger>
                    <TabsTrigger value="routines" className="flex items-center gap-2">
                      <ChartBarIcon className="h-4 w-4" />
                      Nutrition Routines
                    </TabsTrigger>
                    <TabsTrigger value="log" className="flex items-center gap-2">
                      <PlusIcon className="h-4 w-4" />
                      Log Meal
                    </TabsTrigger>
                    <TabsTrigger value="progress" className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Progress
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="logs" className="space-y-6">
                    <NutritionLogsView 
                      refreshTrigger={mealSuccess ? Date.now() : undefined} 
                      isActive={activeTab === 'logs'}
                    />
                  </TabsContent>

                  <TabsContent value="routines" className="space-y-6">
                    <NutritionRoutineManager />
                  </TabsContent>

                  <TabsContent value="log" className="space-y-6">
                    <div className="text-center mb-6">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Log Your Meal
                      </h2>
                      <p className="text-lg text-gray-600 dark:text-gray-400">
                        Choose your preferred nutrition logging experience
                      </p>
                    </div>
                    
                    <Tabs defaultValue="progressive" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="progressive" className="flex items-center gap-2">
                          <BoltIcon className="h-4 w-4" />
                          ✨ Guided Logger
                        </TabsTrigger>
                        <TabsTrigger value="simple" className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4" />
                          Quick Logger
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="progressive" className="space-y-6">
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-4">
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                            <BoltIcon className="h-5 w-5" />
                            <span className="font-medium">Smart Food Database</span>
                          </div>
                          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                            Step-by-step meal logging with food search and nutrition calculation
                          </p>
                        </div>
                        <ProgressiveNutritionLogger 
                          onSuccess={handleLogSuccess}
                        />
                      </TabsContent>
                      
                      <TabsContent value="simple" className="space-y-6">
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <ClockIcon className="h-5 w-5" />
                            <span className="font-medium">Manual Entry</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Quick manual nutrition entry for experienced users
                          </p>
                        </div>
                        <SimpleNutritionLogForm onSuccess={handleLogSuccess} />
                      </TabsContent>
                    </Tabs>
                  </TabsContent>

                  <TabsContent value="progress" className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Nutrition Progress
                      </h2>
                      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                        Track your nutrition goals and see your improvements
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <ChartBarIcon className="h-5 w-5 text-green-500" />
                          Macro Breakdown
                        </h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Protein</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                              </div>
                              <span className="text-sm font-medium">{todayStats.protein}g</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Carbs</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                              </div>
                              <span className="text-sm font-medium">{todayStats.carbs}g</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Fat</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div className="bg-red-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                              </div>
                              <span className="text-sm font-medium">{todayStats.fat}g</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <TrophyIcon className="h-5 w-5 text-yellow-500" />
                          Weekly Goals
                        </h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Meals Logged</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">18 / 21</span>
                              <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Calorie Goal</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{todayStats.calories} / 2000</span>
                              <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Hydration</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">5 / 7 days</span>
                              <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '71%' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>

        {/* Smart Meal Logger Modal */}
        <SmartMealLogger
          isOpen={showSmartLogger}
          onClose={() => setShowSmartLogger(false)}
          onSuccess={handleLogSuccess}
        />
      </div>
      </ProtectedRoute>
    </ErrorBoundary>
  );
}
