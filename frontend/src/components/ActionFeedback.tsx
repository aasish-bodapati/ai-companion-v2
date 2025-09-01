import React from 'react';
import { CheckCircle, XCircle, Calendar, Target, BookOpen, Activity, Utensils } from 'lucide-react';

interface ActionFeedbackProps {
  action: string;
  success: boolean;
  feedback: string;
  timestamp: string;
  onDismiss?: () => void;
}

const ActionFeedback: React.FC<ActionFeedbackProps> = ({
  action,
  success,
  feedback,
  timestamp,
  onDismiss
}) => {
  const getActionIcon = (actionName: string) => {
    switch (actionName) {
      case 'fitness.log_workout':
        return <Activity className="w-5 h-5" />;
      case 'nutrition.log_meal':
        return <Utensils className="w-5 h-5" />;
      case 'calendar.create_event':
        return <Calendar className="w-5 h-5" />;
      case 'coaching.create_goal':
        return <Target className="w-5 h-5" />;
      case 'journal.add_entry':
        return <BookOpen className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getActionName = (actionName: string) => {
    switch (actionName) {
      case 'fitness.log_workout':
        return 'Workout Logged';
      case 'nutrition.log_meal':
        return 'Meal Logged';
      case 'calendar.create_event':
        return 'Calendar Event Created';
      case 'coaching.create_goal':
        return 'Goal Created';
      case 'journal.add_entry':
        return 'Journal Entry Saved';
      default:
        return 'Action Completed';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  return (
    <div className={`rounded-lg border p-4 mb-4 transition-all duration-300 ${
      success 
        ? 'bg-green-50 border-green-200 text-green-800' 
        : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 ${
            success ? 'text-green-600' : 'text-red-600'
          }`}>
            {success ? (
              <CheckCircle className="w-6 h-6" />
            ) : (
              <XCircle className="w-6 h-6" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              {getActionIcon(action)}
              <h4 className="font-medium text-sm">
                {getActionName(action)}
              </h4>
              <span className="text-xs opacity-70">
                {formatTimestamp(timestamp)}
              </span>
            </div>
            
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {feedback}
            </p>
          </div>
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss feedback"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ActionFeedback;
