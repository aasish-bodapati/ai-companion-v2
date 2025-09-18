import React from 'react';
// ChatMessage type removed - using inline type
import { MessageBubble } from '@/components/ui/MessageBubble';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: Date;
  created_at_local_ms: number;
  context?: any;
  suggestions?: string[];
  metrics?: any;
  used_memory?: boolean;
}

interface MessageListProps {
  messages: ChatMessage[];
  liveAssistant?: string;
  liveProvenance?: any[];
  liveFadeOut?: boolean;
  isReplyPending?: boolean;
  isLoading?: boolean;
  normalizeUtcToLocal?: (ts: string | number | Date) => Date;
  copyToClipboard?: (text: string) => Promise<void>;
  onFeedback?: (messageId: string, isPositive: boolean) => void;
  onQuickSave?: (messageId: string) => void;
  onUndoQuickSave?: (messageId: string) => void;
  savedQuick?: Record<string, { id: string; }>;
  memQuickSaveEnabled?: boolean;
  memShowSavedInline?: boolean;
  feedbackPending?: Record<string, boolean>;
  messagesEndRef?: React.RefObject<HTMLDivElement>;
}

export function MessageList({ 
  messages, 
  isLoading = false,
  isReplyPending = false,
  onFeedback, 
  feedbackPending = {},
  messagesEndRef,
  ...otherProps
}: MessageListProps) {
  if (messages.length === 0 && !isLoading && !isReplyPending) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
          <p className="text-sm">Ask me anything or tell me about yourself!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          content={message.content}
          isUser={message.role === 'user'}
          timestamp={message.created_at.toISOString()}
        />
      ))}
      {isLoading && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}
      {messagesEndRef && <div ref={messagesEndRef} />}
    </div>
  );
}