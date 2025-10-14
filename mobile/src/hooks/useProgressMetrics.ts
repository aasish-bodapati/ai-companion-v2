import { useMemo, useRef } from 'react';
import { useHealthStats } from '../stores';

import { DebugUtils } from '../utils/debugUtils';

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
  const { workoutsToday, caloriesToday, waterToday, mealsToday } = useHealthStats();
  const renderCountRef = useRef(0);

  renderCountRef.current += 1;

  // Only log on first render in development
  if (__DEV__ && renderCountRef.current === 1) {
    DebugUtils.log('🔄 [PROGRESS METRICS HOOK] Initialized');
  }

  return useMemo(() => {
    // Simple data mapping from the simplified store
    const rings = [
      {
        id: 'workouts',
        label: 'Workouts',
        value: workoutsToday,
        target: 5, // Default target
        unit: '',
        icon: 'fitness',
        color: '#3b82f6',
      },
      {
        id: 'calories',
        label: 'Calories',
        value: caloriesToday,
        target: 2000, // Default target
        unit: 'cal',
        icon: 'flame',
        color: '#ef4444',
      },
      {
        id: 'water',
        label: 'Water',
        value: waterToday / 1000, // Convert ml to L
        target: 3, // 3L target
        unit: 'L',
        icon: 'water',
        color: '#06b6d4',
      },
    ];

    const bars = [
      {
        id: 'meals',
        label: 'Meals',
        value: mealsToday,
        target: 3, // 3 meals per day
        unit: '',
        icon: 'nutrition',
        color: '#10b981',
      },
    ];

    const numbers = [
      {
        id: 'workouts',
        label: 'Workouts Today',
        value: workoutsToday,
        target: 5,
        unit: '',
        icon: 'fitness',
        color: '#3b82f6',
      },
      {
        id: 'calories',
        label: 'Calories Today',
        value: caloriesToday,
        target: 2000,
        unit: 'cal',
        icon: 'flame',
        color: '#ef4444',
      },
    ];

    return { rings, bars, numbers };
  }, [workoutsToday, caloriesToday, waterToday, mealsToday]);
}
