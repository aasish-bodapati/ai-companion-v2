'use client';

import { useAuth } from '@/contexts/AuthContext';
import TodayPage from './today/page';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading while auth is initializing
  if (isLoading) {
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
    // Use window.location for immediate redirect
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

  // If authenticated, redirect directly to chat page
  if (typeof window !== 'undefined') {
    window.location.href = '/chat';
  }
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecting to chat...</p>
      </div>
    </div>
  );
}