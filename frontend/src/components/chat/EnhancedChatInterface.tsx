/**
 * Simple Chat Interface - Core conversation with your AI companion
 * 
 * This aligns with the "rich circle" vision: simple, flowing conversation,
 * not a feature-rich chat application with complex state management.
 */

import React, { useState, useEffect, useRef } from 'react';
import { MessageBubble } from '@/components/ui/MessageBubble';
import { useMessages, Message } from '@/features/conversations';
import { useSendMessage } from '@/features/conversations/hooks/useSendMessage';
import { Toast, useToast } from '@/components/Toast';
import { SparklesIcon, HeartIcon } from '@heroicons/react/24/outline';

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
  const sendMessageHook = useSendMessage(conversationId);
  const { mutateStream, isPending: isLoading } = sendMessageHook;
  const [inputValue, setInputValue] = useState('');
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  
  const { toast, show } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Combine query messages with local messages
  const messages = [...queryMessages, ...localMessages];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: LocalMessage = {
      id: `user-${Date.now()}`,
      content: inputValue.trim(),
      role: 'user',
      created_at: new Date().toISOString(),
    };

    setLocalMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsStreaming(true);
    setStreamingMessage('');

    try {
      // Send message and get streaming response
      mutateStream({
        content: userMessage.content,
        onChunk: (chunk: string) => {
          setStreamingMessage(chunk);
        },
        onDone: () => {
          setIsStreaming(false);
          setStreamingMessage('');
        },
        onError: (error) => {
          console.error('Failed to send message:', error);
          show('Failed to send message. Please try again.', 'error');
          setIsStreaming(false);
          setStreamingMessage('');
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      show('Failed to send message. Please try again.', 'error');
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMemoryCapture = (content: string) => {
    // Simple memory capture - in real implementation, this would call the memory API
    show('Memory captured! I\'ll remember this about you.', 'success');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isStreaming && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <SparklesIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Start Your Conversation
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Your AI companion is here to chat, remember, and support you. 
              Start with whatever's on your mind.
            </p>
          </div>
        )}

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

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
              disabled={isLoading}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <HeartIcon className="h-4 w-4" />
            <span>Send</span>
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>

      {/* Toast Notifications */}
      {toast && <Toast {...toast} />}
    </div>
  );
};

export default EnhancedChatInterface;