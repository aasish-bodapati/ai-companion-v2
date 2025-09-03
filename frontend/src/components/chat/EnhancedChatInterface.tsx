'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MessageBubble } from '@/components/ui/MessageBubble';
import { ConversationModeInput } from './ConversationModeInput';
import { useMessages, Message, useConversation } from '@/features/conversations';
import { useSendMessage } from '@/features/conversations/hooks/useSendMessage';

interface LocalMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

interface EnhancedChatInterfaceProps {
  conversationId: string;
  userName?: string;
  assistantName?: string;
}

export const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  conversationId,
  userName = "You",
  assistantName = "Assistant"
}) => {
  const { data: queryMessages = [] } = useMessages(conversationId);
  const { data: conversation } = useConversation(conversationId);
  const sendMessageHook = useSendMessage(conversationId);
  const { mutateStream, isPending: isLoading } = sendMessageHook;
  
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingMessageRef = useRef<string>('');

  // Use only server messages to avoid duplication
  const messages = useMemo(() => queryMessages, [queryMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading || isStreaming) return;

    // Clear any previous errors
    setError(null);

    setIsStreaming(true);
    setStreamingMessage('');
    streamingMessageRef.current = '';

    // Set a timeout to handle slow responses
    const timeoutId = setTimeout(() => {
      if (isStreaming && !streamingMessageRef.current) {
        setError('Response is taking longer than usual. Please wait...');
      }
    }, 15000); // 15 second timeout

    try {
      await mutateStream({
        content: content.trim(),
        onChunk: (chunk: string) => {
          clearTimeout(timeoutId);
          streamingMessageRef.current += chunk;
          setStreamingMessage(streamingMessageRef.current);
        },
        onDone: () => {
          clearTimeout(timeoutId);
          setStreamingMessage('');
          streamingMessageRef.current = '';
          setIsStreaming(false);
        },
        onError: (error: any) => {
          clearTimeout(timeoutId);
          console.error('Error sending message:', error);
          setError('Failed to get response. Please try again.');
          setIsStreaming(false);
          setStreamingMessage('');
          streamingMessageRef.current = '';
        }
      });
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Error sending message:', error);
      setError('Something went wrong. Please check your connection and try again.');
      setIsStreaming(false);
      setStreamingMessage('');
      streamingMessageRef.current = '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isStreaming && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <p className="text-xl font-medium mb-2">Hi there! I&apos;m your AI companion</p>
            <p className="text-sm mb-4">I remember your preferences and can help with personalized advice</p>
            <div className="text-xs text-gray-400">
              Try asking: &quot;What should I eat for lunch?&quot; or &quot;Help me plan my day&quot;
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            content={message.content}
            isUser={message.role === 'user'}
            timestamp={message.created_at}
            userName={userName}
            assistantName={assistantName}
          />
        ))}
        
        {/* Streaming message */}
        {isStreaming && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm">🤖</span>
            </div>
            <div className="flex-1">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                {streamingMessage ? (
                  <div className="text-gray-800 dark:text-gray-200">
                    {streamingMessage}
                    <span className="inline-block w-2 h-4 bg-indigo-500 ml-1 animate-pulse"></span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <span className="text-sm ml-2">Thinking...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-red-600 dark:text-red-400">⚠️</span>
              <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isStreaming ? 'AI is responding...' : 'Ready to chat'}
          </span>
        </div>
        <ConversationModeInput
          onSubmit={handleSendMessage}
          disabled={isLoading || isStreaming}
          placeholder={isStreaming ? "Please wait for response..." : "Ask me anything or share what's on your mind..."}
        />
      </div>
    </div>
  );
};