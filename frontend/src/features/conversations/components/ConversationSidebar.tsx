  import { PlusIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useConversations, useCreateConversation, useUpdateConversation, useDeleteConversation } from '..';

export function ConversationSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { data: conversations, isLoading } = useConversations();
  const { mutate: createConversation, isPending: isCreating } = useCreateConversation();
  const { mutate: updateConversation } = useUpdateConversation();
  const { mutate: deleteConversation, mutateAsync: deleteConversationAsync } = useDeleteConversation();

  // Bulk selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const allIds = useMemo(() => (conversations || []).map((c) => c.id), [conversations]);
  const selectedCount = selectedIds.size;
  const hasSelections = selectedCount > 0;

  // Ensure server timestamps (may be UTC without tz) render in local time
  const normalizeUtcToLocal = useCallback((ts: string | number | Date) => {
    if (ts instanceof Date) return ts;
    if (typeof ts === 'number') return new Date(ts);
    if (typeof ts === 'string') {
      let s = ts.trim();
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) s = s.replace(' ', 'T');
      if (!(/[zZ]$/.test(s) || /[+-]\d{2}:\d{2}$/.test(s))) s = s + 'Z';
      const d = new Date(s);
      return isNaN(d.getTime()) ? new Date(ts) : d;
    }
    return new Date();
  }, []);

  const handleNewConversation = useCallback(() => {
    createConversation(
      { title: undefined },
      {
        onSuccess: (data) => {
          router.push(`/chat/${data.id}`);
        },
      }
    );
  }, [createConversation, router]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(allIds));
  }, [allIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (!hasSelections) return;
    if (!confirm(`Delete ${selectedCount} conversation${selectedCount > 1 ? 's' : ''}? This cannot be undone.`)) return;
    setIsDeleting(true);
    // Navigate away if current is among selected to avoid 404 flash
    let activeId: string | null = null;
    if (pathname?.startsWith('/chat/')) {
      const rest = pathname.slice('/chat/'.length);
      activeId = rest.split('/')[0];
    }
    if (activeId && selectedIds.has(activeId)) {
              router.push('/chat');
    }
    // Optimistically remove from cache for instant UI feedback
    try {
      const prev = queryClient.getQueryData<any[]>(['conversations']) || [];
      const next = prev.filter((c) => !selectedIds.has(c.id));
      queryClient.setQueryData(['conversations'], next);
      // Also drop any per-conversation caches
      for (const id of selectedIds) {
        queryClient.removeQueries({ queryKey: ['conversation', id], exact: true });
      }
    } catch (_) {
      // ignore cache errors
    }
    // Perform deletes in parallel, but swallow individual failures
    const ids = Array.from(selectedIds);
    await Promise.allSettled(ids.map((id) => deleteConversationAsync({ id })));
    // Ensure server truth is reflected after operations
    await queryClient.invalidateQueries({ queryKey: ['conversations'] });
    await queryClient.refetchQueries({ queryKey: ['conversations'] });
    clearSelection();
    setSelectionMode(false);
    setIsDeleting(false);
  }, [hasSelections, selectedCount, pathname, selectedIds, router, deleteConversationAsync, clearSelection, queryClient]);

  return (
    <div className="relative w-64 bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm border-r border-gray-200/60 dark:border-gray-700/60 flex flex-col sticky top-16 md:top-20 self-start h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]">
      {/* Subtle bottom-left overlay to blend with app background */}
      <div className="pointer-events-none absolute bottom-0 left-0 w-10 h-10 bg-gradient-to-tr from-white/40 to-transparent dark:from-gray-900/40" />
      <div className="p-3 border-b border-gray-200 space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewConversation}
            disabled={isCreating || selectionMode || isDeleting}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-4 w-4" />
            New Chat
          </button>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs">
          <button
            onClick={() => {
              setSelectionMode((v) => !v);
              if (selectionMode) clearSelection();
            }}
            disabled={isDeleting}
            className={`px-2 py-1 rounded border ${selectionMode ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-900/30' : 'text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100/60 dark:hover:bg-gray-800/40'} disabled:opacity-50`}
          >
            {selectionMode ? 'Cancel' : 'Select'}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              disabled={!selectionMode || !allIds.length || isDeleting}
              className="px-2 py-1 rounded border text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 disabled:opacity-50"
            >
              Select All
            </button>
            <button
              onClick={clearSelection}
              disabled={!selectionMode || !hasSelections || isDeleting}
              className="px-2 py-1 rounded border text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 disabled:opacity-50"
            >
              Clear
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={!selectionMode || !hasSelections || isDeleting}
              className="inline-flex items-center gap-1 px-2 py-1 rounded border text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-50"
              title={hasSelections ? (isDeleting ? 'Deleting…' : `Delete ${selectedCount} selected`) : 'Delete selected'}
            >
              <TrashIcon className="h-4 w-4" />
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-hidden hover:overflow-y-auto pr-1">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading conversations...</div>
        ) : conversations?.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No conversations yet</div>
        ) : (
          <nav className="space-y-1 p-2">
            {conversations?.map((conversation) => {
              const isActive = pathname === `/chat/${conversation.id}`;
              const isChecked = selectedIds.has(conversation.id);
              return (
                <div key={conversation.id} className={`group flex flex-col p-3 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-50/70 text-indigo-700 font-medium dark:bg-indigo-900/30 dark:text-indigo-200'
                    : 'text-gray-700 hover:bg-gray-100/70 dark:text-gray-200 dark:hover:bg-gray-800/40'
                }`}>
                  <div className="flex items-center gap-2">
                    {selectionMode && (
                      <input
                        aria-label="Select conversation"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={isChecked}
                        onChange={() => toggleSelection(conversation.id)}
                      />
                    )}
                    {selectionMode ? (
                      <span className="flex-1 truncate select-none">
                        {conversation.title || 'Untitled conversation'}
                      </span>
                    ) : (
                      <Link href={`/chat/${conversation.id}`} className="flex-1 truncate">
                        {conversation.title || 'Untitled conversation'}
                      </Link>
                    )}
                    <button
                      disabled={selectionMode || isDeleting}
                      className="opacity-0 group-hover:opacity-100 text-xs text-indigo-600 hover:underline disabled:opacity-50"
                      onClick={() => {
                        const title = prompt('Rename conversation', conversation.title || '');
                        if (title != null) {
                          updateConversation({ id: conversation.id, title: title.trim() || 'Untitled conversation' });
                        }
                      }}
                    >
                      Rename
                    </button>
                    <button
                      disabled={selectionMode || isDeleting}
                      className="opacity-0 group-hover:opacity-100 text-xs text-red-600 hover:underline disabled:opacity-50"
                      onClick={() => {
                        if (confirm('Delete this conversation?')) {
                          // If currently viewing this conversation, navigate away first to avoid 404 flash
                          if (isActive) {
                            router.push('/chat');
                          }
                          deleteConversation({ id: conversation.id });
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                  <span
                    className={`text-xs mt-1 ${
                      isActive ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {format(normalizeUtcToLocal(conversation.updated_at as any), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
