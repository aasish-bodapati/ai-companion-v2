'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import api from '@/lib/api';
import { Toast, useToast } from '@/components/Toast';

interface Goal {
  id: string;
  name: string;
  category?: string;
  target_date?: string;
  target_value?: number;
  target_unit?: string;
  notes?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast, show, hide } = useToast();

  // Create Goal form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/v1/coaching/goals', { limit: 50 });
        setGoals(response || []);
      } catch (err: any) {
        setError(err?.message || 'Failed to load goals');
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, []);

  const refreshGoals = async () => {
    try {
      const response = await api.get('/api/v1/coaching/goals', { limit: 50 });
      setGoals(response || []);
    } catch (err: any) {
      // Surface softly; page already loaded
      show(err?.message || 'Failed to refresh goals', 'error');
    }
  };

  const onCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      show('Please enter a goal name', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, any> = { name: trimmedName };
      if (category) payload.category = category;
      if (targetDate) payload.target_date = targetDate;
      if (notes) payload.notes = notes;
      await api.post('/api/v1/coaching/goals', payload);
      show('Goal created', 'success');
      setName('');
      setCategory('');
      setTargetDate('');
      setNotes('');
      await refreshGoals();
    } catch (err: any) {
      show(err?.message || 'Failed to create goal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'strength': return '💪';
      case 'cardio': return '🏃';
      case 'weight_loss': return '⚖️';
      case 'muscle_gain': return '🏋️';
      case 'endurance': return '🚴';
      case 'flexibility': return '🧘';
      default: return '🎯';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'paused': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // No early return; we show a list skeleton below while loading

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-600 dark:text-red-400 mb-2">Error loading goals</div>
            <div className="text-gray-500 dark:text-gray-400">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="goals-heading">
            🎯 Goals
          </h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {goals.length} total goals
          </div>
        </div>

        {/* Create Goal */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Create Goal</h2>
          <form onSubmit={onCreateGoal} className="grid gap-3 md:grid-cols-2" data-testid="create-goal-form">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Deadlift 100kg"
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                data-testid="goal-name-input"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                data-testid="goal-category-select"
              >
                <option value="">Unspecified</option>
                <option value="strength">Strength</option>
                <option value="cardio">Cardio</option>
                <option value="weight_loss">Weight loss</option>
                <option value="muscle_gain">Muscle gain</option>
                <option value="endurance">Endurance</option>
                <option value="flexibility">Flexibility</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Target date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                data-testid="goal-target-date"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any extra details"
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                rows={3}
                data-testid="goal-notes"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                data-testid="goal-submit"
              >
                {submitting ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="animate-pulse" data-testid="goals-list-loading">
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              No goals set yet
            </div>
            <div className="text-sm text-gray-400 dark:text-gray-500">
              Try saying "My goal is to deadlift 100kg by December" in chat
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getCategoryIcon(goal.category)}</span>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {goal.name}
                      </h3>
                      {goal.category && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {goal.category.replace('_', ' ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(goal.status)}`}>
                    {goal.status}
                  </span>
                </div>

                {(goal.target_value || goal.target_date) && (
                  <div className="mb-3 space-y-1">
                    {goal.target_value && (
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Target: {goal.target_value}{goal.target_unit ? ` ${goal.target_unit}` : ''}
                      </div>
                    )}
                    {goal.target_date && (
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        By: {format(new Date(goal.target_date), 'PPP')}
                      </div>
                    )}
                  </div>
                )}

                {goal.notes && (
                  <div className="mb-3 text-sm text-gray-600 dark:text-gray-300 italic">
                    {goal.notes}
                  </div>
                )}

                {goal.created_at && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Created {format(new Date(goal.created_at), 'PPp')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast surface */}
      {toast && (
        <div className="fixed top-4 right-4">
          <Toast message={toast.message} kind={toast.kind} onClose={hide} />
        </div>
      )}
    </div>
  );
}
