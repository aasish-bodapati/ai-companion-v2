'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ImprovedOnboarding } from '@/components/health/ImprovedOnboarding';
import { OnboardingTest } from '@/components/health/OnboardingTest';
import { PageLoading } from '@/components/ui/loading-states';

export default function OnboardingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleOnboardingComplete = () => {
    setOnboardingCompleted(true);
    // Redirect to dashboard after a short delay
    setTimeout(() => {
      router.replace('/dashboard');
    }, 1500);
  };

  // Show loading while auth is initializing
  if (isLoading) {
    return <PageLoading className="min-h-screen" message="Loading..." />;
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <PageLoading className="min-h-screen" message="Redirecting to login..." />;
  }

  // Show success message if onboarding was just completed
  if (onboardingCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to your health journey!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <ImprovedOnboarding onComplete={handleOnboardingComplete} />
    </div>
  );
}
