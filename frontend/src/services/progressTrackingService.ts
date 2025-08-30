import api from '@/lib/api';
import { memoryContextService, type MemoryContextData } from './memoryContextService';

export interface ProgressData {
  date: string;
  hydration: number;
  mood: number;
  journal: number;
  workouts: number;
  meals: number;
  protein: number;
  calories: number;
  sleep: number;
}

export interface ProgressInsight {
  type: 'trend' | 'milestone' | 'suggestion' | 'achievement';
  title: string;
  description: string;
  value?: number;
  change?: number;
  icon: string;
  priority: 'low' | 'medium' | 'high';
}

export interface WeeklyProgress {
  weekStart: string;
  weekEnd: string;
  totalWorkouts: number;
  totalProtein: number;
  totalCalories: number;
  averageMood: number;
  averageSleep: number;
  streakDays: number;
  insights: ProgressInsight[];
}

export interface GoalProgress {
  category: string;
  current: number;
  target: number;
  unit: string;
  percentage: number;
  status: 'on-track' | 'behind' | 'ahead' | 'completed';
  trend: 'improving' | 'declining' | 'stable';
}

class ProgressTrackingService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_DURATION;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && this.isCacheValid(key)) {
      return cached.data;
    }
    return null;
  }

  // Get progress data for a specific date range
  async getProgressData(startDate: string, endDate: string): Promise<ProgressData[]> {
    const cacheKey = `progress-${startDate}-${endDate}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const [hydration, mood, journal, workouts, meals] = await Promise.all([
        api.get('/trackers/hydration', { from_: startDate, to: endDate, limit: 1000 }),
        api.get('/trackers/mood', { from_: startDate, to: endDate, limit: 1000 }),
        api.get('/trackers/journal', { from_: startDate, to: endDate, limit: 1000 }),
        api.get('/trackers/workouts', { from_: startDate, to: endDate, limit: 1000 }),
        api.get('/trackers/meals', { from_: startDate, to: endDate, limit: 1000 })
      ]);

      // Group data by date
      const progressByDate = new Map<string, ProgressData>();
      
      // Initialize all dates in range
      const start = new Date(startDate);
      const end = new Date(endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        progressByDate.set(dateStr, {
          date: dateStr,
          hydration: 0,
          mood: 0,
          journal: 0,
          workouts: 0,
          meals: 0,
          protein: 0,
          calories: 0,
          sleep: 0
        });
      }

      // Fill in actual data
      hydration.data?.forEach((entry: any) => {
        const date = entry.when?.split('T')[0] || entry.created_at?.split('T')[0];
        if (date && progressByDate.has(date)) {
          const progress = progressByDate.get(date)!;
          progress.hydration += entry.amount_ml || 250;
        }
      });

      mood.data?.forEach((entry: any) => {
        const date = entry.when?.split('T')[0] || entry.created_at?.split('T')[0];
        if (date && progressByDate.has(date)) {
          const progress = progressByDate.get(date)!;
          progress.mood = Math.max(progress.mood, entry.val || 0);
        }
      });

      journal.data?.forEach((entry: any) => {
        const date = entry.when?.split('T')[0] || entry.created_at?.split('T')[0];
        if (date && progressByDate.has(date)) {
          const progress = progressByDate.get(date)!;
          progress.journal += 1;
        }
      });

      workouts.data?.forEach((entry: any) => {
        const date = entry.when?.split('T')[0] || entry.created_at?.split('T')[0];
        if (date && progressByDate.has(date)) {
          const progress = progressByDate.get(date)!;
          progress.workouts += 1;
        }
      });

      meals.data?.forEach((entry: any) => {
        const date = entry.when?.split('T')[0] || entry.created_at?.split('T')[0];
        if (date && progressByDate.has(date)) {
          const progress = progressByDate.get(date)!;
          progress.meals += 1;
          progress.protein += entry.protein || 0;
          progress.calories += entry.calories || 0;
        }
      });

      const progressData = Array.from(progressByDate.values());
      this.setCache(cacheKey, progressData);
      return progressData;

    } catch (error) {
      console.error('Failed to fetch progress data:', error);
      return [];
    }
  }

  // Get weekly progress summary
  async getWeeklyProgress(weekStart: string): Promise<WeeklyProgress> {
    const cacheKey = `weekly-${weekStart}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const endDate = new Date(weekStart);
      endDate.setDate(endDate.getDate() + 6);
      const endDateStr = endDate.toISOString().split('T')[0];

      const progressData = await this.getProgressData(weekStart, endDateStr);
      
      // Calculate weekly totals and averages
      const totalWorkouts = progressData.reduce((sum, day) => sum + day.workouts, 0);
      const totalProtein = progressData.reduce((sum, day) => sum + day.protein, 0);
      const totalCalories = progressData.reduce((sum, day) => sum + day.calories, 0);
      const moodValues = progressData.filter(day => day.mood > 0).map(day => day.mood);
      const averageMood = moodValues.length > 0 ? moodValues.reduce((sum, val) => sum + val, 0) / moodValues.length : 0;
      
      // Calculate streak (consecutive days with workouts)
      let streakDays = 0;
      for (let i = progressData.length - 1; i >= 0; i--) {
        if (progressData[i].workouts > 0) {
          streakDays++;
        } else {
          break;
        }
      }

      // Generate insights
      const insights = this.generateWeeklyInsights(progressData, totalWorkouts, totalProtein, averageMood, streakDays);

      const weeklyProgress: WeeklyProgress = {
        weekStart,
        weekEnd: endDateStr,
        totalWorkouts,
        totalProtein,
        totalCalories,
        averageMood: Math.round(averageMood * 10) / 10,
        averageSleep: 7.5, // Placeholder - would need sleep tracking data
        streakDays,
        insights
      };

      this.setCache(cacheKey, weeklyProgress);
      return weeklyProgress;

    } catch (error) {
      console.error('Failed to fetch weekly progress:', error);
      return this.getDefaultWeeklyProgress(weekStart);
    }
  }

  // Get goal progress for different categories
  async getGoalProgress(): Promise<GoalProgress[]> {
    try {
      const memoryData = await memoryContextService.getMemoryContext();
      const today = new Date().toISOString().split('T')[0];
      const progressData = await this.getProgressData(today, today);
      
      const todayProgress = progressData[0] || {
        protein: 0,
        calories: 0,
        workouts: 0,
        sleep: 0
      };

      const goals: GoalProgress[] = [
        {
          category: 'Protein',
          current: todayProgress.protein,
          target: memoryData.goals.protein.target,
          unit: 'g',
          percentage: Math.round((todayProgress.protein / memoryData.goals.protein.target) * 100),
          status: this.getGoalStatus(todayProgress.protein, memoryData.goals.protein.target),
          trend: 'stable'
        },
        {
          category: 'Calories',
          current: todayProgress.calories,
          target: memoryData.goals.calories.target,
          unit: 'cal',
          percentage: Math.round((todayProgress.calories / memoryData.goals.calories.target) * 100),
          status: this.getGoalStatus(todayProgress.calories, memoryData.goals.calories.target),
          trend: 'stable'
        },
        {
          category: 'Workouts',
          current: todayProgress.workouts,
          target: 1,
          unit: 'workout',
          percentage: Math.round((todayProgress.workouts / 1) * 100),
          status: this.getGoalStatus(todayProgress.workouts, 1),
          trend: 'stable'
        }
      ];

      return goals;

    } catch (error) {
      console.error('Failed to fetch goal progress:', error);
      return [];
    }
  }

  // Generate insights based on progress data
  private generateWeeklyInsights(
    progressData: ProgressData[], 
    totalWorkouts: number, 
    totalProtein: number, 
    averageMood: number, 
    streakDays: number
  ): ProgressInsight[] {
    const insights: ProgressInsight[] = [];

    // Workout insights
    if (totalWorkouts >= 5) {
      insights.push({
        type: 'achievement',
        title: 'Workout Warrior! 💪',
        description: `You completed ${totalWorkouts} workouts this week. Amazing consistency!`,
        value: totalWorkouts,
        icon: '🏆',
        priority: 'high'
      });
    } else if (totalWorkouts < 3) {
      insights.push({
        type: 'suggestion',
        title: 'Build Momentum',
        description: `You completed ${totalWorkouts} workouts this week. Try to increase to 4-5 for optimal results.`,
        value: totalWorkouts,
        icon: '📈',
        priority: 'medium'
      });
    }

    // Protein insights
    const weeklyProteinGoal = 150 * 7; // 150g per day
    if (totalProtein >= weeklyProteinGoal) {
      insights.push({
        type: 'achievement',
        title: 'Protein Champion! 🥗',
        description: `You exceeded your weekly protein goal with ${totalProtein}g total.`,
        value: totalProtein,
        icon: '🎯',
        priority: 'medium'
      });
    } else {
      const remaining = weeklyProteinGoal - totalProtein;
      insights.push({
        type: 'suggestion',
        title: 'Protein Boost Needed',
        description: `You're ${remaining}g short of your weekly protein goal. Focus on high-protein meals.`,
        value: totalProtein,
        icon: '🥩',
        priority: 'medium'
      });
    }

    // Mood insights
    if (averageMood >= 8) {
      insights.push({
        type: 'achievement',
        title: 'High Spirits! 😊',
        description: `Your average mood this week was ${averageMood}/10. Keep up the positive energy!`,
        value: averageMood,
        icon: '✨',
        priority: 'low'
      });
    } else if (averageMood < 6) {
      insights.push({
        type: 'suggestion',
        title: 'Mood Check-in',
        description: `Your average mood was ${averageMood}/10 this week. Consider what might be affecting your wellbeing.`,
        value: averageMood,
        icon: '🤔',
        priority: 'high'
      });
    }

    // Streak insights
    if (streakDays >= 5) {
      insights.push({
        type: 'milestone',
        title: 'Consistency King! 🔥',
        description: `You're on a ${streakDays}-day workout streak. Don't break the chain!`,
        value: streakDays,
        icon: '🔥',
        priority: 'high'
      });
    }

    // Trend insights
    const recentWorkouts = progressData.slice(-3).map(day => day.workouts);
    const earlierWorkouts = progressData.slice(-7, -4).map(day => day.workouts);
    
    if (recentWorkouts.length >= 2 && earlierWorkouts.length >= 2) {
      const recentAvg = recentWorkouts.reduce((sum, val) => sum + val, 0) / recentWorkouts.length;
      const earlierAvg = earlierWorkouts.reduce((sum, val) => sum + val, 0) / earlierWorkouts.length;
      
      if (recentAvg > earlierAvg) {
        insights.push({
          type: 'trend',
          title: 'Improving Trend 📊',
          description: 'Your workout frequency is increasing. Great momentum!',
          change: Math.round(((recentAvg - earlierAvg) / earlierAvg) * 100),
          icon: '📈',
          priority: 'low'
        });
      }
    }

    return insights.slice(0, 5); // Limit to 5 insights
  }

  private getGoalStatus(current: number, target: number): 'on-track' | 'behind' | 'ahead' | 'completed' {
    const percentage = current / target;
    if (percentage >= 1) return 'completed';
    if (percentage >= 0.8) return 'on-track';
    if (percentage >= 0.6) return 'behind';
    return 'behind';
  }

  private getDefaultWeeklyProgress(weekStart: string): WeeklyProgress {
    const endDate = new Date(weekStart);
    endDate.setDate(endDate.getDate() + 6);
    
    return {
      weekStart,
      weekEnd: endDate.toISOString().split('T')[0],
      totalWorkouts: 0,
      totalProtein: 0,
      totalCalories: 0,
      averageMood: 0,
      averageSleep: 0,
      streakDays: 0,
      insights: []
    };
  }

  // Clear cache when data changes
  clearCache(): void {
    this.cache.clear();
  }

  // Refresh specific cache key
  refreshCache(key: string): void {
    this.cache.delete(key);
  }
}

export const progressTrackingService = new ProgressTrackingService();
export default progressTrackingService;

