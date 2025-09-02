'use client';

import React from 'react';
import { CogIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export type InteractionMode = 'action' | 'conversation';

interface TwoModeSelectorProps {
  currentMode: InteractionMode;
  onModeChange: (mode: InteractionMode) => void;
  disabled?: boolean;
}

export const TwoModeSelector: React.FC<TwoModeSelectorProps> = ({
  currentMode,
  onModeChange,
  disabled = false
}) => {
    return (
    <div className="flex flex-col space-y-2">
      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
        Mode:
      </div>

      <div className="flex space-x-2">
        {/* Action Mode Button */}
        <button
          onClick={() => onModeChange('action')}
          disabled={disabled}
          className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
            currentMode === 'action'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
        >
          <CogIcon className="h-3 w-3" />
          <span>Action</span>
        </button>

        {/* Conversation Mode Button */}
        <button
          onClick={() => onModeChange('conversation')}
          disabled={disabled}
          className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
            currentMode === 'conversation'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-gray-200 dark:border-gray-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
        >
          <ChatBubbleLeftRightIcon className="h-3 w-3" />
          <span>Chat</span>
        </button>
      </div>

      {/* Mode Description */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {currentMode === 'action' ? (
          <span>Action focus</span>
        ) : (
          <span>General chat</span>
        )}
      </div>
    </div>
  );
};
