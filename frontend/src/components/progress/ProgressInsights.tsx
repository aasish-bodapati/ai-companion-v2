'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { progressTrackingService, type WeeklyProgress, type GoalProgress } from '@/services/progressTrackingService';

interface ProgressInsightsProps {
  className?: string;
}

export default function ProgressInsights({ className = '' }: ProgressInsightsProps) {
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress | null>(null);
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string>('');

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current week start (Monday)
        const now = new Date();
        const monday = new Date(now);
        const dayOfWeek = now.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
        monday.setDate(now.getDate() - daysToSubtract);
        monday.setHours(0, 0, 0, 0);
        
        const weekStart = monday.toISOString().split('T')[0];
        setSelectedWeek(weekStart);

        const [weekly, goals] = await Promise.all([
          progressTrackingService.getWeeklyProgress(weekStart),
          progressTrackingService.getGoalProgress()
        ]);

        setWeeklyProgress(weekly);
        setGoalProgress(goals);
      } catch (err) {
        console.error('Failed to fetch progress data:', err);
        setError('Failed to load progress insights');
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, []);

  const handleWeekChange = async (weekStart: string) => {
    try {
      setLoading(true);
      const weekly = await progressTrackingService.getWeeklyProgress(weekStart);
      setWeeklyProgress(weekly);
      setSelectedWeek(weekStart);
    } catch (err) {
      console.error('Failed to fetch week data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'on-track': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      case 'behind': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'ahead': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
      case 'not-tracked': return 'text-gray-500 bg-gray-100 dark:bg-gray-800/50';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800/50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '✓ Completed';
      case 'on-track': return '🎯 On Track';
      case 'behind': return '⚠️ Behind';
      case 'ahead': return '🚀 Ahead';
      case 'not-tracked': return '📊 Not Tracked';
      default: return '❓ Unknown';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'achievement': return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      case 'milestone': return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'suggestion': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'trend': return 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/20';
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-800/50';
    }
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Progress Insights</h2>
          <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-1/3"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error || !weeklyProgress) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <div className="text-2xl mb-2">⚠️</div>
          <p>Unable to load progress insights</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 underline"
          >
            Try again
          </button>
        </div>
      </Card>
    );
  }

  // Generate week options (current week + 3 previous weeks)
  const weekOptions = [];
  const currentDate = new Date(selectedWeek);
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    weekOptions.push({
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0],
      label: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    });
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Progress Insights</h2>
        
        {/* Week Selector */}
        <select
          value={selectedWeek}
          onChange={(e) => handleWeekChange(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          {weekOptions.map((week) => (
            <option key={week.start} value={week.start}>
              {week.label}
            </option>
          ))}
        </select>
      </div>

      {/* Weekly Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{weeklyProgress.totalWorkouts}</div>
          <div className="text-xs text-blue-600 dark:text-blue-400">Workouts</div>
        </div>
        
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{weeklyProgress.totalProtein}g</div>
          <div className="text-xs text-green-600 dark:text-green-400">Protein</div>
        </div>
        
        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{weeklyProgress.averageMood}/10</div>
          <div className="text-xs text-purple-600 dark:text-purple-400">Avg Mood</div>
        </div>
        
        <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{weeklyProgress.streakDays}</div>
          <div className="text-xs text-orange-600 dark:text-orange-400">Day Streak</div>
        </div>
      </div>

      {/* Goal Progress */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Goal Progress</h3>
        <div className="space-y-3">
          {goalProgress.map((goal, index) => (
            <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{goal.category}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                  {getStatusText(goal.status)}
                </span>
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {goal.current} / {goal.target} {goal.unit}
                </span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {goal.percentage}%
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    goal.status === 'completed' ? 'bg-green-500' :
                    goal.status === 'on-track' ? 'bg-blue-500' :
                    goal.status === 'behind' ? 'bg-yellow-500' :
                    'bg-purple-500'
                  }`}
                  style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Insights */}
      <div>
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Weekly Insights</h3>
        <div className="space-y-3">
          {weeklyProgress.insights.length > 0 ? (
            weeklyProgress.insights.map((insight, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${getInsightColor(insight.type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-xl">{insight.icon}</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                      {insight.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {insight.description}
                    </p>
                    {insight.value && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Value: {insight.value}
                      </div>
                    )}
                    {insight.change && (
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Change: {insight.change > 0 ? '+' : ''}{insight.change}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <div className="text-2xl mb-2">📊</div>
              <p>No insights available for this week</p>
              <p className="text-sm">Keep tracking your progress to see insights</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

