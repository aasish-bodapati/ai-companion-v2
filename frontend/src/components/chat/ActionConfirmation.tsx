'use client';

import React from 'react';
import { 
  CheckCircleIcon, 
  FireIcon, 
  HeartIcon, 
  ClockIcon, 
  BookOpenIcon, 
  CloudIcon,
  PlusIcon 
} from '@heroicons/react/24/outline';
import { ActionInput } from './ActionModeInput';

interface ActionConfirmationProps {
  action: ActionInput;
  timestamp: string;
  onClose?: () => void;
}

const ACTION_ICONS = {
  workout: FireIcon,
  meal: HeartIcon,
  mood: CloudIcon,
  sleep: ClockIcon,
  hydration: PlusIcon,
  journal: BookOpenIcon,
} as const;

const ACTION_COLORS = {
  workout: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  meal: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  mood: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  sleep: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  hydration: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20',
  journal: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
} as const;

export const ActionConfirmation: React.FC<ActionConfirmationProps> = ({
  action,
  timestamp,
  onClose
}) => {
  const Icon = ACTION_ICONS[action.type];
  const colorClasses = ACTION_COLORS[action.type];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg p-4 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-start space-x-3">
        {/* Success Icon */}
        <div className="flex-shrink-0">
          <CheckCircleIcon className="h-6 w-6 text-green-500" />
        </div>
        
        {/* Action Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`p-2 rounded-lg ${colorClasses}`}>
              <Icon className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {action.type.charAt(0).toUpperCase() + action.type.slice(1)} Logged Successfully
            </h4>
          </div>
          
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            {action.details}
          </p>
          
          {action.notes && (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              "{action.notes}"
            </p>
          )}
          
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {new Date(timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
        
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Progress Indicator */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Data saved to your profile</span>
          <span>✓</span>
        </div>
      </div>
    </div>
  );
};
