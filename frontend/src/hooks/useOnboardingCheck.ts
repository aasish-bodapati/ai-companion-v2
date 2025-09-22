import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface UseOnboardingCheckOptions {
  redirectOnIncomplete?: boolean;
  redirectOnError?: boolean;
}

export function useOnboardingCheck(options: UseOnboardingCheckOptions = {}) {
  const { isAuthenticated } = useAuth();
  const [onboardingStatus, setOnboardingStatus] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);

  const {
    redirectOnIncomplete = true,
    redirectOnError = true
  } = options;

  const checkOnboarding = async (force = false) => {
    if (!isAuthenticated || isChecking) {
      return;
    }

    // Debounce: don't check more than once every 5 seconds unless forced
    const now = Date.now();
    if (!force && now - lastCheckRef.current < 5000) {
      return;
    }

    setIsChecking(true);
    lastCheckRef.current = now;

    try {
      const response = await api.get('/health/onboarding/status');
      setOnboardingStatus(response.completed);
      
      if (!response.completed && redirectOnIncomplete) {
        // Use window.location for redirect to avoid hook issues
        if (typeof window !== 'undefined') {
          window.location.href = '/onboarding';
        }
      }
    } catch (error: any) {
      console.error('Failed to check onboarding status:', error);
      
      // Don't retry on auth errors - let the auth system handle it
      if (error?.status === 401 || error?.status === 403) {
        setOnboardingStatus(null);
        return;
      }
      
      setOnboardingStatus(false);
      
      if (redirectOnError) {
        // Use window.location for redirect to avoid hook issues
        if (typeof window !== 'undefined') {
          window.location.href = '/onboarding';
        }
      }
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      checkOnboarding();
    } else {
      setOnboardingStatus(null);
    }
  }, [isAuthenticated]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  return {
    onboardingStatus,
    isChecking,
    checkOnboarding: () => checkOnboarding(true)
  };
}
