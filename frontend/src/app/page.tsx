'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HeartIcon, ChartBarIcon, UserIcon, SparklesIcon, ClockIcon, FireIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { PageLoading } from '@/components/ui/loading-states';
import { useEffect } from 'react';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Handle redirect to dashboard when authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while auth is initializing
  if (isLoading) {
    return <PageLoading className="min-h-[calc(100vh-64px)]" message="Loading..." />;
  }

  // If authenticated, show loading while redirecting
  if (isAuthenticated) {
    return <PageLoading className="min-h-[calc(100vh-64px)]" message="Redirecting to dashboard..." />;
  }

  // Landing page for unauthenticated users
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-green-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
              <HeartIcon className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Your Personal
            <span className="text-green-600 dark:text-green-400"> Health & Wellness</span>
            <br />AI Assistant - Hot Reload Test
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Track your fitness, nutrition, and mood with precision. Get AI-powered insights, 
            pattern recognition, and personalized coaching to transform your health journey.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link 
              href="/register"
              className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Start Your Health Journey
            </Link>
            <Link 
              href="/login"
              className="px-8 py-4 border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
            <div className="flex items-center mb-4">
              <FireIcon className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Fitness Tracking</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Log workouts, track progress, monitor calories burned, and get AI insights on your training patterns.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
            <div className="flex items-center mb-4">
              <BeakerIcon className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Nutrition Logging</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Track meals, monitor macros, log food items, and receive personalized nutrition recommendations.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
            <div className="flex items-center mb-4">
              <HeartIcon className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Mood & Wellness</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Monitor your mood, energy levels, and overall wellbeing with AI-powered pattern recognition.
            </p>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Log Your Health Data</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Track your fitness activities, nutrition intake, and mood through intuitive forms.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI Analysis & Insights</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our AI analyzes your data to identify patterns and provide personalized recommendations.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Achieve Your Goals</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get actionable insights and coaching to help you reach your health and wellness objectives.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-xl">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Transform Your Health Journey?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Join users who are achieving their health goals with AI-powered insights and personalized coaching.
          </p>
          <Link 
            href="/register"
            className="inline-block px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            Start Your Health Journey Today
          </Link>
        </div>
      </div>
    </div>
  );
}