import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface MemorySearchResult {
  id: string;
  content: string;
  content_type: string;
  relevance_score: number;
  memory_metadata?: string;
}

export function useHealthMemories() {
  return useQuery({
    queryKey: ['health-memories'],
    queryFn: async () => {
      // Search for health-related memories (fitness, nutrition, wellness, etc.)
      const response = await api.get('/memory/users/me/memories/search?query=health+fitness+nutrition+wellness+exercise+workout+diet+food+weight+goals+medical&limit=30&min_relevance=0.1');
      const data = response.data as MemorySearchResult[];
      
      // Ensure we always return an array
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
