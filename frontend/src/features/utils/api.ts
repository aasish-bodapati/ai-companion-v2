import api from '@/lib/api';

export interface RouteMetrics {
  count?: number;
  total_latency_ms?: number;
  avg_latency_ms?: number;
  [k: string]: any;
}

export interface MetricsResponse {
  total_requests?: number;
  per_route?: Record<string, RouteMetrics>;
  started_at?: string;
  [k: string]: any;
}

export async function getMetrics(): Promise<MetricsResponse> {
  return api.get<MetricsResponse>('/utils/metrics');
}

export interface LLMLatencyLatest {
  first_token_ms: number | null;
  llm_total_ms: number | null;
}

export async function getLLMLatencyLatest(): Promise<LLMLatencyLatest> {
  return api.get<LLMLatencyLatest>('/utils/llm-latency/latest');
}

export interface StatRollup {
  avg: number;
  min: number;
  max: number;
  count: number;
}

export interface LLMLatencyRollupResponse {
  first_token_ms: StatRollup;
  llm_total_ms: StatRollup;
}

export async function getLLMLatencyRollup(): Promise<LLMLatencyRollupResponse> {
  return api.get<LLMLatencyRollupResponse>('/utils/llm-latency');
}

export interface RetrievalSummaryResponse {
  window_hours: number;
  metrics: Record<string, any>;
  rollups: {
    avg_retrieval_ms: number;
    avg_mmr_ms: number;
    avg_selected: number;
    avg_diversity: number;
  };
}

export async function getRetrievalSummary(hours: number = 1): Promise<RetrievalSummaryResponse> {
  return api.get<RetrievalSummaryResponse>('/utils/metrics/retrieval-summary', { hours });
}
