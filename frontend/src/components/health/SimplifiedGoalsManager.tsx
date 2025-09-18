'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import GoalCreationForm from './GoalCreationForm';

interface HealthGoal {
  id: string;
  goal_type: 'weight' | 'fitness' | 'nutrition' | 'general';
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  unit: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface GoalsSummary {
  total_goals: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
}

export default function SimplifiedGoalsManager() {
  const { isAuthenticated } = useAuth();
  const [goals, setGoals] = useState<HealthGoal[]>([]);
  const [summary, setSummary] = useState<GoalsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState<{
    goal_type?: string;
    status?: string;
  }>({});

  const loadGoals = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.goal_type) params.append('goal_type', filter.goal_type);
      if (filter.status) params.append('status', filter.status);
      
      const response = await api.get(`/health/goals/goals?${params.toString()}`);
      setGoals(response);
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, filter.goal_type, filter.status]);

  const loadSummary = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await api.get('/health/goals/goals/summary');
      setSummary(response);
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadGoals();
    loadSummary();
  }, [isAuthenticated, filter, loadGoals, loadSummary]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getGoalTypeIcon = (type: string) => {
    switch (type) {
      case 'weight': return '⚖️';
      case 'fitness': return '💪';
      case 'nutrition': return '🥗';
      case 'general': return '🎯';
      default: return '📋';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please log in to view your health goals.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors duration-300">Total Goals</h3>
            <p className="text-3xl font-bold text-blue-600 group-hover:scale-110 transition-transform duration-300">{summary.total_goals}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-green-600 transition-colors duration-300">Active Goals</h3>
            <p className="text-3xl font-bold text-green-600 group-hover:scale-110 transition-transform duration-300">{summary.by_status.active || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors duration-300">Completed</h3>
            <p className="text-3xl font-bold text-purple-600 group-hover:scale-110 transition-transform duration-300">{summary.by_status.completed || 0}</p>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4">
              <select
                value={filter.goal_type || ''}
                onChange={(e) => setFilter({ ...filter, goal_type: e.target.value || undefined })}
                className="px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 dark:hover:border-blue-400 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
              >
                <option value="">All Types</option>
                <option value="weight">Weight</option>
                <option value="fitness">Fitness</option>
                <option value="nutrition">Nutrition</option>
                <option value="general">General</option>
              </select>

              <select
                value={filter.status || ''}
                onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
                className="px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 dark:hover:border-blue-400 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
              </select>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 hover:scale-105 hover:shadow-lg transition-all duration-200 font-medium"
        >
          + Create Goal
        </button>
      </div>

      {/* Goals List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto hover:scale-110 transition-transform duration-300"></div>
          <p className="mt-2 text-gray-500 animate-pulse">Loading goals...</p>
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No goals found. Create your first health goal!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {goals.map((goal) => (
            <div key={goal.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group border border-transparent hover:border-blue-200 dark:hover:border-blue-800">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{getGoalTypeIcon(goal.goal_type)}</span>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors duration-300">
                      {goal.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)} group-hover:scale-105 transition-transform duration-200`}>
                      {goal.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)} group-hover:scale-105 transition-transform duration-200`}>
                      {goal.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{goal.description}</p>
                  
                  {goal.target_value && (
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{goal.current_value} / {goal.target_value} {goal.unit}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 group-hover:bg-gray-300 dark:group-hover:bg-gray-600 transition-colors duration-300">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500 group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-blue-700"
                            style={{ 
                              width: `${Math.min((goal.current_value / goal.target_value) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Goal Creation Form Modal */}
      {showCreateForm && (
        <GoalCreationForm
          onGoalCreated={() => {
            setShowCreateForm(false);
            loadGoals();
            loadSummary();
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
}
