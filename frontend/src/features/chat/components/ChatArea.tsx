import React, { useState, useCallback } from 'react';

// Hooks
import { useChatState } from '../hooks/useChatState';
import { useActionHandlers } from '../hooks/useActionHandlers';
import { useMemoryHandlers } from '../hooks/useMemoryHandlers';
import { useAttachmentHandlers } from '../hooks/useAttachmentHandlers';

// Components
import { ChatContainer } from './ChatContainer';
import { ActionModals } from './ActionModals';
import { useChatUtilities } from './ChatUtilities';

interface ChatAreaProps {
  onNewConversation: () => void;
  initialPrompt?: string;
}

export function ChatArea({ onNewConversation, initialPrompt }: ChatAreaProps) {
  // Custom hooks for state management
  const chatState = useChatState();
  const actionHandlers = useActionHandlers();
  const memoryHandlers = useMemoryHandlers(chatState.conversationId);
  const attachmentHandlers = useAttachmentHandlers();
  const { normalizeUtcToLocal, copyToClipboard } = useChatUtilities();

  // Additional state for MessageList
  const [feedbackPending, setFeedbackPending] = useState<Record<string, boolean>>({});

  const handleFeedback = useCallback((messageId: string, isPositive: boolean) => {
    setFeedbackPending(prev => ({ ...prev, [messageId]: true }));
    // TODO: Implement actual feedback API call
    setTimeout(() => {
      setFeedbackPending(prev => ({ ...prev, [messageId]: false }));
    }, 1000);
  }, []);

  // Send handler that matches ChatInput expectations
  const handleSend = useCallback(async (rememberNow?: boolean) => {
    if (!chatState.input.trim()) return;
    
    chatState.sendMessage({
      content: chatState.input,
      role: 'user',
    });
    
    chatState.setInput('');
  }, [chatState]);

  return (
    <div className="flex flex-col h-full">
      <ChatContainer
        chatState={chatState}
        memoryHandlers={memoryHandlers}
        attachmentHandlers={attachmentHandlers}
        onSend={handleSend}
        onFeedback={handleFeedback}
        feedbackPending={feedbackPending}
        normalizeUtcToLocal={normalizeUtcToLocal}
        copyToClipboard={copyToClipboard}
      />
      
      <ActionModals actionHandlers={actionHandlers} />
    </div>
  );
}
