// TypeScript interfaces for conversations and messages

export interface Conversation {
  id: string;
  title: string | null;
  personalization_enabled: boolean;
  created_at: string;
  updated_at: string;
  // client-derived: normalized local epoch ms
  created_at_local_ms?: number;
  updated_at_local_ms?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  // client-derived: normalized local epoch ms
  created_at_local_ms?: number;
  // Enhanced memory indicators
  usesMemories?: boolean;
  hasSuggestions?: boolean;
  memoryAttribution?: string[];
  // Response metadata
  used_llm?: boolean | null;
  memory_hit?: boolean;
  redundancy_ratio?: number;
  continuity_pass?: boolean;
}

// Aligns with backend AssistantReply schema
export interface AssistantReply {
  id: string | null;
  message: Message;
  used_llm: boolean | null;
}

export interface StreamCallbacks {
  signal?: AbortSignal;
  onChunk?: (text: string) => void;
  onDone?: () => void;
  onError?: (err: unknown) => void;
  onTimelineStart?: (payload: any) => void;
  onTimelineEnd?: (payload: any) => void;
  onProvenance?: (items: any[]) => void;
  onActions?: (items: any[]) => void;
}

export interface SendMessageParams {
  content: string;
  remember?: boolean;
  onChunk?: (t: string) => void;
  onDone?: () => void;
  onTimelineStart?: (p: any) => void;
  onTimelineEnd?: (p: any) => void;
  onProvenance?: (items: any[]) => void;
  onActions?: (items: any[]) => void;
  // Enhanced request options
  idempotencyKey?: string;
  requestId?: string;
}
