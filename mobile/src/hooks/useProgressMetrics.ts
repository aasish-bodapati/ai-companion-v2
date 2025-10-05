import { useMemo } from 'react';
import { useProgressMetrics, useStreaks, useAchievements } from '../contexts/GlobalStateContext';

interface ProgressMetricsData {
  rings: Array<{
    id: string;
    label: string;
    value: number;
    target: number;
    unit: string;
    icon: string;
    color: string;
  }>;
  bars: Array<{
    id: string;
    label: string;
    value: number;
    target: number;
    unit: string;
    icon: string;
    color: string;
  }>;
  numbers: Array<{
    id: string;
    label: string;
    value: number;
    target: number;
    unit: string;
    icon: string;
    color: string;
  }>;
}

export function useProgressMetricsData(): ProgressMetricsData {
  const progressMetrics = useProgressMetrics();
  const { streaks } = useStreaks();
  const { achievements } = useAchievements();

  return useMemo(() => {
    const rings = [
      {
        id: 'workouts',
        label: 'Workouts',
        value: progressMetrics.workouts.current,
        target: progressMetrics.workouts.target,
        unit: '',
        icon: 'fitness',
        color: '#3b82f6',
      },
      {
        id: 'calories',
        label: 'Calories',
        value: progressMetrics.calories.current,
        target: progressMetrics.calories.target,
        unit: 'cal',
        icon: 'flame',
        color: '#ef4444',
      },
      {
        id: 'protein',
        label: 'Protein',
        value: progressMetrics.protein.current,
        target: progressMetrics.protein.target,
        unit: 'g',
        icon: 'nutrition',
        color: '#10b981',
      },
      {
        id: 'steps',
        label: 'Steps',
        value: progressMetrics.steps.current,
        target: progressMetrics.steps.target,
        unit: '',
        icon: 'walk',
        color: '#8b5cf6',
      },
    ];

    const bars = [
      {
        id: 'mood',
        label: 'Mood',
        value: progressMetrics.mood.current,
        target: progressMetrics.mood.target,
        unit: '/10',
        icon: 'happy',
        color: '#f59e0b',
      },
    ];

    const numbers = [
      {
        id: 'achievements',
        label: 'Achievements',
        value: achievements.filter(a => a.unlocked).length,
        target: achievements.length,
        unit: '',
        icon: 'trophy',
        color: '#8b5cf6',
      },
      {
        id: 'streaks',
        label: 'Best Streak',
        value: Math.max(...streaks.map(s => s.best)),
        target: 30,
        unit: 'days',
        icon: 'flame',
        color: '#ef4444',
      },
    ];

    return { rings, bars, numbers };
  }, [progressMetrics, streaks, achievements]);
}
