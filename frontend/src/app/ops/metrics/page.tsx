'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getMetrics,
  type MetricsResponse,
  getLLMLatencyRollup,
  type LLMLatencyRollupResponse,
  getRetrievalSummary,
  type RetrievalSummaryResponse,
} from '@/features/utils/api';
import logger from '@/utils/logger';

export default function MetricsPage() {
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [llm, setLlm] = useState<LLMLatencyRollupResponse | null>(null);
  const [retrieval, setRetrieval] = useState<RetrievalSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOnce = async () => {
    try {
      setLoading(true);
      setError(null);
      const [res, llmRoll, retSum] = await Promise.all([
        getMetrics(),
        getLLMLatencyRollup().catch((e) => { logger.warn('llm rollup failed', e); return null as any; }),
        getRetrievalSummary(1).catch((e) => { logger.warn('retrieval summary failed', e); return null as any; }),
      ]);
      setData(res);
      if (llmRoll) setLlm(llmRoll);
      if (retSum) setRetrieval(retSum);
    } catch (e: any) {
      logger.error('Failed to load metrics', e);
      setError('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnce();
    const id = setInterval(fetchOnce, 10_000);
    return () => clearInterval(id);
  }, []);

  const rows = useMemo(() => {
    const pr = data?.per_route || {};
    return Object.keys(pr)
      .sort()
      .map((route) => ({ route, ...pr[route] }));
  }, [data]);

  return (
    <div className="min-h-[calc(100vh-8rem)] w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Metrics</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Backend request, LLM latency, and retrieval summary (auto-refreshes every 10s).</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Total Requests</div>
                <div className="text-gray-900 dark:text-white font-medium">{data?.total_requests ?? 0}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Started</div>
                <div className="text-gray-900 dark:text-white font-medium">{data?.started_at ? new Date(data.started_at).toLocaleString() : '-'}</div>
              </div>
              <div className="flex items-end justify-end">
                <button onClick={fetchOnce} disabled={loading} className="px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50">
                  {loading ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>

          {/* LLM latency rollups */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="mb-3">
              <h2 className="text-sm font-medium text-gray-900 dark:text-white">LLM Latency (rolling)</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">From in-process streaming metrics</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-500 dark:text-gray-400">FT avg (ms)</div>
                <div className="text-gray-900 dark:text-white font-medium">{llm?.first_token_ms?.avg?.toFixed(1) ?? '-'}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">FT pks (min/max)</div>
                <div className="text-gray-900 dark:text-white font-medium">{llm ? `${llm.first_token_ms.min.toFixed(0)} / ${llm.first_token_ms.max.toFixed(0)}` : '-'}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Total avg (ms)</div>
                <div className="text-gray-900 dark:text-white font-medium">{llm?.llm_total_ms?.avg?.toFixed(1) ?? '-'}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Total pks (min/max)</div>
                <div className="text-gray-900 dark:text-white font-medium">{llm ? `${llm.llm_total_ms.min.toFixed(0)} / ${llm.llm_total_ms.max.toFixed(0)}` : '-'}</div>
              </div>
            </div>
          </div>

          {/* Retrieval summary rollups */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="mb-3">
              <h2 className="text-sm font-medium text-gray-900 dark:text-white">Retrieval Summary (last {retrieval?.window_hours ?? 1}h)</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">Aggregated from memory monitor</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Avg retrieval (ms)</div>
                <div className="text-gray-900 dark:text-white font-medium">{retrieval?.rollups?.avg_retrieval_ms?.toFixed(1) ?? '-'}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Avg MMR (ms)</div>
                <div className="text-gray-900 dark:text-white font-medium">{retrieval?.rollups?.avg_mmr_ms?.toFixed(1) ?? '-'}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Avg selected</div>
                <div className="text-gray-900 dark:text-white font-medium">{retrieval?.rollups?.avg_selected?.toFixed(2) ?? '-'}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Avg diversity</div>
                <div className="text-gray-900 dark:text-white font-medium">{retrieval?.rollups?.avg_diversity?.toFixed(3) ?? '-'}</div>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="text-left px-4 py-2">Route</th>
                    <th className="text-right px-4 py-2">Count</th>
                    <th className="text-right px-4 py-2">Avg Latency (ms)</th>
                    <th className="text-right px-4 py-2">Total Latency (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">No route metrics yet.</td>
                    </tr>
                  ) : (
                    rows.map((r) => {
                      const count = typeof r.count === 'number' ? r.count : 0;
                      const totalMs = typeof r.total_latency_ms === 'number' ? r.total_latency_ms : 0;
                      const avgMs = typeof r.avg_latency_ms === 'number' ? r.avg_latency_ms : (count > 0 ? totalMs / count : 0);
                      return (
                      <tr key={r.route} className="border-t border-gray-100 dark:border-gray-700/50">
                        <td className="px-4 py-2 text-gray-900 dark:text-white font-medium">
                          <code>{r.route}</code>
                        </td>
                        <td className="px-4 py-2 text-right">{count}</td>
                        <td className="px-4 py-2 text-right">{avgMs.toFixed(1)}</td>
                        <td className="px-4 py-2 text-right">{totalMs.toFixed(1)}</td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
