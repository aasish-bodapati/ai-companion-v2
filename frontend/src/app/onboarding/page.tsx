'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';

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
      const response = await api.post('/onboarding/process-briefing', {
        briefing: briefing.trim()
      });

      if (response.success) {
        // Redirect to chat to test the memory
        router.push('/chat');
      } else {
        console.error('Failed to process briefing:', response.error);
      }
    } catch (error) {
      console.error('Error processing briefing:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Let&apos;s Get Personal
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-200 mb-4">
              Share a bit about yourself so I can give you personalized advice
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Why this matters:</strong> The more I know about your routines, preferences, and goals, 
                the better I can help you with personalized suggestions and remember important details.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="briefing" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                Tell me about yourself
              </label>
              <Textarea
                id="briefing"
                value={briefing}
                onChange={(e) => setBriefing(e.target.value)}
                placeholder="I wake up at 7 AM and go for a run. I'm a software engineer who works from home. I don't eat meat, and I'm trying to reduce my social media usage. I have a dog named Max and love reading sci-fi books..."
                className="min-h-[200px] resize-none"
                required
              />
              <div className="mt-3 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                <span>Share your routines, preferences, goals, and what makes you unique</span>
                <span className="text-gray-400">{briefing.length}/500</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                This takes about 30 seconds to process
              </div>
              <Button
                type="submit"
                disabled={!briefing.trim() || isSubmitting}
                className="px-8 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing your info...
                  </div>
                ) : (
                  'Start Chatting'
                )}
              </Button>
            </div>
          </form>

          <div className="mt-8 p-4 bg-blue-50/80 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800/50">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Example Briefing:
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 italic leading-relaxed">
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