/**
 * Testing utilities for state management
 * Provides helpers for testing Zustand stores, hooks, and components
 */

import { render, RenderOptions } from '@testing-library/react-native';
import React, { ReactElement } from 'react';
import { ErrorProvider } from '../contexts/ErrorContext';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';

// Mock data generators
export const mockRoutine = (overrides: Partial<any> = {}) => ({
  id: Math.floor(Math.random() * 1000),
  name: 'Test Routine',
  description: 'A test routine',
  difficulty: 'beginner' as const,
  duration_weeks: 4,
  total_workouts_per_week: 3,
  is_template: false,
  is_active: false,
  created_by_user_id: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  workout_schedule: [],
  user_progress: null,
  ...overrides,
});

export const mockWorkout = (overrides: Partial<any> = {}) => ({
  id: Math.floor(Math.random() * 1000),
  user_id: 1,
  routine_id: 1,
  activity_date: new Date().toISOString(),
  duration_minutes: 30,
  calories_burned: 200,
  notes: 'Test workout',
  exercises: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const mockMeal = (overrides: Partial<any> = {}) => ({
  id: Math.floor(Math.random() * 1000),
  user_id: 1,
  meal_date: new Date().toISOString(),
  meal_type: 'breakfast' as const,
  total_calories: 300,
  protein_g: 20,
  carbs_g: 30,
  fat_g: 10,
  food_items: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const mockExercise = (overrides: Partial<any> = {}) => ({
  id: Math.floor(Math.random() * 1000),
  name: 'Test Exercise',
  category: 'strength',
  logging_category: 'weighted',
  description: 'A test exercise',
  instructions: ['Do the exercise'],
  muscle_groups: ['chest'],
  equipment: 'barbell',
  difficulty: 'beginner' as const,
  ...overrides,
});

export const mockCategory = (overrides: Partial<any> = {}) => ({
  id: 'test-category',
  name: 'Test Category',
  display_name: 'Test Category',
  color: '#3b82f6',
  icon: 'dumbbell',
  ...overrides,
});

export const mockUser = (overrides: Partial<any> = {}) => ({
  id: 1,
  email: 'test@example.com',
  full_name: 'Test User',
  is_active: true,
  timezone: 'UTC',
  ...overrides,
});

// Store testing utilities
export const createMockStore = (initialState: any = {}) => {
  const store = {
    ...initialState,
    setState: jest.fn(),
    getState: jest.fn(() => store),
    subscribe: jest.fn(),
    destroy: jest.fn(),
  };
  return store;
};

export const mockStoreActions = {
  setRoutines: jest.fn(),
  addRoutine: jest.fn(),
  updateRoutine: jest.fn(),
  removeRoutine: jest.fn(),
  setRoutinesLoading: jest.fn(),
  setRoutinesError: jest.fn(),
  setWorkouts: jest.fn(),
  addWorkout: jest.fn(),
  updateWorkout: jest.fn(),
  removeWorkout: jest.fn(),
  setWorkoutsLoading: jest.fn(),
  setWorkoutsError: jest.fn(),
  setMeals: jest.fn(),
  addMeal: jest.fn(),
  updateMeal: jest.fn(),
  removeMeal: jest.fn(),
  setMealsLoading: jest.fn(),
  setMealsError: jest.fn(),
  setExercises: jest.fn(),
  addExercise: jest.fn(),
  updateExercise: jest.fn(),
  removeExercise: jest.fn(),
  setExercisesLoading: jest.fn(),
  setExercisesError: jest.fn(),
  setCategories: jest.fn(),
  addCategory: jest.fn(),
  updateCategory: jest.fn(),
  removeCategory: jest.fn(),
  setCategoriesLoading: jest.fn(),
  setCategoriesError: jest.fn(),
  clearAll: jest.fn(),
  resetErrors: jest.fn(),
};

// Hook testing utilities
export const renderHook = <T,>(hook: () => T) => {
  let result: T;
  const TestComponent = () => {
    result = hook();
    return null;
  };
  
  render(<TestComponent />);
  return { result: result! };
};

export const waitForHookUpdate = () => new Promise(resolve => setTimeout(resolve, 0));

// Component testing utilities
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorProvider>
      <AuthProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
    </ErrorProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock API responses
export const mockApiResponse = <T,>(data: T, delay: number = 0) => {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

export const mockApiError = (message: string = 'API Error', delay: number = 0) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), delay);
  });
};

// Async testing utilities
export const waitFor = (callback: () => void, timeout: number = 1000) => {
  return new Promise<void>((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      try {
        callback();
        resolve();
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(error);
        } else {
          setTimeout(check, 10);
        }
      }
    };
    
    check();
  });
};

// Store state testing utilities
export const expectStoreState = (store: any, expectedState: any) => {
  const actualState = store.getState();
  expect(actualState).toMatchObject(expectedState);
};

export const expectStoreActionCalled = (action: jest.Mock, ...args: any[]) => {
  expect(action).toHaveBeenCalledWith(...args);
};

export const expectStoreActionNotCalled = (action: jest.Mock) => {
  expect(action).not.toHaveBeenCalled();
};

// Performance testing utilities
export const measurePerformance = async <T,>(
  fn: () => Promise<T>,
  iterations: number = 10
): Promise<{ average: number; min: number; max: number; results: T[] }> => {
  const times: number[] = [];
  const results: T[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    times.push(end - start);
    results.push(result);
  }
  
  return {
    average: times.reduce((sum, time) => sum + time, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    results,
  };
};

// Memory testing utilities
export const measureMemoryUsage = () => {
  if (global.gc) {
    global.gc();
  }
  
  const usage = process.memoryUsage();
  return {
    rss: usage.rss,
    heapTotal: usage.heapTotal,
    heapUsed: usage.heapUsed,
    external: usage.external,
  };
};

// Test data factories
export const createTestData = {
  routines: (count: number) => Array.from({ length: count }, (_, i) => mockRoutine({ id: i + 1 })),
  workouts: (count: number) => Array.from({ length: count }, (_, i) => mockWorkout({ id: i + 1 })),
  meals: (count: number) => Array.from({ length: count }, (_, i) => mockMeal({ id: i + 1 })),
  exercises: (count: number) => Array.from({ length: count }, (_, i) => mockExercise({ id: i + 1 })),
  categories: (count: number) => Array.from({ length: count }, (_, i) => mockCategory({ id: `category-${i + 1}` })),
};

// Export everything
export * from '@testing-library/react-native';
export { customRender as render };
export { waitForHookUpdate, waitFor, measurePerformance, measureMemoryUsage };
export { createTestData };
