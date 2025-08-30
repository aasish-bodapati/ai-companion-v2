'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/today');
    }
  }, [isAuthenticated, isLoading, router]);

  // Ensure landing on home starts at top when not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] w-full flex flex-col items-center justify-center relative px-4 py-8 pb-16 sm:py-12">
      <div className="w-full max-w-screen-lg mx-auto px-4 sm:px-6 md:px-8 relative z-10">
        <div className="p-0 space-y-12">
          
          {/* Hero Section */}
          <div className="space-y-8 text-center">
            {/* Brand icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/20 shadow-inner p-3 mb-8 ring-2 ring-white/20 ring-inset">
              <svg 
                className="w-12 h-12 text-transparent" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <path 
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" 
                  fill="url(#iconGradient)"
                  className="opacity-30"
                />
                <path 
                  d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" 
                  fill="url(#iconGradient)"
                  className="opacity-90"
                />
                <path 
                  d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" 
                  fill="url(#iconGradient)"
                  className="opacity-100"
                />
              </svg>
            </div>
            
            <h1 className="text-6xl font-bold text-gray-900 dark:text-white tracking-tight">
              Your <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">9-5 Life</span> Companion
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 font-normal max-w-2xl mx-auto leading-relaxed">
              An AI that remembers your daily routines, tracks your progress, and helps you optimize your work-life balance, fitness, and nutrition for peak performance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity shadow-lg hover:shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 text-center flex-1 sm:flex-none text-lg"
              >
                Start Your 9-5 Journey
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-200 font-medium rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 text-center flex-1 sm:flex-none text-lg"
              >
                Welcome Back
              </Link>
            </div>
          </div>

          {/* 9-5 Workflow Section */}
          <div className="py-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
              Optimize Your 9-5 Life
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">🌅 Morning Routine Optimization</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">AI remembers your 4:30 AM wake-up, 5:00-6:30 AM workouts, and breakfast preferences. Suggests optimizations based on your energy patterns.</p>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Example:</span> "Your energy peaks 5-7 AM. Want to move your workout to 5:30 AM for better performance?"
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">💪 Workout & Progress Tracking</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Log your weights, reps, and progress. AI remembers your routines and suggests improvements based on your goals.</p>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Example:</span> "Same as last week? I'll log your usual routine. Any changes to note?"
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">🥗 Nutrition & Meal Planning</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Track your 2500 calories, 150g protein goals. AI remembers your meal preferences and helps adjust when you eat out.</p>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Example:</span> "You skipped lunch today. Want to adjust dinner to meet your protein goals?"
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">📅 Smart Calendar Integration</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">AI automatically schedules your routines, considers your energy patterns, and adapts when life changes.</p>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Example:</span> "You're most focused 9-11 AM. Should I block that time for your presentation prep?"
                </div>
              </div>
            </div>
          </div>

          {/* Value Proposition */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Remembers Everything</h3>
              <p className="text-gray-600 dark:text-gray-400">Your workout routines, meal preferences, energy patterns, and life goals. Never repeat yourself again.</p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Proactive & Intelligent</h3>
              <p className="text-gray-600 dark:text-gray-400">Suggests workout improvements, nutrition adjustments, and schedule optimizations based on your patterns.</p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">9-5 Life Management</h3>
              <p className="text-gray-600 dark:text-gray-400">Holistic approach to work-life balance. Optimize your routines, track progress, and achieve your goals.</p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="pt-8 border-t border-gray-200 dark:border-gray-700 mt-8">
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
              Everything You Need for 9-5 Life Optimization
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Memory Center</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">See everything your AI knows about your routines, preferences, and goals</p>
              </div>
              
              <div className="space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Smart Calendar</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Intelligent scheduling that considers your energy patterns and routines</p>
              </div>
              
              <div className="space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Progress Tracking</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Monitor your workouts, nutrition, and life improvements over time</p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Optimize Your 9-5 Life?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Join users who are building better routines, achieving their fitness goals, and living more intentional lives.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity shadow-lg hover:shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 text-lg"
            >
              Start Your 9-5 Life Optimization
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}