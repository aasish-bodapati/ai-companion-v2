'use client';

import React, { useState } from 'react';
import { 
  FireIcon, 
  HeartIcon, 
  ClockIcon, 
  BookOpenIcon, 
  CloudIcon,
  PlusIcon 
} from '@heroicons/react/24/outline';

export interface ActionInput {
  type: 'workout' | 'meal' | 'mood' | 'sleep' | 'hydration' | 'journal';
  details: string;
  notes?: string;
}

interface ActionModeInputProps {
  onSubmit: (action: ActionInput) => void;
  disabled?: boolean;
}

const ACTION_TYPES = [
  { type: 'workout', icon: FireIcon, label: 'Workout', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20' },
  { type: 'meal', icon: HeartIcon, label: 'Meal', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  { type: 'mood', icon: CloudIcon, label: 'Mood', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
  { type: 'sleep', icon: ClockIcon, label: 'Sleep', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  { type: 'hydration', icon: PlusIcon, label: 'Hydration', color: 'text-cyan-600', bgColor: 'bg-cyan-50 dark:bg-cyan-900/20' },
  { type: 'journal', icon: BookOpenIcon, label: 'Journal', color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
] as const;

export const ActionModeInput: React.FC<ActionModeInputProps> = ({
  onSubmit,
  disabled = false
}) => {
  const [selectedType, setSelectedType] = useState<ActionInput['type'] | null>(null);
  const [details, setDetails] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !details.trim()) return;

    onSubmit({
      type: selectedType,
      details: details.trim(),
      notes: notes.trim() || undefined
    });

    // Reset form
    setSelectedType(null);
    setDetails('');
    setNotes('');
  };

  const handleQuickAction = (type: ActionInput['type'], quickDetail: string) => {
    onSubmit({
      type,
      details: quickDetail,
      notes: undefined
    });
  };

  return (
    <div className="space-y-4">
      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {ACTION_TYPES.map(({ type, icon: Icon, label, color, bgColor }) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            disabled={disabled}
            className={`p-3 rounded-lg border-2 transition-all duration-200 ${
              selectedType === type
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            } ${bgColor} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          >
            <div className="flex flex-col items-center space-y-2">
              <Icon className={`h-6 w-6 ${color}`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Action Presets */}
      {selectedType && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Quick {ACTION_TYPES.find(t => t.type === selectedType)?.label} Options:
          </h4>
          
          <div className="flex flex-wrap gap-2">
            {selectedType === 'workout' && (
              <>
                <button
                  onClick={() => handleQuickAction('workout', 'Strength Training')}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50"
                >
                  💪 Strength
                </button>
                <button
                  onClick={() => handleQuickAction('workout', 'Cardio')}
                  className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm hover:bg-red-200 dark:hover:bg-red-900/50"
                >
                  🏃 Cardio
                </button>
                <button
                  onClick={() => handleQuickAction('workout', 'Yoga')}
                  className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50"
                >
                  🧘 Yoga
                </button>
              </>
            )}
            
            {selectedType === 'meal' && (
              <>
                <button
                  onClick={() => handleQuickAction('meal', 'Breakfast')}
                  className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                >
                  🍳 Breakfast
                </button>
                <button
                  onClick={() => handleQuickAction('meal', 'Lunch')}
                  className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm hover:bg-orange-200 dark:hover:bg-orange-900/50"
                >
                  🥪 Lunch
                </button>
                <button
                  onClick={() => handleQuickAction('meal', 'Dinner')}
                  className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm hover:bg-red-200 dark:hover:bg-red-900/50"
                >
                  🍽️ Dinner
                </button>
              </>
            )}
            
            {selectedType === 'mood' && (
              <>
                <button
                  onClick={() => handleQuickAction('mood', 'Happy')}
                  className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                >
                  😊 Happy
                </button>
                <button
                  onClick={() => handleQuickAction('mood', 'Tired')}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50"
                >
                  😴 Tired
                </button>
                <button
                  onClick={() => handleQuickAction('mood', 'Stressed')}
                  className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm hover:bg-red-200 dark:hover:bg-red-900/50"
                >
                  😰 Stressed
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Custom Action Form */}
      {selectedType && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {ACTION_TYPES.find(t => t.type === selectedType)?.label} Details:
            </label>
            <input
              type="text"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={`Describe your ${selectedType}...`}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={disabled}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Notes (optional):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={disabled}
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={!details.trim() || disabled}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Log {ACTION_TYPES.find(t => t.type === selectedType)?.label}
            </button>
            
            <button
              type="button"
              onClick={() => setSelectedType(null)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
