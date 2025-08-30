'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMyOnboarding, saveMyOnboarding } from '@/features/onboarding/api';
import { useMemo, useState } from 'react';
import type { OnboardingProfileIn, ResponseStyle, MemoryPolicy } from '@/features/onboarding/types';

export default function MemoryDashboard() {
  const { data: onboarding, isLoading } = useQuery({
    queryKey: ['onboarding:me'],
    queryFn: fetchMyOnboarding,
  });
  const qc = useQueryClient();

  // Inline edit state for lightweight edits inside the summary
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields (subset most users touch)
  const [nickname, setNickname] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [location, setLocation] = useState('');
  const [topics, setTopics] = useState('');
  const [responseStyle, setResponseStyle] = useState<ResponseStyle | ''>('');
  const [primaryReason, setPrimaryReason] = useState('');
  const [memoryPolicy, setMemoryPolicy] = useState<MemoryPolicy | ''>('');

  const canSave = useMemo(() => editing && !saving, [editing, saving]);

  if (isLoading) {
    return (
      <div className="p-6">
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

  if (!onboarding?.completed) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500 dark:text-gray-400">
          Complete your onboarding to see what I know about you.
        </div>
      </div>
    );
  }

  const { identity, interests, communication, goals, boundaries, fun } = onboarding;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-1 text-gray-900 dark:text-gray-100">
            What I Know About You
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This is the information I use to personalize our conversations and provide better support.
          </p>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setEditing(true);
              // Hydrate form values from the current onboarding snapshot
              setNickname(identity?.nickname ?? '');
              setPronouns(identity?.pronouns ?? '');
              setLocation(identity?.location ?? '');
              setTopics((interests?.topics ?? []).join(', '));
              setResponseStyle(communication?.responseStyle ?? '');
              setPrimaryReason(goals?.primaryReason ?? '');
              setMemoryPolicy(boundaries?.memoryPolicy ?? '');
            }}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canSave}
              onClick={async () => {
                if (!canSave) return;
                setSaving(true);
                setError(null);
                try {
                  const payload: OnboardingProfileIn = {
                    identity: {
                      nickname: nickname || undefined,
                      pronouns: pronouns || undefined,
                      location: location || undefined,
                    },
                    interests: {
                      topics: topics
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    },
                    communication: {
                      responseStyle: (responseStyle as any) || undefined,
                    },
                    goals: {
                      primaryReason: primaryReason || undefined,
                    },
                    boundaries: {
                      memoryPolicy: (memoryPolicy as any) || undefined,
                    },
                  };
                  await saveMyOnboarding(payload);
                  await qc.invalidateQueries({ queryKey: ['onboarding:me'] });
                  setEditing(false);
                } catch (e: any) {
                  setError(e?.message || 'Failed to save');
                } finally {
                  setSaving(false);
                }
              }}
              className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {/* Identity Section */}
      {identity && (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Identity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Nickname:</span>
              {editing ? (
                <input
                  className="ml-2 mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Preferred nickname"
                />
              ) : (
                <span className="ml-2 text-gray-900 dark:text-gray-100">{identity.nickname || '—'}</span>
              )}
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Pronouns:</span>
              {editing ? (
                <input
                  className="ml-2 mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={pronouns}
                  onChange={(e) => setPronouns(e.target.value)}
                  placeholder="they/them, she/her, he/him"
                />
              ) : (
                <span className="ml-2 text-gray-900 dark:text-gray-100">{identity.pronouns || '—'}</span>
              )}
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Location:</span>
              {editing ? (
                <input
                  className="ml-2 mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                />
              ) : (
                <span className="ml-2 text-gray-900 dark:text-gray-100">{identity.location || '—'}</span>
              )}
            </div>
            {identity.birthday && !editing && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Birthday:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">{identity.birthday}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interests Section */}
      {interests && (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Interests & Passions</h3>
          <div className="space-y-3 text-sm">
            {(editing || (interests.topics && interests.topics.length > 0)) && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Topics you love:</span>
                {editing ? (
                  <input
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={topics}
                    onChange={(e) => setTopics(e.target.value)}
                    placeholder="AI, startups, design"
                  />
                ) : (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {(interests.topics || []).map((topic: string) => (
                      <span
                        key={topic}
                        className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            {interests.hobbies && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Current hobbies:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">{interests.hobbies}</span>
              </div>
            )}
            {interests.favorites && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Favorites:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">{interests.favorites}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Communication Section */}
      {communication && (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Communication Style</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Response style:</span>
              {editing ? (
                <select
                  className="ml-2 mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={responseStyle}
                  onChange={(e) => setResponseStyle(e.target.value as ResponseStyle)}
                >
                  <option value="">—</option>
                  <option value="Concise">Concise</option>
                  <option value="Detailed">Detailed</option>
                  <option value="Balanced">Balanced</option>
                </select>
              ) : (
                <span className="ml-2 text-gray-900 dark:text-gray-100">{communication.responseStyle || '—'}</span>
              )}
            </div>
            {communication.tone && communication.tone.length > 0 && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Preferred tone:</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {communication.tone.map((tone: string) => (
                    <span
                      key={tone}
                      className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs"
                    >
                      {tone}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {communication.smallTalkLevel !== undefined && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Small talk preference:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">
                  {['None', 'A little', 'Lots'][communication.smallTalkLevel]}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Goals Section */}
      {goals && (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Goals & Use Cases</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Primary reason:</span>
              {editing ? (
                <input
                  className="ml-2 mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={primaryReason}
                  onChange={(e) => setPrimaryReason(e.target.value)}
                  placeholder="Why are you using the companion?"
                />
              ) : (
                <span className="ml-2 text-gray-900 dark:text-gray-100">{goals.primaryReason || '—'}</span>
              )}
            </div>
            {goals.personalGoals && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Personal goals:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">{goals.personalGoals}</span>
              </div>
            )}
            {goals.checkinsEnabled !== undefined && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Progress check-ins:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">
                  {goals.checkinsEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Boundaries Section */}
      {boundaries && (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Boundaries & Preferences</h3>
          <div className="space-y-3 text-sm">
            {boundaries.avoidTopics && !editing && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Topics to avoid:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">{boundaries.avoidTopics}</span>
              </div>
            )}
            {boundaries.recallEnabled !== undefined && !editing && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Proactive recall:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">
                  {boundaries.recallEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            )}
            <div>
              <span className="text-gray-600 dark:text-gray-400">Memory policy:</span>
              {editing ? (
                <select
                  className="ml-2 mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={memoryPolicy}
                  onChange={(e) => setMemoryPolicy(e.target.value as MemoryPolicy)}
                >
                  <option value="">—</option>
                  <option value="RememberAll">RememberAll</option>
                  <option value="ImportantOnly">ImportantOnly</option>
                  <option value="NoMemory">NoMemory</option>
                </select>
              ) : (
                <span className="ml-2 text-gray-900 dark:text-gray-100">{boundaries.memoryPolicy || '—'}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fun Section */}
      {fun && (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Fun & Personality</h3>
          <div className="space-y-3 text-sm">
            {fun.dreamTrip && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Dream trip:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">{fun.dreamTrip}</span>
              </div>
            )}
            {fun.randomFact && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Random fact:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">{fun.randomFact}</span>
              </div>
            )}
            {fun.aiPersona && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">How I should act:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">{fun.aiPersona}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-4">
        This information helps me provide more personalized and relevant responses.
        You can update these preferences anytime from your profile.
      </div>
    </div>
  );
}
