import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { executeAction, listActions, undoAction, type ActionDescriptor } from '@/features/actions/api';

export interface ActionHandlers {
  actionsByName: Record<string, ActionDescriptor>;
  permOpen: boolean;
  setPermOpen: (value: boolean) => void;
  permAction: { action: string; label: string; description?: string; scopes?: string[]; params?: Record<string, any> } | null;
  setPermAction: (value: any) => void;
  requestRun: (action: { name: string; title?: string; description?: string; permissions?: string[] }, params?: Record<string, any>) => void;
  runActionWithPolicy: (name: string, label: string, params?: Record<string, any>) => Promise<void>;
  toToastMessage: (v: any) => string;
}

export function useActionHandlers(): ActionHandlers {
  const [actionsByName, setActionsByName] = useState<Record<string, ActionDescriptor>>({});
  const [permOpen, setPermOpen] = useState<boolean>(false);
  const [permAction, setPermAction] = useState<{ action: string; label: string; description?: string; scopes?: string[]; params?: Record<string, any> } | null>(null);

  // Coerce any error-like value to a safe, readable string for toasts
  const toToastMessage = useCallback((v: any): string => {
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
  }, []);

  const requestRun = useCallback((a: { name: string; title?: string; description?: string; permissions?: string[] }, params?: Record<string, any>) => {
    setPermAction({ action: a.name, label: a.title || a.name, description: a.description, scopes: a.permissions, params: params || {} });
    setPermOpen(true);
  }, []);

  // Execute with policy: low/medium auto, high => ask permission
  const runActionWithPolicy = useCallback(async (name: string, label: string, params?: Record<string, any>) => {
    const desc = actionsByName[name];
    const risk = (desc?.risk || 'high');
    if (risk === 'high') {
      requestRun({ name, title: label }, params || {});
      return;
    }
    try {
      const res = await executeAction({ action: name, params: params || {} });
      if ((res as any).ok) {
        const undo = (res as any).result?.undo_token as string | undefined;
        if (undo) {
          toast.success(label + ' • done', {
            action: {
              label: 'Undo',
              onClick: async () => {
                try {
                  await undoAction({ undo_token: undo });
                  toast.success('Undone');
                  // If the original action impacted calendar data, also trigger a refresh after undo
                  const isCalendar = name.startsWith('calendar.');
                  const isTracker = (
                    name.startsWith('hydration.') ||
                    name.startsWith('mood.') ||
                    name.startsWith('journal.')
                  );
                  try {
                    if (typeof window !== 'undefined') {
                      if (isCalendar) window.dispatchEvent(new CustomEvent('calendar:refresh'));
                      if (isTracker) window.dispatchEvent(new CustomEvent('trackers:refresh'));
                    }
                  } catch { /* noop */ }
                }
                catch (e: any) { toast.error(e?.message || 'Undo failed'); }
              }
            }
          } as any);
        } else {
          toast.success(label + ' • done');
        }
        // Trigger refresh events for successful actions
        const isCalendar = name.startsWith('calendar.');
        const isTracker = (
          name.startsWith('hydration.') ||
          name.startsWith('mood.') ||
          name.startsWith('journal.')
        );
        try {
          if (typeof window !== 'undefined') {
            if (isCalendar) window.dispatchEvent(new CustomEvent('calendar:refresh'));
            if (isTracker) window.dispatchEvent(new CustomEvent('trackers:refresh'));
          }
        } catch { /* noop */ }
      } else {
        const msg = toToastMessage((res as any).error);
        toast.error(msg || 'Action failed');
      }
    } catch (e: any) {
      toast.error(toToastMessage(e));
    }
  }, [actionsByName, requestRun, toToastMessage]);

  // Load actions catalog once to know risk tiers
  useState(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await listActions();
        if (!mounted) return;
        const map: Record<string, ActionDescriptor> = {};
        (res.actions || []).forEach(a => { map[a.name] = a; });
        setActionsByName(map);
      } catch (_) { /* ignore */ }
    })();
    return () => { mounted = false; };
  });

  return {
    actionsByName,
    permOpen,
    setPermOpen,
    permAction,
    setPermAction,
    requestRun,
    runActionWithPolicy,
    toToastMessage,
  };
}
