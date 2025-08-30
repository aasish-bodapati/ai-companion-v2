import api from '@/lib/api';
import type { MemoryNode } from '@/features/memory/api';

export type NudgeType = 'morning' | 'evening' | 'weekly' | 'opportunity' | 'checkin';

export interface NudgeItem {
  id: string;
  nudge_type: NudgeType;
  title: string;
  message: string;
  scheduled_for?: string | null;
  seen: boolean;
}

export async function listMyNudges(): Promise<NudgeItem[]> {
  return api.get<NudgeItem[]>(`/users/me/nudges`);
}

export interface CreateCheckInIn {
  content: string;
  cadence?: 'daily' | 'weekly';
  prompt?: string;
}

export async function createCheckIn(body: CreateCheckInIn): Promise<MemoryNode> {
  return api.post<MemoryNode>(`/users/me/checkins`, body);
}

export async function autoSummarize(conversationId: string): Promise<MemoryNode> {
  return api.post<MemoryNode>(`/conversations/${conversationId}/auto-summarize`, {});
}
