import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Message } from '../types';

interface SendMessageParams {
  content: string;
  role?: 'user' | 'assistant';
  idempotencyKey?: string;
  requestId?: string;
}

interface StreamCallbacks {
  onChunk?: (text: string) => void;
  onDone?: () => void;
  onError?: (err: unknown) => void;
}

export const useSendMessage = (conversationId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<Message, Error, SendMessageParams>({
    mutationFn: async (vars: SendMessageParams) => {
      const { content, role = 'user', idempotencyKey, requestId } = vars;
      const data = await api.post<Message>(`/conversations/${conversationId}/messages`, {
        content,
        role,
      }, { 
        timeoutMs: 45000,
        idempotencyKey,
        requestId
      });
      return data;
    },
    onSuccess: async (data, variables) => {
      // Refresh messages after user message is created
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });

  // Real streaming mutation using the streaming endpoint
  const streamMutation = useMutation<void, Error, SendMessageParams & StreamCallbacks>({
    mutationFn: async (vars: SendMessageParams & StreamCallbacks) => {
      const { content, role = 'user', idempotencyKey, requestId, onChunk, onDone, onError } = vars;
      
      try {
        // First create the user message
        const messageData = await api.post<Message>(`/conversations/${conversationId}/messages`, {
          content,
          role,
        }, { 
          timeoutMs: 45000,
          idempotencyKey,
          requestId
        });

        // Then use the backend complete reply endpoint via API client
        console.log('[Reply] Initiating POST /conversations/:id/reply');
        const response = await api.post(`/conversations/${conversationId}/reply`, {}, {
          timeoutMs: 60000, // Longer timeout for complete response
        });
        console.log('[Reply] Response received:', response);

        // Send the complete response as a single chunk
        if (response && response.message && response.message.content) {
          onChunk?.(response.message.content);
        } else {
          console.error('[Reply] No content in response:', response);
        }
        onDone?.();

        // Refresh messages after response is complete
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });

      } catch (error) {
        onError?.(error);
        throw error;
      }
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    mutateStream: streamMutation.mutate,
    mutateStreamAsync: streamMutation.mutateAsync,
    isPending: mutation.isPending || streamMutation.isPending,
    isError: mutation.isError || streamMutation.isError,
    error: mutation.error || streamMutation.error,
    reset: () => {
      mutation.reset();
      streamMutation.reset();
    }
  };
};

