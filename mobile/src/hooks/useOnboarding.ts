/**
 * Onboarding Hook - Handles onboarding state and completion
 * Extracted from AuthContext to reduce complexity
 */

import { useState } from 'react';
import { api } from '../services/api';
import { DebugUtils } from '../utils/debugUtils';

interface OnboardingData {
  age: number;
  gender: string;
  height_cm: number;
  current_weight_kg: number;
  activity_level: string;
}

interface OnboardingActions {
  needsOnboarding: boolean;
  setNeedsOnboarding: (needs: boolean) => void;
  completeOnboarding: (data?: OnboardingData) => Promise<void>;
  rerunOnboarding: () => void;
  checkOnboardingStatus: () => Promise<boolean>;
}

export function useOnboarding(): OnboardingActions {
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const completeOnboarding = async (data?: OnboardingData): Promise<void> => {
    DebugUtils.log('🎉 useOnboarding completeOnboarding called with data:', data);
    try {
      // Use provided data or default values
      const onboardingData = data || {
        age: 25,
        gender: 'male',
        height_cm: 175,
        current_weight_kg: 70,
        activity_level: 'moderate'
      };

      // Call backend API to complete onboarding
      const response = await api.post('/api/v1/health/onboarding/complete', onboardingData);

      DebugUtils.log('🎉 Backend onboarding completion response:', response);
      setNeedsOnboarding(false);
      DebugUtils.log('🎉 useOnboarding completeOnboarding completed - needsOnboarding set to false');
    } catch (error) {
      DebugUtils.error('🎉 useOnboarding completeOnboarding error:', error);
      // Still mark as completed locally to prevent infinite onboarding loop
      setNeedsOnboarding(false);
    }
  };

  const rerunOnboarding = (): void => {
    DebugUtils.log('🔄 useOnboarding rerunOnboarding called');
    setNeedsOnboarding(true);
    DebugUtils.log('🔄 useOnboarding rerunOnboarding completed - needsOnboarding set to true');
  };

  const checkOnboardingStatus = async (): Promise<boolean> => {
    try {
      const onboardingStatus = await api.get('/api/v1/health/onboarding/status');
      const completed = onboardingStatus.data.completed;
      
      if (__DEV__) {
        DebugUtils.log('🔍 Onboarding check - completed:', completed);
      }
      
      setNeedsOnboarding(!completed);
      return completed;
    } catch (error) {
      // Only log error if it's not a 401 (authentication error)
      if (error?.response?.status !== 401) {
        if (__DEV__) {
          DebugUtils.log('🔍 Onboarding check - error, defaulting to needed');
        }
      }
      // Default to needing onboarding if we can't check
      setNeedsOnboarding(true);
      return false;
    }
  };

  return {
    needsOnboarding,
    setNeedsOnboarding,
    completeOnboarding,
    rerunOnboarding,
    checkOnboardingStatus,
  };
}
