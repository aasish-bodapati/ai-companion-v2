import api from '@/lib/api';

// Types mirror backend/app/schemas/coaching.py
export interface CreatedId { id: string }

export interface HydrationLogCreate {
  when: string; // ISO
  amount_ml: number;
}

export interface MoodLogCreate {
  when: string; // ISO
  val: number; // 1..5
  scale?: number; // default 5
  tags?: string[];
  notes?: string;
}

export interface JournalEntryCreate {
  when: string; // ISO
  title?: string;
  content: string;
  tags?: string[];
}

// List item types (from backend query responses)
export interface HydrationLogItem {
  id: string;
  when: string;
  amount_ml: number;
}

export interface MoodLogItem {
  id: string;
  when: string;
  val: number;
  scale: number;
  tags?: string[] | null;
  notes?: string | null;
}

export interface JournalEntryItem {
  id: string;
  when: string;
  title?: string | null;
  content: string;
  tags?: string[] | null;
}

// Create endpoints
export async function logHydration(body: HydrationLogCreate): Promise<CreatedId> {
  return api.post<CreatedId>('/trackers/hydration', body);
}
export async function logMood(body: MoodLogCreate): Promise<CreatedId> {
  return api.post<CreatedId>('/trackers/mood', body);
}
export async function addJournal(body: JournalEntryCreate): Promise<CreatedId> {
  return api.post<CreatedId>('/trackers/journal', body);
}

// Query endpoints
export type TrackerKind = 'hydration' | 'mood' | 'journal';

export async function queryLogs<T = any>(kind: TrackerKind, params?: { from?: string; to?: string; limit?: number }): Promise<T[]> {
  const q: Record<string, string> = {};
  if (params?.from) q['from'] = params.from;
  if (params?.to) q['to'] = params.to;
  if (params?.limit != null) q['limit'] = String(params.limit);
  return api.get<T[]>(`/trackers/${kind}`, q);
}

export function queryHydration(params?: { from?: string; to?: string; limit?: number }) {
  return queryLogs<HydrationLogItem>('hydration', params);
}
export function queryMood(params?: { from?: string; to?: string; limit?: number }) {
  return queryLogs<MoodLogItem>('mood', params);
}
export function queryJournal(params?: { from?: string; to?: string; limit?: number }) {
  return queryLogs<JournalEntryItem>('journal', params);
}

// Reviews API
export interface QuietHours { from: string; to: string; tz?: string }
export interface DailyNudgeRequest { date: string; quiet_hours?: QuietHours }
export interface DailyNudgeResponse { suggestions: string[] }

export interface WeeklyReviewRequest { week_start: string; domains?: string[] }
export interface WeeklyReviewResponse { summary: string; adjustments?: any[]; insights?: string[] }

export function dailyNudge(body: DailyNudgeRequest) {
  return api.post<DailyNudgeResponse>('/reviews/daily', body);
}
export function weeklyReview(body: WeeklyReviewRequest) {
  return api.post<WeeklyReviewResponse>('/reviews/weekly', body);
}
