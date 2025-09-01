/**
 * Routine Management Service
 * Handles user's daily routine with dynamic status updates and intelligent scheduling
 */

export interface RoutineActivity {
  id: string;
  time: string;
  activity: string;
  description?: string;
  icon: string;
  status: 'completed' | 'in-progress' | 'upcoming' | 'missed' | 'skipped';
  type: 'routine' | 'meal' | 'workout' | 'work' | 'personal';
  isRecurring: boolean;
  daysOfWeek?: number[]; // 0-6, Sunday-Saturday
  completedAt?: Date;
  estimatedDuration?: number; // minutes
  tags?: string[];
  nutritionInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
}

export interface DailyRoutineData {
  date: string;
  activities: RoutineActivity[];
  completionRate: number;
  streakDays: number;
  insights: string[];
}

class RoutineService {
  private readonly STORAGE_KEY = 'ai_companion_routine';
  
  /**
   * Get user's default routine based on the 9-5 workflow document
   */
  getDefaultRoutine(): RoutineActivity[] {
    return [
      {
        id: 'wake_up',
        time: '04:30',
        activity: 'Wake up',
        icon: '🌅',
        status: 'upcoming',
        type: 'routine',
        isRecurring: true,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Every day
        estimatedDuration: 5,
        tags: ['morning', 'sleep']
      },
      {
        id: 'workout',
        time: '05:00',
        activity: 'Workout',
        description: 'Monday to Saturday strength training',
        icon: '💪',
        status: 'upcoming',
        type: 'workout',
        isRecurring: true,
        daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday-Saturday
        estimatedDuration: 90,
        tags: ['fitness', 'strength', 'morning']
      },
      {
        id: 'back_home',
        time: '07:00',
        activity: 'Back home',
        icon: '🏠',
        status: 'upcoming',
        type: 'routine',
        isRecurring: true,
        daysOfWeek: [1, 2, 3, 4, 5, 6],
        estimatedDuration: 5,
        tags: ['transition']
      },
      {
        id: 'breakfast',
        time: '08:00',
        activity: 'Breakfast',
        description: '4 boiled eggs, salad, protein shake, supplements',
        icon: '🥗',
        status: 'upcoming',
        type: 'meal',
        isRecurring: true,
        estimatedDuration: 30,
        tags: ['nutrition', 'morning'],
        nutritionInfo: {
          calories: 650,
          protein: 45,
          carbs: 35,
          fat: 25,
          fiber: 8
        }
      },
      {
        id: 'leave_for_work',
        time: '09:30',
        activity: 'Leave for work',
        icon: '🚗',
        status: 'upcoming',
        type: 'work',
        isRecurring: true,
        daysOfWeek: [1, 2, 3, 4, 5], // Weekdays only
        estimatedDuration: 5,
        tags: ['commute', 'work']
      },
      {
        id: 'reach_office',
        time: '10:30',
        activity: 'Reach office',
        icon: '🏢',
        status: 'upcoming',
        type: 'work',
        isRecurring: true,
        daysOfWeek: [1, 2, 3, 4, 5],
        estimatedDuration: 5,
        tags: ['work', 'arrival']
      },
      {
        id: 'snack_carrot',
        time: '12:00',
        activity: 'Snack: 1 carrot',
        icon: '🥕',
        status: 'upcoming',
        type: 'meal',
        isRecurring: true,
        estimatedDuration: 10,
        tags: ['nutrition', 'snack'],
        nutritionInfo: {
          calories: 25,
          protein: 0.5,
          carbs: 6,
          fat: 0.1,
          fiber: 1.5
        }
      },
      {
        id: 'lunch',
        time: '14:00',
        activity: 'Lunch',
        description: '2 cups white rice, curry (chicken/fish + greens)',
        icon: '🍽️',
        status: 'upcoming',
        type: 'meal',
        isRecurring: true,
        estimatedDuration: 45,
        tags: ['nutrition', 'main-meal'],
        nutritionInfo: {
          calories: 800,
          protein: 35,
          carbs: 90,
          fat: 15,
          fiber: 6
        }
      },
      {
        id: 'fruit_salad',
        time: '16:00',
        activity: 'Fruit salad',
        description: 'Ordered from outside',
        icon: '🍎',
        status: 'upcoming',
        type: 'meal',
        isRecurring: true,
        estimatedDuration: 15,
        tags: ['nutrition', 'snack', 'fruit'],
        nutritionInfo: {
          calories: 150,
          protein: 2,
          carbs: 38,
          fat: 0.5,
          fiber: 6
        }
      },
      {
        id: 'leave_work',
        time: '18:30',
        activity: 'Leave work',
        icon: '🚗',
        status: 'upcoming',
        type: 'work',
        isRecurring: true,
        daysOfWeek: [1, 2, 3, 4, 5],
        estimatedDuration: 5,
        tags: ['commute', 'work']
      },
      {
        id: 'reach_home',
        time: '19:30',
        activity: 'Reach home',
        icon: '🏠',
        status: 'upcoming',
        type: 'routine',
        isRecurring: true,
        daysOfWeek: [1, 2, 3, 4, 5],
        estimatedDuration: 5,
        tags: ['home', 'transition']
      },
      {
        id: 'dinner',
        time: '20:00',
        activity: 'Dinner',
        description: '250g air-fried mixed chicken, salad with greens',
        icon: '🍽️',
        status: 'upcoming',
        type: 'meal',
        isRecurring: true,
        estimatedDuration: 45,
        tags: ['nutrition', 'main-meal'],
        nutritionInfo: {
          calories: 550,
          protein: 45,
          carbs: 15,
          fat: 20,
          fiber: 8
        }
      },
      {
        id: 'evening_activities',
        time: '20:30',
        activity: 'Work on app, short walk',
        icon: '💻',
        status: 'upcoming',
        type: 'personal',
        isRecurring: true,
        estimatedDuration: 60,
        tags: ['development', 'exercise', 'personal']
      },
      {
        id: 'bedtime',
        time: '21:30',
        activity: 'Bedtime',
        icon: '😴',
        status: 'upcoming',
        type: 'routine',
        isRecurring: true,
        estimatedDuration: 10,
        tags: ['sleep', 'evening']
      }
    ];
  }

  /**
   * Get today's routine with dynamic status updates
   */
  getTodaysRoutine(): RoutineActivity[] {
    const now = new Date();
    const today = now.getDay(); // 0-6, Sunday-Saturday
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
    
    const routine = this.getDefaultRoutine();
    const savedData = this.getSavedRoutineData();
    
    return routine
      .filter(activity => !activity.daysOfWeek || activity.daysOfWeek.includes(today))
      .map(activity => {
        const [hours, minutes] = activity.time.split(':').map(Number);
        const activityTime = hours * 60 + minutes;
        const timeDiff = currentTime - activityTime;
        
        // Check if we have saved completion data for today
        const savedActivity = savedData.activities?.find(a => a.id === activity.id);
        if (savedActivity?.completedAt) {
          const completedDate = new Date(savedActivity.completedAt);
          if (this.isSameDay(completedDate, now)) {
            return { ...activity, status: 'completed' as const, completedAt: completedDate };
          }
        }
        
        // Dynamic status calculation
        let status: RoutineActivity['status'];
        if (timeDiff < -30) { // More than 30 minutes before
          status = 'upcoming';
        } else if (timeDiff >= -30 && timeDiff <= (activity.estimatedDuration || 30)) {
          status = 'in-progress';
        } else if (timeDiff > (activity.estimatedDuration || 30) && timeDiff < 120) {
          // Recently passed but within 2 hours - could still be completed
          status = 'upcoming';
        } else {
          // More than 2 hours past - likely missed
          status = 'missed';
        }
        
        return { ...activity, status };
      });
  }

  /**
   * Mark an activity as completed
   */
  completeActivity(activityId: string): void {
    const data = this.getSavedRoutineData();
    const now = new Date();
    
    const existingIndex = data.activities.findIndex(a => a.id === activityId);
    if (existingIndex >= 0) {
      data.activities[existingIndex] = {
        ...data.activities[existingIndex],
        completedAt: now,
        status: 'completed'
      };
    } else {
      const activity = this.getDefaultRoutine().find(a => a.id === activityId);
      if (activity) {
        data.activities.push({
          ...activity,
          completedAt: now,
          status: 'completed'
        });
      }
    }
    
    this.saveRoutineData(data);
  }

  /**
   * Skip an activity
   */
  skipActivity(activityId: string): void {
    const data = this.getSavedRoutineData();
    const existingIndex = data.activities.findIndex(a => a.id === activityId);
    
    if (existingIndex >= 0) {
      data.activities[existingIndex].status = 'skipped';
    } else {
      const activity = this.getDefaultRoutine().find(a => a.id === activityId);
      if (activity) {
        data.activities.push({
          ...activity,
          status: 'skipped'
        });
      }
    }
    
    this.saveRoutineData(data);
  }

  /**
   * Get completion rate for today
   */
  getTodayCompletionRate(): number {
    const todaysRoutine = this.getTodaysRoutine();
    const completed = todaysRoutine.filter(a => a.status === 'completed').length;
    return todaysRoutine.length > 0 ? (completed / todaysRoutine.length) * 100 : 0;
  }

  /**
   * Get streak information
   */
  getStreakInfo(): { current: number; best: number } {
    // This would ideally connect to the backend for persistent streak tracking
    // For now, return mock data
    return { current: 7, best: 12 };
  }

  /**
   * Get personalized insights based on routine completion
   */
  getPersonalizedInsights(): string[] {
    const completionRate = this.getTodayCompletionRate();
    const insights: string[] = [];
    
    if (completionRate >= 80) {
      insights.push("🎉 Excellent routine adherence! You're building strong habits.");
    } else if (completionRate >= 60) {
      insights.push("👍 Good progress on your routine. Small adjustments can help you reach 80%+");
    } else {
      insights.push("💪 Every small step counts. Focus on 2-3 key activities first.");
    }
    
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 4 && hour < 6) {
      insights.push("🌅 Perfect timing! Your 4:30 AM routine gives you a head start on the day.");
    } else if (hour >= 17 && hour < 20) {
      insights.push("🏠 Evening wind-down time. Great for app development and reflection.");
    }
    
    return insights;
  }

  /**
   * Calculate daily nutrition totals
   */
  getDailyNutritionTotals(): {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  } {
    const todaysRoutine = this.getTodaysRoutine();
    const completedMeals = todaysRoutine.filter(
      a => a.type === 'meal' && a.status === 'completed' && a.nutritionInfo
    );
    
    return completedMeals.reduce(
      (totals, meal) => {
        const nutrition = meal.nutritionInfo!;
        return {
          calories: totals.calories + (nutrition.calories || 0),
          protein: totals.protein + (nutrition.protein || 0),
          carbs: totals.carbs + (nutrition.carbs || 0),
          fat: totals.fat + (nutrition.fat || 0),
          fiber: totals.fiber + (nutrition.fiber || 0),
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  }

  private getSavedRoutineData(): DailyRoutineData {
    if (typeof window === 'undefined') {
      return { date: new Date().toDateString(), activities: [], completionRate: 0, streakDays: 0, insights: [] };
    }
    
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        // Reset if it's a new day
        if (data.date !== new Date().toDateString()) {
          return { date: new Date().toDateString(), activities: [], completionRate: 0, streakDays: 0, insights: [] };
        }
        return data;
      } catch {
        return { date: new Date().toDateString(), activities: [], completionRate: 0, streakDays: 0, insights: [] };
      }
    }
    
    return { date: new Date().toDateString(), activities: [], completionRate: 0, streakDays: 0, insights: [] };
  }

  private saveRoutineData(data: DailyRoutineData): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }
}

export const routineService = new RoutineService();
