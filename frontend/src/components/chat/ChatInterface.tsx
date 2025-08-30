"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { getLLMLatencyLatest, LLMLatencyLatest } from '@/features/utils/api';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  context?: any;
  suggestions?: string[];
  metrics?: LLMLatencyLatest;
}

export default function ChatInterface() {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Add welcome message
      setMessages([{
        id: 'welcome',
        content: `Hello ${user.email}! I'm your AI life management companion. I can help you with planning, organization, wellness check-ins, and scheduling. How can I assist you today?`,
        isUser: false,
        timestamp: new Date().toISOString(),
        suggestions: [
          "Help me plan my week",
          "Suggest a daily routine",
          "I have an appointment to schedule",
          "I'm feeling stressed about work"
        ]
      }]);
    }
  }, [isAuthenticated, user]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputMessage,
      isUser: true,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await api.post('/conversation/chat', {
        message: inputMessage,
        conversation_history: conversationHistory
      });

      // Fetch latest latency metrics to attach to this assistant message
      let latest: LLMLatencyLatest | undefined = undefined;
      try {
        latest = await getLLMLatencyLatest();
      } catch (e) {
        // Non-fatal if fails
        console.warn('Failed to fetch LLM latency latest', e);
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: response.message,
        isUser: false,
        timestamp: new Date().toISOString(),
        context: response.context_analysis,
        suggestions: response.suggested_actions,
        metrics: latest,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update conversation history
      setConversationHistory(prev => [...prev, 
        { role: 'user', content: inputMessage },
        { role: 'assistant', content: response.message }
      ]);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please log in to use the chat interface.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
        <h2 className="text-xl font-semibold">AI Life Management Companion</h2>
        <p className="text-blue-100 text-sm">Your personal assistant for planning, wellness check-ins, and scheduling</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.isUser
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              {/* Per-reply latency metrics */}
              {!message.isUser && message.metrics && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                  {typeof message.metrics.first_token_ms === 'number' && (
                    <span className="px-2 py-0.5 rounded-full bg-gray-100">FT: {Math.round(message.metrics.first_token_ms)} ms</span>
                  )}
                  {typeof message.metrics.llm_total_ms === 'number' && (
                    <span className="px-2 py-0.5 rounded-full bg-gray-100">Total: {Math.round(message.metrics.llm_total_ms)} ms</span>
                  )}
                </div>
              )}
              
              {/* Show suggestions for assistant messages */}
              {!message.isUser && message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-gray-600">Suggestions:</p>
                  {message.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="block w-full text-left text-xs bg-white bg-opacity-20 hover:bg-opacity-30 rounded px-2 py-1 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              
              <p className="text-xs opacity-70 mt-2">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => handleSuggestionClick("Help me plan my week")}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
          >
            📅 Plan week
          </button>
          <button
            onClick={() => handleSuggestionClick("Suggest a daily routine")}
            className="px-3 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full hover:bg-indigo-200 transition-colors"
          >
            🧭 Daily routine
          </button>
          <button
            onClick={() => handleSuggestionClick("I'm feeling stressed and need support")}
            className="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200 transition-colors"
          >
            🧘 Wellness
          </button>
        </div>
      </div>
    </div>
  );
}
