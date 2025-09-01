'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { memoryContextService } from '@/services/memoryContextService';

interface OnboardingCheckProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function OnboardingCheck({ 
  children, 
  redirectTo = '/onboarding' 
}: OnboardingCheckProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [hasOnboarding, setHasOnboarding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const hasCompleted = await memoryContextService.hasCompletedOnboarding();
        setHasOnboarding(hasCompleted);
        
        if (!hasCompleted) {
          console.log('User has not completed onboarding, redirecting...');
          router.push(redirectTo);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // On error, assume onboarding is incomplete
        router.push(redirectTo);
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboarding();
  }, [router, redirectTo]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking onboarding status...</p>
        </div>
      </div>
    );
  }

  // Only render children if user has completed onboarding
  return hasOnboarding ? <>{children}</> : null;
}
