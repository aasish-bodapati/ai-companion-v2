"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMyOnboarding, saveMyOnboarding, completeMyOnboarding } from './api';
import type { OnboardingProfileOut, OnboardingProfileIn } from './types';

// Life improvement focused options
const DAILY_SCHEDULE_OPTIONS = [
  'Early bird (5-8 AM start)', 
  'Standard 9-5', 
  'Flexible/Remote', 
  'Shift work', 
  'Student schedule',
  'Entrepreneur (variable hours)',
  'Parent with kids'
];

const LIFE_IMPROVEMENT_GOALS = [
  'Better work-life balance',
  'Improve health and fitness',
  'Build better habits',
  'Reduce stress and anxiety',
  'Improve productivity',
  'Better time management',
  'Personal development',
  'Relationship improvement',
  'Financial wellness',
  'Mental health and mindfulness'
];

const CURRENT_CHALLENGES = [
  'Feeling overwhelmed',
  'Lack of routine',
  'Poor time management',
  'Stress and burnout',
  'Health goals not sticking',
  'Work-life imbalance',
  'Procrastination',
  'Lack of motivation',
  'Sleep issues',
  'Social isolation'
];

const COMMUNICATION_STYLE = [
  'Brief and direct', 
  'Detailed explanations', 
  'Friendly and casual', 
  'Professional and formal',
  'Encouraging and motivational',
  'Analytical and data-driven'
];

// Enhanced onboarding questions with more personality
const ONBOARDING_QUESTIONS = [
  {
    step: 0,
    title: "Let's start with your daily rhythm",
    subtitle: "I want to understand your natural energy patterns",
    icon: "🌅",
    color: "from-yellow-400 to-orange-500"
  },
  {
    step: 1,
    title: "What matters most to you?",
    subtitle: "Your goals will shape how I support you",
    icon: "🎯",
    color: "from-blue-400 to-indigo-500"
  },
  {
    step: 2,
    title: "What's holding you back?",
    subtitle: "Understanding challenges helps me give better advice",
    icon: "🚧",
    color: "from-red-400 to-pink-500"
  },
  {
    step: 3,
    title: "How should we communicate?",
    subtitle: "I'll adapt my style to match your preferences",
    icon: "💬",
    color: "from-green-400 to-teal-500"
  },
  {
    step: 4,
    title: "Ready to start your journey?",
    subtitle: "Let's review and begin optimizing your life",
    icon: "🚀",
    color: "from-purple-400 to-pink-500"
  }
];

export default function OnboardingWizard({ mode }: { mode: 'onboarding' | 'preferences' }) {
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<OnboardingProfileOut>({
    queryKey: ['onboarding:me'],
    queryFn: fetchMyOnboarding,
  });

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OnboardingProfileIn>({});
  const [showMigrationNotice, setShowMigrationNotice] = useState(false);

  useEffect(() => {
    if (data) {
      const { completed, id, user_id, ...rest } = data as any;
      setForm(rest);
      
      // Check if user needs migration (has completed profile but no meaningful data)
      if (completed && mode === 'onboarding') {
        const hasData = Object.values(rest).some(value => value && value.toString().trim() !== '');
        if (!hasData) {
          setShowMigrationNotice(true);
        } else if (data.completed) {
          router.replace('/companion');
        }
      }
    }
  }, [data, router, mode]);

  const saveMutation = useMutation({
    mutationFn: (payload: OnboardingProfileIn) => saveMyOnboarding(payload),
    onSuccess: (updated) => {
      qc.setQueryData(['onboarding:me'], updated);
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => completeMyOnboarding(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding:me'] });
      router.replace('/companion');
    },
  });

  const steps = useMemo(() => [
    'Your Schedule',
    'Life Goals',
    'Current Challenges',
    'Communication Style',
    'Review & Start',
  ], []);

  const onNext = async () => {
    await saveMutation.mutateAsync(form);
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const onBack = () => setStep((s) => Math.max(s - 1, 0));

  const onFinish = async () => {
    await saveMutation.mutateAsync(form);
    if (mode === 'onboarding') {
      await completeMutation.mutateAsync();
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading your preferences...</p>
      </div>
    </div>
  );

  // Show migration notice if user needs to re-complete onboarding
  if (showMigrationNotice) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-4">
              Welcome Back! We've Enhanced Your Experience
            </h2>
            <p className="text-blue-700 dark:text-blue-300 mb-6 text-lg">
              We've completely redesigned our onboarding to better understand your life improvement goals and help you achieve them more effectively.
            </p>
            <button
              onClick={() => setShowMigrationNotice(false)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Complete Enhanced Onboarding
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = ONBOARDING_QUESTIONS[step];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/20 shadow-inner p-3 mb-6 ring-2 ring-white/20 ring-inset">
            <svg className="w-12 h-12 text-transparent" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="url(#iconGradient)" className="opacity-30" />
              <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="url(#iconGradient)" className="opacity-90" />
              <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="url(#iconGradient)" className="opacity-100" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {mode === 'onboarding' ? 'Welcome to Your AI Life Companion' : 'Update Your Preferences'}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            I'm here to help you optimize your daily routines, achieve your goals, and build a better life. Let me get to know you better.
          </p>
        </div>

        {/* Enhanced Progress indicator */}
        <div className="flex items-center justify-center space-x-2 mb-12">
          {steps.map((stepName, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                index <= step 
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg scale-110' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-20 h-1 mx-2 rounded-full transition-all duration-300 ${
                  index < step 
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600' 
                    : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Current Step Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Step Header */}
          <div className={`bg-gradient-to-r ${currentQuestion.color} text-white p-8 text-center`}>
            <div className="text-6xl mb-4">{currentQuestion.icon}</div>
            <h2 className="text-3xl font-bold mb-2">{currentQuestion.title}</h2>
            <p className="text-xl opacity-90">{currentQuestion.subtitle}</p>
          </div>

          {/* Step Content */}
          <div className="p-8">
            {/* Step 1: Daily Schedule */}
            {step === 0 && (
              <section className="space-y-6">
                <Field label="What's your typical daily schedule?" required>
                  <select
                    className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    value={form.daily_schedule || ''}
                    onChange={(e) => setForm({
                      ...form,
                      daily_schedule: e.target.value
                    })}
                  >
                    <option value="">Select your schedule...</option>
                    {DAILY_SCHEDULE_OPTIONS.map(schedule => (
                      <option key={schedule} value={schedule}>{schedule}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Any specific times I should avoid scheduling things?" required>
                  <textarea
                    placeholder="e.g., 'I'm usually in meetings 2-4 PM' or 'I prefer morning tasks' or 'I need quiet time after dinner'"
                    className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 h-24 resize-none"
                    value={form.avoid_times || ''}
                    onChange={(e) => setForm({
                      ...form,
                      avoid_times: e.target.value
                    })}
                  />
                </Field>

                <Field label="What time do you usually wake up and go to bed?" required>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Wake up time</label>
                      <input
                        type="time"
                        className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        value={form.wake_up_time || ''}
                        onChange={(e) => setForm({
                          ...form,
                          wake_up_time: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bedtime</label>
                      <input
                        type="time"
                        className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        value={form.bedtime || ''}
                        onChange={(e) => setForm({
                          ...form,
                          bedtime: e.target.value
                        })}
                      />
                    </div>
                  </div>
                </Field>
              </section>
            )}

            {/* Step 2: Life Goals */}
            {step === 1 && (
              <section className="space-y-6">
                <Field label="What are your main life improvement goals?" required>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {LIFE_IMPROVEMENT_GOALS.map(goal => (
                      <label key={goal} className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={form.life_goals?.includes(goal) || false}
                          onChange={(e) => {
                            const currentGoals = form.life_goals || [];
                            if (e.target.checked) {
                              setForm({ ...form, life_goals: [...currentGoals, goal] });
                            } else {
                              setForm({ ...form, life_goals: currentGoals.filter(g => g !== goal) });
                            }
                          }}
                        />
                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{goal}</span>
                      </label>
                    ))}
                  </div>
                </Field>

                <Field label="Tell me about your fitness and nutrition goals">
                  <textarea
                    placeholder="e.g., 'I want to build muscle and eat 150g protein daily' or 'I'm training for a marathon' or 'I want to lose 20 pounds'"
                    className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 h-24 resize-none"
                    value={form.fitness_goals || ''}
                    onChange={(e) => setForm({
                      ...form,
                      fitness_goals: e.target.value
                    })}
                  />
                </Field>
              </section>
            )}

            {/* Step 3: Current Challenges */}
            {step === 2 && (
              <section className="space-y-6">
                <Field label="What challenges are you currently facing?" required>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {CURRENT_CHALLENGES.map(challenge => (
                      <label key={challenge} className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={form.current_challenges?.includes(challenge) || false}
                          onChange={(e) => {
                            const currentChallenges = form.current_challenges || [];
                            if (e.target.checked) {
                              setForm({ ...form, current_challenges: [...currentChallenges, challenge] });
                            } else {
                              setForm({ ...form, current_challenges: currentChallenges.filter(c => c !== challenge) });
                            }
                          }}
                        />
                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{challenge}</span>
                      </label>
                    ))}
                  </div>
                </Field>

                <Field label="What's one thing you'd like to improve most right now?">
                  <textarea
                    placeholder="Be specific! e.g., 'I want to stop hitting snooze and actually get up at 5 AM' or 'I need to stop eating junk food at 3 PM'"
                    className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 h-24 resize-none"
                    value={form.immediate_goal || ''}
                    onChange={(e) => setForm({
                      ...form,
                      immediate_goal: e.target.value
                    })}
                  />
                </Field>
              </section>
            )}

            {/* Step 4: Communication Style */}
            {step === 3 && (
              <section className="space-y-6">
                <Field label="How would you like me to communicate with you?" required>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {COMMUNICATION_STYLE.map(style => (
                      <label key={style} className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="communication_style"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          checked={form.communication_style === style}
                          onChange={(e) => setForm({
                            ...form,
                            communication_style: e.target.value
                          })}
                        />
                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{style}</span>
                      </label>
                    ))}
                  </div>
                </Field>

                <Field label="Any other preferences for how I should interact with you?">
                  <textarea
                    placeholder="e.g., 'I like motivational quotes' or 'Please remind me gently' or 'I prefer data and charts'"
                    className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 h-24 resize-none"
                    value={form.communication_preferences || ''}
                    onChange={(e) => setForm({
                      ...form,
                      communication_preferences: e.target.value
                    })}
                  />
                </Field>
              </section>
            )}

            {/* Step 5: Review & Start */}
            {step === 4 && (
              <section className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-4">🎉 Perfect! Here's what I know about you:</h3>
                  
                  <div className="space-y-4">
                    {form.daily_schedule && (
                      <div className="flex items-start gap-3">
                        <span className="text-green-600">🌅</span>
                        <div>
                          <div className="font-medium text-green-800 dark:text-green-200">Schedule:</div>
                          <div className="text-sm text-green-700 dark:text-green-300">{form.daily_schedule}</div>
                        </div>
                      </div>
                    )}
                    
                    {form.life_goals && form.life_goals.length > 0 && (
                      <div className="flex items-start gap-3">
                        <span className="text-green-600">🎯</span>
                        <div>
                          <div className="font-medium text-green-800 dark:text-green-200">Goals:</div>
                          <div className="text-sm text-green-700 dark:text-green-300">{form.life_goals.join(', ')}</div>
                        </div>
                      </div>
                    )}
                    
                    {form.communication_style && (
                      <div className="flex items-start gap-3">
                        <span className="text-green-600">💬</span>
                        <div>
                          <div className="font-medium text-green-800 dark:text-green-200">Communication:</div>
                          <div className="text-sm text-green-700 dark:text-green-300">{form.communication_style}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    I'm excited to help you optimize your life and achieve your goals! Let's start building better routines together.
                  </p>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    You can always update these preferences later in your settings.
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Navigation */}
          <div className="px-8 py-6 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
            <button
              onClick={onBack}
              disabled={step === 0}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                step === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              ← Back
            </button>

            <div className="flex items-center gap-3">
              {step < steps.length - 1 ? (
                <button
                  onClick={onNext}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={onFinish}
                  disabled={completeMutation.isPending}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {completeMutation.isPending ? 'Starting...' : 'Start My Journey! 🚀'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Field component
function Field({ label, children, required = false }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="block text-lg font-medium text-gray-900 dark:text-white">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
