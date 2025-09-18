'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SimpleRoutineTemplates } from '@/components/health/SimpleRoutineTemplates';
import { SimpleWorkoutLogger } from '@/features/health/components/SimpleWorkoutLogger';
import { ProgressiveWorkoutLogger } from '@/components/health/ProgressiveWorkoutLogger';
import { SmartWorkoutLogger } from '@/components/health/SmartWorkoutLogger';
import FitnessLogsView from '@/components/health/FitnessLogsView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FireIcon, 
  ChartBarIcon, 
  PlusIcon, 
  ClockIcon,
  TrophyIcon,
  CalendarIcon,
  BoltIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useSuccessToast, useErrorToast, useWarningToast } from '@/components/ui/toast';
import { AnimatedButton, AnimatedCard, AnimatedCounter } from '@/components/ui/micro-interactions';
import { LoadingOverlay, StatsCardSkeleton } from '@/components/ui/loading-states';
import api from '@/lib/api';

export default function FitnessPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [onboardingStatus, setOnboardingStatus] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [activeTab, setActiveTab] = useState('logs');
  const [showSmartLogger, setShowSmartLogger] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [todayStats, setTodayStats] = useState({
    workouts: 0,
    totalMinutes: 0,
    caloriesBurned: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [workoutSuccess, setWorkoutSuccess] = useState(false);

  // Toast hooks
  const successToast = useSuccessToast();
  const errorToast = useErrorToast();
  const warningToast = useWarningToast();

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isAuthenticated) {
        setCheckingOnboarding(false);
        return;
      }

      try {
        const response = await api.get('/health/onboarding/status');
        setOnboardingStatus(response.completed);
        // Don't redirect to onboarding - let users access fitness page
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
        setOnboardingStatus(false);
        warningToast('Onboarding Status', 'Could not verify your profile completion status. You can still use the fitness tracker.');
        // Don't redirect on error - let users access fitness page
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, [isAuthenticated, router, warningToast]);

  const handleLogSuccess = async () => {
    setWorkoutSuccess(true);
    successToast('Workout Logged!', 'Your workout has been successfully recorded.');
    
    // Refresh real data from API
    try {
      setIsLoadingStats(true);
      setStatsError(null);
      const fitnessToday = await api.get('/health/logging/fitness/today');
      setTodayStats({
        workouts: fitnessToday.workouts || 0,
        totalMinutes: fitnessToday.totalMinutes || 0,
        caloriesBurned: fitnessToday.caloriesBurned || 0
      });
    } catch (error) {
      console.error('Failed to refresh fitness stats:', error);
      setStatsError('Failed to refresh stats');
      errorToast('Stats Update Failed', 'Could not refresh your workout statistics, but your workout was saved.');
      
      // Fallback to incrementing current stats
      setTodayStats(prev => ({
        ...prev,
        workouts: prev.workouts + 1,
        totalMinutes: prev.totalMinutes + 30,
        caloriesBurned: prev.caloriesBurned + 250
      }));
    } finally {
      setIsLoadingStats(false);
    }
    
    // Trigger refresh of the logs view
    setRefreshTrigger(prev => prev + 1);
    setShowSmartLogger(false);
    
    // Reset success state after animation
    setTimeout(() => setWorkoutSuccess(false), 2000);
  };

  useEffect(() => {
    // Load today's stats
    const loadTodayStats = async () => {
      if (!isAuthenticated) return;
      
      try {
        setIsLoadingStats(true);
        setStatsError(null);
        // Load today's fitness data with timezone offset
        const timezoneOffset = new Date().getTimezoneOffset();
        const fitnessToday = await api.get(`/health/logging/fitness/today?timezone_offset=${timezoneOffset}`);
        setTodayStats({
          workouts: fitnessToday.workouts || 0,
          totalMinutes: fitnessToday.totalMinutes || 0,
          caloriesBurned: fitnessToday.caloriesBurned || 0
        });
      } catch (error) {
        console.error('Failed to load today stats:', error);
        setStatsError('Failed to load stats');
        errorToast('Stats Loading Failed', 'Could not load your workout statistics. Using sample data.');
        
        // Fallback to mock data
        setTodayStats({
          workouts: Math.floor(Math.random() * 3),
          totalMinutes: Math.floor(Math.random() * 120),
          caloriesBurned: Math.floor(Math.random() * 500)
        });
      } finally {
        setIsLoadingStats(false);
      }
    };

    if (isAuthenticated && onboardingStatus) {
      loadTodayStats();
    }
  }, [isAuthenticated, onboardingStatus, errorToast]);

  if (!isAuthenticated || checkingOnboarding) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              {!isAuthenticated ? 'Loading...' : 'Checking status...'}
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-3xl mb-8">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative px-8 py-12">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-3">
                    Fitness & Recovery
                  </h1>
                  <p className="text-xl text-white/90 mb-6 max-w-2xl">
                    Track your workouts, monitor your progress, and optimize your fitness journey with AI-powered insights.
                  </p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                    <button
                      onClick={() => setShowSmartLogger(true)}
                      className={`bg-white/20 text-white hover:bg-white/30 px-6 py-3 rounded-xl font-semibold text-lg flex items-center gap-2 backdrop-blur-sm border-0 transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                        workoutSuccess ? 'animate-pulse bg-green-500/20 border-2 border-green-400' : ''
                      }`}
                    >
                      <BoltIcon className="h-5 w-5" />
                      <span>Log Today&apos;s Workout</span>
                    </button>
                    <AnimatedButton
                      onClick={() => setActiveTab('routines')}
                      className="bg-white/20 text-white hover:bg-white/30 px-6 py-3 rounded-xl font-semibold text-lg flex items-center gap-2 backdrop-blur-sm border-0"
                    >
                      <ChartBarIcon className="h-5 w-5" />
                      View Routines
                    </AnimatedButton>
                  </div>
                  <div className="flex items-center gap-4 text-white/80">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      <span className="text-sm">Workout Tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="text-sm">Progress Monitoring</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                      <span className="text-sm">AI Insights</span>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <FireIcon className="h-16 w-16 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Onboarding Notice */}
            {onboardingStatus === false && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    <strong>Tip:</strong> Complete your health profile in <a href="/onboarding" className="underline hover:no-underline">onboarding</a> for personalized recommendations
                  </p>
                </div>
              </div>
            )}


            {/* Today's Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <LoadingOverlay isLoading={isLoadingStats} message="Loading workout stats...">
                <AnimatedCard hover={false}>
                  <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white" data-testid="stats-card">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-100 text-sm font-medium">Today&apos;s Workouts</p>
                          <AnimatedCounter 
                            value={todayStats.workouts} 
                            className="text-3xl font-bold"
                            duration={0.8}
                          />
                        </div>
                        <FireIcon className="h-8 w-8 text-orange-200" />
                      </div>
                      {statsError && (
                        <div className="mt-2 text-xs text-orange-200 opacity-75">
                          ⚠️ {statsError}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </AnimatedCard>
              </LoadingOverlay>

              <LoadingOverlay isLoading={isLoadingStats} message="Loading workout stats...">
                <AnimatedCard hover={false}>
                  <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white" data-testid="stats-card">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm font-medium">Total Minutes</p>
                          <AnimatedCounter 
                            value={todayStats.totalMinutes} 
                            className="text-3xl font-bold"
                            duration={0.8}
                          />
                        </div>
                        <ClockIcon className="h-8 w-8 text-blue-200" />
                      </div>
                      {statsError && (
                        <div className="mt-2 text-xs text-blue-200 opacity-75">
                          ⚠️ {statsError}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </AnimatedCard>
              </LoadingOverlay>

              <LoadingOverlay isLoading={isLoadingStats} message="Loading workout stats...">
                <AnimatedCard hover={false}>
                  <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white" data-testid="stats-card">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-red-100 text-sm font-medium">Calories Burned</p>
                          <AnimatedCounter 
                            value={todayStats.caloriesBurned} 
                            className="text-3xl font-bold"
                            duration={0.8}
                          />
                        </div>
                        <TrophyIcon className="h-8 w-8 text-red-200" />
                      </div>
                      {statsError && (
                        <div className="mt-2 text-xs text-red-200 opacity-75">
                          ⚠️ {statsError}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </AnimatedCard>
              </LoadingOverlay>

              <AnimatedCard hover={true} onClick={() => setActiveTab('log')}>
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium">Quick Log</p>
                        <p className="text-lg font-bold">Log Workout</p>
                      </div>
                      <BoltIcon className="h-8 w-8 text-green-200" />
                    </div>
                  </CardContent>
                </Card>
              </AnimatedCard>
            </div>

            {/* Main Content with Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" data-testid="fitness-tabs">
                <TabsList className="grid w-full grid-cols-4 mb-8">
                  <TabsTrigger value="logs" className="flex items-center gap-2" data-testid="workout-logs-tab">
                    <DocumentTextIcon className="h-4 w-4" />
                    Workout Logs
                  </TabsTrigger>
                  <TabsTrigger value="routines" className="flex items-center gap-2" data-testid="routines-tab">
                    <ChartBarIcon className="h-4 w-4" />
                    My Routines
                  </TabsTrigger>
                  <TabsTrigger value="log" className="flex items-center gap-2" data-testid="log-workout-tab">
                    <PlusIcon className="h-4 w-4" />
                    Log Workout
                  </TabsTrigger>
                  <TabsTrigger value="progress" className="flex items-center gap-2" data-testid="progress-tab">
                    <CalendarIcon className="h-4 w-4" />
                    Progress
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="routines" className="space-y-6">
                  <SimpleRoutineTemplates onRoutineSelected={handleLogSuccess} />
                </TabsContent>

                <TabsContent value="log" className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      Log Your Workout
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                      Choose your preferred logging experience
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
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                          <BoltIcon className="h-5 w-5" />
                          <span className="font-medium">Smart Guided Experience</span>
                        </div>
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                          Step-by-step logging with smart suggestions and exercise database
                        </p>
                      </div>
                      <ProgressiveWorkoutLogger 
                        onSuccess={handleLogSuccess}
                      />
                    </TabsContent>
                    
                    <TabsContent value="simple" className="space-y-6">
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <ClockIcon className="h-5 w-5" />
                          <span className="font-medium">Quick & Simple</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Fast logging for users who know exactly what they want to track
                        </p>
                      </div>
                      <SimpleWorkoutLogger onWorkoutLogged={handleLogSuccess} />
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                <TabsContent value="logs" className="space-y-6">
                  <FitnessLogsView refreshTrigger={refreshTrigger} />
                </TabsContent>

                <TabsContent value="progress" className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      Your Progress
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                      Track your fitness journey and see your improvements
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FireIcon className="h-5 w-5 text-orange-500" />
                          This Week
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Workouts</span>
                            <span className="font-semibold">4 / 5</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-orange-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrophyIcon className="h-5 w-5 text-yellow-500" />
                          Achievements
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">First Workout</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">Week Streak</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <span className="text-sm text-gray-500">Monthly Goal</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

          </div>
        </div>

        {/* Smart Workout Logger Modal */}
        <SmartWorkoutLogger
          isOpen={showSmartLogger}
          onClose={() => setShowSmartLogger(false)}
          onSuccess={handleLogSuccess}
        />
      </div>
    </ProtectedRoute>
  );
}