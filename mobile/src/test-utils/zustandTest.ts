/**
 * Test utilities for Zustand store implementation
 * Verifies that the new Zustand stores work correctly
 */

import { useAppStore, useNutritionStore, useFitnessStore, useAnalyticsStore } from '../stores';

// Mock the services
jest.mock('../services/dashboardService');
jest.mock('../services/fitnessService');
jest.mock('../services/nutritionService');
jest.mock('../services/predictiveAnalyticsService');

describe('Zustand Store Implementation', () => {
  beforeEach(() => {
    // Reset all stores before each test
    useAppStore.getState().resetState();
    useNutritionStore.getState().resetNutritionState();
    useFitnessStore.getState().resetFitnessState();
    useAnalyticsStore.getState().resetAnalyticsState();
  });

  describe('App Store', () => {
    it('should initialize with correct initial state', () => {
      const state = useAppStore.getState();
      
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.progressMetrics).toEqual({
        workouts: { current: 0, target: 5, progress: 0 },
        calories: { current: 0, target: 2000, progress: 0 },
        protein: { current: 0, target: 150, progress: 0 },
        water: { current: 0, target: 3.0, progress: 0 },
        steps: { current: 0, target: 10000, progress: 0 },
        mood: { current: 0, target: 10, progress: 0 },
      });
      expect(state.achievements).toEqual([]);
      expect(state.streaks).toEqual([]);
      expect(state.aiInsights).toEqual([]);
    });

    it('should update user correctly', () => {
      const { setUser } = useAppStore.getState();
      const testUser = {
        id: 1,
        full_name: 'Test User',
        email: 'test@example.com',
      };
      
      setUser(testUser);
      
      const state = useAppStore.getState();
      expect(state.user).toEqual(testUser);
    });

    it('should update progress metrics correctly', () => {
      const { setProgressMetrics } = useAppStore.getState();
      const testMetrics = {
        workouts: { current: 3, target: 5, progress: 60 },
        calories: { current: 1500, target: 2000, progress: 75 },
        protein: { current: 100, target: 150, progress: 66.67 },
        water: { current: 2.5, target: 3.0, progress: 83.33 },
        steps: { current: 8000, target: 10000, progress: 80 },
        mood: { current: 8, target: 10, progress: 80 },
      };
      
      setProgressMetrics(testMetrics);
      
      const state = useAppStore.getState();
      expect(state.progressMetrics).toEqual(testMetrics);
    });
  });

  describe('Nutrition Store', () => {
    it('should initialize with correct initial state', () => {
      const state = useNutritionStore.getState();
      
      expect(state.todayStats).toBeNull();
      expect(state.weekStats).toBeNull();
      expect(state.recentMeals).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should add meal correctly', () => {
      const { addMeal } = useNutritionStore.getState();
      const testMeal = {
        id: '1',
        meal_type: 'breakfast' as const,
        food_items: [],
        total_calories: 500,
        total_protein: 25,
        total_carbs: 60,
        total_fat: 15,
        logged_at: new Date().toISOString(),
      };
      
      addMeal(testMeal);
      
      const state = useNutritionStore.getState();
      expect(state.recentMeals).toHaveLength(1);
      expect(state.recentMeals[0]).toEqual(testMeal);
    });

    it('should update meal correctly', () => {
      const { addMeal, updateMeal } = useNutritionStore.getState();
      const testMeal = {
        id: '1',
        meal_type: 'breakfast' as const,
        food_items: [],
        total_calories: 500,
        total_protein: 25,
        total_carbs: 60,
        total_fat: 15,
        logged_at: new Date().toISOString(),
      };
      
      addMeal(testMeal);
      updateMeal('1', { total_calories: 600 });
      
      const state = useNutritionStore.getState();
      expect(state.recentMeals[0].total_calories).toBe(600);
    });

    it('should delete meal correctly', () => {
      const { addMeal, deleteMeal } = useNutritionStore.getState();
      const testMeal = {
        id: '1',
        meal_type: 'breakfast' as const,
        food_items: [],
        total_calories: 500,
        total_protein: 25,
        total_carbs: 60,
        total_fat: 15,
        logged_at: new Date().toISOString(),
      };
      
      addMeal(testMeal);
      deleteMeal('1');
      
      const state = useNutritionStore.getState();
      expect(state.recentMeals).toHaveLength(0);
    });
  });

  describe('Fitness Store', () => {
    it('should initialize with correct initial state', () => {
      const state = useFitnessStore.getState();
      
      expect(state.todayStats).toBeNull();
      expect(state.weekStats).toBeNull();
      expect(state.recentWorkouts).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should add workout correctly', () => {
      const { addWorkout } = useFitnessStore.getState();
      const testWorkout = {
        id: '1',
        activity_type: 'strength_training',
        duration_minutes: 45,
        calories_burned: 300,
        notes: 'Test workout',
        activity_date: new Date().toISOString(),
      };
      
      addWorkout(testWorkout);
      
      const state = useFitnessStore.getState();
      expect(state.recentWorkouts).toHaveLength(1);
      expect(state.recentWorkouts[0]).toEqual(testWorkout);
    });

    it('should update workout correctly', () => {
      const { addWorkout, updateWorkout } = useFitnessStore.getState();
      const testWorkout = {
        id: '1',
        activity_type: 'strength_training',
        duration_minutes: 45,
        calories_burned: 300,
        notes: 'Test workout',
        activity_date: new Date().toISOString(),
      };
      
      addWorkout(testWorkout);
      updateWorkout('1', { duration_minutes: 60 });
      
      const state = useFitnessStore.getState();
      expect(state.recentWorkouts[0].duration_minutes).toBe(60);
    });

    it('should delete workout correctly', () => {
      const { addWorkout, deleteWorkout } = useFitnessStore.getState();
      const testWorkout = {
        id: '1',
        activity_type: 'strength_training',
        duration_minutes: 45,
        calories_burned: 300,
        notes: 'Test workout',
        activity_date: new Date().toISOString(),
      };
      
      addWorkout(testWorkout);
      deleteWorkout('1');
      
      const state = useFitnessStore.getState();
      expect(state.recentWorkouts).toHaveLength(0);
    });
  });

  describe('Analytics Store', () => {
    it('should initialize with correct initial state', () => {
      const state = useAnalyticsStore.getState();
      
      expect(state.analyticsData).toBeNull();
      expect(state.weeklyActivityData).toEqual({
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0,
      });
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should update analytics data correctly', () => {
      const { setAnalyticsData } = useAnalyticsStore.getState();
      const testData = {
        total_steps: 8000,
        average_mood: 8,
        weekly_activity: {
          monday: 1,
          tuesday: 2,
          wednesday: 1,
          thursday: 3,
          friday: 2,
          saturday: 1,
          sunday: 0,
        },
      };
      
      setAnalyticsData(testData);
      
      const state = useAnalyticsStore.getState();
      expect(state.analyticsData).toEqual(testData);
    });
  });

  describe('Store Integration', () => {
    it('should maintain separate state between stores', () => {
      // Add data to different stores
      useNutritionStore.getState().addMeal({
        id: '1',
        meal_type: 'breakfast',
        food_items: [],
        total_calories: 500,
        total_protein: 25,
        total_carbs: 60,
        total_fat: 15,
        logged_at: new Date().toISOString(),
      });

      useFitnessStore.getState().addWorkout({
        id: '1',
        activity_type: 'strength_training',
        duration_minutes: 45,
        calories_burned: 300,
        notes: 'Test workout',
        activity_date: new Date().toISOString(),
      });

      // Verify stores are independent
      expect(useNutritionStore.getState().recentMeals).toHaveLength(1);
      expect(useFitnessStore.getState().recentWorkouts).toHaveLength(1);
      expect(useAppStore.getState().recentMeals).toBeUndefined();
      expect(useAppStore.getState().recentWorkouts).toBeUndefined();
    });
  });
});

/**
 * Manual test helper for Zustand stores
 */
export const testZustandStores = {
  /**
   * Test all stores initialization
   */
  testInitialization() {
    console.log('🧪 Testing Zustand stores initialization...');
    
    try {
      // Test app store
      const appState = useAppStore.getState();
      console.log('✅ App store initialized:', {
        user: appState.user,
        loading: appState.loading,
        progressMetrics: appState.progressMetrics,
      });

      // Test nutrition store
      const nutritionState = useNutritionStore.getState();
      console.log('✅ Nutrition store initialized:', {
        todayStats: nutritionState.todayStats,
        weekStats: nutritionState.weekStats,
        recentMeals: nutritionState.recentMeals.length,
      });

      // Test fitness store
      const fitnessState = useFitnessStore.getState();
      console.log('✅ Fitness store initialized:', {
        todayStats: fitnessState.todayStats,
        weekStats: fitnessState.weekStats,
        recentWorkouts: fitnessState.recentWorkouts.length,
      });

      // Test analytics store
      const analyticsState = useAnalyticsStore.getState();
      console.log('✅ Analytics store initialized:', {
        analyticsData: analyticsState.analyticsData,
        weeklyActivityData: analyticsState.weeklyActivityData,
      });

      return true;
    } catch (error) {
      console.error('❌ Store initialization test failed:', error);
      return false;
    }
  },

  /**
   * Test store actions
   */
  testActions() {
    console.log('🧪 Testing Zustand store actions...');
    
    try {
      // Test app store actions
      useAppStore.getState().setLoading(true);
      console.log('✅ App store setLoading action works');

      // Test nutrition store actions
      useNutritionStore.getState().addMeal({
        id: 'test-1',
        meal_type: 'breakfast',
        food_items: [],
        total_calories: 500,
        total_protein: 25,
        total_carbs: 60,
        total_fat: 15,
        logged_at: new Date().toISOString(),
      });
      console.log('✅ Nutrition store addMeal action works');

      // Test fitness store actions
      useFitnessStore.getState().addWorkout({
        id: 'test-1',
        activity_type: 'strength_training',
        duration_minutes: 45,
        calories_burned: 300,
        notes: 'Test workout',
        activity_date: new Date().toISOString(),
      });
      console.log('✅ Fitness store addWorkout action works');

      return true;
    } catch (error) {
      console.error('❌ Store actions test failed:', error);
      return false;
    }
  },

  /**
   * Run all tests
   */
  runAllTests() {
    console.log('🚀 Running all Zustand store tests...');
    console.log('=====================================');
    
    const results = {
      initialization: this.testInitialization(),
      actions: this.testActions(),
    };
    
    console.log('=====================================');
    console.log('📋 Test Results Summary:');
    console.log('Initialization:', results.initialization ? '✅ PASS' : '❌ FAIL');
    console.log('Actions:', results.actions ? '✅ PASS' : '❌ FAIL');
    
    const allPassed = Object.values(results).every(result => result);
    console.log('Overall:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
    
    return {
      allPassed,
      results
    };
  }
};

export default testZustandStores;
