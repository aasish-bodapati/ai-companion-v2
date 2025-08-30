'use client';

import { useState } from 'react';
import { dailyNudge, type DailyNudgeRequest, weeklyReview, type WeeklyReviewRequest } from '@/features/trackers/api';

export default function ReviewsPage() {
  const [dailyLoading, setDailyLoading] = useState(false);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [daily, setDaily] = useState<string[] | null>(null);
  const [weekly, setWeekly] = useState<{ summary: string; adjustments?: any[]; insights?: string[] } | null>(null);

  const onDaily = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: DailyNudgeRequest = {
      date: String(fd.get('date') || new Date().toISOString().slice(0, 10)),
    };
    const from = fd.get('qh_from') as string;
    const to = fd.get('qh_to') as string;
    const tz = fd.get('qh_tz') as string;
    if (from && to) body.quiet_hours = { from, to, tz: tz || undefined };
    try {
      setDailyLoading(true);
      const res = await dailyNudge(body);
      setDaily(res.suggestions);
    } catch (e) {
      console.error(e);
      alert('Failed to fetch daily suggestions');
    } finally {
      setDailyLoading(false);
    }
  };

  const onWeekly = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const domains = String(fd.get('domains') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const body: WeeklyReviewRequest = {
      week_start: String(fd.get('week_start') || ''),
      domains: domains.length ? domains : undefined,
    };
    try {
      setWeeklyLoading(true);
      const res = await weeklyReview(body);
      setWeekly(res);
    } catch (e) {
      console.error(e);
      alert('Failed to fetch weekly review');
    } finally {
      setWeeklyLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Reviews</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Generate daily suggestions and weekly review.</p>
          </div>

          <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Daily Nudge</h2>
            <form onSubmit={onDaily} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input name="date" type="date" className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm" />
                <input name="qh_from" type="time" placeholder="From" className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm" />
                <input name="qh_to" type="time" placeholder="To" className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm" />
                <input name="qh_tz" placeholder="Time zone (e.g., Asia/Kolkata)" className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm sm:col-span-3" />
              </div>
              <button disabled={dailyLoading} className="px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50">
                {dailyLoading ? 'Generating…' : 'Generate'}
              </button>
            </form>
            {daily && (
              <ul className="mt-4 list-disc pl-5 text-sm text-gray-800 dark:text-gray-200 space-y-1">
                {daily.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Weekly Review</h2>
            <form onSubmit={onWeekly} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input name="week_start" type="date" className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm" required />
                <input name="domains" placeholder="Domains (comma-separated)" className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm sm:col-span-2" />
              </div>
              <button disabled={weeklyLoading} className="px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50">
                {weeklyLoading ? 'Reviewing…' : 'Review'}
              </button>
            </form>
            {weekly && (
              <div className="mt-4 space-y-2 text-sm text-gray-800 dark:text-gray-200">
                <div>
                  <div className="font-medium">Summary</div>
                  <div className="opacity-90">{weekly.summary}</div>
                </div>
                {weekly.insights && weekly.insights.length > 0 && (
                  <div>
                    <div className="font-medium">Insights</div>
                    <ul className="list-disc pl-5">
                      {weekly.insights.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
