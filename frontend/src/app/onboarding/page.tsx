'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/services/apiClient';

export default function OnboardingPage() {
  const [briefing, setBriefing] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!briefing.trim()) return;

    setIsSubmitting(true);
    try {
      // Process the briefing through the backend
      const response = await apiClient.post('/onboarding/process-briefing', {
        briefing: briefing.trim()
      });

      if ((response.data as any).success) {
        // Redirect to chat to test the memory
        router.push('/chat');
      } else {
        console.error('Failed to process briefing:', (response.data as any).error);
      }
    } catch (error) {
      console.error('Error processing briefing:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to Your AI Companion
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Tell me about yourself so I can help you better
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="briefing" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Life Briefing
              </label>
              <Textarea
                id="briefing"
                value={briefing}
                onChange={(e) => setBriefing(e.target.value)}
                placeholder="I wake up at 7, I like running, I don't eat beef, I want to work on focus..."
                className="min-h-[200px] resize-none"
                required
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Share your daily routines, preferences, goals, and anything else that would help me understand you better.
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!briefing.trim() || isSubmitting}
                className="px-8 py-2"
              >
                {isSubmitting ? 'Processing...' : 'Continue to Chat'}
              </Button>
            </div>
          </form>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Example Briefing:
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              &ldquo;I wake up at 7 AM every day and start with a 30-minute run. I&apos;m a software engineer who works from home. 
              I don&apos;t eat beef or pork, and I&apos;m trying to focus better by reducing social media. I have a dog named Max 
              and I love reading sci-fi books in the evening.&rdquo;
            </p>
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  );
}