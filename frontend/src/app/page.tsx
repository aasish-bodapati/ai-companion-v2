'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const [onboardingStatus, setOnboardingStatus] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);

  // Check onboarding status when authenticated
  useEffect(() => {
    if (isAuthenticated && !checkingOnboarding) {
      setCheckingOnboarding(true);
      api.get('/onboarding/status')
        .then(response => {
          setOnboardingStatus(response.completed);
        })
        .catch(error => {
          console.error('Failed to check onboarding status:', error);
          setOnboardingStatus(false); // Default to not completed on error
        })
        .finally(() => {
          setCheckingOnboarding(false);
        });
    }
  }, [isAuthenticated, checkingOnboarding]);

  // Show loading while auth is initializing or checking onboarding
  if (isLoading || (isAuthenticated && onboardingStatus === null)) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // If authenticated, redirect based on onboarding status
  if (typeof window !== 'undefined') {
    if (onboardingStatus === false) {
      window.location.href = '/onboarding';
    } else {
      window.location.href = '/chat';
    }
  }
  
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <p className="text-gray-600 dark:text-gray-400">
          {onboardingStatus === false ? 'Redirecting to onboarding...' : 'Redirecting to chat...'}
        </p>
      </div>
    </div>
  );
}