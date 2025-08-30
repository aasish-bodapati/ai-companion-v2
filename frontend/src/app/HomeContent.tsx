'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function HomeContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/chat');
    }
  }, [isAuthenticated, isLoading, router]);

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
    <div className="min-h-[calc(100vh-64px)] w-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-[#0f0f10] dark:via-[#141416] dark:to-[#0f0f10] relative overflow-hidden px-4 py-8 pb-16 sm:py-12">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-full h-full bg-gradient-radial from-indigo-100 to-transparent opacity-30 dark:from-indigo-900/20 dark:to-transparent" />
        <div className="absolute -bottom-1/2 -left-1/4 w-full h-full bg-gradient-radial from-blue-100 to-transparent opacity-30 dark:from-blue-900/20 dark:to-transparent" />
      </div>

      <div className="w-full max-w-screen-md mx-auto px-4 sm:px-6 md:px-8 relative z-10">
        <div className="bg-white/95 dark:bg-gradient-to-br dark:from-gray-800/95 dark:to-gray-900/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 space-y-8 border border-gray-100/70 dark:border-gray-700/50">
          <div className="space-y-6 text-center">
            {/* Brand icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/20 shadow-inner p-2.5 mb-6 ring-2 ring-white/20 ring-inset">
              <svg 
                className="w-9 h-9 text-transparent" 
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
            
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
              Welcome to <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">AI Companion</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 font-normal max-w-md mx-auto leading-relaxed">
              Your personal AI assistant powered by state-of-the-art language models.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity shadow-lg hover:shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 text-center"
            >
              Get Started
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 text-center"
            >
              Create Account
            </Link>
          </div>

          <div className="pt-8 border-t border-gray-100 dark:border-gray-800 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white">Lightning Fast</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Instant responses powered by AI</p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white">Secure & Private</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your data stays yours</p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white">Always Available</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">24/7 assistance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
