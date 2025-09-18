import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
// Types and utils removed - using inline types
interface Conversation {
  id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  user_id: string;
  created_at_local_ms: number;
  updated_at_local_ms: number;
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

// Get all conversations for the current user
export const useConversations = () => {
  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const data = await api.get<Conversation[]>('/conversations/');
      return (data || []).map((c) => ({
        ...c,
        created_at: normalizeTimestamp(c.created_at),
        updated_at: normalizeTimestamp(c.updated_at),
        created_at_local_ms: toLocalMs(c.created_at),
        updated_at_local_ms: toLocalMs(c.updated_at),
      }));
    },
  });
};

// Get single conversation
export const useConversation = (id: string | null) => {
  return useQuery<Conversation>({
    queryKey: ['conversation', id],
    queryFn: async () => {
      if (!id) throw new Error('missing id');
      const data = await api.get<Conversation>(`/conversations/${id}`);
      return {
        ...data,
        created_at: normalizeTimestamp(data.created_at),
        updated_at: normalizeTimestamp(data.updated_at),
        created_at_local_ms: toLocalMs(data.created_at),
        updated_at_local_ms: toLocalMs(data.updated_at),
      };
    },
    enabled: !!id,
  });
};

// Create a new conversation
export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Conversation, Error, { title?: string; incognito_mode?: boolean }>({
    mutationFn: async (vars: { title?: string; incognito_mode?: boolean }) => {
      console.log('Creating conversation with vars:', vars);
      const { title = "New Conversation", incognito_mode = false } = vars;
      const data = await api.post<Conversation>('/conversations/', { title, incognito_mode });
      console.log('Conversation created successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Conversation creation onSuccess called:', data);
      // Invalidate and refetch conversations list
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Conversation created');
    },
    onError: (error) => {
      console.error('Conversation creation onError called:', error);
      toast.error('Failed to create conversation');
    },
  });
};

// Update a conversation (e.g., title)
export const useUpdateConversation = () => {
  const queryClient = useQueryClient();
  return useMutation<
    Conversation,
    Error,
    { id: string; title?: string; personalization_enabled?: boolean }
  >({
    mutationFn: async ({ id, title, personalization_enabled }) => {
      const body: Record<string, unknown> = {};
      if (typeof title !== 'undefined') body.title = title;
      if (typeof personalization_enabled !== 'undefined') body.personalization_enabled = personalization_enabled;
      const data = await api.put<Conversation>(`/conversations/${id}`, body);
      return data;
    },
    onSuccess: (data, variables) => {
      // Read cached conversation to detect actual title change
      const prev = queryClient.getQueryData<Conversation>(['conversation', variables.id]);
      const prevTitle = (prev?.title || '').trim();
      const newTitle = (data.title || '').trim();

      // Refresh list and the specific conversation so detail view updates
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.id] });

      if (newTitle && newTitle !== prevTitle) {
        toast.success('Conversation renamed');
      }
    },
    onError: (err) => {
      const message = (err as unknown as { message?: string })?.message || 'Failed to rename conversation';
      toast.error(message);
    },
  });
};

// Delete a conversation
export const useDeleteConversation = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      await api.delete<void>(`/conversations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Conversation deleted');
    },
    onError: (err) => {
      const message = (err as unknown as { message?: string })?.message || 'Failed to delete conversation';
      toast.error(message);
    },
  });
};
