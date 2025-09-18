import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';
// Types and utils removed - using inline types
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: Date;
  created_at_local_ms: number;
  context?: any;
  suggestions?: string[];
  metrics?: any;
  used_memory?: boolean;
}

interface AssistantReply {
  reply: string;
  context_analysis?: any;
  suggested_actions?: string[];
  used_memory?: boolean;
}

const normalizeTimestamp = (ts: string | number | Date): Date => {
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
};

const toLocalMs = (ts: string | number | Date): number => {
  return normalizeTimestamp(ts).getTime();
};

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
        
        const now = new Date();
        queryClient.setQueryData<Message[]>(['messages', conversationId], (old = []) => [
          ...old,
          {
            id: `temp-${Date.now()}`,
            content: newMessage.content,
            role: newMessage.role || 'user',
            created_at: now,
            created_at_local_ms: now.getTime(),
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
