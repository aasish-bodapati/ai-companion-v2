import React, { useEffect, useMemo, useState } from 'react';
import { listActions, executeAction, type ActionDescriptor } from './api';
import { toast } from 'sonner';

export type CapabilitiesPanelProps = {
  onInsert: (text: string) => void;
  onRequestRun?: (a: ActionDescriptor) => void;
};

const CapabilitiesPanel: React.FC<CapabilitiesPanelProps> = ({ onInsert, onRequestRun }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actions, setActions] = useState<ActionDescriptor[]>([]);
  const [q, setQ] = useState<string>('');

  const toToastMessage = (v: any): string => {
    try {
      if (typeof v === 'string') return v;
      if (v && typeof v.message === 'string') return v.message;
      if (v && typeof v.detail === 'string') return v.detail;
      if (v && typeof v.error === 'string') return v.error;
      if (v && Array.isArray(v.errors) && v.errors.length > 0) {
        const first = v.errors[0];
        if (first?.msg) return String(first.msg);
      }
      if (v && typeof v.detail === 'object') return JSON.stringify(v.detail);
      if (v && typeof v === 'object') return JSON.stringify(v);
    } catch (_) { /* ignore */ }
    return 'Action failed';
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    listActions()
      .then((res) => {
        if (!mounted) return;
        setActions(res.actions || []);
      })
      .catch((e: any) => {
        if (!mounted) return;
        setError(e?.message || 'Failed to load actions');
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return actions;
    return actions.filter(a =>
      a.name.toLowerCase().includes(s) ||
      (a.title || '').toLowerCase().includes(s) ||
      (a.description || '').toLowerCase().includes(s) ||
      (a.category || '').toLowerCase().includes(s)
    );
  }, [q, actions]);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 space-y-3" data-testid="capabilities-panel">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search actions..."
          className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent"
          data-testid="capabilities-search"
        />
        <span className="text-xs text-gray-500">{filtered.length} / {actions.length}</span>
      </div>
      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800 max-h-64 overflow-auto" data-testid="capabilities-list">
          {filtered.map((a) => (
            <li key={a.name} className="py-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{a.title || a.name}</div>
                  <div className="text-[12px] text-gray-500">{a.name}</div>
                  {a.description && (
                    <div className="mt-1 text-[12px] text-gray-600 dark:text-gray-300 line-clamp-2">{a.description}</div>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    className="text-[11px] px-2 py-1 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50"
                    data-testid="capability-insert"
                    title="Insert as prompt"
                    onClick={() => {
                      const template = '```actions\n' + JSON.stringify([{ action: a.name, params: {} }], null, 2) + '\n```';
                      onInsert(template);
                    }}
                  >Insert</button>
                  <button
                    type="button"
                    className="text-[11px] px-2 py-1 rounded-full border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                    data-testid="capability-run"
                    title="Run with confirmation"
                    onClick={async () => {
                      if (onRequestRun) {
                        onRequestRun(a);
                        return;
                      }
                      // Fallback: execute directly if no permission handler provided
                      const label = a.title || a.name;
                      try {
                        const res = await executeAction({ action: a.name, params: {} });
                        if ((res as any).ok) toast.success(label + ' • done');
                        else toast.error(toToastMessage((res as any).error));
                      } catch (e: any) {
                        toast.error(toToastMessage(e));
                      }
                    }}
                  >Run</button>
                </div>
              </div>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="py-3 text-sm text-gray-500">No actions</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default CapabilitiesPanel;
