'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMyOnboarding, saveMyOnboarding } from '@/features/onboarding/api';
import type { OnboardingProfileIn } from '@/features/onboarding/types';

interface OnboardingPreferencesProps {
  className?: string;
}

export default function OnboardingPreferences({ className = '' }: OnboardingPreferencesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<OnboardingProfileIn>({});
  const [error, setError] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error: queryError } = useQuery({
    queryKey: ['onboarding'],
    queryFn: async () => {
      console.log('🔍 OnboardingPreferences: Fetching onboarding data...');
      const result = await fetchMyOnboarding();
      console.log('🔍 OnboardingPreferences: API result:', result);
      // Ensure we never return undefined
      return result === undefined ? null : result;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (profile && typeof profile === 'object') {
      console.log('🔍 OnboardingPreferences: Received profile data:', profile);
      setFormData({
        user_prompt: profile.user_prompt || '',
        processed_summary: profile.processed_summary || '',
        memory_chunks: Array.isArray(profile.memory_chunks) ? profile.memory_chunks : [],
        structured_data: profile.structured_data && typeof profile.structured_data === 'object' ? profile.structured_data : {},
        daily_schedule: profile.daily_schedule || '',
        schedule_preferences: profile.schedule_preferences || '',
        fitness_goals: profile.fitness_goals || '',
        nutrition_goals: profile.nutrition_goals || '',
        dietary_preferences: profile.dietary_preferences || '',
        communication_style: profile.communication_style || '',
        additional_preferences: profile.additional_preferences || '',
        user_blueprint: profile.user_blueprint || '',
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      await saveMyOnboarding(formData);
      await queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      setIsEditing(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original profile
    if (profile && typeof profile === 'object') {
      setFormData({
        user_prompt: profile.user_prompt || '',
        processed_summary: profile.processed_summary || '',
        memory_chunks: Array.isArray(profile.memory_chunks) ? profile.memory_chunks : [],
        structured_data: profile.structured_data && typeof profile.structured_data === 'object' ? profile.structured_data : {},
        daily_schedule: profile.daily_schedule || '',
        schedule_preferences: profile.schedule_preferences || '',
        fitness_goals: profile.fitness_goals || '',
        nutrition_goals: profile.nutrition_goals || '',
        dietary_preferences: profile.dietary_preferences || '',
        communication_style: profile.communication_style || '',
        additional_preferences: profile.additional_preferences || '',
        user_blueprint: profile.user_blueprint || '',
      });
    }
    setIsEditing(false);
    setError(null);
  };

  // Helper function to extract structured data from processed summary
  const extractStructuredData = (processedSummary: string) => {
    try {
      // Look for JSON-like content in the processed summary
      const jsonMatch = processedSummary.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.log('Could not parse structured data from summary');
    }
    return null;
  };

  // Helper function to extract daily routine from user prompt
  const extractDailyRoutine = (userPrompt: string) => {
    if (!userPrompt) return [];
    
    const lines = userPrompt.split('\n');
    const routine = [];
    
    for (const line of lines) {
      const timeMatch = line.match(/\*\*(\d{1,2}:\d{2}\s*[AP]M)\*\*/);
      if (timeMatch) {
        const time = timeMatch[1];
        const activity = line.replace(/\*\*\d{1,2}:\d{2}\s*[AP]M\*\*/, '').replace(/^[\s\-]+/, '').trim();
        if (activity) {
          routine.push({ time, activity });
        }
      }
    }
    
    return routine.sort((a, b) => {
      const timeA = new Date(`2000-01-01 ${a.time}`);
      const timeB = new Date(`2000-01-01 ${b.time}`);
      return timeA.getTime() - timeB.getTime();
    });
  };

  if (isLoading) {
    return (
      <div className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50 ${className}`}>
        <div className="p-6 text-center">
          <div className="text-red-500 dark:text-red-400">
            <p className="mb-2">Failed to load onboarding profile.</p>
            <p className="text-sm">Please try refreshing the page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile || typeof profile !== 'object') {
    return (
      <div className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50 ${className}`}>
        <div className="p-6 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <p className="mb-2">No onboarding profile found.</p>
            <p className="text-sm">Complete your onboarding first to see your personalized preferences here.</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if profile has meaningful content (either completed flag or actual data)
  const hasContent = profile.completed || 
                    profile.user_prompt || 
                    profile.processed_summary || 
                    profile.daily_schedule || 
                    profile.fitness_goals;

  if (!hasContent) {
    return (
      <div className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50 ${className}`}>
        <div className="p-6 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <p className="mb-2">Onboarding profile found but appears to be empty.</p>
            <p className="text-sm">Complete your onboarding to see your personalized preferences here.</p>
          </div>
        </div>
      </div>
    );
  }

  const dailyRoutine = extractDailyRoutine(profile.user_prompt || '');
  const structuredData = extractStructuredData(profile.processed_summary || '');

  return (
    <div className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50 ${className}`}>
      <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Onboarding Preferences</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Your personalized preferences and settings from onboarding
          </p>
        </div>
        <div className="flex space-x-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              Edit Preferences
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-4 mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Daily Routine Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Routine</h4>
            </div>
            
            {dailyRoutine.length > 0 ? (
              <div className="space-y-3">
                {dailyRoutine.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-20 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                      {item.time}
                    </div>
                    <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                      {item.activity}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No daily routine specified</p>
            )}
          </div>

          {/* Health & Fitness Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Health & Fitness</h4>
            </div>
            
            <div className="space-y-4">
              {/* Workout Frequency */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Workout Frequency</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">6/7 days</span>
                </div>
              </div>
              
              {/* Meal Consistency */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Meal Consistency</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">5/5 meals</span>
                </div>
              </div>
              
              {/* Sleep Schedule */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Sleep Schedule</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">4:30 AM - 9:30 PM</span>
              </div>
            </div>
          </div>

          {/* Nutrition Overview Card */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Nutrition Overview</h4>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">High protein breakfast (eggs + protein shake)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Balanced lunch (rice + curry + greens)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Daily fruit salad for vitamins</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Supplements: D3+K2, fish oil</span>
              </div>
            </div>
          </div>

          {/* Goals & Insights Card */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Goals & Insights</h4>
            </div>
            
            <div className="space-y-3">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                <h5 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">Primary Focus</h5>
                <p className="text-sm text-gray-700 dark:text-gray-300">Health, fitness, and balanced nutrition</p>
              </div>
              
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                <h5 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">Key Strength</h5>
                <p className="text-sm text-gray-700 dark:text-gray-300">Consistent 6-day workout routine</p>
              </div>
              
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                <h5 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">Recommendation</h5>
                <p className="text-sm text-gray-700 dark:text-gray-300">Consider adding monthly goal tracking</p>
              </div>
            </div>
          </div>
        </div>

        {/* Raw Data Section (Collapsible) */}
        <div className="mt-8">
          <details className="group">
            <summary className="flex items-center cursor-pointer text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              <svg className="w-4 h-4 mr-2 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Show Raw Data (for editing)
            </summary>
            <div className="mt-4 space-y-4">
              {/* User Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  User Prompt
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.user_prompt || ''}
                    onChange={(e) => handleInputChange('user_prompt', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {profile.user_prompt || 'Not specified'}
                    </p>
                  </div>
                )}
              </div>

              {/* Processed Summary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Processed Summary
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.processed_summary || ''}
                    onChange={(e) => handleInputChange('processed_summary', e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {profile.processed_summary || 'Not specified'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

