'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MessageBubble } from '@/components/ui/MessageBubble';
import { TwoModeSelector, InteractionMode } from './TwoModeSelector';
// import { ActionModeInput, ActionInput } from './ActionModeInput'; // No longer needed
import { ConversationModeInput } from './ConversationModeInput';
// import { ActionConfirmation } from './ActionConfirmation'; // No longer needed
import { useMessages, Message, useConversation } from '@/features/conversations';
import { useSendMessage } from '@/features/conversations/hooks/useSendMessage';
// Toast and icons removed for Milestone 1 simplicity

interface LocalMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  mode?: InteractionMode;
}

interface TwoModeChatInterfaceProps {
  conversationId: string;
  userName?: string;
  assistantName?: string;
}

export const TwoModeChatInterface: React.FC<TwoModeChatInterfaceProps> = ({
  conversationId,
  userName = "You",
  assistantName = "Assistant"
}) => {
  const { data: queryMessages = [] } = useMessages(conversationId);
  const { data: conversation } = useConversation(conversationId);
  const sendMessageHook = useSendMessage(conversationId);
  const { mutateStream, isPending: isLoading } = sendMessageHook;
  
  const [currentMode, setCurrentMode] = useState<InteractionMode>('conversation');
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  // const [recentActions, setRecentActions] = useState<Array<ActionInput & { timestamp: string }>>([]); // No longer needed
  
  // Toast removed for Milestone 1 simplicity
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Combine query messages with local messages
  const messages = useMemo(() => [...queryMessages, ...localMessages], [queryMessages, localMessages]);

  // Set mode to conversation for incognito chats
  useEffect(() => {
    if (conversation?.incognito_mode) {
      setCurrentMode('conversation');
    }
  }, [conversation?.incognito_mode]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  // Handle action mode submission (now works like conversation mode)
  const handleActionSubmit = async (message: string) => {
    const userMessage: LocalMessage = {
      id: `user-${Date.now()}`,
      content: message,
      role: 'user',
      created_at: new Date().toISOString(),
      mode: 'action'
    };

    setLocalMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setStreamingMessage('');

    try {
      // Send message and get streaming response (same as conversation mode)
      mutateStream({
        content: message,
        onChunk: (chunk: string) => {
          setStreamingMessage(chunk);
        },
        onDone: () => {
          setIsStreaming(false);
          setStreamingMessage('');
          // Clear local messages since they're now in the API response
          setLocalMessages([]);
        },
        onError: (error) => {
          console.error('Failed to send message:', error);
          // Error handling simplified
          setIsStreaming(false);
          setStreamingMessage('');
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Error handling simplified
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };

  // Handle conversation mode submission
  const handleConversationSubmit = async (message: string) => {
    const userMessage: LocalMessage = {
      id: `user-${Date.now()}`,
      content: message,
      role: 'user',
      created_at: new Date().toISOString(),
      mode: 'conversation'
    };

    setLocalMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setStreamingMessage('');

    try {
      // Send message and get streaming response
      mutateStream({
        content: message,
        onChunk: (chunk: string) => {
          setStreamingMessage(chunk);
        },
        onDone: () => {
          setIsStreaming(false);
          setStreamingMessage('');
          // Clear local messages since they're now in the API response
          setLocalMessages([]);
        },
        onError: (error) => {
          console.error('Failed to send message:', error);
          // Error handling simplified
          setIsStreaming(false);
          setStreamingMessage('');
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Error handling simplified
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };

  // Remove old action confirmations - no longer needed
  // useEffect(() => {
  //   if (recentActions.length > 3) {
  //     setRecentActions(prev => prev.slice(-3));
  //   }
  // }, [recentActions]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with Incognito Mode Indicator */}
      {conversation?.incognito_mode && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800 px-4 py-2">
          <div className="flex items-center space-x-2 text-orange-700 dark:text-orange-300">
            <span>👁️</span>
            <span className="text-sm font-medium">Incognito Mode</span>
            <span className="text-xs text-orange-600 dark:text-orange-400">
              - No memory storage or retrieval
            </span>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isStreaming && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="text-2xl">🤖</div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Welcome to Your AI Companion
            </h3>
                            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  Choose your mode above to get started. Both modes provide natural conversation
                  with your AI companion - Action mode focuses on productivity, Chat mode for general conversation.
                </p>
          </div>
        )}

        {/* Display Messages */}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            content={message.content}
            isUser={message.role === 'user'}
            timestamp={message.created_at}
            userName={message.role === 'user' ? userName : assistantName}
            assistantName={assistantName}
          />
        ))}

        {/* Streaming Message */}
        {isStreaming && streamingMessage && (
          <MessageBubble
            content={streamingMessage}
            isUser={false}
            timestamp={new Date().toISOString()}
            userName={assistantName}
            assistantName={assistantName}
            isStreaming={true}
          />
        )}

        {/* Loading Indicator */}
        {isStreaming && !streamingMessage && (
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm">Your companion is thinking...</span>
          </div>
        )}

        {/* Action Confirmations - no longer needed */}
        {/* {recentActions.map((action, index) => (
          <ActionConfirmation
            key={`${action.type}-${action.timestamp}-${index}`}
            action={action}
            timestamp={action.timestamp}
            onClose={() => setRecentActions(prev => prev.filter((_, i) => i !== index))}
          />
        ))} */}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area with Mode Selector Above */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="space-y-3">
          {/* Mode Selector - positioned above the chatbox on the left (hidden for incognito chats) */}
          {!conversation?.incognito_mode && (
            <div className="flex justify-start">
              <TwoModeSelector
                currentMode={currentMode}
                onModeChange={setCurrentMode}
                disabled={isLoading || isStreaming}
              />
            </div>
          )}
          
          {/* Input Area - always chat interface */}
          <div>
            <ConversationModeInput
              onSubmit={currentMode === 'action' ? handleActionSubmit : handleConversationSubmit}
              disabled={isLoading || isStreaming}
              placeholder="Type your message..."
              mode={currentMode}
              showHeader={false}
            />
          </div>
        </div>
      </div>

      {/* Toast removed for Milestone 1 simplicity */}
    </div>
  );
};
