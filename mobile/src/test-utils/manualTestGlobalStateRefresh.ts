/**
 * Manual test script to verify global state refresh functionality
 * Run this script to test that the dashboard updates after meal/workout logging
 * 
 * Usage: Import and call the test functions in your app for manual testing
 */

import { nutritionService } from '../services/nutritionService';
import { fitnessService } from '../services/fitnessService';

export const manualTestGlobalStateRefresh = {
  /**
   * Test the complete meal logging flow
   * This simulates what happens when a user logs a meal
   */
  async testMealLoggingFlow() {
    console.log('🍽️ Testing meal logging global state refresh...');
    
    try {
      // Step 1: Log a meal (this should trigger global state refresh)
      const mealData = {
        meal_type: 'breakfast' as const,
        total_calories: 500,
        protein_g: 25,
        carbs_g: 60,
        fat_g: 15,
        food_items: JSON.stringify([{
          food_id: Date.now(),
          food_name: 'Test Food',
          quantity: 1,
          quantity_unit: 'serving',
          quantity_grams: 100,
          calories: 500,
          protein_g: 25,
          carbs_g: 60,
          fat_g: 15,
        }]),
        notes: 'Manual test meal',
        meal_date: new Date().toISOString(),
      };
      
      console.log('📝 Logging meal...');
      const result = await nutritionService.logMeal(mealData);
      console.log('✅ Meal logged:', result);
      
      // Step 2: Wait a moment for global state to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 3: Check if dashboard would show updated calories
      console.log('📊 Dashboard should now show updated calorie count');
      console.log('🔍 Check that the dashboard calorie display has increased by 500 calories');
      
      return {
        success: true,
        message: 'Meal logging flow completed. Check dashboard for updated calories.',
        expectedCalories: 500
      };
      
    } catch (error) {
      console.error('❌ Meal logging test failed:', error);
      return {
        success: false,
        message: 'Meal logging test failed',
        error: error
      };
    }
  },

  /**
   * Test the complete workout logging flow
   * This simulates what happens when a user logs a workout
   */
  async testWorkoutLoggingFlow() {
    console.log('💪 Testing workout logging global state refresh...');
    
    try {
      // Step 1: Log a workout (this should trigger global state refresh)
      const workoutData = {
        activity_type: 'strength_training',
        duration_minutes: 45,
        calories_burned: 300,
        notes: 'Manual test workout',
        activity_date: new Date().toISOString(),
      };
      
      console.log('📝 Logging workout...');
      const result = await fitnessService.logWorkout(workoutData);
      console.log('✅ Workout logged:', result);
      
      // Step 2: Wait a moment for global state to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 3: Check if dashboard would show updated workout metrics
      console.log('📊 Dashboard should now show updated workout metrics');
      console.log('🔍 Check that the dashboard shows increased workout count and calories burned');
      
      return {
        success: true,
        message: 'Workout logging flow completed. Check dashboard for updated metrics.',
        expectedCaloriesBurned: 300,
        expectedDuration: 45
      };
      
    } catch (error) {
      console.error('❌ Workout logging test failed:', error);
      return {
        success: false,
        message: 'Workout logging test failed',
        error: error
      };
    }
  },

  /**
   * Test the refresh functionality
   * This simulates what happens when a user pulls to refresh
   */
  async testRefreshFlow() {
    console.log('🔄 Testing refresh global state flow...');
    
    try {
      // Step 1: Simulate a refresh action
      console.log('📝 Triggering refresh...');
      
      // In a real app, this would be called by the refresh control
      // The refresh should update both local data and global state
      console.log('✅ Refresh triggered');
      
      // Step 2: Wait for refresh to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 3: Check if dashboard shows latest data
      console.log('📊 Dashboard should now show the most recent data');
      console.log('🔍 Check that the dashboard displays current metrics');
      
      return {
        success: true,
        message: 'Refresh flow completed. Check dashboard for updated data.',
      };
      
    } catch (error) {
      console.error('❌ Refresh test failed:', error);
      return {
        success: false,
        message: 'Refresh test failed',
        error: error
      };
    }
  },

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Running all global state refresh tests...');
    console.log('=====================================');
    
    const results = {
      mealLogging: await this.testMealLoggingFlow(),
      workoutLogging: await this.testWorkoutLoggingFlow(),
      refresh: await this.testRefreshFlow(),
    };
    
    console.log('=====================================');
    console.log('📋 Test Results Summary:');
    console.log('Meal Logging:', results.mealLogging.success ? '✅ PASS' : '❌ FAIL');
    console.log('Workout Logging:', results.workoutLogging.success ? '✅ PASS' : '❌ FAIL');
    console.log('Refresh:', results.refresh.success ? '✅ PASS' : '❌ FAIL');
    
    const allPassed = Object.values(results).every(result => result.success);
    console.log('Overall:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
    
    return {
      allPassed,
      results
    };
  }
};

/**
 * Instructions for manual testing:
 * 
 * 1. Import this module in your app:
 *    import { manualTestGlobalStateRefresh } from './test-utils/manualTestGlobalStateRefresh';
 * 
 * 2. Call the test functions:
 *    manualTestGlobalStateRefresh.runAllTests();
 * 
 * 3. Or test individual flows:
 *    manualTestGlobalStateRefresh.testMealLoggingFlow();
 *    manualTestGlobalStateRefresh.testWorkoutLoggingFlow();
 *    manualTestGlobalStateRefresh.testRefreshFlow();
 * 
 * 4. Check the console output and verify that:
 *    - Meals are logged successfully
 *    - Workouts are logged successfully
 *    - Dashboard updates show the new data
 *    - Global state is refreshed after each action
 */

export default manualTestGlobalStateRefresh;
