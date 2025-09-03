'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MessageBubble } from '@/components/ui/MessageBubble';
import { TwoModeSelector, InteractionMode } from './TwoModeSelector';
import { ConversationModeInput } from './ConversationModeInput';
import { useMessages, Message, useConversation } from '@/features/conversations';
import { useSendMessage } from '@/features/conversations/hooks/useSendMessage';
// Toast and icons removed for Milestone 1 simplicity
import { memoryService, type MemoryInsight } from '@/services/memoryService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LocalMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  mode?: InteractionMode;
  tasks?: ChatTask[];
}

interface ChatTask {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  due_date?: string;
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
  
  const [currentMode, setCurrentMode] = useState<InteractionMode>('conversation');
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [activeTasks, setActiveTasks] = useState<ChatTask[]>([]);
  const [insights, setInsights] = useState<MemoryInsight[]>([]);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  
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

  // Load active tasks and insights
  useEffect(() => {
    loadActiveTasks();
    loadInsights();
  }, [conversationId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const loadActiveTasks = async () => {
    try {
      // Get tasks from memory system
      const response = await memoryService.getInsights('active_tasks');
      // Mock active tasks for demo
      const mockTasks: ChatTask[] = [
        {
          id: '1',
          title: 'Review project proposal',
          description: 'Need to review the Q4 project proposal by end of week',
          status: 'pending',
          priority: 'high',
          created_at: new Date().toISOString(),
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          title: 'Schedule team meeting',
          description: 'Coordinate with team for weekly standup',
          status: 'in-progress',
          priority: 'medium',
          created_at: new Date().toISOString()
        }
      ];
      setActiveTasks(mockTasks);
    } catch (error) {
      console.error('Failed to load active tasks:', error);
    }
  };

  const loadInsights = async () => {
    try {
      const response = await memoryService.getInsights('chat_context');
      setInsights(response.insights);
    } catch (error) {
      console.error('Failed to load insights:', error);
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    try {
      // Update task status in memory system
      await memoryService.captureInteraction(
        'task_completion',
        `Completed task: ${activeTasks.find(t => t.id === taskId)?.title}`,
        { task_id: taskId, status: 'completed' }
      );
      
      // Update local state
      setActiveTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: 'completed' as const } : task
      ));
      
      // Toast removed for Milestone 1 simplicity
    } catch (error) {
      console.error('Failed to complete task:', error);
      // Error handling simplified
    }
  };

  const handleCreateTask = async (title: string, description?: string) => {
    try {
      const newTask: ChatTask = {
        id: `task-${Date.now()}`,
        title,
        description,
        status: 'pending',
        priority: 'medium',
        created_at: new Date().toISOString()
      };
      
      // Capture task creation in memory
      await memoryService.captureInteraction(
        'task_creation',
        `Created task: ${title}`,
        { task: newTask }
      );
      
      setActiveTasks(prev => [...prev, newTask]);
      // Toast removed for Milestone 1 simplicity
    } catch (error) {
      console.error('Failed to create task:', error);
      // Error handling simplified
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
          // Refresh tasks and insights
          loadActiveTasks();
          loadInsights();
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

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <span className="text-green-500">✓</span>;
      case 'in-progress': return <span className="text-blue-500">⏳</span>;
      default: return <span className="text-gray-400">⏳</span>;
    }
  };

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

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

      {/* Task Panel Toggle */}
      {!conversation?.incognito_mode && (
        <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active Tasks: {activeTasks.filter(t => t.status !== 'completed').length}
              </span>
              {insights.length > 0 && (
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  💡 {insights.length} insights available
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTaskPanel(!showTaskPanel)}
              className="text-xs"
            >
              {showTaskPanel ? 'Hide Tasks' : 'Show Tasks'}
            </Button>
          </div>
        </div>
      )}

      {/* Task Panel */}
      {showTaskPanel && !conversation?.incognito_mode && (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Your Tasks</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const title = prompt('Task title:');
                  if (title) {
                    const description = prompt('Task description (optional):');
                    handleCreateTask(title, description || undefined);
                  }
                }}
                className="text-xs"
              >
                <span className="mr-1">+</span>
                Add Task
              </Button>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {activeTasks.filter(t => t.status !== 'completed').map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-2 rounded-lg border-l-4 ${getTaskPriorityColor(task.priority)} bg-gray-50 dark:bg-gray-800/50`}
                >
                  {getTaskStatusIcon(task.status)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {task.description}
                      </div>
                    )}
                  </div>
                  {task.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTaskComplete(task.id)}
                      className="text-xs text-green-600 hover:text-green-700"
                    >
                      Complete
                    </Button>
                  )}
                </div>
              ))}
              
              {activeTasks.filter(t => t.status !== 'completed').length === 0 && (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <p className="text-sm">No active tasks. Great job! 🎉</p>
                </div>
              )}
            </div>
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
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-4">
              I&apos;m here to help you with tasks, answer questions, and provide insights based on your memory.
            </p>
            {!conversation?.incognito_mode && activeTasks.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You have {activeTasks.filter(t => t.status !== 'completed').length} active tasks.
                </p>
              </div>
            )}
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
              onSubmit={handleConversationSubmit}
              disabled={isLoading || isStreaming}
              placeholder="Type your message or ask about your tasks..."
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