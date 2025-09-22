import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ClockIcon, 
  FireIcon, 
  TrophyIcon, 
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import { AnimatedCounter } from '@/components/ui/micro-interactions';
import { formatDuration } from '@/utils/fitnessLogsUtils';
import { FitnessStats } from '@/services/fitnessLogsService';

interface FitnessLogsStatsProps {
  stats: FitnessStats;
  loading?: boolean;
  className?: string;
}

export function FitnessLogsStats({ stats, loading = false, className = '' }: FitnessLogsStatsProps) {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {/* Total Workouts */}
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Workouts</p>
              <AnimatedCounter 
                value={stats.totalWorkouts} 
                className="text-3xl font-bold"
              />
            </div>
            <ChartBarIcon className="h-8 w-8 text-blue-200" />
          </div>
        </CardContent>
      </Card>

      {/* Total Duration */}
      <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Duration</p>
              <div className="text-3xl font-bold">
                {formatDuration(stats.totalDuration)}
              </div>
            </div>
            <ClockIcon className="h-8 w-8 text-green-200" />
          </div>
        </CardContent>
      </Card>

      {/* Total Calories */}
      <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Total Calories</p>
              <AnimatedCounter 
                value={stats.totalCalories} 
                className="text-3xl font-bold"
              />
            </div>
            <FireIcon className="h-8 w-8 text-orange-200" />
          </div>
        </CardContent>
      </Card>

      {/* Current Streak */}
      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Current Streak</p>
              <AnimatedCounter 
                value={stats.currentStreak} 
                className="text-3xl font-bold"
              />
            </div>
            <TrophyIcon className="h-8 w-8 text-purple-200" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
