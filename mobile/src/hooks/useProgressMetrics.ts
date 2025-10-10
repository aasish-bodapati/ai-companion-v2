import { useMemo, useRef } from 'react';
import { useProgressMetrics, useStreaks, useAchievements } from '../stores';

interface ProgressMetricsData {
  rings: {
    id: string;
    label: string;
    value: number;
    target: number;
    unit: string;
    icon: string;
    color: string;
  }[];
  bars: {
    id: string;
    label: string;
    value: number;
    target: number;
    unit: string;
    icon: string;
    color: string;
  }[];
  numbers: {
    id: string;
    label: string;
    value: number;
    target: number;
    unit: string;
    icon: string;
    color: string;
  }[];
}

export function useProgressMetricsData(): ProgressMetricsData {
  const progressMetrics = useProgressMetrics();
  const { streaks } = useStreaks();
  const { achievements } = useAchievements();
  const renderCountRef = useRef(0);

  renderCountRef.current += 1;
  
  // Only log on first render in development
  if (__DEV__ && renderCountRef.current === 1) {
    console.log('🔄 [PROGRESS METRICS HOOK] Initialized');
  }

  return useMemo(() => {
    
    // Default values if progressMetrics is undefined
    const defaultMetrics = {
      workouts: { current: 0, target: 0 },
      calories: { current: 0, target: 0 },
      protein: { current: 0, target: 0 },
      steps: { current: 0, target: 0 },
      mood: { current: 0, target: 0 },
    };
    
    const metrics = progressMetrics || defaultMetrics;
    
    const rings = [
      {
        id: 'workouts',
        label: 'Workouts',
        value: metrics.workouts?.current || 0,
        target: metrics.workouts?.target || 0,
        unit: '',
        icon: 'fitness',
        color: '#3b82f6',
      },
      {
        id: 'calories',
        label: 'Calories',
        value: metrics.calories?.current || 0,
        target: metrics.calories?.target || 0,
        unit: 'cal',
        icon: 'flame',
        color: '#ef4444',
      },
      {
        id: 'protein',
        label: 'Protein',
        value: metrics.protein?.current || 0,
        target: metrics.protein?.target || 0,
        unit: 'g',
        icon: 'nutrition',
        color: '#10b981',
      },
      {
        id: 'steps',
        label: 'Steps',
        value: metrics.steps?.current || 0,
        target: metrics.steps?.target || 0,
        unit: '',
        icon: 'walk',
        color: '#8b5cf6',
      },
    ];

    const bars = [
      {
        id: 'mood',
        label: 'Mood',
        value: metrics.mood?.current || 0,
        target: metrics.mood?.target || 0,
        unit: '/10',
        icon: 'happy',
        color: '#f59e0b',
      },
    ];

    const numbers = [
      {
        id: 'achievements',
        label: 'Achievements',
        value: achievements?.filter(a => a.unlocked).length || 0,
        target: achievements?.length || 0,
        unit: '',
        icon: 'trophy',
        color: '#8b5cf6',
      },
      {
        id: 'streaks',
        label: 'Best Streak',
        value: streaks?.length > 0 ? Math.max(...streaks.map(s => s.best)) : 0,
        target: 30,
        unit: 'days',
        icon: 'flame',
        color: '#ef4444',
      },
    ];

    return { rings, bars, numbers };
  }, [progressMetrics, streaks, achievements]);
}
