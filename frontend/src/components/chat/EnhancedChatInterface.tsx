import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MessageBubble } from '@/components/ui/MessageBubble';
import { IntelligentTyping } from './IntelligentTyping';
import { useMessages, Message } from '@/features/conversations/api';
import { useSendMessage } from '@/features/conversations/hooks/useSendMessage';
import { Toast, useToast } from '@/components/Toast';
import { useContextTracker } from '@/features/conversations/hooks/useContextTracker';
import { LightBulbIcon, SparklesIcon, HeartIcon, CalendarIcon, TagIcon, CogIcon } from '@heroicons/react/24/outline';
import { getLLMLatencyLatest, LLMLatencyLatest } from '@/features/utils/api';
import { RateLimitIndicator } from '@/components/ui/RateLimitIndicator';
import { useRateLimit } from '@/hooks/useRateLimit';
import { MemoryCaptureIndicator } from '@/components/ui/MemoryCaptureIndicator';
import { createMemory } from '@/features/memory/api';

// Utility function to generate unique IDs
const generateUniqueId = (prefix: string = 'id') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

interface LocalMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  usesMemories?: boolean;
  hasSuggestions?: boolean;
  memoryAttribution?: string[];
  // Response metadata
  used_llm?: boolean | null;
  memory_hit?: boolean;
  redundancy_ratio?: number;
  continuity_pass?: boolean;
  // Per-reply metrics
  metrics?: LLMLatencyLatest;
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
  const [isTyping, setIsTyping] = useState(false);
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  // Keep latest streaming content for callbacks (avoid stale closure)
  const streamingRef = useRef<string>('');
  const processedResponseRef = useRef<boolean>(false);
  const currentResponseIdRef = useRef<string>('');
  const processedMessagesRef = useRef<Set<string>>(new Set());
  const [savingMemoryIds, setSavingMemoryIds] = useState<Record<string, boolean>>({});

  const [memoryCaptures, setMemoryCaptures] = useState<Array<{
    id: string;
    type: 'preference' | 'fact' | 'schedule' | 'work' | 'allergy' | 'goal' | 'challenge' | 'habit';
    content: string;
  }>>([]);
  const { toast, show, hide } = useToast();
  
  // Context tracking for no-repeated-context
  const { trackContent, isContentRepeated } = useContextTracker(conversationId);
  
  // Rate limiting tracking
  const { rateLimitInfo } = useRateLimit();
  
  // Combine query messages with local messages and streaming message
  const messages = useMemo(() => {
    const baseMessages = [...queryMessages, ...localMessages];
    
    // Add streaming message if active
    if (isStreaming && streamingMessage) {
      const streamingMsg: LocalMessage = {
        id: 'streaming',
        content: streamingMessage,
        role: 'assistant',
        created_at: new Date().toISOString(),
      };
      baseMessages.push(streamingMsg);
    }
    
    return baseMessages;
  }, [queryMessages, localMessages, isStreaming, streamingMessage]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive or streaming message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced typing indicator to avoid rapid toggles
  useEffect(() => {
    const desired = (isLoading || isStreaming);
    let timer: any;
    if (desired !== isTyping) {
      // small debounce to smooth flicker
      timer = setTimeout(() => setIsTyping(desired), desired ? 150 : 250);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [isLoading, isStreaming, isTyping]);

  // Debug effect to monitor typing state (log only on change)
  const prevTypingRef = useRef<boolean>(isTyping);
  useEffect(() => {
    if (prevTypingRef.current !== isTyping) {
      console.log(`Typing state changed: ${isTyping}`);
      prevTypingRef.current = isTyping;
    }
  }, [isTyping]);

  const formatMessageContent = (content: string): string => {
    return content || '';
  };

  const sendMessage = async (messageContent: string, bypassDuplicate: boolean = false) => {
    if (!messageContent.trim() || isLoading || isStreaming) return;

    // Check for content duplication
    if (!bypassDuplicate && isContentRepeated(messageContent)) {
      show("You've already sent a similar message recently.", "info", {
        label: 'Send anyway',
        onAction: () => { void sendMessage(messageContent, true); }
      });
      return;
    }

    // Track content for duplication detection
    trackContent(messageContent);

    // Enhanced memory capture detection for life improvement
    const lowerContent = messageContent.toLowerCase();
    let captureType: 'preference' | 'fact' | 'schedule' | 'work' | 'allergy' | 'goal' | 'challenge' | 'habit' | null = null;
    
    if (lowerContent.includes('i like') || lowerContent.includes('i prefer') || lowerContent.includes('i love') || lowerContent.includes('i enjoy')) {
      captureType = 'preference';
    } else if (lowerContent.includes('i work') || lowerContent.includes('i\'m a') || lowerContent.includes('my job') || lowerContent.includes('career')) {
      captureType = 'work';
    } else if (lowerContent.includes('allergic') || lowerContent.includes('allergy')) {
      captureType = 'allergy';
    } else if (lowerContent.includes('schedule') || lowerContent.includes('routine') || lowerContent.includes('usually') || lowerContent.includes('typically')) {
      captureType = 'schedule';
    } else if (lowerContent.includes('i am') || lowerContent.includes('i have') || lowerContent.includes('my name') || lowerContent.includes('i\'m')) {
      captureType = 'fact';
    } else if (lowerContent.includes('goal') || lowerContent.includes('want to') || lowerContent.includes('aim to') || lowerContent.includes('trying to')) {
      captureType = 'goal';
    } else if (lowerContent.includes('struggle') || lowerContent.includes('difficulty') || lowerContent.includes('challenge') || lowerContent.includes('problem')) {
      captureType = 'challenge';
    } else if (lowerContent.includes('habit') || lowerContent.includes('routine') || lowerContent.includes('daily') || lowerContent.includes('always')) {
      captureType = 'habit';
    }

    // Generate idempotency key and request ID for better reliability
    const idempotencyKey = generateUniqueId('msg');
    const requestId = generateUniqueId('req');

    // Add local message immediately for better UX
    const localMessage: LocalMessage = {
      id: `local-${Date.now()}`,
      content: messageContent,
      role: 'user',
      created_at: new Date().toISOString(),
    };
    setLocalMessages(prev => [...prev, localMessage]);

    // Clear input only when sending from the input box content
    if (inputValue.trim() === messageContent) {
      setInputValue('');
    }

    try {
      // Use streaming for real-time responses
      setIsStreaming(true);
      setStreamingMessage('');
      streamingRef.current = '';
      processedResponseRef.current = false;
      currentResponseIdRef.current = '';
      processedMessagesRef.current.clear();
      
      await mutateStream({
        content: messageContent,
        role: 'user',
        idempotencyKey,
        requestId,
        onChunk: (chunk: string) => {
          console.log('[Reply] Received complete response:', chunk);
          streamingRef.current = chunk;
          setStreamingMessage(chunk);
        },
        onDone: async () => {
          // When response completes, just clean up streaming state
          console.log('[Reply] onDone called, response completed');
          
          // Prevent duplicate processing
          if (processedResponseRef.current) {
            console.log('[Reply] Response already processed, skipping');
            return;
          }
          
          // Set the flag to prevent race conditions
          processedResponseRef.current = true;
          
          setIsStreaming(false);
          setStreamingMessage('');
          streamingRef.current = '';
          
          // The backend will create the assistant message, so we don't need to create a local one
          // This prevents duplicate messages
        },
        onError: (error: unknown) => {
          console.error('Streaming failed:', error);
          setIsStreaming(false);
          setStreamingMessage('');
          streamingRef.current = '';
          show("Failed to get response. Please try again.", "error");
        }
      });

      // Remove local message after successful send
      setLocalMessages(prev => prev.filter(msg => msg.id !== localMessage.id));
      
      // Show memory capture indicator if applicable
      if (captureType) {
        const captureId = generateUniqueId('capture');
        setMemoryCaptures(prev => [...prev, {
          id: captureId,
          type: captureType,
          content: messageContent.substring(0, 50) + (messageContent.length > 50 ? '...' : '')
        }]);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
          setMemoryCaptures(prev => prev.filter(c => c.id !== captureId));
        }, 5000);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      show("Failed to send message. Please try again.", "error");
      setIsStreaming(false);
      setStreamingMessage('');
      // Keep local message if send failed
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || isStreaming) return;
    const messageContent = inputValue.trim();
    await sendMessage(messageContent);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (action: string) => {
    setInputValue(action);
    inputRef.current?.focus();
  };

  // Enhanced message rendering with better indicators
  const renderMessage = (message: Message | LocalMessage) => {
    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';
    const localMessage = message as LocalMessage;
    const isSaving = !!savingMemoryIds[message.id as string];

    const rememberThis = async () => {
      if (!isAssistant) return;
      const content = (message.content || '').trim();
      if (!content) return;
      if (isSaving) return;
      setSavingMemoryIds((m) => ({ ...m, [message.id]: true }));
      try {
        await createMemory({
          content,
          content_type: 'message',
          conversation_id: conversationId,
          importance_score: 50,
          source: 'chat:remember',
        });
        show('Message saved to memories', 'success');
      } catch (e) {
        console.error('Remember failed', e);
        show('Failed to save memory', 'error');
      } finally {
        setSavingMemoryIds((m) => {
          const n = { ...m };
          delete n[message.id];
          return n;
        });
      }
    };
    
    return (
      <div key={message.id} className="relative">
        <MessageBubble
          content={formatMessageContent(message.content)}
          isUser={isUser}
          timestamp={message.created_at}
          userName={userName}
          assistantName={assistantName}
        />
        
        {/* Remember this button for assistant messages - Only show in development */}
        {process.env.NODE_ENV === 'development' && isAssistant && (
          <div className="flex justify-end mt-2">
            <button
              data-testid="remember-this-button"
              onClick={rememberThis}
              disabled={isSaving}
              className={`px-3 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 ${
                isSaving
                  ? 'bg-blue-100/60 dark:bg-blue-900/20 text-blue-400 cursor-not-allowed'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'
              }`}
            >
              <CogIcon className="h-3 w-3" />
              {isSaving ? 'Saving…' : 'Remember this'}
            </button>
          </div>
        )}
        
        {/* Enhanced indicators for assistant messages - Only show in development */}
        {process.env.NODE_ENV === 'development' && isAssistant && (
          <div className="absolute -top-2 -right-2 flex items-center gap-1">
            {/* Memory indicator */}
            {localMessage.usesMemories && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                <CogIcon className="h-3 w-3" />
                <span>Memory</span>
              </div>
            )}
            
            {/* Suggestions indicator */}
            {localMessage.hasSuggestions && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs">
                <LightBulbIcon className="h-3 w-3" />
                <span>Suggestions</span>
              </div>
            )}
            
            {/* Enhanced response indicator */}
            {localMessage.memoryAttribution && localMessage.memoryAttribution.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs">
                <SparklesIcon className="h-3 w-3" />
                <span>Enhanced</span>
              </div>
            )}
            
            {/* LLM usage indicator - Only show in development */}
            {localMessage.used_llm !== null && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                localMessage.used_llm 
                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                  : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
              }`}>
                <span>{localMessage.used_llm ? 'LLM' : 'Cache'}</span>
              </div>
            )}
            
            {/* Memory hit indicator */}
            {localMessage.memory_hit && (
              <div className="flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs">
                <span>Context</span>
              </div>
            )}
          </div>
        )}

        {/* Per-reply latency metrics (first token & total) - Only show in development */}
        {process.env.NODE_ENV === 'development' && isAssistant && localMessage.metrics && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-300">
            {typeof localMessage.metrics.first_token_ms === 'number' && (
              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">FT: {Math.round(localMessage.metrics.first_token_ms)} ms</span>
            )}
            {typeof localMessage.metrics.llm_total_ms === 'number' && (
              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">Total: {Math.round(localMessage.metrics.llm_total_ms)} ms</span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full" data-testid="chat-interface">
      {/* Memory Capture Indicators */}
      {memoryCaptures.length > 0 && (
        <div className="px-4 py-2 space-y-2">
          {memoryCaptures.map((capture) => (
            <MemoryCaptureIndicator
              key={capture.id}
              type={capture.type}
              content={capture.content}
              onDismiss={() => setMemoryCaptures(prev => prev.filter(c => c.id !== capture.id))}
            />
          ))}
        </div>
      )}
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Display existing messages */}
        {messages.map((message) => renderMessage(message))}
        
        {/* Show thinking notification when assistant is processing */}
        {(isTyping || isLoading || isStreaming) && (
          <IntelligentTyping
            isVisible={true}
            userName={assistantName}
            responseLength={0}
            responseComplexity="medium"
          />
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Life Improvement Quick Actions */}
      <div data-testid="quick-actions" className="border-t border-gray-200/60 dark:border-gray-700/60 px-4 py-3 bg-white/70 dark:bg-gray-800/60 backdrop-blur-md">
        <div className="flex flex-wrap gap-2">
          <button
            data-testid="quick-action-plan-day"
            onClick={() => handleQuickAction("Help me plan my day")}
            className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
          >
            <CalendarIcon className="h-3 w-3" />
            Plan My Day
          </button>
          <button
            data-testid="quick-action-stressed"
            onClick={() => handleQuickAction("I'm feeling overwhelmed")}
            className="px-3 py-1.5 text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors flex items-center gap-1"
          >
            <HeartIcon className="h-3 w-3" />
            I'm Stressed
          </button>
                      <button
              data-testid="quick-action-memories"
              onClick={() => handleQuickAction("What do you remember about me?")}
              className="px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-1"
            >
              <CogIcon className="h-3 w-3" />
              My Memories
            </button>
            <button
              data-testid="quick-action-habit"
              onClick={() => handleQuickAction("Help me build a new habit")}
              className="px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center gap-1"
            >
              <TagIcon className="h-3 w-3" />
              Build Habit
            </button>
          <button
            onClick={() => handleQuickAction("I want to improve my work-life balance")}
            className="px-3 py-1.5 text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-1"
          >
            <SparklesIcon className="h-3 w-3" />
            Work-Life Balance
          </button>
                      <button
              onClick={() => handleQuickAction("Help me set some goals")}
              className="px-3 py-1.5 text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors flex items-center gap-1"
            >
              <TagIcon className="h-3 w-3" />
              Set Goals
            </button>
        </div>
      </div>

      {/* Enhanced Input Area */}
      <div className="border-t border-gray-200/60 dark:border-gray-700/60 p-4 bg-white/70 dark:bg-gray-800/60 backdrop-blur-md">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me about your life, goals, challenges, or ask for help with anything..."
            className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            disabled={isLoading}
            data-testid="message-input"
          />
          <button
            type="submit"
            aria-label="Send"
            className="px-4 py-3 rounded-lg bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            disabled={(!inputValue.trim()) || isLoading || isStreaming}
          >
            Send
          </button>
        </form>
        
        {/* Rate Limit Indicator */}
        <div className="mt-2 flex justify-end">
          <RateLimitIndicator
            remaining={rateLimitInfo.remaining}
            limit={rateLimitInfo.limit}
            reset={rateLimitInfo.reset}
          />
        </div>
      </div>

      {/* Toast surface */}
      {toast && (
        <Toast message={toast.message} kind={toast.kind} onClose={hide} actionLabel={toast.actionLabel} onAction={toast.onAction} />
      )}
    </div>
  );
};

export default EnhancedChatInterface;