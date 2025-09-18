'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircleIcon,
  TrophyIcon,
  SparklesIcon,
  FireIcon,
  HeartIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Achievement {
  title: string;
  description: string;
  icon: string;
}

interface InstantFeedbackData {
  feedback_type: 'fitness' | 'nutrition';
  primary_message: string;
  insights: string[];
  achievements: string[];
  recommendations: string[];
  celebration_worthy: boolean;
  next_action_suggestion?: string;
  motivational_boost: string;
}

interface InstantFeedbackProps {
  logType: 'fitness' | 'nutrition';
  logId: string;
  onClose?: () => void;
  autoClose?: boolean;
}

export function InstantFeedback({ 
  logType, 
  logId, 
  onClose, 
  autoClose = true 
}: InstantFeedbackProps) {
  const [feedback, setFeedback] = useState<InstantFeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    loadFeedback();
  }, [logType, logId]);

  useEffect(() => {
    if (autoClose && feedback && !feedback.celebration_worthy) {
      const timer = setTimeout(() => {
        handleClose();
      }, 5000); // Auto-close after 5 seconds for non-celebration feedback
      
      return () => clearTimeout(timer);
    }
  }, [feedback, autoClose]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/health/insights/instant-feedback/${logType}/${logId}`);
      setFeedback(response);
    } catch (error) {
      console.error('Failed to load instant feedback:', error);
      // Show a simple success message as fallback
      setFeedback({
        feedback_type: logType,
        primary_message: logType === 'fitness' ? 'Workout logged successfully!' : 'Meal logged successfully!',
        insights: [],
        achievements: [],
        recommendations: [],
        celebration_worthy: false,
        motivational_boost: 'Great job staying consistent! 🌟'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300); // Allow fade animation to complete
  };

  if (!visible || loading) {
    return null;
  }

  if (!feedback) {
    return null;
  }

  const getIcon = () => {
    if (feedback.achievements.length > 0) {
      return <TrophyIcon className="h-8 w-8 text-yellow-500" />;
    }
    if (feedback.celebration_worthy) {
      return <SparklesIcon className="h-8 w-8 text-purple-500" />;
    }
    if (feedback.feedback_type === 'fitness') {
      return <FireIcon className="h-8 w-8 text-orange-500" />;
    }
    return <HeartIcon className="h-8 w-8 text-green-500" />;
  };

  const getCardStyle = () => {
    if (feedback.achievements.length > 0) {
      return 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800';
    }
    if (feedback.celebration_worthy) {
      return 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800';
    }
    if (feedback.feedback_type === 'fitness') {
      return 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800';
    }
    return 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800';
  };

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-md w-full mx-4">
        <Card className={`${getCardStyle()} shadow-xl transform transition-all duration-300 ${visible ? 'scale-100' : 'scale-95'}`}>
          <CardContent className="p-6">
            {/* Close Button */}
            <div className="flex justify-end mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
              {getIcon()}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {feedback.primary_message}
                </h3>
                {feedback.motivational_boost && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {feedback.motivational_boost}
                  </p>
                )}
              </div>
            </div>

            {/* Achievements */}
            {feedback.achievements.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrophyIcon className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium text-gray-900 dark:text-white">Achievements</span>
                </div>
                <div className="space-y-2">
                  {feedback.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{achievement}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            {feedback.insights.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <SparklesIcon className="h-5 w-5 text-blue-500" />
                  <span className="font-medium text-gray-900 dark:text-white">Insights</span>
                </div>
                <div className="space-y-1">
                  {feedback.insights.map((insight, index) => (
                    <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
                      • {insight}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {feedback.recommendations.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <FireIcon className="h-5 w-5 text-orange-500" />
                  <span className="font-medium text-gray-900 dark:text-white">Recommendations</span>
                </div>
                <div className="space-y-1">
                  {feedback.recommendations.map((rec, index) => (
                    <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
                      💡 {rec}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Next Action */}
            {feedback.next_action_suggestion && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span className="font-medium">Next:</span> {feedback.next_action_suggestion}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleClose}
                className="flex-1"
                variant={feedback.celebration_worthy ? "default" : "outline"}
              >
                {feedback.celebration_worthy ? '🎉 Awesome!' : 'Got it!'}
              </Button>
              {feedback.next_action_suggestion && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Could implement navigation to next suggested action
                    toast.success('Feature coming soon!');
                  }}
                >
                  Next Action
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
