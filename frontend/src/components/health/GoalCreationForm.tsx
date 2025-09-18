'use client';

import { useState } from 'react';
import api from '@/lib/api';

interface GoalFormData {
  goal_type: 'weight' | 'fitness' | 'nutrition' | 'general';
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  unit: string;
  priority: 'low' | 'medium' | 'high';
  target_date: string;
}

interface GoalCreationFormProps {
  onGoalCreated: () => void;
  onCancel: () => void;
}

export default function GoalCreationForm({ onGoalCreated, onCancel }: GoalCreationFormProps) {
  const [formData, setFormData] = useState<GoalFormData>({
    goal_type: 'general',
    title: '',
    description: '',
    target_value: 0,
    current_value: 0,
    unit: '',
    priority: 'medium',
    target_date: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/health/goals/goals', formData);
      onGoalCreated();
    } catch (error) {
      console.error('Failed to create goal:', error);
      alert('Failed to create goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof GoalFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getGoalTypeUnits = (type: string) => {
    switch (type) {
      case 'weight': return ['kg', 'lbs'];
      case 'fitness': return ['times/week', 'minutes', 'hours', 'days'];
      case 'nutrition': return ['calories', 'grams', 'ml', 'servings'];
      case 'general': return ['times', 'days', 'weeks', 'months'];
      default: return [];
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl transform transition-all duration-300 scale-100 hover:scale-[1.02]">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create New Goal</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Goal Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Goal Type
            </label>
            <select
              value={formData.goal_type}
              onChange={(e) => handleInputChange('goal_type', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors duration-200 cursor-pointer"
              required
            >
              <option value="general">General</option>
              <option value="weight">Weight</option>
              <option value="fitness">Fitness</option>
              <option value="nutrition">Nutrition</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors duration-200"
              placeholder="e.g., Lose 5kg"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors duration-200 resize-none"
              placeholder="Describe your goal..."
              rows={3}
            />
          </div>

          {/* Target Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Value
            </label>
            <input
              type="number"
              value={formData.target_value}
              onChange={(e) => handleInputChange('target_value', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="70"
              required
            />
          </div>

          {/* Current Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Value
            </label>
            <input
              type="number"
              value={formData.current_value}
              onChange={(e) => handleInputChange('current_value', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="75"
            />
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Unit
            </label>
            <select
              value={formData.unit}
              onChange={(e) => handleInputChange('unit', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select unit</option>
              {getGoalTypeUnits(formData.goal_type).map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Target Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Date (Optional)
            </label>
            <input
              type="date"
              value={formData.target_date}
              onChange={(e) => handleInputChange('target_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 hover:scale-105 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none transition-all duration-200 font-medium"
            >
              {loading ? 'Creating...' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
