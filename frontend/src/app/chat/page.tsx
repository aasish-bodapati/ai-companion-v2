'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useConversations, useCreateConversation } from '@/features/conversations';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import api from '@/lib/api';

export default function ChatIndexPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: conversations, isLoading } = useConversations();
  const { mutate: createConversation, isPending: isCreating } = useCreateConversation();
  const [hasAutoCreated, setHasAutoCreated] = useState(false);
  // Check if we're coming from a bulk delete operation
  const isFromBulkDelete = searchParams.get('bulkDelete') === 'true';

  useEffect(() => {
    // Wait for conversations to load
    if (isLoading) return;

    // If conversations exist, redirect to the most recent one
    if (conversations && conversations.length > 0) {
      router.replace(`/chat/${conversations[0].id}`);
      return;
    }

    // No conversations exist, create one automatically
    // Use a small delay for bulk delete to ensure smooth UX
    if (!isCreating && !hasAutoCreated) {
      setHasAutoCreated(true);
      const delay = isFromBulkDelete ? 500 : 0; // Small delay for bulk delete
      
      setTimeout(() => {
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
      }, delay);
    }
  }, [conversations, isLoading, isCreating, createConversation, router, hasAutoCreated, isFromBulkDelete]);

  // Show loading state
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

          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                {isLoading ? 'Loading conversations...' : 
                 isFromBulkDelete ? 'Starting fresh conversation...' : 'Setting up your chat...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}


