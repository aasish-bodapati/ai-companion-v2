import React, { useCallback } from 'react';
import { format } from 'date-fns';
import { HandThumbUpIcon, HandThumbDownIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { StreamingIndicator } from '@/components/ui/StreamingIndicator';
import { IntelligentTyping } from '@/components/chat/IntelligentTyping';
// MemoryContext requires a conversationId; for live provenance we render a minimal inline panel here.

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  created_at_local_ms?: number;
}

interface MessageListProps {
  messages: Message[];
  liveAssistant: string;
  liveProvenance: any[];
  liveFadeOut: boolean;
  isReplyPending: boolean;
  normalizeUtcToLocal: (ts: string | number | Date) => Date;
  copyToClipboard: (text: string) => Promise<void>;
  onFeedback: (messageId: string, isPositive: boolean) => void;
  onQuickSave: (message: Message) => void;
  onUndoQuickSave: (messageId: string) => void;
  savedQuick: Record<string, { id: string }>;
  memQuickSaveEnabled: boolean;
  memShowSavedInline: boolean;
  feedbackPending: Record<string, boolean>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function MessageList({
  messages,
  liveAssistant,
  liveProvenance,
  liveFadeOut,
  isReplyPending,
  normalizeUtcToLocal,
  copyToClipboard,
  onFeedback,
  onQuickSave,
  onUndoQuickSave,
  savedQuick,
  memQuickSaveEnabled,
  memShowSavedInline,
  feedbackPending,
  messagesEndRef,
}: MessageListProps) {
  const renderMessage = useCallback((message: Message, index: number) => {
    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';
    const timestamp = normalizeUtcToLocal(message.created_at);
    const isSaved = savedQuick[message.id];

    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}> 
        {!isUser && (
          <div className="flex-shrink-0 mr-3 mt-0.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
        <div
          className={`max-w-3xl px-4 py-3 rounded-2xl shadow-sm border ${
            isUser
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600/40 rounded-br-md'
              : 'bg-white text-gray-900 border-gray-100 rounded-bl-md'
          }`}
        >
          {/* Message content */}
          <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'prose-neutral'} whitespace-pre-wrap break-words`}> 
            {message.content}
          </div>

          {/* Timestamp and actions */}
          <div className="mt-2 flex items-center justify-between">
            <div className={`text-[11px] ${isUser ? 'text-blue-100/80' : 'text-gray-500'}`}>
              {format(timestamp, 'MMM d, h:mm a')}
            </div>

            <div className="flex items-center space-x-2">
              {/* Copy button */}
              <button
                onClick={() => copyToClipboard(message.content)}
                className={`text-[11px] px-2 py-1 rounded-md transition ${
                  isUser ? 'text-blue-100 hover:bg-blue-700/60' : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label="Copy message to clipboard"
              >
                Copy
              </button>

              {/* Quick save for user messages */}
              {isUser && memQuickSaveEnabled && !isSaved && (
                <button
                  onClick={() => onQuickSave(message)}
                  className={`text-[11px] px-2 py-1 rounded-md transition ${
                    isUser ? 'text-blue-100 hover:bg-blue-700/60' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  aria-label="Save message to memory"
                >
                  Save
                </button>
              )}

              {/* Undo quick save */}
              {isUser && isSaved && memShowSavedInline && (
                <button
                  onClick={() => onUndoQuickSave(message.id)}
                  className="text-[11px] px-2 py-1 rounded-md text-green-700 bg-green-50 hover:bg-green-100"
                  aria-label="Undo save"
                >
                  Saved ✓
                </button>
              )}
            </div>

            {/* Feedback buttons for assistant messages */}
          </div>
          {isAssistant && (
            <div className="flex items-center justify-end space-x-1 mt-1">
              <button
                onClick={() => onFeedback(message.id, true)}
                disabled={feedbackPending[message.id]}
                className="p-1 text-gray-400 hover:text-green-600 disabled:opacity-50"
                title="Good response"
                aria-label="Thumbs up feedback"
              >
                <HandThumbUpIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onFeedback(message.id, false)}
                disabled={feedbackPending[message.id]}
                className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                title="Poor response"
                aria-label="Thumbs down feedback"
              >
                <HandThumbDownIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }, [
    normalizeUtcToLocal,
    copyToClipboard,
    onFeedback,
    onQuickSave,
    onUndoQuickSave,
    savedQuick,
    memQuickSaveEnabled,
    memShowSavedInline,
    feedbackPending,
  ]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Render all messages */}
      {messages.map(renderMessage)}

      {/* Live assistant response */}
      {liveAssistant && (
        <div className={`flex justify-start mb-4 transition-opacity duration-200 ${
          liveFadeOut ? 'opacity-70' : 'opacity-100'
        }`}>
          <div className="max-w-3xl px-4 py-3 rounded-2xl bg-white text-gray-900 shadow-sm border border-gray-100">
            <div className="mb-2">
              <StreamingIndicator isVisible={true} userName="Assistant" />
            </div>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap break-words">
              {liveAssistant}
            </div>
          </div>
        </div>
      )}

      {/* Thinking indicator */}
      {isReplyPending && !liveAssistant && (
        <div className="flex justify-start mb-4">
          <IntelligentTyping isVisible={true} userName="Assistant" />
        </div>
      )}

      {/* Live provenance (minimal inline panel) */}
      {liveProvenance && liveProvenance.length > 0 && (
        <div className="mb-4 p-3 border border-gray-100 rounded-xl bg-white shadow-sm">
          <div className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-indigo-600" />
            Memory Context (live)
          </div>
          <div className="space-y-2">
            {liveProvenance.map((p: any, idx: number) => (
              <div key={p.id ?? idx} className="text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-gray-50 text-gray-700 border border-gray-100">
                    {p.type ?? 'memory'}
                  </span>
                  {typeof p.relevance === 'number' && (
                    <span className="text-blue-600">{Math.round(p.relevance * 100)}%</span>
                  )}
                </div>
                <div className="mt-1 whitespace-pre-wrap break-words">{p.content ?? ''}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
