import api from '@/lib/api';

export interface MemoryContextData {
  routines: RoutineItem[];
  goals: GoalProgress;
  insights: string[];
  recentMemories: MemoryItem[];
  userProfile: UserProfile;
}

export interface RoutineItem {
  time: string;
  activity: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  icon: string;
  metadata?: any;
}

export interface GoalProgress {
  protein: { target: number; current: number; unit: string };
  calories: { target: number; current: number; unit: string };
  workout: { target: string; current: string; unit: string };
  sleep: { target: string; current: string; unit: string };
}

export interface MemoryItem {
  id: string;
  content: string;
  category?: string;
  importance?: number;
  timestamp: string;
  source: string;
}

export interface UserProfile {
  wakeUpTime: string;
  bedtime: string;
  workoutTime: string;
  dailySchedule: string;
  fitnessGoals: string;
  nutritionGoals: string;
}

export interface ProgressData {
  hydration: number;
  mood: number;
  journal: number;
  workouts: number;
  meals: number;
}

class MemoryContextService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

  async getMemoryContext(conversationId?: string): Promise<MemoryContextData> {
    const cacheKey = `memory-context-${conversationId || 'global'}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      // Fetch data from multiple endpoints in parallel
      const [
        userProfile,
        goals,
        recentMemories,
        progressData
      ] = await Promise.all([
        this.getUserProfile(),
        this.getUserGoals(),
        this.getRecentMemories(),
        this.getProgressData()
      ]);

      // Generate insights based on real data
      const insights = this.generateInsights(userProfile, goals, progressData, recentMemories);

      // Build routine items based on user profile and current time
      const routines = this.buildRoutines(userProfile, progressData);

      const memoryContext: MemoryContextData = {
        routines,
        goals,
        insights,
        recentMemories,
        userProfile
      };

      this.setCache(cacheKey, memoryContext);
      return memoryContext;
    } catch (error) {
      console.error('Failed to fetch memory context:', error);
      // Return fallback data if API calls fail
      return this.getFallbackData();
    }
  }

  private async getUserProfile(): Promise<UserProfile> {
    try {
      const response = await api.get('/users/me/onboarding');
      const profile = response.data || {};
      
      return {
        wakeUpTime: profile.wake_up_time || '04:30',
        bedtime: profile.bedtime || '21:30',
        workoutTime: profile.workout_time || '05:00',
        dailySchedule: profile.daily_schedule || 'Early bird (5-8 AM start)',
        fitnessGoals: profile.fitness_goals || 'Build muscle and improve fitness',
        nutritionGoals: profile.nutrition_goals || 'Eat 150g protein daily'
      };
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      return this.getDefaultUserProfile();
    }
  }

  private async getUserGoals(): Promise<GoalProgress> {
    try {
      const response = await api.get('/goals');
      const goals = response.data || [];
      
      // Extract nutrition and fitness goals
      const nutritionGoal = goals.find((g: any) => g.category === 'nutrition');
      const fitnessGoal = goals.find((g: any) => g.category === 'fitness');
      
      // Get today's progress - use default values since progress endpoint doesn't exist
      const today = new Date().toISOString().split('T')[0];
      const progress = {
        protein: 0,
        calories: 0,
        workouts: 0,
        sleep: 'Unknown'
      };

      return {
        protein: {
          target: 150,
          current: progress.protein || 0,
          unit: 'g'
        },
        calories: {
          target: 2500,
          current: progress.calories || 0,
          unit: 'cal'
        },
        workout: {
          target: '6 days',
          current: `${progress.workouts || 0} days`,
          unit: 'this week'
        },
        sleep: {
          target: '7-8 hours',
          current: progress.sleep || 'Unknown',
          unit: 'last night'
        }
      };
    } catch (error) {
      console.error('Failed to fetch user goals:', error);
      return this.getDefaultGoals();
    }
  }

  private async getRecentMemories(): Promise<MemoryItem[]> {
    try {
      const response = await api.get('/memory/users/me/memories', { limit: 10 });
      const memories = response.data || [];
      
      return memories.map((memory: any) => ({
        id: memory.id,
        content: memory.content,
        category: memory.category,
        importance: memory.importance_score,
        timestamp: memory.timestamp || memory.created_at,
        source: memory.source || 'chat'
      }));
    } catch (error) {
      console.error('Failed to fetch recent memories:', error);
      return [];
    }
  }

  private async getProgressData(): Promise<ProgressData> {
    try {
      const now = new Date();
      const from = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      
      const [hydration, mood, journal] = await Promise.all([
        api.get('/trackers/hydration', { from_: from, limit: 100 }),
        api.get('/trackers/mood', { from_: from, limit: 100 }),
        api.get('/trackers/journal', { from_: from, limit: 100 })
      ]);

      return {
        hydration: hydration.data?.length || 0,
        mood: mood.data?.length || 0,
        journal: journal.data?.length || 0,
        workouts: 0, // Feature removed
        meals: 0      // Feature removed
      };
    } catch (error) {
      console.error('Failed to fetch progress data:', error);
      return {
        hydration: 0,
        mood: 0,
        journal: 0,
        workouts: 0,
        meals: 0
      };
    }
  }

  private buildRoutines(userProfile: UserProfile, progressData: ProgressData): RoutineItem[] {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const currentTime = hour * 60 + minute;

    const routines: RoutineItem[] = [
      {
        time: userProfile.wakeUpTime,
        activity: 'Wake up',
        icon: '🌅',
        status: this.getRoutineStatus(userProfile.wakeUpTime, currentTime)
      },
      {
        time: userProfile.workoutTime,
        activity: 'Workout (Monday-Saturday)',
        icon: '💪',
        status: this.getRoutineStatus(userProfile.workoutTime, currentTime)
      },
      {
        time: '08:00',
        activity: 'Breakfast',
        icon: '🥗',
        status: this.getRoutineStatus('08:00', currentTime)
      },
      {
        time: '09:30',
        activity: 'Leave for work',
        icon: '🚗',
        status: this.getRoutineStatus('09:30', currentTime)
      },
      {
        time: '12:00',
        activity: 'Snack: 1 carrot',
        icon: '🥕',
        status: this.getRoutineStatus('12:00', currentTime)
      },
      {
        time: '14:00',
        activity: 'Lunch',
        icon: '🍽️',
        status: this.getRoutineStatus('14:00', currentTime)
      },
      {
        time: '16:00',
        activity: 'Fruit salad',
        icon: '🍎',
        status: this.getRoutineStatus('16:00', currentTime)
      },
      {
        time: '18:30',
        activity: 'Leave work',
        icon: '🚗',
        status: this.getRoutineStatus('18:30', currentTime)
      },
      {
        time: '20:00',
        activity: 'Dinner',
        icon: '🍽️',
        status: this.getRoutineStatus('20:00', currentTime)
      },
      {
        time: '20:30',
        activity: 'Work on app, short walk',
        icon: '💻',
        status: this.getRoutineStatus('20:30', currentTime)
      },
      {
        time: userProfile.bedtime,
        activity: 'Bedtime',
        icon: '😴',
        status: this.getRoutineStatus(userProfile.bedtime, currentTime)
      }
    ];

    return routines;
  }

  private getRoutineStatus(routineTime: string, currentTime: number): 'completed' | 'in-progress' | 'upcoming' {
    const [hours, minutes] = routineTime.split(':').map(Number);
    const routineTimeMinutes = hours * 60 + minutes;
    
    if (currentTime >= routineTimeMinutes + 60) return 'completed';
    if (currentTime >= routineTimeMinutes && currentTime < routineTimeMinutes + 60) return 'in-progress';
    return 'upcoming';
  }

  private generateInsights(
    userProfile: UserProfile,
    goals: GoalProgress,
    progressData: ProgressData,
    recentMemories: MemoryItem[]
  ): string[] {
    const insights: string[] = [];
    const now = new Date();
    const hour = now.getHours();

    // Time-based insights
    if (hour >= 5 && hour < 7) {
      insights.push("Your energy peaks 5-7 AM - perfect timing for your workout!");
    } else if (hour >= 9 && hour < 11) {
      insights.push("You're most focused 9-11 AM - great time for important tasks");
    }

    // Progress-based insights
    if (progressData.workouts > 0) {
      insights.push(`You've completed ${progressData.workouts} workout(s) today - great job!`);
    }

    if (goals.protein.current > 0) {
      const remaining = goals.protein.target - goals.protein.current;
      if (remaining > 0) {
        insights.push(`You need ${remaining}g more protein to reach your daily goal`);
      } else {
        insights.push("You've hit your protein goal for today! 🎉");
      }
    }

    // Memory-based insights
    if (recentMemories.length > 0) {
      const recentMemory = recentMemories[0];
      if (recentMemory.content.toLowerCase().includes('workout') || 
          recentMemory.content.toLowerCase().includes('exercise')) {
        insights.push("You've been discussing workouts recently - keep up the momentum!");
      }
    }

    // Default insights if none generated
    if (insights.length === 0) {
      insights.push("Your 4:30 AM wake-up routine is setting you up for success today");
      insights.push("Remember to stay hydrated throughout the day");
    }

    return insights.slice(0, 3); // Limit to 3 insights
  }

  private getDefaultUserProfile(): UserProfile {
    return {
      wakeUpTime: '04:30',
      bedtime: '21:30',
      workoutTime: '05:00',
      dailySchedule: 'Early bird (5-8 AM start)',
      fitnessGoals: 'Build muscle and improve fitness',
      nutritionGoals: 'Eat 150g protein daily'
    };
  }

  private getDefaultGoals(): GoalProgress {
    return {
      protein: { target: 150, current: 0, unit: 'g' },
      calories: { target: 2500, current: 0, unit: 'cal' },
      workout: { target: '6 days', current: '0 days', unit: 'this week' },
      sleep: { target: '7-8 hours', current: 'Unknown', unit: 'last night' }
    };
  }

  private getFallbackData(): MemoryContextData {
    return {
      routines: this.buildRoutines(this.getDefaultUserProfile(), { hydration: 0, mood: 0, journal: 0, workouts: 0, meals: 0 }),
      goals: this.getDefaultGoals(),
      insights: [
        "Your 4:30 AM wake-up routine is setting you up for success today",
        "Remember to stay hydrated throughout the day",
        "Your energy peaks 5-7 AM - perfect timing for workouts"
      ],
      recentMemories: [],
      userProfile: this.getDefaultUserProfile()
    };
  }

  /**
   * Check if user has completed onboarding
   */
  public async hasCompletedOnboarding(): Promise<boolean> {
    try {
      await api.get('/users/me/onboarding');
      return true;
    } catch (error: any) {
      if (error.status === 404) {
        return false;
      }
      // For other errors, assume onboarding is incomplete
      return false;
    }
  }

  /**
   * Get onboarding completion status
   */
  public async getOnboardingStatus(): Promise<{ completed: boolean; hasProfile: boolean }> {
    try {
      const response = await api.get('/users/me/onboarding');
      return { completed: true, hasProfile: true };
    } catch (error: any) {
      if (error.status === 404) {
        return { completed: false, hasProfile: false };
      }
      return { completed: false, hasProfile: false };
    }
  }

  // Clear cache when user data changes
  clearCache(): void {
    this.cache.clear();
  }

  // Refresh specific cache key
  refreshCache(key: string): void {
    this.cache.delete(key);
  }
}

export const memoryContextService = new MemoryContextService();
export default memoryContextService;

