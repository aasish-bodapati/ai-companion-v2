/**
 * Main app store using Zustand
 * Centralized state management for global app data
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { AppStore, ProgressMetrics, Achievement, Streak } from './types';
import { dashboardService } from '../services/dashboardService';
import { fitnessService } from '../services/fitnessService';
import { nutritionService } from '../services/nutritionService';
import { predictiveAnalyticsService } from '../services/predictiveAnalyticsService';
import stepTrackingService from '../services/stepTrackingService';
import { timezoneDetectionService } from '../services/timezoneDetectionService';

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
  aiInsights: [],
};

// Create the main app store
export const useAppStore = create<AppStore>()(
  devtools(
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
        setAIInsights: (aiInsights) => 
          set({ aiInsights }, false, 'setAIInsights'),
        
        // Data refresh
        refreshData: async () => {
          const { setLoading, setError, setProgressMetrics, setAchievements, setStreaks, setAIInsights, loading } = get();
          
          // Prevent multiple simultaneous calls
          if (loading) {
            console.log('🔄 refreshData already in progress, skipping');
            return;
          }
          
          try {
            setLoading(true);
            setError(null);
            
            // Initialize step tracking
            const stepTrackingAvailable = await stepTrackingService.isAvailable();
            if (stepTrackingAvailable) {
              await stepTrackingService.startTracking();
              console.log('🚶 Step tracking initialized');
            } else {
              console.log('🚶 Step tracking not available on this device');
            }
            
            // Load progress metrics
            const newProgressMetrics = await loadProgressMetrics();
            setProgressMetrics(newProgressMetrics);
            
            // Load non-essential data in parallel
            const [achievements, streaks, aiInsights] = await Promise.allSettled([
              loadAchievements(),
              loadStreaks(),
              loadAIInsights()
            ]);
            
            if (achievements.status === 'fulfilled') {
              setAchievements(achievements.value);
            }
            
            if (streaks.status === 'fulfilled') {
              setStreaks(streaks.value);
            }
            
            if (aiInsights.status === 'fulfilled') {
              setAIInsights(aiInsights.value);
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
      name: 'app-store',
    }
  )
);

// Helper function to get steps
const getStepsData = async (analyticsData: any): Promise<{ current: number; progress: number }> => {
  try {
    // Try to get today's step data from device first
    const deviceSteps = await stepTrackingService.getTodaySteps();
    const currentDeviceSteps = stepTrackingService.getCurrentSteps();
    const backendSteps = analyticsData?.total_steps || 0;
    
    console.log('🔍 Step calculation - device today steps:', deviceSteps);
    console.log('🔍 Step calculation - device current steps:', currentDeviceSteps);
    console.log('🔍 Step calculation - backend steps:', backendSteps);
    
    // Use the highest available step count
    const finalSteps = Math.max(deviceSteps, currentDeviceSteps, backendSteps);
    console.log('🔍 Step calculation - final steps:', finalSteps);
    
    return {
      current: finalSteps,
      progress: Math.min((finalSteps / 10000) * 100, 100)
    };
  } catch (error) {
    console.error('Error getting steps data:', error);
    return { current: 0, progress: 0 };
  }
};

// Helper functions for data loading
const loadProgressMetrics = async (): Promise<ProgressMetrics> => {
  try {
    // Load from dashboard service
    const dashboardData = await dashboardService.getDashboardSummary();
    console.log('🔍 Dashboard Data:', JSON.stringify(dashboardData, null, 2));
    
    // Load analytics data for steps
    const analyticsData = await dashboardService.getAnalyticsData();
    console.log('🔍 Analytics Data:', JSON.stringify(analyticsData, null, 2));
    console.log('🔍 Steps from analytics:', analyticsData?.total_steps);
    
    // Get steps data
    const stepsData = await getStepsData(analyticsData);
    
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
        current: analyticsData?.average_mood || 0,
        target: 10,
        progress: Math.min(((analyticsData?.average_mood || 0) / 10) * 100, 100),
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

const loadAIInsights = async (): Promise<any[]> => {
  try {
    return await predictiveAnalyticsService.getPredictiveInsights();
  } catch (error) {
    console.error('Error loading AI insights:', error);
    return [];
  }
};

// Selector hooks for better performance with shallow comparison
export const useUser = () => useAppStore((state) => state.user, shallow);
export const useProgressMetrics = () => useAppStore((state) => state.progressMetrics, shallow);
export const useAchievements = () => useAppStore((state) => state.achievements, shallow);
export const useStreaks = () => useAppStore((state) => state.streaks, shallow);
export const useAIInsights = () => useAppStore((state) => state.aiInsights, shallow);
export const useAppLoading = () => useAppStore((state) => state.loading, shallow);
export const useAppError = () => useAppStore((state) => state.error, shallow);
export const useAppLastUpdated = () => useAppStore((state) => state.lastUpdated, shallow);
