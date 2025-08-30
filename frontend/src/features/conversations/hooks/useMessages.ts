import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Message, AssistantReply } from '../types';
import { normalizeTimestamp, toLocalMs } from '../utils';

// Get messages for a conversation
export const useMessages = (conversationId: string | null) => {
  return useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const data = await api.get<Message[]>(`/conversations/${conversationId}/messages`);
      return (data || []).map((m) => ({
        ...m,
        created_at: normalizeTimestamp(m.created_at),
        created_at_local_ms: toLocalMs(m.created_at),
      }));
    },
    enabled: !!conversationId,
  });
};

// Send a message in a conversation
export const useSendMessage = (conversationId: string) => {
  const queryClient = useQueryClient();
  const [isReplyPending, setIsReplyPending] = useState(false);

  const mutation = useMutation<Message, Error, { 
    content: string; 
    role?: 'user' | 'assistant';
    idempotencyKey?: string;
    requestId?: string;
  }>({
    mutationFn: async (vars: { 
      content: string; 
      role?: 'user' | 'assistant';
      idempotencyKey?: string;
      requestId?: string;
    }) => {
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
      // After a user message is created, ask the assistant to reply
      try {
        setIsReplyPending(true);
        // Trigger assistant reply (response includes used_llm flag)
        await api.post<AssistantReply>(`/conversations/${conversationId}/reply`, {}, {
          idempotencyKey: variables.idempotencyKey ? `${variables.idempotencyKey}-reply` : undefined,
          requestId: variables.requestId
        });
      } catch (err: any) {
        const message = err?.message || 'Assistant reply failed';
        toast.error(message);
      } finally {
        setIsReplyPending(false);
        // Refresh messages regardless
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      }
    },
      onMutate: async (newMessage: { 
        content: string; 
        role?: 'user' | 'assistant';
        idempotencyKey?: string;
        requestId?: string;
      }) => {
        // Optimistically update the messages list
        await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });
        
        const previousMessages = queryClient.getQueryData<Message[]>([
          'messages',
          conversationId,
        ]) || [];
        
        queryClient.setQueryData<Message[]>(['messages', conversationId], (old = []) => [
          ...old,
          {
            id: `temp-${Date.now()}`,
            content: newMessage.content,
            role: newMessage.role || 'user',
            created_at: new Date().toISOString(),
          },
        ]);
        
        return { previousMessages };
      },
      onError: (
        _err,
        _newMessage,
        context: unknown
      ) => {
        const ctx = context as { previousMessages?: Message[] } | undefined;
        // Revert on error
        if (ctx?.previousMessages) {
          queryClient.setQueryData(
            ['messages', conversationId],
            ctx.previousMessages
          );
        }
      },
      onSettled: () => {
        // Always refetch messages after error or success
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      },
    }
  );

  return { ...mutation, isReplyPending };
};

export const useReply = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation<AssistantReply, Error, void>({
    mutationFn: async () => {
      // Trigger backend to generate a reply for the latest user message
      const data = await api.post<AssistantReply>(`/conversations/${conversationId}/reply`);
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};
