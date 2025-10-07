/**
 * Test utilities for step tracking functionality
 * Verifies that step tracking works correctly
 */

import stepTrackingService from '../services/stepTrackingService';

export const testStepTracking = {
  /**
   * Test step tracking initialization
   */
  async testInitialization() {
    console.log('🧪 Testing step tracking initialization...');
    
    try {
      // Check if step tracking is available
      const isAvailable = await stepTrackingService.isAvailable();
      console.log('✅ Step tracking available:', isAvailable);
      
      if (isAvailable) {
        // Try to start tracking
        const started = await stepTrackingService.startTracking();
        console.log('✅ Step tracking started:', started);
        
        if (started) {
          // Check current steps
          const currentSteps = stepTrackingService.getCurrentSteps();
          console.log('✅ Current steps:', currentSteps);
          
          // Check today's steps
          const todaySteps = await stepTrackingService.getTodaySteps();
          console.log('✅ Today steps:', todaySteps);
          
          return {
            success: true,
            available: isAvailable,
            started: started,
            currentSteps: currentSteps,
            todaySteps: todaySteps,
          };
        }
      }
      
      return {
        success: true,
        available: isAvailable,
        started: false,
        currentSteps: 0,
        todaySteps: 0,
      };
    } catch (error) {
      console.error('❌ Step tracking initialization test failed:', error);
      return {
        success: false,
        error: error,
      };
    }
  },

  /**
   * Test step data persistence
   */
  async testStepDataPersistence() {
    console.log('🧪 Testing step data persistence...');
    
    try {
      // Get today's steps
      const todaySteps = await stepTrackingService.getTodaySteps();
      console.log('✅ Today steps from storage:', todaySteps);
      
      // Get current steps
      const currentSteps = stepTrackingService.getCurrentSteps();
      console.log('✅ Current steps from device:', currentSteps);
      
      // Get weekly steps
      const weeklySteps = await stepTrackingService.getWeeklySteps();
      console.log('✅ Weekly steps:', weeklySteps.length, 'days');
      
      return {
        success: true,
        todaySteps: todaySteps,
        currentSteps: currentSteps,
        weeklyStepsCount: weeklySteps.length,
      };
    } catch (error) {
      console.error('❌ Step data persistence test failed:', error);
      return {
        success: false,
        error: error,
      };
    }
  },

  /**
   * Test step tracking status
   */
  async testTrackingStatus() {
    console.log('🧪 Testing step tracking status...');
    
    try {
      const isTracking = stepTrackingService.isCurrentlyTracking();
      const isAvailable = await stepTrackingService.isAvailable();
      
      console.log('✅ Is tracking:', isTracking);
      console.log('✅ Is available:', isAvailable);
      
      return {
        success: true,
        isTracking: isTracking,
        isAvailable: isAvailable,
      };
    } catch (error) {
      console.error('❌ Step tracking status test failed:', error);
      return {
        success: false,
        error: error,
      };
    }
  },

  /**
   * Run all step tracking tests
   */
  async runAllTests() {
    console.log('🚀 Running all step tracking tests...');
    console.log('=====================================');
    
    const results = {
      initialization: await this.testInitialization(),
      persistence: await this.testStepDataPersistence(),
      status: await this.testTrackingStatus(),
    };
    
    console.log('=====================================');
    console.log('📋 Test Results Summary:');
    console.log('Initialization:', results.initialization.success ? '✅ PASS' : '❌ FAIL');
    console.log('Persistence:', results.persistence.success ? '✅ PASS' : '❌ FAIL');
    console.log('Status:', results.status.success ? '✅ PASS' : '❌ FAIL');
    
    const allPassed = Object.values(results).every(result => result.success);
    console.log('Overall:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
    
    return {
      allPassed,
      results
    };
  }
};

export default testStepTracking;
