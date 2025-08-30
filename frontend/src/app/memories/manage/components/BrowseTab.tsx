'use client';

import { useEffect, useMemo, useState } from 'react';
import { CONTENT_TYPES, typeBadgeColor } from './common';
import { deleteMemory, getMemoryAudit, hardDeleteMemory, listMyMemories, type MemoryNode, type MemoryType } from '@/features/memory/api';
import HistoryDrawer from '@/components/memory/HistoryDrawer';

export default function BrowseTab() {
  const [items, setItems] = useState<MemoryNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<MemoryType | 'all'>('all');
  const [coreOnly, setCoreOnly] = useState<boolean>(false);
  const [q, setQ] = useState<string>('');
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [pageSize, setPageSize] = useState<number>(50);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [historyFaissId, setHistoryFaissId] = useState<string | null>(null);
  const [auditCounts, setAuditCounts] = useState<Record<string, number>>({});

  const filtered = useMemo(() => {
    const byType = filterType === 'all' ? items : items.filter((m) => m.content_type === filterType);
    const query = q.trim().toLowerCase();
    if (!query) return byType;
    return byType.filter((m) =>
      [m.content, m.content_type, m.memory_metadata ? JSON.stringify(m.memory_metadata) : '']
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [items, filterType, q]);

  const load = async () => {
    setLoading(true);
    try {
      const params: { limit: number; content_type?: string; core?: boolean } = { limit: pageSize };
      if (filterType !== 'all') params.content_type = filterType;
      if (coreOnly) params.core = true;
      const data = await listMyMemories(params);
      data.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
      setItems(data);
    } catch (e) {
      console.error('Failed to load memories', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openHistory = (faissId?: string) => {
    if (!faissId) return;
    setHistoryFaissId(faissId);
    setShowHistory(true);
  };

  const prefetchAuditCount = async (faissId?: string) => {
    if (!faissId) return;
    if (auditCounts[faissId] !== undefined) return;
    try {
      const res = await getMemoryAudit(faissId, { limit: 1, skip: 0 });
      setAuditCounts((m) => ({ ...m, [faissId]: res.total }));
    } catch {
      // silent fail; keep UI clean
    }
  };

  const onDelete = async (id: string) => {
    if (!id) return;
    const confirmed = window.confirm('Delete this memory? This action cannot be undone.');
    if (!confirmed) return;
    try {
      setDeleting((d) => ({ ...d, [id]: true }));
      await deleteMemory(id);
      setItems((arr) => arr.filter((m) => m.id !== id));
    } catch (e) {
      console.error('Delete failed', e);
      alert('Failed to delete memory');
    } finally {
      setDeleting((d) => ({ ...d, [id]: false }));
    }
  };

  const onHardDelete = async (id: string) => {
    if (!id) return;
    const confirmed = window.confirm('Hard delete this memory permanently? This cannot be undone.');
    if (!confirmed) return;
    try {
      setDeleting((d) => ({ ...d, [id]: true }));
      await hardDeleteMemory(id);
      setItems((arr) => arr.filter((m) => m.id !== id));
    } catch (e) {
      console.error('Hard delete failed', e);
      alert('Failed to hard delete memory');
    } finally {
      setDeleting((d) => ({ ...d, [id]: false }));
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, coreOnly, pageSize]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Browse Memories</h2>
        <div className="flex items-center space-x-2">
          <button onClick={() => load()} className="px-3 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
            Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:space-x-3 space-y-3 md:space-y-0">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter locally by content or metadata..."
          className="w-full md:w-1/2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as MemoryType | 'all')}
          className="w-full md:w-56 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {CONTENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <label className="inline-flex items-center space-x-2 text-sm">
          <input type="checkbox" checked={coreOnly} onChange={(e) => setCoreOnly(e.target.checked)} />
          <span>Core only</span>
        </label>
        <label className="inline-flex items-center space-x-2 text-sm">
          <span>Page size:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-sm"
          >
            {[25, 50, 100, 200].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading memories…</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No memories found.</div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filtered.map((m) => (
              <li key={m.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${typeBadgeColor(m.content_type)}`}>{m.content_type}</span>
                      <span className="text-xs text-gray-500">{new Date(m.timestamp).toLocaleString()}</span>
                      {typeof m.importance_score === 'number' && (
                        <span className="text-xs text-gray-500">· importance {Math.round(m.importance_score)}</span>
                      )}
                      {typeof m.relevance_score === 'number' && (
                        <span className="text-xs text-gray-500">· relevance {Math.round((m.relevance_score || 0) * 100)}%</span>
                      )}
                      {m.faiss_id && auditCounts[m.faiss_id] !== undefined && (
                        <span className="text-xs text-gray-500">· Updated {auditCounts[m.faiss_id]} times</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{m.content}</p>
                    {m.memory_metadata && (
                      <pre className="mt-2 text-xs text-gray-500 overflow-x-auto">{JSON.stringify(m.memory_metadata, null, 2)}</pre>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex space-x-2">
                      {m.faiss_id && (
                        <button
                          onMouseEnter={() => void prefetchAuditCount(m.faiss_id)}
                          onFocus={() => void prefetchAuditCount(m.faiss_id)}
                          onClick={() => openHistory(m.faiss_id)}
                          className="px-2 py-1 text-xs rounded-md bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700"
                          aria-label={`View history for memory ${m.faiss_id}`}
                        >
                          {auditCounts[m.faiss_id] !== undefined ? `History (${auditCounts[m.faiss_id]})` : 'History'}
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(m.id)}
                        disabled={!!deleting[m.id]}
                        className="px-2 py-1 text-xs rounded-md bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                        aria-label={`Delete memory ${m.id}`}
                      >
                        {deleting[m.id] ? 'Deleting…' : 'Soft delete'}
                      </button>
                      <button
                        onClick={() => onHardDelete(m.id)}
                        disabled={!!deleting[m.id]}
                        className="px-2 py-1 text-xs rounded-md bg-red-700 text-white hover:bg-red-800 disabled:opacity-50"
                        aria-label={`Hard delete memory ${m.id}`}
                      >
                        {deleting[m.id] ? 'Deleting…' : 'Hard delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <HistoryDrawer open={showHistory} onClose={() => setShowHistory(false)} faissId={historyFaissId} />
    </div>
  );
}
