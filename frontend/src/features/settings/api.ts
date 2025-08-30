import { api } from '@/lib/api';

export interface RetrievalSettings {
  MEMORY_ENABLED: boolean;
  MEMORY_PROVIDER: string;
  EMBEDDING_MODEL_NAME: string;
  RETRIEVAL_TOP_K: number;
  RETRIEVAL_RECENT_MESSAGES: number;
  MEMORY_MIN_RELEVANCE: number;
}

export async function fetchRetrievalSettings(): Promise<RetrievalSettings> {
  return api.get<RetrievalSettings>('/utils/retrieval-settings');
}
