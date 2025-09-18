'use client';

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
  const { mutate: deleteConversation } = useDeleteConversation();

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
      { title: 'New Conversation' },
      {
        onSuccess: (newConversation) => {
          router.push(`/chat/${newConversation.id}`);
        },
      }
    );
  }, [createConversation, router]);

  const handleRename = useCallback(
    (id: string, newTitle: string) => {
      updateConversation({ id, title: newTitle });
    },
    [updateConversation]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm('Are you sure you want to delete this conversation?')) {
        deleteConversation({ id }, {
          onSuccess: () => {
            if (pathname === `/chat/${id}`) {
              router.push('/chat');
            }
          },
        });
      }
    },
    [deleteConversation, pathname, router]
  );

  const sortedConversations = useMemo(() => {
    if (!conversations) return [];
    return [...conversations].sort((a, b) => {
      const aTime = normalizeUtcToLocal(a.updated_at || a.created_at).getTime();
      const bTime = normalizeUtcToLocal(b.updated_at || b.created_at).getTime();
      return bTime - aTime;
    });
  }, [conversations, normalizeUtcToLocal]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Conversations</h2>
          <button
            onClick={handleNewConversation}
            disabled={isCreating}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors"
          >
            {isCreating ? 'Creating...' : 'New'}
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {sortedConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <p>No conversations yet</p>
            <p className="text-sm mt-1">Start a new conversation to get AI health insights</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sortedConversations.map((conversation) => {
              const isActive = pathname === `/chat/${conversation.id}`;
              const lastUpdated = normalizeUtcToLocal(conversation.updated_at || conversation.created_at);
              
              return (
                <div
                  key={conversation.id}
                  className={`group relative rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Link
                    href={`/chat/${conversation.id}`}
                    className="block p-3 pr-8"
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {conversation.title || 'Untitled Conversation'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {format(lastUpdated, 'MMM d, h:mm a')}
                    </div>
                  </Link>
                  
                  {/* Actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          const newTitle = prompt('Enter new title:', conversation.title || '');
                          if (newTitle && newTitle !== conversation.title) {
                            handleRename(conversation.id, newTitle);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                        title="Rename"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDelete(conversation.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}