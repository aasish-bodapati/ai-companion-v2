"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listMyNudges, type NudgeItem, createCheckIn, autoSummarize } from '@/features/nudges/api';
import { toast } from 'sonner';
import { BellIcon } from '@heroicons/react/24/outline';

interface NudgeInboxProps {
  conversationId?: string | null;
}

export function NudgeInbox({ conversationId }: NudgeInboxProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: nudges, isLoading, refetch } = useQuery({
    queryKey: ['nudges:list'],
    queryFn: listMyNudges,
    staleTime: 60_000,
  });

  // Refresh on window focus when open
  useEffect(() => {
    if (!open) return;
    const onFocus = () => void refetch();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [open, refetch]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const [checkInText, setCheckInText] = useState<string>('');
  const [activeNudge, setActiveNudge] = useState<NudgeItem | null>(null);

  const mCheckIn = useMutation({
    mutationFn: createCheckIn,
    onSuccess: () => {
      toast.success('Check-in saved');
      setCheckInText('');
      setActiveNudge(null);
      void qc.invalidateQueries({ queryKey: ['nudges:list'] });
    },
    onError: () => toast.error('Failed to save check-in'),
  });

  const mWeekly = useMutation({
    mutationFn: async () => {
      const cid = conversationId;
      if (!cid) throw new Error('No conversation');
      await autoSummarize(cid);
    },
    onSuccess: () => {
      toast.success('Weekly recap created');
      void qc.invalidateQueries({ queryKey: ['nudges:list'] });
    },
    onError: () => toast.error('Failed to create recap'),
  });

  const count = nudges?.length ?? 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-800"
      >
        <BellIcon className="h-4 w-4" aria-hidden />
        <span>Nudges</span>
        {count > 0 && (
          <span className="ml-1 inline-flex items-center justify-center text-xs bg-amber-500 text-white rounded-full px-2 py-0.5">
            {count}
          </span>
        )}
      </button>

      {open && createPortal(
        (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
            <div className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 mx-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold">Nudge Inbox</h3>
                <button className="text-sm text-gray-500 hover:text-gray-700" onClick={() => setOpen(false)}>Close</button>
              </div>
              {isLoading ? (
                <div className="py-6 text-center text-gray-500">Loading…</div>
              ) : (nudges && nudges.length > 0) ? (
                <div className="space-y-3">
                  {nudges.map((n) => (
                    <div key={n.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-medium">{n.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{n.message}</div>
                        </div>
                        <span className="text-[10px] uppercase tracking-wide text-amber-600">{n.nudge_type}</span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        {(n.nudge_type === 'morning' || n.nudge_type === 'evening' || n.nudge_type === 'checkin') && (
                          <button
                            type="button"
                            className="px-2.5 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
                            onClick={() => { setActiveNudge(n); setCheckInText(''); }}
                          >
                            Check in
                          </button>
                        )}
                        {n.nudge_type === 'weekly' && (
                          <button
                            type="button"
                            className="px-2.5 py-1 text-xs rounded-md bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                            disabled={!conversationId || mWeekly.isPending}
                            onClick={() => mWeekly.mutate()}
                          >
                            Create recap
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">No nudges right now</div>
              )}

              {activeNudge && (
                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="text-sm font-medium mb-2">Quick Check-in</div>
                  <textarea
                    className="w-full min-h-[90px] rounded-md border border-gray-300 dark:border-gray-700 bg-transparent p-2 text-sm"
                    placeholder="What’s on your mind?"
                    value={checkInText}
                    onChange={(e) => setCheckInText(e.target.value)}
                  />
                  <div className="mt-2 flex items-center gap-2 justify-end">
                    <button className="text-xs text-gray-500 hover:text-gray-700" onClick={() => setActiveNudge(null)}>Cancel</button>
                    <button
                      className="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                      disabled={!checkInText || mCheckIn.isPending}
                      onClick={() => mCheckIn.mutate({
                        content: checkInText,
                        cadence: activeNudge.nudge_type === 'weekly' ? 'weekly' : 'daily',
                        prompt: activeNudge.title,
                      })}
                    >
                      Save check-in
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ),
        document.body
      )}
    </div>
  );
}
