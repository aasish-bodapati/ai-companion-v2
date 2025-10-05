import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User } from '../types/user';
import { dashboardService } from '../services/dashboardService';
import { fitnessService } from '../services/fitnessService';
import { nutritionService } from '../services/nutritionService';
import { predictiveAnalyticsService } from '../services/predictiveAnalyticsService';
import stepTrackingService from '../services/stepTrackingService';

// Global State Types
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  progress?: number;
  unlockedAt?: string;
  category: 'fitness' | 'nutrition' | 'consistency' | 'milestone';
}

interface Streak {
  type: 'workout' | 'nutrition' | 'water' | 'mood';
  current: number;
  best: number;
  icon: string;
  color: string;
  label: string;
  unit: string;
}

interface ProgressMetrics {
  workouts: { current: number; target: number; progress: number };
  calories: { current: number; target: number; progress: number };
  protein: { current: number; target: number; progress: number };
  water: { current: number; target: number; progress: number };
  steps: { current: number; target: number; progress: number };
  mood: { current: number; target: number; progress: number };
}

interface GlobalState {
  user: User | null;
  achievements: Achievement[];
  streaks: Streak[];
  progressMetrics: ProgressMetrics;
  aiInsights: any[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// Action Types
type GlobalAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ACHIEVEMENTS'; payload: Achievement[] }
  | { type: 'SET_STREAKS'; payload: Streak[] }
  | { type: 'SET_PROGRESS_METRICS'; payload: ProgressMetrics }
  | { type: 'SET_AI_INSIGHTS'; payload: any[] }
  | { type: 'UPDATE_ACHIEVEMENT'; payload: { id: string; unlocked: boolean; progress?: number } }
  | { type: 'UPDATE_STREAK'; payload: { type: string; current: number } }
  | { type: 'REFRESH_DATA' }
  | { type: 'RESET_STATE' };

// Initial State
const initialState: GlobalState = {
  user: null,
  achievements: [],
  streaks: [],
  progressMetrics: {
    workouts: { current: 0, target: 5, progress: 0 },
    calories: { current: 0, target: 2000, progress: 0 },
    protein: { current: 0, target: 150, progress: 0 },
    water: { current: 0, target: 3.0, progress: 0 },
    steps: { current: 0, target: 10000, progress: 0 },
    mood: { current: 0, target: 10, progress: 0 },
  },
  aiInsights: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

// Reducer
function globalStateReducer(state: GlobalState, action: GlobalAction): GlobalState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_ACHIEVEMENTS':
      return { ...state, achievements: action.payload };
    case 'SET_STREAKS':
      return { ...state, streaks: action.payload };
    case 'SET_PROGRESS_METRICS':
      return { ...state, progressMetrics: action.payload };
    case 'SET_AI_INSIGHTS':
      return { ...state, aiInsights: action.payload };
    case 'UPDATE_ACHIEVEMENT':
      return {
        ...state,
        achievements: state.achievements.map(achievement =>
          achievement.id === action.payload.id
            ? { ...achievement, unlocked: action.payload.unlocked, progress: action.payload.progress }
            : achievement
        ),
      };
    case 'UPDATE_STREAK':
      return {
        ...state,
        streaks: state.streaks.map(streak =>
          streak.type === action.payload.type
            ? { ...streak, current: action.payload.current }
            : streak
        ),
      };
    case 'REFRESH_DATA':
      return { ...state, lastUpdated: new Date().toISOString() };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

// Context
const GlobalStateContext = createContext<{
  state: GlobalState;
  dispatch: React.Dispatch<GlobalAction>;
  refreshData: () => Promise<void>;
  updateAchievement: (id: string, unlocked: boolean, progress?: number) => void;
  updateStreak: (type: string, current: number) => void;
} | null>(null);

// Provider Component
export function GlobalStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(globalStateReducer, initialState);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Initialize step tracking
      const stepTrackingAvailable = await stepTrackingService.isAvailable();
      if (stepTrackingAvailable) {
        await stepTrackingService.startTracking();
        console.log('🚶 Step tracking initialized');
      } else {
        console.log('🚶 Step tracking not available on this device');
      }
      
      // Load achievements
      const achievements = await loadAchievements();
      dispatch({ type: 'SET_ACHIEVEMENTS', payload: achievements });
      
      // Load streaks
      const streaks = await loadStreaks();
      dispatch({ type: 'SET_STREAKS', payload: streaks });
      
      // Load progress metrics
      const progressMetrics = await loadProgressMetrics();
      dispatch({ type: 'SET_PROGRESS_METRICS', payload: progressMetrics });
      
      // Load AI insights
      const aiInsights = await loadAIInsights();
      dispatch({ type: 'SET_AI_INSIGHTS', payload: aiInsights });
      
      dispatch({ type: 'REFRESH_DATA' });
    } catch (error) {
      console.error('Error loading initial data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadAchievements = async (): Promise<Achievement[]> => {
    // Mock achievements data - replace with actual API call
    return [
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
  };

  const loadStreaks = async (): Promise<Streak[]> => {
    // Mock streaks data - replace with actual API call
    return [
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
  };

  const loadProgressMetrics = async (): Promise<ProgressMetrics> => {
    try {
      // Load from dashboard service
      const dashboardData = await dashboardService.getDashboardSummary();
      console.log('🔍 Dashboard Data:', JSON.stringify(dashboardData, null, 2));
      
      // Load analytics data for steps
      const analyticsData = await dashboardService.getAnalyticsData();
      console.log('🔍 Analytics Data:', JSON.stringify(analyticsData, null, 2));
      console.log('🔍 Steps from analytics:', analyticsData?.total_steps);
      
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
          current: (() => {
            // Try to get real step data from device first
            const deviceSteps = stepTrackingService.getCurrentSteps();
            const backendSteps = analyticsData?.total_steps || 0;
            
            console.log('🔍 Step calculation - device steps:', deviceSteps);
            console.log('🔍 Step calculation - backend steps:', backendSteps);
            
            // Use device steps if available, otherwise fall back to backend
            const finalSteps = deviceSteps > 0 ? deviceSteps : backendSteps;
            console.log('🔍 Step calculation - final steps:', finalSteps);
            
            return finalSteps;
          })(),
          target: 10000,
          progress: (() => {
            const deviceSteps = stepTrackingService.getCurrentSteps();
            const backendSteps = analyticsData?.total_steps || 0;
            const finalSteps = deviceSteps > 0 ? deviceSteps : backendSteps;
            return Math.min((finalSteps / 10000) * 100, 100);
          })(),
        },
        mood: {
          current: analyticsData?.average_mood || 0,
          target: 10,
          progress: Math.min(((analyticsData?.average_mood || 0) / 10) * 100, 100),
        },
      };
    } catch (error) {
      console.error('Error loading progress metrics:', error);
      return state.progressMetrics;
    }
  };

  const loadAIInsights = async (): Promise<any[]> => {
    try {
      return await predictiveAnalyticsService.getPredictiveInsights();
    } catch (error) {
      console.error('Error loading AI insights:', error);
      return [];
    }
  };

  const refreshData = async () => {
    await loadInitialData();
  };

  const updateAchievement = (id: string, unlocked: boolean, progress?: number) => {
    dispatch({ type: 'UPDATE_ACHIEVEMENT', payload: { id, unlocked, progress } });
  };

  const updateStreak = (type: string, current: number) => {
    dispatch({ type: 'UPDATE_STREAK', payload: { type, current } });
  };

  return (
    <GlobalStateContext.Provider
      value={{
        state,
        dispatch,
        refreshData,
        updateAchievement,
        updateStreak,
      }}
    >
      {children}
    </GlobalStateContext.Provider>
  );
}

// Custom Hooks
export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
}

export function useUserData() {
  const { state } = useGlobalState();
  return state.user;
}

export function useAchievements() {
  const { state, updateAchievement } = useGlobalState();
  return {
    achievements: state.achievements,
    updateAchievement,
  };
}

export function useStreaks() {
  const { state, updateStreak } = useGlobalState();
  return {
    streaks: state.streaks,
    updateStreak,
  };
}

export function useProgressMetrics() {
  const { state } = useGlobalState();
  return state.progressMetrics;
}

export function useAIInsights() {
  const { state } = useGlobalState();
  return state.aiInsights;
}

export function useGlobalLoading() {
  const { state } = useGlobalState();
  return state.loading;
}

export function useGlobalError() {
  const { state } = useGlobalState();
  return state.error;
}
