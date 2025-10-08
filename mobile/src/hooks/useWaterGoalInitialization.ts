import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWaterStore } from '../stores/waterStore';

/**
 * Hook to initialize water goal based on user's gender
 * This should be called when the user logs in or when the app starts
 */
export function useWaterGoalInitialization() {
  const { user } = useAuth();
  const { initializeWaterGoal, waterGoal } = useWaterStore();

  useEffect(() => {
    if (user?.health_data?.gender && waterGoal === 3200) {
      // Only initialize if we still have the default goal
      // This prevents overriding a user-set goal
      initializeWaterGoal(user.health_data.gender);
    }
  }, [user?.health_data?.gender, initializeWaterGoal, waterGoal]);

  return {
    waterGoal,
    isInitialized: waterGoal !== 3200, // Check if goal has been set to something other than default
  };
}

export default useWaterGoalInitialization;
