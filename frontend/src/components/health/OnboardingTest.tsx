'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckIcon } from '@heroicons/react/24/outline';

const GOAL_OPTIONS = [
  { value: 'lose_weight', label: 'Lose Weight', icon: '📉', description: 'Create a calorie deficit' },
  { value: 'gain_weight', label: 'Gain Weight', icon: '📈', description: 'Build muscle and mass' },
  { value: 'maintain_weight', label: 'Maintain Weight', icon: '⚖️', description: 'Stay at current weight' },
  { value: 'build_muscle', label: 'Build Muscle', icon: '💪', description: 'Focus on strength training' },
  { value: 'improve_fitness', label: 'Improve Fitness', icon: '🏃', description: 'Get more active' },
  { value: 'general_health', label: 'General Health', icon: '❤️', description: 'Overall wellness' }
];

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
  { value: 'light', label: 'Light', description: 'Light exercise 1-3 days/week' },
  { value: 'moderate', label: 'Moderate', description: 'Moderate exercise 3-5 days/week' },
  { value: 'active', label: 'Active', description: 'Heavy exercise 6-7 days/week' }
];

export function OnboardingTest() {
  const [data, setData] = useState({
    primary_goal: '',
    activity_level: ''
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center">Onboarding Test</h1>
      
      {/* Goals Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            What's your main goal?
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Choose what you'd like to focus on most
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GOAL_OPTIONS.map((goal) => (
            <div
              key={goal.value}
              className={`cursor-pointer transition-all duration-200 border-2 rounded-lg p-4 ${
                data.primary_goal === goal.value
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => {
                setData(prev => ({ ...prev, primary_goal: goal.value }));
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{goal.icon}</span>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{goal.label}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{goal.description}</p>
                </div>
                {data.primary_goal === goal.value && (
                  <CheckIcon className="h-5 w-5 text-indigo-600 ml-auto" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Levels Section */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 dark:text-white">How active are you?</h4>
        <div className="grid grid-cols-1 gap-3">
          {ACTIVITY_LEVELS.map((level) => (
            <div
              key={level.value}
              className={`cursor-pointer transition-all duration-200 border-2 rounded-lg p-4 ${
                data.activity_level === level.value
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => {
                setData(prev => ({ ...prev, activity_level: level.value }));
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white">{level.label}</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{level.description}</p>
                </div>
                {data.activity_level === level.value && (
                  <CheckIcon className="h-5 w-5 text-indigo-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={() => {
            console.log('Previous clicked');
            // Add previous step logic here
          }}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          ← Previous
        </button>

        <button
          onClick={() => {
            console.log('Next clicked with data:', data);
            // Add next step logic here
          }}
          disabled={!data.primary_goal || !data.activity_level}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
