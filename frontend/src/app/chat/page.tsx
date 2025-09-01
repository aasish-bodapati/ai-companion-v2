'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConversations, useCreateConversation } from '@/features/conversations';

export default function ChatIndexPage() {
  const router = useRouter();
  const { data: conversations, isLoading } = useConversations();
  const { mutate: createConversation, isPending: isCreating } = useCreateConversation();

  useEffect(() => {
    // Wait for conversations to load
    if (isLoading) return;

    // If conversations exist, redirect to the most recent one
    if (conversations && conversations.length > 0) {
      router.replace(`/chat/${conversations[0].id}`);
      return;
    }

    // No conversations exist, create a new one
    if (!isCreating) {
      createConversation(
        { title: undefined },
        {
          onSuccess: (data) => {
            router.replace(`/chat/${data.id}`);
          },
          onError: (error) => {
            console.error('Failed to create conversation:', error);
            // Fallback: redirect to a basic chat page
            router.replace('/chat/new');
          },
        }
      );
    }
  }, [conversations, isLoading, isCreating, createConversation, router]);

  // Show loading state
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="text-center bg-white/80 dark:bg-gray-900/60 backdrop-blur-md rounded-xl px-6 py-5 shadow-glow border border-indigo-100/60 dark:border-indigo-900/30">
        <div className="flex items-center justify-center gap-2 text-indigo-700 dark:text-indigo-300">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
          <div className="font-medium">
            {isLoading ? 'Loading conversations...' : 'Setting up your chat...'}
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {isLoading ? 'Checking your chat history' : 'Creating a new conversation'}
        </div>
      </div>
    </div>
  );
}


