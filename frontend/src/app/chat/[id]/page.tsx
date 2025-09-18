'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCreateConversation, useConversation, useUpdateConversation } from '@/features/conversations';
import { ConversationSidebar } from '@/features/conversations/components/ConversationSidebar';
import { EnhancedChatInterface } from '@/features/chat/ui/EnhancedChatInterface';
// NudgeInbox removed for Milestone 1 simplicity
// ChatHeader removed for simplified design
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import api from '@/lib/api';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = (params?.id as string) || null;
  const { data: conversation } = useConversation(conversationId);
  const { mutate: updateConversation } = useUpdateConversation();
  const [title, setTitle] = useState('');
  const [saved, setSaved] = useState(false);

  // Sync local title with server
  useEffect(() => {
    setTitle(conversation?.title || '');
  }, [conversation?.title]);

  // Debounce saving title
  useEffect(() => {
    if (!conversationId) return;
    const serverTitle = (conversation?.title || '').trim();
    const nextTitle = title.trim();
    if (nextTitle === serverTitle) return; // no-op if unchanged
    const t = setTimeout(() => {
      updateConversation({ id: conversationId, title: nextTitle });
      if (nextTitle !== serverTitle) {
        setSaved(true);
        setTimeout(() => setSaved(false), 800);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [title, conversationId, conversation?.title, updateConversation]);




  // Show loading state if no conversation ID
  if (!conversationId) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 rounded-3xl mb-8">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative px-8 py-12">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-3">
                    AI Health Coach
                  </h1>
                  <p className="text-xl text-white/90 mb-6 max-w-2xl">
                    Get personalized health insights, track your progress, and receive intelligent recommendations from your AI companion.
                  </p>
                  <div className="flex items-center gap-4 text-white/80">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span className="text-sm">Personalized Insights</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                      <span className="text-sm">Health Guidance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-sm">Smart Recommendations</span>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <svg className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            <ConversationSidebar />
            <div className="flex-1 flex flex-col">
              {/* Simple Header */}
              <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 px-6 py-4">
                <div className="flex items-center gap-2">
                  <input
                    className="bg-transparent text-lg font-medium text-gray-900 dark:text-white outline-none border-b border-transparent focus:border-gray-300 dark:focus:border-gray-600 px-2 py-1 transition-colors"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Untitled conversation"
                  />
                  {saved && <span className="text-xs text-green-600 dark:text-green-400">✓ Saved</span>}
                </div>
              </div>

              {/* Main Chat Interface */}
              <div className="flex-1 min-h-0">
                {conversationId && <EnhancedChatInterface conversationId={conversationId} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
