'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function OnboardingContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');
  const [processedSummary, setProcessedSummary] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPrompt.trim()) return;

    setIsLoading(true);

    try {
      // Step 1: Send user prompt to LLM for processing
      // Temporarily use port 8001 to test the new backend with fixed database
      const processingResponse = await api.post('/memory/process-onboarding', {
        user_prompt: userPrompt
      });

      // Debug: Log the full response
      console.log('🔍 Full API Response:', processingResponse);
      console.log('🔍 Response data:', processingResponse.data);
      console.log('🔍 Summary field:', processingResponse.data?.summary);

      // Step 2: Get the processed summary
      // Fix: The API client returns data directly, not nested under .data
      const summary = processingResponse.summary || processingResponse.data?.summary;
      console.log('🔍 Final summary value:', summary);
      setProcessedSummary(summary);
      setShowSummary(true);

    } catch (error) {
      console.error('Failed to process onboarding prompt:', error);
      alert('Failed to process your onboarding prompt. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSummary = async () => {
    if (!processedSummary) return;

    setIsLoading(true);

    try {
      // Step 3: Save the processed onboarding data
      await api.put('/users/me/onboarding', {
        user_prompt: userPrompt,
        processed_summary: processedSummary,
        onboarding_complete: true
      });
      
      // Step 4: Mark onboarding as complete
      await api.post('/users/me/onboarding/complete');
      
      // Redirect to profile page
      router.push('/profile');
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      alert('Failed to save onboarding data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPrompt = () => {
    setShowSummary(false);
    setProcessedSummary(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to AI Companion! 🚀
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Tell me about yourself, your routines, goals, and preferences. Be as detailed as possible - 
            this helps me understand your patterns and provide personalized support.
          </p>
        </div>

        {!showSummary ? (
          // Step 1: User Input Form
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <span className="text-lg">📝 Your Comprehensive Introduction</span>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-normal">
                  Describe your daily routines, weekly habits, monthly activities, goals, preferences, 
                  communication style, and anything else that defines your lifestyle and needs.
                </p>
              </label>
              
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white resize-none"
                placeholder="Example: I'm a morning person who starts my day at 6 AM with coffee and planning. I go to the gym 3 times a week (Monday, Wednesday, Friday) in the evenings around 7 PM. I do grocery shopping every Saturday morning and meal prep on Sundays. I review my finances and goals at the end of each month. I prefer direct, encouraging communication and want to focus on building muscle, eating 150g protein daily, and improving my sleep quality. I'm most productive in the mornings and like to wind down with reading before bed around 10 PM..."
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">💡 Tips for Better Results:</h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Include specific times, frequencies, and patterns</li>
                <li>• Mention your goals and what you want to achieve</li>
                <li>• Describe your communication preferences</li>
                <li>• Share your daily routines and weekly habits</li>
                <li>• Mention any constraints or special requirements</li>
              </ul>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isLoading || !userPrompt.trim()}
                className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isLoading ? 'Processing...' : 'Process My Introduction'}
              </button>
            </div>
          </form>
        ) : (
          // Step 2: Show Processed Summary
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-600">✅</span>
                <span className="font-medium text-green-800 dark:text-green-200">
                  Your Introduction Processed Successfully!
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                I've analyzed your input and created a structured summary. Review it below and confirm if it captures everything correctly.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                📋 Processed Summary
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono">
                  {processedSummary}
                </pre>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={handleEditPrompt}
                disabled={isLoading}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Edit My Introduction
              </button>
              
              <button
                onClick={handleConfirmSummary}
                disabled={isLoading}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isLoading ? 'Saving...' : 'Confirm & Complete Onboarding'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
