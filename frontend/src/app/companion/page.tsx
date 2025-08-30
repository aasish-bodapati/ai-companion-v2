'use client';

import { useEffect, useRef, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useConversations, useCreateConversation } from '@/features/conversations/api';
import { useQuery } from '@tanstack/react-query';
import { fetchMyOnboarding } from '@/features/onboarding/api';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { memoryContextService, type MemoryContextData } from '@/services/memoryContextService';

// Companion welcome component with personalized insights using real data
function CompanionWelcome({ onboarding }: any) {
  const [memoryData, setMemoryData] = useState<MemoryContextData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime] = useState(new Date());
  const hour = currentTime.getHours();
  
  useEffect(() => {
    const fetchMemoryContext = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await memoryContextService.getMemoryContext();
        setMemoryData(data);
      } catch (err) {
        console.error('Failed to fetch memory context:', err);
        setError('Failed to load personalized insights');
      } finally {
        setLoading(false);
      }
    };

    fetchMemoryContext();
  }, []);

  const getTimeBasedGreeting = () => {
    if (hour >= 5 && hour < 12) {
      return {
        greeting: "Good morning! Ready to crush your day?",
        icon: "🌅",
        color: "from-yellow-400 to-orange-500",
        message: memoryData ? `Your ${memoryData.userProfile.wakeUpTime} wake-up routine is setting you up for success today.` : "Your early morning routine is setting you up for success today."
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        greeting: "Good afternoon! How's your day going?",
        icon: "☀️",
        color: "from-orange-400 to-red-500",
        message: "Perfect time to check in on your nutrition and energy levels."
      };
    } else if (hour >= 17 && hour < 21) {
      return {
        greeting: "Good evening! Time to wind down and reflect.",
        icon: "🌆",
        color: "from-purple-400 to-pink-500",
        message: memoryData ? `Great time to plan tomorrow and reflect on today's achievements.` : "Great time to plan tomorrow and reflect on today's achievements."
      };
    } else {
      return {
        greeting: "Late night! Don't forget to get some rest.",
        icon: "🌙",
        color: "from-blue-400 to-indigo-500",
        message: memoryData ? `Remember your ${memoryData.userProfile.bedtime} bedtime goal for optimal recovery.` : "Remember your bedtime goal for optimal recovery."
      };
    }
  };

  const timeInfo = getTimeBasedGreeting();

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Loading Hero */}
        <div className="text-center py-12 px-6 rounded-2xl bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse">
          <div className="h-16 w-16 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4"></div>
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-4 w-3/4 mx-auto"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mx-auto"></div>
        </div>

        {/* Loading Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 text-center animate-pulse">
              <div className="h-12 w-12 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-2"></div>
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-20 mx-auto"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mx-auto"></div>
            </Card>
          ))}
        </div>

        {/* Loading Content */}
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-4 w-1/3"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !memoryData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Error Hero */}
        <div className="text-center py-12 px-6 rounded-2xl bg-gradient-to-r from-red-200 to-red-300 dark:from-red-800 dark:to-red-900">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-4xl font-bold mb-4 text-red-800 dark:text-red-200">Unable to Load Insights</h1>
          <p className="text-xl opacity-90 text-red-700 dark:text-red-300">
            We're having trouble loading your personalized data. Please try again.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Welcome */}
      <div className={`text-center py-12 px-6 rounded-2xl bg-gradient-to-r ${timeInfo.color} text-white`}>
        <div className="text-6xl mb-4">{timeInfo.icon}</div>
        <h1 className="text-4xl font-bold mb-4">{timeInfo.greeting}</h1>
        <p className="text-xl opacity-90">{timeInfo.message}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 text-center">
          <div className="text-3xl mb-2">💪</div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{memoryData.userProfile.workoutTime}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Workout Time</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl mb-2">🥗</div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{memoryData.goals.protein.target}g</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Protein Goal</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl mb-2">🌅</div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{memoryData.userProfile.wakeUpTime}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Wake-up Time</div>
        </Card>
      </div>

      {/* What I Remember About You */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">What I Remember About You</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Daily Routine</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• {memoryData.userProfile.wakeUpTime} wake-up (consistent)</li>
              <li>• {memoryData.userProfile.workoutTime}-6:30 AM workout (Mon-Sat)</li>
              <li>• 8:00 AM breakfast with 4 eggs + protein shake</li>
              <li>• 9:30 AM commute to work</li>
              <li>• {memoryData.userProfile.bedtime} bedtime goal</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Preferences & Goals</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Target: {memoryData.goals.calories.target} calories, {memoryData.goals.protein.target}g protein</li>
              <li>• Energy peaks: 5-7 AM (perfect for workouts)</li>
              <li>• Focus time: 9-11 AM (best for important tasks)</li>
              <li>• Evening: App development + short walk</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Today's Focus */}
      <Card className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-200 dark:border-indigo-800">
        <h2 className="text-xl font-semibold text-indigo-800 dark:text-indigo-200 mb-4">Today's Focus</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💪</span>
            <div>
              <div className="font-medium text-indigo-800 dark:text-indigo-200">Morning Workout</div>
              <div className="text-sm text-indigo-600 dark:text-indigo-300">You're most energetic 5-7 AM. Perfect timing!</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🥗</span>
            <div>
              <div className="font-medium text-indigo-800 dark:text-indigo-200">Nutrition Tracking</div>
              <div className="text-sm text-indigo-600 dark:text-indigo-300">Log your meals to hit your {memoryData.goals.protein.target}g protein goal</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📱</span>
            <div>
              <div className="font-medium text-indigo-800 dark:text-indigo-200">Evening Planning</div>
              <div className="text-sm text-indigo-600 dark:text-indigo-300">Time before bed for app development + walk</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/chat" className="block">
          <Card className="p-6 hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-300">
            <div className="text-center">
              <div className="text-4xl mb-3">💬</div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Start Chatting</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tell me about your day, ask for advice, or just chat</p>
            </div>
          </Card>
        </Link>
        
        <Link href="/today" className="block">
          <Card className="p-6 hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-300">
            <div className="text-center">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">View Dashboard</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Check your progress, habits, and daily routine</p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Insights */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Recent Insights</h2>
        <div className="space-y-3">
          {memoryData.insights.map((insight, index) => (
            <div key={index} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
              <div className="text-sm text-green-800 dark:text-green-200">
                {insight}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function CompanionPageContent() {
  const router = useRouter();
  const search = useSearchParams();
  const prompt = (search?.get('prompt') || '').trim();
  const { data: conversations, isLoading: conversationsLoading } = useConversations();
  const { mutate: createConversation, isPending: isCreating } = useCreateConversation();
  const creationStartedRef = useRef(false);
  
  // Check onboarding status
  const { data: onboarding, isLoading: onboardingLoading } = useQuery({
    queryKey: ['onboarding:me'],
    queryFn: fetchMyOnboarding,
  });

  useEffect(() => {
    console.log('Companion useEffect triggered:', {
      onboardingLoading,
      conversationsLoading,
      isCreating,
      conversationsCount: conversations?.length,
      creationStarted: creationStartedRef.current
    });

    // Wait for both onboarding and conversations to load
    if (onboardingLoading || conversationsLoading) {
      console.log('Companion: Still loading onboarding or conversations, returning early');
      return;
    }

    // TEMPORARY BYPASS: Skip onboarding check for testing
    // if (!onboarding?.completed) {
    //   router.replace('/onboarding');
    //   return;
    // }

    // Onboarding completed - proceed to chat
    // Prefer the most recent conversation if it exists
    if (conversations && conversations.length > 0) {
      console.log('Companion: Found existing conversations, redirecting to first one:', conversations[0].id);
      const q = prompt ? `?prompt=${encodeURIComponent(prompt)}` : '';
      router.replace(`/chat/${conversations[0].id}${q}`);
      return;
    }

    // No existing conversations - create a new one (but only if not already creating)
    if (isCreating) {
      console.log('Companion: Already creating conversation, waiting...');
      return;
    }

    // Guard against double invocation in StrictMode
    if (creationStartedRef.current) {
      console.log('Companion: Conversation creation already started, skipping');
      return;
    }
    
    console.log('Companion: No existing conversations, creating new one');
    creationStartedRef.current = true;
    createConversation(
      { title: undefined },
      {
        onSuccess: (data) => {
          console.log('Companion: Conversation created successfully:', data.id);
          const q = prompt ? `?prompt=${encodeURIComponent(prompt)}` : '';
          router.replace(`/chat/${data.id}${q}`);
        },
        onError: (error) => {
          console.error('Companion: Conversation creation failed:', error);
          // allow retry on next render if it failed
          creationStartedRef.current = false;
        },
      }
    );
  }, [onboarding, onboardingLoading, conversations, conversationsLoading, isCreating, createConversation, router, prompt]);

  // Show loading state while checking onboarding and conversations
  if (onboardingLoading || conversationsLoading) {
    console.log('Companion: Showing loading state - onboardingLoading:', onboardingLoading, 'conversationsLoading:', conversationsLoading);
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center bg-white/80 dark:bg-gray-900/60 backdrop-blur-md rounded-xl px-6 py-5 shadow-glow border border-indigo-100/60 dark:border-indigo-900/30">
          <div className="flex items-center justify-center gap-2 text-indigo-700 dark:text-indigo-300">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
            <div className="font-medium">Loading your companion…</div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Checking your preferences</div>
        </div>
      </div>
    );
  }

  // Show loading state while creating conversation
  if (isCreating) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center bg-white/80 dark:bg-gray-900/60 backdrop-blur-md rounded-xl px-6 py-5 shadow-glow border border-indigo-100/60 dark:border-indigo-900/30">
          <div className="flex items-center justify-center gap-2 text-indigo-700 dark:text-indigo-300">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
            <div className="font-medium">Setting up your conversation…</div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Creating a new chat session</div>
        </div>
      </div>
    );
  }

  // Show the companion welcome page
  return (
    <div className="min-h-[calc(100vh-4rem)] w-full px-4 py-6 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center text-white text-lg font-bold">
              AI
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your AI Companion</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Personalized insights and guidance</p>
            </div>
          </div>
        </header>
        
        <CompanionWelcome onboarding={onboarding} />
      </div>
    </div>
  );
}

export default function CompanionPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading companion...</p>
        </div>
      </div>
    }>
      <CompanionPageContent />
    </Suspense>
  );
}


