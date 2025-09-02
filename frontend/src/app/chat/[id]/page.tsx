'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCreateConversation, useConversation, useUpdateConversation } from '@/features/conversations';
import { ConversationSidebar } from '@/features/conversations/components/ConversationSidebar';
import { TwoModeChatInterface } from '@/components/chat/TwoModeChatInterface';
import { NudgeInbox } from '@/features/nudges/components/NudgeInbox';
import { getMemoryDigest, enforceLifecycle, type MemoryDigestOut } from '@/features/memory/api';
import ChatHeader from '@/components/chat/ChatHeader';

export default function ChatPage() {
  const params = useParams();
  const conversationId = (params?.id as string) || null;
  const { data: conversation } = useConversation(conversationId);
  const { mutate: updateConversation } = useUpdateConversation();
  const [title, setTitle] = useState('');
  const [saved, setSaved] = useState(false);
  const [digest, setDigest] = useState<MemoryDigestOut | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  // Plan cancel hook removed
  const nudgesEnabled = process.env.NEXT_PUBLIC_FEATURE_NUDGES === 'true';

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


  // Brain Meter: fetch digest periodically
  useEffect(() => {
    let cancelled = false;
    async function loadDigest() {
      try {
        const d = await getMemoryDigest();
        if (!cancelled) setDigest(d);
      } catch {
        // ignore
      }
    }
    loadDigest();
    const id = setInterval(loadDigest, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [conversationId]);

  const handleOptimize = async () => {
    try {
      setOptimizing(true);
      await enforceLifecycle(true);
      const d = await getMemoryDigest();
      setDigest(d);
    } catch {
      // no-op
    } finally {
      setOptimizing(false);
    }
  };

  return (
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
        
        {/* Brain Meter and Optimize Button */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Brain Meter Chip */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/70 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 text-sm shadow-sm">
              <span role="img" aria-label="brain">🧠</span>
              <span className="font-medium">L{digest?.level ?? 1}</span>
              <span className="text-gray-500 dark:text-gray-400">• Memories {digest?.total_count ?? 0}</span>
            </div>
            
            {/* Title Edit (moved from header) */}
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
          
          {/* Optimize Button */}
          <button
            type="button"
            onClick={handleOptimize}
            disabled={optimizing}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {optimizing ? 'Optimizing...' : '🧠 Optimize Memory'}
          </button>
        </div>

        {/* Main Chat Interface */}
        <div className="flex-1 min-h-0">
          {conversationId && <TwoModeChatInterface conversationId={conversationId} />}
        </div>

        {/* Nudge Inbox */}
        {nudgesEnabled && conversationId && (
          <NudgeInbox conversationId={conversationId} />
        )}
      </div>
    </div>
  );
}
