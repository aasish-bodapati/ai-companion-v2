"use client";

import { useEffect, useMemo, useState } from 'react';
import { getWeeklyDigest, type WeeklyDigestResponse } from '@/features/weekly/api';

function formatDateISO(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function WeeklyDigestPage() {
  const enabled = process.env.NEXT_PUBLIC_FEATURE_WEEKLY_DIGEST === 'true';
  const [start, setStart] = useState<string>(() => {
    const dt = new Date();
    dt.setDate(dt.getDate() - 7);
    return formatDateISO(dt);
  });
  const [end, setEnd] = useState<string>(() => formatDateISO(new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WeeklyDigestResponse | null>(null);

  useEffect(() => {
    if (!enabled) return;
    // Auto-load on first mount
    void handleLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const canSubmit = useMemo(() => {
    return !loading && !!start && !!end;
  }, [loading, start, end]);

  async function handleLoad() {
    if (!enabled) return;
    try {
      setLoading(true);
      setError(null);
      const resp = await getWeeklyDigest({ start, end });
      setData(resp);
    } catch (e: any) {
      const msg = e?.message || 'Failed to load weekly digest';
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  if (!enabled) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Weekly Digest</h1>
        <p className="mt-2 text-sm text-gray-600">This feature is disabled. Set <code className="font-mono">NEXT_PUBLIC_FEATURE_WEEKLY_DIGEST=true</code> to enable.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <label className="block text-sm font-medium text-gray-700">Start</label>
          <input
            type="date"
            className="mt-1 block w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End</label>
          <input
            type="date"
            className="mt-1 block w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={handleLoad}
          disabled={!canSubmit}
          className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Generate Weekly Digest'}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold">Summary</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-800">
              {data.summary || '(No summary)'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Highlights</h2>
            {data.highlights?.length ? (
              <ul className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {data.highlights.map((h, idx) => (
                  <li key={`${h.faiss_id || idx}-${idx}`} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-medium text-gray-900 truncate">{h.title || 'Highlight'}</div>
                    <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{h.detail}</div>
                    {(h.rank_boost ?? null) !== null && (
                      <div className="mt-2 text-xs text-gray-500">rank_boost: {String(h.rank_boost)}</div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-gray-600">No highlights in this period.</p>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold">Stats</h2>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-gray-200 bg-white p-4 text-sm shadow-sm">
                <div className="text-gray-500">Messages</div>
                <div className="text-lg font-semibold">{data.stats.messages}</div>
              </div>
              <div className="rounded-md border border-gray-200 bg-white p-4 text-sm shadow-sm">
                <div className="text-gray-500">New Memories</div>
                <div className="text-lg font-semibold">{data.stats.new_memories}</div>
              </div>
              <div className="rounded-md border border-gray-200 bg-white p-4 text-sm shadow-sm">
                <div className="text-gray-500">Reinforced</div>
                <div className="text-lg font-semibold">{data.stats.reinforced}</div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
