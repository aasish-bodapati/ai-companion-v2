"use client";

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMyOnboarding, saveMyOnboarding } from './api';
import type { OnboardingProfileIn, ResponseStyle, MemoryPolicy } from './types';

interface OnboardingWizardProps {
  mode?: 'onboarding' | 'preferences';
}

export default function OnboardingWizard({ mode = 'onboarding' }: OnboardingWizardProps) {
  const [formData, setFormData] = useState<OnboardingProfileIn>({});
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['onboarding'],
    queryFn: fetchMyOnboarding,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        nickname: profile.nickname || '',
        pronouns: profile.pronouns || '',
        location: profile.location || '',
        topics: profile.topics || '',
        primaryReason: profile.primaryReason || '',
        communication: {
          responseStyle: profile.communication?.responseStyle || undefined,
        },
        boundaries: {
          memoryPolicy: profile.boundaries?.memoryPolicy || undefined,
        },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await saveMyOnboarding(formData);
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      // Show success message or redirect
    } catch (error) {
      console.error('Failed to save onboarding profile:', error);
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedChange = (parent: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof OnboardingProfileIn],
        [field]: value,
      },
    }));
  };

  if (isLoading) {
    return <div className="flex justify-center items-center p-8">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === 'preferences' ? 'Profile Preferences' : 'Onboarding Profile'}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {mode === 'preferences' 
              ? 'Customize your profile and preferences' 
              : 'Tell us about yourself to personalize your experience'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nickname
              </label>
              <input
                type="text"
                value={formData.nickname || ''}
                onChange={(e) => handleInputChange('nickname', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Pronouns
              </label>
              <input
                type="text"
                value={formData.pronouns || ''}
                onChange={(e) => handleInputChange('pronouns', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., she/her, he/him, they/them"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Location
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="City, Country"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Topics of Interest
              </label>
              <input
                type="text"
                value={formData.topics || ''}
                onChange={(e) => handleInputChange('topics', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="AI, startups, design"
              />
            </div>
          </div>

          {/* Communication Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Response Style
              </label>
              <select
                value={formData.communication?.responseStyle || ''}
                onChange={(e) => handleNestedChange('communication', 'responseStyle', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">—</option>
                <option value="Concise">Concise</option>
                <option value="Detailed">Detailed</option>
                <option value="Balanced">Balanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Memory Policy
              </label>
              <select
                value={formData.boundaries?.memoryPolicy || ''}
                onChange={(e) => handleNestedChange('boundaries', 'memoryPolicy', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">—</option>
                <option value="RememberAll">Remember All</option>
                <option value="ImportantOnly">Important Only</option>
                <option value="NoMemory">No Memory</option>
              </select>
            </div>
          </div>

          {/* Personal Assistant Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Daily Schedule
              </label>
              <input
                type="text"
                value={formData.daily_schedule || ''}
                onChange={(e) => handleInputChange('daily_schedule', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., 9-5 work, evening workouts"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fitness Goals
              </label>
              <input
                type="text"
                value={formData.fitness_goals || ''}
                onChange={(e) => handleInputChange('fitness_goals', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., build strength, lose weight"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nutrition Goals
              </label>
              <input
                type="text"
                value={formData.nutrition_goals || ''}
                onChange={(e) => handleInputChange('nutrition_goals', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., eat more protein, reduce sugar"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Communication Style
              </label>
              <input
                type="text"
                value={formData.communication_style || ''}
                onChange={(e) => handleInputChange('communication_style', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., direct, encouraging, casual"
              />
            </div>
          </div>

          {/* Additional Preferences */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Additional Preferences
            </label>
            <textarea
              value={formData.additional_preferences || ''}
              onChange={(e) => handleInputChange('additional_preferences', e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Any other preferences or requirements..."
            />
          </div>

          {/* Enhanced User Blueprint */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mr-3">
                <span className="text-blue-600 dark:text-blue-400 text-lg">🗿</span>
              </div>
              <div>
                <label className="block text-lg font-semibold text-blue-900 dark:text-blue-100">
                  Your Life Blueprint
                </label>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  The foundation of your AI companion's understanding
                </p>
              </div>
            </div>

            <div className="mb-4 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 dark:text-blue-400 text-lg">💡</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Think of this as briefing your new personal assistant
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    Describe your life comprehensively - your daily routines, fitness and nutrition habits, 
                    work schedule, goals, challenges, and preferences. This becomes the core of my memory about you.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded border border-green-200 dark:border-green-700">
                      <h4 className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">✅ Include:</h4>
                      <ul className="text-xs text-green-700 dark:text-green-300 space-y-0.5">
                        <li>• Daily schedule (wake up, work, meals, sleep)</li>
                        <li>• Fitness routine & goals</li>
                        <li>• Nutrition habits & targets</li>
                        <li>• Work patterns & preferences</li>
                        <li>• Personal challenges & pain points</li>
                      </ul>
                    </div>
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded border border-amber-200 dark:border-amber-700">
                      <h4 className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">💭 Consider:</h4>
                      <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-0.5">
                        <li>• What motivates you?</li>
                        <li>• When do you need support?</li>
                        <li>• How do you prefer feedback?</li>
                        <li>• What disrupts your routine?</li>
                        <li>• What's your ideal outcome?</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <textarea
              value={formData.user_blueprint || ''}
              onChange={(e) => handleInputChange('user_blueprint', e.target.value)}
              rows={12}
              className="w-full px-4 py-3 border border-blue-300 dark:border-blue-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800/80 dark:text-white resize-none"
              placeholder={`Example blueprint:

"I wake up at 4:30 AM and work out from 5-6:30 AM Monday through Saturday. My breakfast is always 4 boiled eggs, salad, and a protein shake with 27g protein powder, 250ml milk, 1 banana, and 2 tbsp peanut butter. I take D3+K2 and fish oil supplements.

I work 10:30 AM to 6:30 PM, with a carrot snack at noon and lunch at 2 PM (2 cups rice with curry). I get fruit salad at 4 PM. Dinner is 250g air-fried chicken with salad at 8 PM. Evenings are for app development and short walks. I'm in bed by 9:30 PM.

My goals: Build muscle, maintain 2500 calories with 150g protein daily, and develop my AI companion app. I struggle with consistency when my routine gets disrupted. I prefer direct communication and want help tracking fitness progress, nutrition goals, and staying motivated with development work.

I need support with: Workout progression (like 'increased squats by 2.5kg'), meal timing when eating out, and motivation during busy periods. I like data-driven insights and celebrate small wins."`}
            />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                💎 The more detailed you are, the better I can support your journey
              </p>
              <span className="text-sm text-blue-500 dark:text-blue-400">
                {formData.user_blueprint?.length || 0} characters
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
