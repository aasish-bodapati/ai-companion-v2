'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SimpleOnboarding } from '@/components/health/SimpleOnboarding';

export default function OnboardingPage() {
  const router = useRouter();

  const handleOnboardingComplete = () => {
    router.push('/dashboard');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        {/* Main Onboarding Content */}
        <div className="container mx-auto">
          <SimpleOnboarding onComplete={handleOnboardingComplete} />
        </div>
      </div>
    </ProtectedRoute>
  );
}