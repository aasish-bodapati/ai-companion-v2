'use client';

import { useEffect, useState } from 'react';
import { addJournal, queryJournal, type JournalEntryCreate, type JournalEntryItem } from '@/features/trackers/api';
import { Toast, useToast } from '@/components/Toast';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/Skeleton';
import { mapApiError } from '@/lib/errorMapper';

export default function JournalPage() {
  const [submitting, setSubmitting] = useState(false);
  const [logs, setLogs] = useState<JournalEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, show, hide } = useToast();
  const [from, setFrom] = useState<string | undefined>(undefined);
  const [to, setTo] = useState<string | undefined>(undefined);
  const [limit, setLimit] = useState<number>(10);
  // 7-day summary
  const [summaryLoading, setSummaryLoading] = useState<boolean>(true);
  const [dailyCounts, setDailyCounts] = useState<number[]>([]);
  const [totalEntries, setTotalEntries] = useState<number>(0);

  const fetchLogs = async (opts?: { keepLoading?: boolean }) => {
    try {
      if (!opts?.keepLoading) setLoading(true);
      const params: { from?: string; to?: string; limit?: number } = {};
      if (from) params.from = new Date(from).toISOString();
      if (to) params.to = new Date(to).toISOString();
      if (limit) params.limit = limit;
      const data = await queryJournal(params);
      setLogs(data);
    } catch (e) {
      console.error(e);
      const m = mapApiError(e);
      show(m.message || 'Failed to load journal', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setSummaryLoading(true);
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - 6);
        const data = await queryJournal({ from: start.toISOString(), to: now.toISOString(), limit: 500 });
        const buckets: Record<string, number> = {};
        for (let i = 0; i < 7; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          const key = d.toISOString().slice(0, 10);
          buckets[key] = 0;
        }
        data.forEach(j => {
          const key = new Date(j.when).toISOString().slice(0, 10);
          if (!(key in buckets)) buckets[key] = 0;
          buckets[key] += 1;
        });
        const counts: number[] = Object.keys(buckets).sort().map(k => buckets[k]);
        setDailyCounts(counts);
        setTotalEntries(data.length);
      } catch (e) {
        console.error(e);
        const m = mapApiError(e);
        show(m.message || 'Failed to load summary', 'error');
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const tagsRaw = String(fd.get('tags') || '').split(',').map(s => s.trim()).filter(Boolean);
    const body: JournalEntryCreate = {
      when: new Date(String(fd.get('when') || new Date().toISOString())).toISOString(),
      title: (fd.get('title') as string) || undefined,
      content: String(fd.get('content') || ''),
      tags: tagsRaw.length ? tagsRaw : undefined,
    };
    try {
      setSubmitting(true);
      await addJournal(body);
      setLogs(await queryJournal({ limit: 10 }));
      (e.target as HTMLFormElement).reset();
      show('Journal entry added', 'success');
    } catch (e) {
      console.error(e);
      const m = mapApiError(e);
      show(m.message || 'Failed to add entry', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] w-full">
      {toast && <Toast message={toast.message} kind={toast.kind} onClose={hide} />}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Journal</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Daily notes and reflections.</p>
          </div>

          {/* Filters */}
          <form
            aria-label="Filter journal entries"
            className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3"
            onSubmit={(e) => { e.preventDefault(); fetchLogs(); }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label htmlFor="from" className="block text-xs font-medium text-gray-700 dark:text-gray-300">From</label>
                <input id="from" name="from" type="datetime-local" className="input mt-1" value={from ?? ''} onChange={(e) => setFrom(e.target.value || undefined)} />
              </div>
              <div>
                <label htmlFor="to" className="block text-xs font-medium text-gray-700 dark:text-gray-300">To</label>
                <input id="to" name="to" type="datetime-local" className="input mt-1" value={to ?? ''} onChange={(e) => setTo(e.target.value || undefined)} />
              </div>
              <div>
                <label htmlFor="limit" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Limit</label>
                <select id="limit" name="limit" className="input mt-1" value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  aria-label="Number of items to load"
                >
                  {[10, 20, 50, 100].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary h-9 self-end">Apply</button>
                <button
                  type="button"
                  className="btn-secondary h-9 self-end"
                  onClick={() => { setFrom(undefined); setTo(undefined); setLimit(10); fetchLogs(); }}
                  aria-label="Clear filters"
                >
                  Clear
                </button>
              </div>
            </div>
          </form>

          {/* Last 7 days summary */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Last 7 days</h2>
            {summaryLoading ? (
              <SkeletonList count={1} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Entries</div>
                  <div className="text-xl font-semibold text-gray-900 dark:text-white">{totalEntries}</div>
                </div>
                <div className="sm:col-span-2 col-span-1">
                  <Sparkline data={dailyCounts} />
                </div>
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="space-y-3 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input name="when" type="datetime-local" className="input" required />
              <input name="title" placeholder="Title (optional)" className="input" />
              <input name="tags" placeholder="Tags (comma-separated)" className="input" />
              <textarea name="content" placeholder="Write your entry..." className="input col-span-1 sm:col-span-2 h-32" required />
            </div>
            <button disabled={submitting} className="btn-primary">{submitting ? 'Saving…' : 'Save'}</button>
          </form>

          <div>
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent</h2>
            {loading ? (
              <SkeletonList count={3} />
            ) : logs.length === 0 ? (
              <EmptyState title="No entries yet" subtitle="Write your first journal entry." />
            ) : (
              <div className="space-y-2">
                {logs.map((l) => (
                  <div key={l.id} className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-2 rounded">
                    <div className="font-medium">{new Date(l.when).toLocaleString()}</div>
                    <div className="whitespace-pre-wrap">{l.content}</div>
                  </div>
                ))}
                <div className="pt-2">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => { setLimit((prev) => prev + 10); fetchLogs({ keepLoading: true }); }}
                    aria-label="Load more journal entries"
                  >
                    Load more
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx global>{`
        .input{ @apply w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm; }
        .btn-primary{ @apply px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50; }
        .btn-secondary{ @apply px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm hover:bg-gray-200 dark:hover:bg-gray-600; }
      `}</style>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const width = 160;
  const height = 40;
  const padding = 4;
  const n = data.length || 1;
  const max = Math.max(1, ...data);
  const points = data.map((v, i) => {
    const x = padding + (i * (width - padding * 2)) / Math.max(1, n - 1);
    const y = height - padding - (v / max) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} className="w-full h-10">
      <polyline fill="none" stroke="currentColor" className="text-indigo-600 dark:text-indigo-400" strokeWidth="2" points={points} />
    </svg>
  );
}
