import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { journalApi } from '@/lib/api';

export function useJournalEntries() {
  return useQuery({
    queryKey: ['journalEntries'],
    queryFn: async () => {
      const { data, error } = await journalApi.getEntries();
      if (error) throw new Error(error);
      return data?.entries || [];
    },
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ content, mood }: { content: string; mood?: string }) => {
      const { data, error } = await journalApi.createEntry(content, mood);
      if (error) throw new Error(error);
      return data?.entry;
    },
    onSuccess: () => {
      // Invalidate and refetch journal entries after successful creation
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
    },
  });
}

export function useJournalEntry(entryId: string) {
  return useQuery({
    queryKey: ['journalEntry', entryId],
    queryFn: async () => {
      const { data, error } = await journalApi.getEntries();
      if (error) throw new Error(error);
      return data?.entries.find((entry: any) => entry.id === entryId);
    },
  });
}
