import React from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ChatState } from '../hooks/useChatState';
// Memory system removed - focusing on health logging only
import { AttachmentHandlers } from '../hooks/useAttachmentHandlers';

interface ChatContainerProps {
  chatState: ChatState;
  attachmentHandlers: AttachmentHandlers;
  onSend: (rememberNow?: boolean) => Promise<void>;
  onFeedback: (messageId: string, isPositive: boolean) => void;
  feedbackPending: Record<string, boolean>;
  normalizeUtcToLocal: (ts: string | number | Date) => Date;
  copyToClipboard: (text: string) => Promise<void>;
}

export function ChatContainer({
  chatState,
  attachmentHandlers,
  onSend,
  onFeedback,
  feedbackPending,
  normalizeUtcToLocal,
  copyToClipboard,
}: ChatContainerProps) {
  return (
    <>
      {/* Message List */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={chatState.messages}
          liveAssistant={chatState.liveAssistant}
          liveProvenance={chatState.liveProvenance}
          liveFadeOut={chatState.liveFadeOut}
          isReplyPending={chatState.isReplyPending}
          normalizeUtcToLocal={normalizeUtcToLocal}
          copyToClipboard={copyToClipboard}
          onFeedback={onFeedback}
          // Memory system removed - focusing on health logging only
          feedbackPending={feedbackPending}
          messagesEndRef={chatState.messagesEndRef}
        />
      </div>

      {/* Chat Input */}
      <div className="flex-shrink-0 border-t">
        <ChatInput
          input={chatState.input}
          setInput={chatState.setInput}
          onSend={onSend}
          disabled={chatState.isLoading && !chatState.isReplyPending}
          onAttach={attachmentHandlers.handleAttach}
          remember={chatState.remember}
          setRemember={chatState.setRemember}
          inputRef={chatState.inputRef}
          fileInputRef={chatState.fileInputRef}
        />
      </div>
    </>
  );
}
