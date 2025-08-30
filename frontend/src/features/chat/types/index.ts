export interface SuggestedAction {
  action: string;
  label?: string;
  params?: Record<string, any>;
  client_action_id?: string;
}

export interface SlashItem {
  id: string;
  label: string;
  template: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  created_at_local_ms?: number;
}

export interface HistoryCounts {
  hydration: number;
  mood: number;
  journal: number;
}
