import React from 'react';
import { Message } from '../types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onFeedback?: (messageId: string, isPositive: boolean) => void;
  feedbackPending?: Record<string, boolean>;
}

export function MessageList({ 
  messages, 
  isLoading, 
  onFeedback, 
  feedbackPending = {} 
}: MessageListProps) {
  if (messages.length === 0 && !isLoading) {
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
        <MessageItem
          key={message.id}
          message={message}
          onFeedback={onFeedback}
          feedbackPending={feedbackPending[message.id]}
        />
      ))}
      {isLoading && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}