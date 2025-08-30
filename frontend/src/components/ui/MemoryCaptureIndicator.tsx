import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface MemoryCaptureIndicatorProps {
  type: 'preference' | 'fact' | 'schedule' | 'work' | 'allergy' | 'goal' | 'challenge' | 'habit';
  content: string;
  onDismiss?: () => void;
  className?: string;
}

export const MemoryCaptureIndicator: React.FC<MemoryCaptureIndicatorProps> = ({
  type,
  content,
  onDismiss,
  className = ''
}) => {
  const getTypeInfo = () => {
    switch (type) {
      case 'preference':
        return {
          label: 'Preference Captured',
          color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
          icon: '❤️'
        };
      case 'fact':
        return {
          label: 'Fact Remembered',
          color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
          icon: '🧠'
        };
      case 'schedule':
        return {
          label: 'Schedule Noted',
          color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
          icon: '📅'
        };
      case 'work':
        return {
          label: 'Work Info Saved',
          color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
          icon: '💼'
        };
      case 'allergy':
        return {
          label: 'Allergy Noted',
          color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
          icon: '⚠️'
        };
      case 'goal':
        return {
          label: 'Goal Captured',
          color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
          icon: '🎯'
        };
      case 'challenge':
        return {
          label: 'Challenge Noted',
          color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
          icon: '💪'
        };
      case 'habit':
        return {
          label: 'Habit Pattern Captured',
          color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
          icon: '🔄'
        };
      default:
        return {
          label: 'Information Captured',
          color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300',
          icon: '💡'
        };
    }
  };

  const typeInfo = getTypeInfo();

  return (
    <div data-testid="memory-capture" className={`flex items-center gap-2 px-3 py-2 rounded-lg ${typeInfo.color} ${className}`}>
      <span className="text-sm">{typeInfo.icon}</span>
      <div className="flex-1">
        <div className="text-xs font-medium">{typeInfo.label}</div>
        <div className="text-xs opacity-75 truncate max-w-xs">{content}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-xs opacity-50 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      )}
    </div>
  );
};



