"use client";

import { useEffect, useMemo, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { fetchMyOnboarding, saveMyOnboarding } from '@/features/onboarding/api';
import type { OnboardingProfileIn, ResponseStyle, MemoryPolicy } from '@/features/onboarding/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function ProfileQuickEditModal({ open, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state (subset of onboarding fields)
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [location, setLocation] = useState('');

  const [topics, setTopics] = useState(''); // comma-separated

  const [responseStyle, setResponseStyle] = useState<ResponseStyle | ''>('');
  const [primaryReason, setPrimaryReason] = useState('');

  const [memoryPolicy, setMemoryPolicy] = useState<MemoryPolicy | ''>('');

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      setInitializing(true);
      setError(null);
      try {
        const profile = await fetchMyOnboarding();
        if (!mounted) return;
        setName(profile.identity?.name ?? '');
        setNickname(profile.identity?.nickname ?? '');
        setPronouns(profile.identity?.pronouns ?? '');
        setLocation(profile.identity?.location ?? '');
        setTopics((profile.interests?.topics ?? []).join(', '));
        setResponseStyle(profile.communication?.responseStyle ?? '');
        setPrimaryReason(profile.goals?.primaryReason ?? '');
        setMemoryPolicy(profile.boundaries?.memoryPolicy ?? '');
      } catch (e) {
        if (mounted) setError('Failed to load current profile');
      } finally {
        if (mounted) setInitializing(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open]);

  const canSave = useMemo(() => !loading && !initializing, [loading, initializing]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    setLoading(true);
    setError(null);
    try {
      const payload: OnboardingProfileIn = {
        identity: {
          name: name || undefined,
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
      if (onSaved) onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Quick Edit Profile">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left align-middle shadow-xl transition-all">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Quick Edit Profile</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onSubmit}>
              <div className="px-6 py-4 space-y-4">
                {error && <div className="text-sm text-red-600">{error}</div>}
                {initializing ? (
                  <div className="text-sm text-gray-500">Loading...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                      <input
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nickname</label>
                      <input
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pronouns</label>
                      <input
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={pronouns}
                        onChange={(e) => setPronouns(e.target.value)}
                        placeholder="e.g., she/her, he/him, they/them"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                      <input
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="City, Country"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Topics (comma-separated)</label>
                      <input
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={topics}
                        onChange={(e) => setTopics(e.target.value)}
                        placeholder="AI, startups, design"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Response Style</label>
                      <select
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={responseStyle}
                        onChange={(e) => setResponseStyle(e.target.value as ResponseStyle)}
                      >
                        <option value="">—</option>
                        <option value="Concise">Concise</option>
                        <option value="Detailed">Detailed</option>
                        <option value="Balanced">Balanced</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Primary Reason</label>
                      <input
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={primaryReason}
                        onChange={(e) => setPrimaryReason(e.target.value)}
                        placeholder="Why are you using the companion?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Memory Policy</label>
                      <select
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={memoryPolicy}
                        onChange={(e) => setMemoryPolicy(e.target.value as MemoryPolicy)}
                      >
                        <option value="">—</option>
                        <option value="RememberAll">RememberAll</option>
                        <option value="ImportantOnly">ImportantOnly</option>
                        <option value="NoMemory">NoMemory</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSave}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
