'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCreateConversation, useConversation, useUpdateConversation } from '@/features/conversations';
import { ConversationSidebar } from '@/features/conversations/components/ConversationSidebar';
import { EnhancedChatInterface } from '@/components/chat/EnhancedChatInterface';
// NudgeInbox removed for Milestone 1 simplicity
import ChatHeader from '@/components/chat/ChatHeader';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ChatPage() {
  const params = useParams();
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




  return (
    <ProtectedRoute>
      <div className="flex min-h-[calc(100vh-4rem)]">
      <ConversationSidebar />
      <div className="relative flex-1 min-h-0 backdrop-blur-md bg-white/70 dark:bg-gray-900/40">
        {/* Decorative overlay to even out bottom-left shade */}
        <div className="pointer-events-none absolute bottom-0 left-0 w-28 h-28 md:w-40 md:h-40 rounded-2xl bg-gradient-to-tr from-white/40 to-transparent dark:from-gray-800/30" />
        
        {/* Enhanced Chat Header with Memory Context */}
        <ChatHeader 
          conversationId={conversationId || ''} 
          title={title || 'Untitled conversation'}
        />
        
        {/* Simple Title Edit */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <input
              className="bg-transparent text-sm text-gray-600 dark:text-gray-400 outline-none border-b border-transparent focus:border-gray-300 dark:focus:border-gray-600 px-2 py-1 transition-colors"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Edit conversation title..."
            />
            {saved && <span className="text-xs text-green-600 dark:text-green-400">✓ Saved</span>}
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="flex-1 min-h-0">
          {conversationId && <EnhancedChatInterface conversationId={conversationId} />}
        </div>

        {/* Nudge Inbox removed for Milestone 1 simplicity */}
      </div>
    </div>
    </ProtectedRoute>
  );
}
