import api from '@/lib/api';

export interface WeeklyDigestPeriod {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export interface WeeklyDigestHighlight {
  title: string;
  detail: string;
  faiss_id?: string | null;
  rank_boost?: number | null;
}

export interface WeeklyDigestStats {
  messages: number;
  new_memories: number;
  reinforced: number;
}

export interface WeeklyDigestProvenance {
  model: string;
  source: 'weekly_digest';
  user_id: string;
}

export interface WeeklyDigestResponse {
  period: WeeklyDigestPeriod;
  summary: string;
  highlights: WeeklyDigestHighlight[];
  stats: WeeklyDigestStats;
  provenance: WeeklyDigestProvenance;
}

export interface WeeklyDigestParams {
  start?: string; // YYYY-MM-DD or ISO
  end?: string;   // YYYY-MM-DD or ISO
  limit_conversations?: number; // 1..10
  limit_highlights?: number;    // 1..20
}

export async function getWeeklyDigest(params?: WeeklyDigestParams): Promise<WeeklyDigestResponse> {
  return api.get<WeeklyDigestResponse>(`/users/me/weekly-digest`, params);
}
