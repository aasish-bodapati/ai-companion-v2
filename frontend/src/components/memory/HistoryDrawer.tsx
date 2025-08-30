"use client";

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { getMemoryAudit, type MemoryAuditItem } from '@/features/memory/api';

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  faissId: string | null; // required to fetch
}

// Minimal word diff (LCS-based) to highlight removals/additions.
function renderDiff(before: string, after: string, side: 'before' | 'after') {
  const tokensA = tokenize(before);
  const tokensB = tokenize(after);
  const ops = diffLCS(tokensA, tokensB);
  const spans: ReactNode[] = [];
  ops.forEach((op, i) => {
    if (op.type === 'same') {
      spans.push(<span key={i}>{op.text}</span>);
    } else if (op.type === 'del') {
      if (side === 'before') {
        spans.push(
          <span key={i} className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
            {op.text}
          </span>
        );
      }
    } else if (op.type === 'add') {
      if (side === 'after') {
        spans.push(
          <span key={i} className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
            {op.text}
          </span>
        );
      }
    }
  });
  return <>{spans}</>;
}

function tokenize(s: string): string[] {
  // Preserve whitespace as tokens to keep layout stable
  const parts: string[] = [];
  let buf = '';
  for (const ch of s) {
    if (/\s/.test(ch)) {
      if (buf) {
        parts.push(buf);
        buf = '';
      }
      parts.push(ch);
    } else {
      buf += ch;
    }
  }
  if (buf) parts.push(buf);
  return parts;
}

type Op = { type: 'same' | 'del' | 'add'; text: string };

function diffLCS(a: string[], b: string[]): Op[] {
  // Simple LCS table
  const n = a.length, m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  // Backtrack
  const ops: Op[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: 'same', text: a[i] });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: 'del', text: a[i] });
      i++;
    } else {
      ops.push({ type: 'add', text: b[j] });
      j++;
    }
  }
  while (i < n) ops.push({ type: 'del', text: a[i++] });
  while (j < m) ops.push({ type: 'add', text: b[j++] });
  return ops;
}

export default function HistoryDrawer({ open, onClose, faissId }: HistoryDrawerProps) {
  const [items, setItems] = useState<MemoryAuditItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState<number>(0);
  const [limit, setLimit] = useState<number>(20);
  const [showDiff, setShowDiff] = useState<Record<string, boolean>>({});

  const hasNext = useMemo(() => skip + items.length < total, [skip, items.length, total]);
  const hasPrev = useMemo(() => skip > 0, [skip]);

  useEffect(() => {
    if (!open) return;
    if (!faissId) return;
    setLoading(true);
    setError(null);
    void getMemoryAudit(faissId, { skip, limit })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((e: unknown) => {
        // Do not leak details to UI
        setError('Failed to load history');
        setItems([]);
        setTotal(0);
        console.error('HistoryDrawer load failed', e);
      })
      .finally(() => setLoading(false));
  }, [open, faissId, skip, limit]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full sm:w-[32rem] bg-white dark:bg-gray-900 shadow-xl border-l border-gray-200 dark:border-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-base font-semibold">History</h3>
          <button onClick={onClose} className="px-2 py-1 text-sm rounded-md bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700">
            Close
          </button>
        </div>

        {/* Controls */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between text-sm">
          <div className="space-x-2">
            <span className="text-gray-600 dark:text-gray-400">Total:</span>
            <span>{total}</span>
          </div>
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-1">
              <span className="text-gray-600 dark:text-gray-400">Page size</span>
              <select
                className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1"
                value={limit}
                onChange={(e) => {
                  setSkip(0);
                  setLimit(Number(e.target.value));
                }}
              >
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => setSkip(Math.max(0, skip - limit))}
              disabled={!hasPrev}
              className="px-2 py-1 rounded-md text-sm bg-gray-200 dark:bg-gray-800 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setSkip(skip + limit)}
              disabled={!hasNext}
              className="px-2 py-1 rounded-md text-sm bg-gray-200 dark:bg-gray-800 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-sm text-gray-500">Loading…</div>
          ) : error ? (
            <div className="p-4 text-sm text-rose-600">{error}</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No audit events yet.</div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {items.map((ev) => (
                <li key={ev.id} className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">{actionIcon(ev.action)}</div>
                    <div className="flex-1 pr-3">
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                          {ev.action}
                        </span>
                        <span>{new Date(ev.created_at).toLocaleString()}</span>
                        {ev.request_ip && <span className="text-gray-500">· {truncate(ev.request_ip, 40)}</span>}
                        {ev.user_agent && (
                          <span className="text-gray-500 truncate max-w-[14rem]" title={ev.user_agent}>
                            · {truncate(ev.user_agent, 80)}
                          </span>
                        )}
                      </div>
                      {(ev.before_content || ev.after_content) && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-[11px] text-gray-500">Content changes</div>
                            <button
                              className="text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                              onClick={() => setShowDiff((s) => ({ ...s, [ev.id]: !s[ev.id] }))}
                            >
                              {showDiff[ev.id] ? 'Hide diff' : 'Show diff'}
                            </button>
                          </div>
                          {showDiff[ev.id] ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <div className="text-[11px] text-gray-500">Before</div>
                                <div className="mt-1 text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words max-h-40 overflow-auto">
                                  {renderDiff(ev.before_content || '', ev.after_content || '', 'before')}
                                </div>
                              </div>
                              <div>
                                <div className="text-[11px] text-gray-500">After</div>
                                <div className="mt-1 text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words max-h-40 overflow-auto">
                                  {renderDiff(ev.before_content || '', ev.after_content || '', 'after')}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <div className="text-[11px] text-gray-500">Before</div>
                                <pre className="mt-1 text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words max-h-40 overflow-auto">
                                  {truncate(ev.before_content)}
                                </pre>
                              </div>
                              <div>
                                <div className="text-[11px] text-gray-500">After</div>
                                <pre className="mt-1 text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words max-h-40 overflow-auto">
                                  {truncate(ev.after_content)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function truncate(v?: string | null, n = 280): string {
  const s = (v ?? '').toString();
  if (s.length <= n) return s;
  return s.slice(0, n) + '…';
}

function actionIcon(action: string) {
  const cls = 'w-4 h-4 text-gray-500';
  switch (action) {
    case 'update':
      // Pencil icon
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={cls} aria-hidden>
          <path d="M12.293 2.293a1 1 0 0 1 1.414 0l3.999 4a1 1 0 0 1 0 1.414l-9.5 9.5a1 1 0 0 1-.45.263l-4 1a1 1 0 0 1-1.213-1.213l1-4a1 1 0 0 1 .263-.45l9.5-9.5Z"/>
          <path d="M11 4l5 5" stroke="currentColor" strokeWidth="2"/>
        </svg>
      );
    case 'soft_delete':
      // Trash icon
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={cls} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2" />
        </svg>
      );
    case 'hard_delete':
      // Skull/cross (use X-circle)
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={cls} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9Zm-3 3l6 12M9 15l6-6" />
        </svg>
      );
    case 'search':
      // Magnifying glass
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={cls} aria-hidden>
          <circle cx="11" cy="11" r="7" strokeWidth="2"/>
          <path d="M20 20l-3-3" strokeWidth="2"/>
        </svg>
      );
    default:
      return <div className={cls} />;
  }
}
