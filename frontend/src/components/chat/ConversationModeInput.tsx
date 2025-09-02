'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HeartIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface ConversationModeInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  showHeader?: boolean;
  mode?: 'action' | 'conversation';
}

export const ConversationModeInput: React.FC<ConversationModeInputProps> = ({
  onSubmit,
  disabled = false,
  placeholder = "Share what's on your mind...",
  showHeader = true,
  mode = 'conversation'
}) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || disabled) return;

    onSubmit(inputValue.trim());
    setInputValue('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="space-y-3">
      {/* Mode Header - only show if showHeader is true */}
      {showHeader && (
        <div className="text-center py-2">
          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${
            mode === 'action' 
              ? 'bg-blue-50 dark:bg-blue-900/20' 
              : 'bg-purple-50 dark:bg-purple-900/20'
          }`}>
            <HeartIcon className={`h-4 w-4 ${
              mode === 'action' 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-purple-600 dark:text-purple-400'
            }`} />
            <span className={`text-sm font-medium ${
              mode === 'action' 
                ? 'text-blue-700 dark:text-blue-300' 
                : 'text-purple-700 dark:text-purple-300'
            }`}>
              {mode === 'action' ? 'Action Mode' : 'Chat Mode'}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {mode === 'action' 
              ? 'Log actions and activities quickly' 
              : 'Your AI companion is here to chat, remember, and support you'
            }
          </p>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all duration-200"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
            disabled={disabled}
            data-testid="message-input"
          />
          
          <button
            type="submit"
            disabled={!inputValue.trim() || disabled}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              mode === 'action' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </form>


    </div>
  );
};
