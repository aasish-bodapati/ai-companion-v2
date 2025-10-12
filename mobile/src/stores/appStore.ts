/**
 * Main app store using Zustand
 * Centralized state management for global app data
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { AppStore, ProgressMetrics, Achievement, Streak } from './types';
import { dashboardService } from '../services/dashboardService';
// import { predictiveAnalyticsService } from '../services/predictiveAnalyticsService'; // REMOVED
import stepTrackingService from '../services/stepTrackingService';

// Initial state
const initialState = {
  user: null,
  loading: false,
  error: null,
  lastUpdated: null,
  progressMetrics: {
    workouts: { current: 0, target: 5, progress: 0 },
    calories: { current: 0, target: 2000, progress: 0 },
    protein: { current: 0, target: 150, progress: 0 },
    water: { current: 0, target: 3.0, progress: 0 },
    steps: { current: 0, target: 10000, progress: 0 },
    mood: { current: 0, target: 10, progress: 0 },
  },
  achievements: [],
  streaks: [],
};

// Create the main app store with persistence
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Basic setters
        setUser: (user) => set({ user }, false, 'setUser'),
        setLoading: (loading) => set({ loading }, false, 'setLoading'),
        setError: (error) => set({ error, loading: false }, false, 'setError'),
        
        // Progress metrics
        setProgressMetrics: (progressMetrics) => 
          set({ progressMetrics }, false, 'setProgressMetrics'),
        
        // Achievements
        setAchievements: (achievements) => 
          set({ achievements }, false, 'setAchievements'),
        
        updateAchievement: (id, unlocked, progress) => 
          set((state) => ({
            achievements: state.achievements.map(achievement =>
              achievement.id === id
                ? { ...achievement, unlocked, progress }
                : achievement
            )
          }), false, 'updateAchievement'),
        
        // Streaks
        setStreaks: (streaks) => 
          set({ streaks }, false, 'setStreaks'),
        
        updateStreak: (type, current) => 
          set((state) => ({
            streaks: state.streaks.map(streak =>
              streak.type === type
                ? { ...streak, current }
                : streak
            )
          }), false, 'updateStreak'),
        
        // AI insights
        
        // Data refresh
        refreshData: async () => {
          const { setLoading, setError, setProgressMetrics, setAchievements, setStreaks, loading } = get();
          
          // Prevent multiple simultaneous calls
          if (loading) {
            return;
          }
          
          try {
            setLoading(true);
            setError(null);
            
            // Initialize step tracking
            const stepTrackingAvailable = await stepTrackingService.isAvailable();
            if (stepTrackingAvailable) {
              await stepTrackingService.startTracking();
            }
            
            // Load progress metrics
            const newProgressMetrics = await loadProgressMetrics();
            setProgressMetrics(newProgressMetrics);
            
            // Load non-essential data in parallel
            const [achievements, streaks] = await Promise.allSettled([
              loadAchievements(),
              loadStreaks()
            ]);
            
            if (achievements.status === 'fulfilled') {
              setAchievements(achievements.value);
            }
            
            if (streaks.status === 'fulfilled') {
              setStreaks(streaks.value);
            }
            
            set({ lastUpdated: new Date().toISOString() }, false, 'refreshData');
          } catch (error) {
            console.error('Error refreshing app data:', error);
            setError('Failed to refresh data');
          } finally {
            setLoading(false);
          }
        },
        
        // Reset state
        resetState: () => set(initialState, false, 'resetState'),
      }),
      {
        name: 'app-store-persist',
        partialize: (state) => ({
          progressMetrics: state.progressMetrics,
          achievements: state.achievements,
          streaks: state.streaks,
          lastUpdated: state.lastUpdated,
        }),
      }
    ),
    {
      name: 'app-store',
    }
  )
);

// getStepsData function removed - analytics functionality deleted

// Helper functions for data loading
const loadProgressMetrics = async (): Promise<ProgressMetrics> => {
  try {
    // Load from dashboard service
    const dashboardData = await dashboardService.getDashboardSummary();
    if (__DEV__) {
      console.log('🔍 Dashboard loaded - workouts:', dashboardData.today_stats.workouts, 'meals:', dashboardData.today_stats.meals);
    }
    
    // Analytics data loading removed - using default values
    const stepsData = { current: 0, progress: 0 };
    
    return {
      workouts: {
        current: dashboardData?.today_stats?.workouts || 0,
        target: 5,
        progress: Math.min(((dashboardData?.today_stats?.workouts || 0) / 5) * 100, 100),
      },
      calories: {
        current: dashboardData?.today_stats?.calories_consumed || 0,
        target: 2000,
        progress: Math.min(((dashboardData?.today_stats?.calories_consumed || 0) / 2000) * 100, 100),
      },
      protein: {
        current: dashboardData?.today_stats?.protein_g || 0,
        target: 150,
        progress: Math.min(((dashboardData?.today_stats?.protein_g || 0) / 150) * 100, 100),
      },
      water: {
        current: (dashboardData?.today_stats?.water_ml || 0) / 1000, // Convert ml to L
        target: 3.0,
        progress: Math.min(((dashboardData?.today_stats?.water_ml || 0) / 3000) * 100, 100),
      },
      steps: {
        current: stepsData.current,
        target: 10000,
        progress: stepsData.progress,
      },
      mood: {
        current: 0,
        target: 10,
        progress: 0,
      },
    };
  } catch (error) {
    console.error('Error loading progress metrics:', error);
    return initialState.progressMetrics;
  }
};

// Memoize achievements data to prevent re-creation on every call
const achievementsData: Achievement[] = [
  {
    id: '1',
    title: 'First Workout',
    description: 'Complete your first workout',
    icon: 'trophy',
    color: '#f59e0b',
    unlocked: true,
    unlockedAt: '2024-01-15',
    category: 'fitness',
  },
  {
    id: '2',
    title: 'Week Warrior',
    description: 'Complete 5 workouts in a week',
    icon: 'flame',
    color: '#ef4444',
    unlocked: false,
    progress: 80,
    category: 'fitness',
  },
  {
    id: '3',
    title: 'Consistency King',
    description: 'Work out 7 days in a row',
    icon: 'checkmark-circle',
    color: '#10b981',
    unlocked: false,
    progress: 60,
    category: 'consistency',
  },
];

const loadAchievements = async (): Promise<Achievement[]> => {
  // Return memoized data to prevent re-creation
  return achievementsData;
};

// Memoize streaks data to prevent re-creation on every call
const streaksData: Streak[] = [
  {
    type: 'workout',
    current: 3,
    best: 7,
    icon: 'fitness',
    color: '#3b82f6',
    label: 'Workout',
    unit: 'days',
  },
  {
    type: 'nutrition',
    current: 5,
    best: 12,
    icon: 'nutrition',
    color: '#10b981',
    label: 'Nutrition',
    unit: 'days',
  },
  {
    type: 'water',
    current: 2,
    best: 5,
    icon: 'water',
    color: '#06b6d4',
    label: 'Water',
    unit: 'days',
  },
  {
    type: 'mood',
    current: 1,
    best: 3,
    icon: 'happy',
    color: '#f59e0b',
    label: 'Mood',
    unit: 'days',
  },
];

const loadStreaks = async (): Promise<Streak[]> => {
  // Return memoized data to prevent re-creation
  return streaksData;
};

// loadAIInsights function removed - analytics functionality deleted

// Selector hooks for better performance with shallow comparison
export const useUser = () => useAppStore((state) => state.user, shallow);
export const useProgressMetrics = () => useAppStore((state) => state.progressMetrics, shallow);
export const useAchievements = () => useAppStore((state) => state.achievements, shallow);
export const useStreaks = () => useAppStore((state) => state.streaks, shallow);
export const useAppLoading = () => useAppStore((state) => state.loading, shallow);
export const useAppError = () => useAppStore((state) => state.error, shallow);
export const useAppLastUpdated = () => useAppStore((state) => state.lastUpdated, shallow);
