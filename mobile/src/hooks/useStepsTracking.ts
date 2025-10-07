/**
 * Hook for real-time step tracking
 * Provides current step count and refresh functionality
 */

import { useState, useEffect, useCallback } from 'react';
import stepTrackingService from '../services/stepTrackingService';

export function useStepsTracking() {
  const [steps, setSteps] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshSteps = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get today's steps from storage
      const todaySteps = await stepTrackingService.getTodaySteps();
      
      // Get current steps from device
      const currentSteps = stepTrackingService.getCurrentSteps();
      
      // Use the higher value
      const finalSteps = Math.max(todaySteps, currentSteps);
      
      setSteps(finalSteps);
      setIsTracking(stepTrackingService.isCurrentlyTracking());
      
      console.log('🚶 Steps refreshed:', { todaySteps, currentSteps, finalSteps });
    } catch (error) {
      console.error('Error refreshing steps:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const startTracking = useCallback(async () => {
    try {
      const started = await stepTrackingService.startTracking();
      setIsTracking(started);
      if (started) {
        // Refresh steps after starting tracking
        await refreshSteps();
      }
      return started;
    } catch (error) {
      console.error('Error starting step tracking:', error);
      return false;
    }
  }, [refreshSteps]);

  const stopTracking = useCallback(async () => {
    try {
      await stepTrackingService.stopTracking();
      setIsTracking(false);
    } catch (error) {
      console.error('Error stopping step tracking:', error);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    refreshSteps();
  }, [refreshSteps]);

  // Set up periodic refresh when tracking
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      refreshSteps();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isTracking, refreshSteps]);

  return {
    steps,
    isTracking,
    loading,
    refreshSteps,
    startTracking,
    stopTracking,
  };
}

export default useStepsTracking;
