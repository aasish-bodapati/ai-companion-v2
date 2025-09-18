'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FireIcon, 
  ClockIcon, 
  HeartIcon, 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import api from '@/lib/api';

interface FitnessLog {
  id: string;
  activity_type: string;
  activity_name: string;
  duration_minutes: number;
  intensity: string;
  calories_burned: number;
  activity_date: string;
  created_at: string;
}

export function SimpleFitnessDashboard() {
  const [todayStats, setTodayStats] = useState({
    workouts: 0,
    totalMinutes: 0,
    caloriesBurned: 0,
    avgIntensity: 0
  });
  const [weeklyStats, setWeeklyStats] = useState({
    totalWorkouts: 0,
    totalMinutes: 0,
    avgCaloriesPerWorkout: 0,
    streak: 0
  });
  const [recentLogs, setRecentLogs] = useState<FitnessLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFitnessData();
  }, []);

  const loadFitnessData = async () => {
    try {
      setLoading(true);
      
      // Load today's fitness data with timezone offset
      const timezoneOffset = new Date().getTimezoneOffset();
      const todayResponse = await api.get(`/health/logging/fitness/today?timezone_offset=${timezoneOffset}`);
      setTodayStats(todayResponse);
      
      // Load weekly fitness data with timezone offset
      const weeklyResponse = await api.get(`/health/logging/fitness/weekly?timezone_offset=${timezoneOffset}`);
      setWeeklyStats(weeklyResponse);
      
      // Load recent fitness logs (last 5)
      const logsResponse = await api.get('/health/logging/fitness?limit=5');
      setRecentLogs(logsResponse);
    } catch (error) {
      console.error('Failed to load fitness data:', error);
      // Set default values on error
      setTodayStats({
        workouts: 0,
        totalMinutes: 0,
        caloriesBurned: 0,
        avgIntensity: 0
      });
      setWeeklyStats({
        totalWorkouts: 0,
        totalMinutes: 0,
        avgCaloriesPerWorkout: 0,
        streak: 0
      });
      setRecentLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getIntensityStatus = (intensity: number) => {
    if (intensity >= 8) return { label: 'High', color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-100' };
    if (intensity >= 5) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-100' };
    return { label: 'Low', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-100' };
  };

  const getActivityTypeIcon = (activityType: string) => {
    switch (activityType.toLowerCase()) {
      case 'running':
      case 'jogging':
        return <FireIcon className="h-4 w-4 text-orange-500" />;
      case 'walking':
        return <HeartIcon className="h-4 w-4 text-green-500" />;
      case 'weightlifting':
      case 'strength':
        return <ChartBarIcon className="h-4 w-4 text-blue-500" />;
      case 'cycling':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-purple-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const intensityStatus = getIntensityStatus(todayStats.avgIntensity);

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
      {/* Today's Overview */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FireIcon className="h-5 w-5 text-orange-500" />
          Today&apos;s Fitness
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Workouts</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayStats.workouts}</p>
                </div>
                <FireIcon className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Minutes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayStats.totalMinutes}</p>
                </div>
                <ClockIcon className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Calories Burned</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayStats.caloriesBurned}</p>
                </div>
                <HeartIcon className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Intensity</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayStats.avgIntensity}/10</p>
                  <Badge className={`mt-1 ${intensityStatus.color}`}>
                    {intensityStatus.label}
                  </Badge>
                </div>
                <ChartBarIcon className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Weekly Summary */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 text-blue-500" />
          This Week
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Workouts</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyStats.totalWorkouts}</p>
                </div>
                <FireIcon className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Minutes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyStats.totalMinutes}</p>
                </div>
                <ClockIcon className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Calories</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyStats.avgCaloriesPerWorkout}</p>
                </div>
                <HeartIcon className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Streak</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyStats.streak} days</p>
                </div>
                <ArrowTrendingUpIcon className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      {recentLogs.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-gray-500" />
            Recent Activity
          </h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getActivityTypeIcon(log.activity_type)}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{log.activity_name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {log.duration_minutes} min • {log.calories_burned} cal
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(log.activity_date).toLocaleDateString()}
                      </p>
                      <Badge className={`mt-1 ${getIntensityStatus(parseInt(log.intensity)).color}`}>
                        {log.intensity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
