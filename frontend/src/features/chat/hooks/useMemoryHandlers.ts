import { useState, useCallback, useEffect } from 'react';
import { createMemory, getMemoryDigest, getConversationMemoryContext, deleteMemory, type MemoryDigestOut, type MemoryContextItem } from '@/features/memory/api';

export interface MemoryHandlers {
  digest: MemoryDigestOut | null;
  setDigest: (value: MemoryDigestOut | null) => void;
  savedQuick: Record<string, { id: string }>;
  setSavedQuick: (value: Record<string, { id: string }>) => void;
  expandedContext: Record<string, boolean>;
  setExpandedContext: (value: Record<string, boolean>) => void;
  convContextCount: number | null;
  setConvContextCount: (value: number | null) => void;
  ctxByMessage: Record<string, MemoryContextItem[] | null>;
  setCtxByMessage: (value: Record<string, MemoryContextItem[] | null>) => void;
  lastImportance: number;
  setLastImportance: (value: number) => void;
  memQuickSaveEnabled: boolean;
  setMemQuickSaveEnabled: (value: boolean) => void;
  memShowSavedInline: boolean;
  setMemShowSavedInline: (value: boolean) => void;
  memRememberByDefault: boolean;
  setMemRememberByDefault: (value: boolean) => void;
  memSettingsOpen: boolean;
  setMemSettingsOpen: (value: boolean) => void;
  quickSaveMessage: (message: any) => Promise<void>;
  undoQuickSave: (messageId: string) => Promise<void>;
}

export function useMemoryHandlers(conversationId: string | null): MemoryHandlers {
  const [digest, setDigest] = useState<MemoryDigestOut | null>(null);
  const [savedQuick, setSavedQuick] = useState<Record<string, { id: string }>>({});
  const [expandedContext, setExpandedContext] = useState<Record<string, boolean>>({});
  const [convContextCount, setConvContextCount] = useState<number | null>(null);
  const [ctxByMessage, setCtxByMessage] = useState<Record<string, MemoryContextItem[] | null>>({});
  
  // Minimal quick-save UX state
  const [lastImportance, setLastImportance] = useState<number>(() => {
    if (typeof window === 'undefined') return 50;
    const v = Number(window.localStorage.getItem('mem.lastImportance'));
    return isNaN(v) ? 50 : Math.max(0, Math.min(100, v));
  });

  // Pending Memories: lightweight settings persisted locally
  const [memQuickSaveEnabled, setMemQuickSaveEnabled] = useState<boolean>(() => {
    try { return (window.localStorage.getItem('mem.quickSaveEnabled') ?? 'true') === 'true'; } catch { return true; }
  });
  const [memShowSavedInline, setMemShowSavedInline] = useState<boolean>(() => {
    try { return (window.localStorage.getItem('mem.showSavedInline') ?? 'true') === 'true'; } catch { return true; }
  });
  const [memRememberByDefault, setMemRememberByDefault] = useState<boolean>(() => {
    try { return (window.localStorage.getItem('mem.rememberByDefault') ?? 'false') === 'true'; } catch { return false; }
  });
  const [memSettingsOpen, setMemSettingsOpen] = useState<boolean>(false);

  // Hover quick-save action for user messages (minimal, inline UX)
  const quickSaveMessage = useCallback(async (message: any) => {
    if (!conversationId || !message?.content) return;
    try {
      const body = {
        content: message.content,
        content_type: 'message',
        conversation_id: conversationId,
        importance_score: lastImportance,
        source: 'chat:quick-save',
        message_id: message?.id,
      } as const;
      const saved = await createMemory(body);
      setSavedQuick((s) => ({ ...s, [message.id]: { id: saved.id } }));
      try { if (typeof window !== 'undefined') window.localStorage.setItem('mem.lastImportance', String(lastImportance)); } catch {}
    } catch (e) {
      console.error('Quick save failed', e);
    }
  }, [conversationId, lastImportance]);

  // Undo for quick-save (inline, subtle)
  const undoQuickSave = useCallback(async (messageId: string) => {
    const memId = savedQuick[messageId]?.id;
    if (!memId) return;
    try {
      await deleteMemory(memId);
    } catch (_) { /* ignore */ }
    setSavedQuick((s) => {
      const n = { ...s };
      delete n[messageId];
      return n;
    });
  }, [savedQuick]);

  // Fetch context count once for collapsed line (after conversationId exists)
  useEffect(() => {
    if (!conversationId) return;
    (async () => {
      try {
        const out = await getConversationMemoryContext(conversationId);
        setConvContextCount(Array.isArray(out?.context) ? out.context.length : 0);
      } catch (_) {
        setConvContextCount(null);
      }
    })();
  }, [conversationId]);

  return {
    digest,
    setDigest,
    savedQuick,
    setSavedQuick,
    expandedContext,
    setExpandedContext,
    convContextCount,
    setConvContextCount,
    ctxByMessage,
    setCtxByMessage,
    lastImportance,
    setLastImportance,
    memQuickSaveEnabled,
    setMemQuickSaveEnabled,
    memShowSavedInline,
    setMemShowSavedInline,
    memRememberByDefault,
    setMemRememberByDefault,
    memSettingsOpen,
    setMemSettingsOpen,
    quickSaveMessage,
    undoQuickSave,
  };
}
