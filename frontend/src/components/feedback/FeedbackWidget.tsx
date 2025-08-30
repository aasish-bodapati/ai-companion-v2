/**
 * Comprehensive Feedback Widget
 * 
 * Provides intuitive feedback collection for continuous improvement:
 * - Multi-dimensional feedback scoring
 * - Contextual feedback prompts
 * - Real-time satisfaction tracking
 * - Improvement suggestion collection
 */

import React, { useState, useCallback } from 'react';
import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Star, 
  Send,
  X,
  Lightbulb,
  Heart
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface FeedbackData {
  messageId?: string;
  conversationId: string;
  type: 'response_quality' | 'conversation_flow' | 'memory_accuracy' | 'emotional_support' | 'overall_satisfaction';
  score: number;
  comments?: string;
  improvementSuggestions?: string[];
  context?: {
    responseTime?: number;
    aiResponseLength?: number;
    memoryUsed?: string[];
  };
}

interface FeedbackWidgetProps {
  conversationId: string;
  messageId?: string;
  trigger?: 'manual' | 'auto' | 'completion';
  onFeedbackSubmitted?: (feedback: FeedbackData) => void;
  className?: string;
}

const FEEDBACK_TYPES = [
  {
    id: 'response_quality',
    label: 'Response Quality',
    icon: MessageSquare,
    description: 'How accurate and helpful was this response?'
  },
  {
    id: 'conversation_flow',
    label: 'Conversation Flow',
    icon: Heart,
    description: 'How natural did this conversation feel?'
  },
  {
    id: 'memory_accuracy',
    label: 'Memory Usage',
    icon: Lightbulb,
    description: 'How well did I remember and use your information?'
  },
  {
    id: 'emotional_support',
    label: 'Emotional Support',
    icon: Heart,
    description: 'How well did I understand and support your emotions?'
  },
  {
    id: 'overall_satisfaction',
    label: 'Overall Experience',
    icon: Star,
    description: 'How would you rate this overall interaction?'
  }
] as const;

export function FeedbackWidget({ 
  conversationId, 
  messageId, 
  trigger = 'manual',
  onFeedbackSubmitted,
  className = ''
}: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'quick' | 'detailed' | 'suggestions'>('quick');
  const [selectedType, setSelectedType] = useState<typeof FEEDBACK_TYPES[number]['id']>('overall_satisfaction');
  const [score, setScore] = useState<number>(5);
  const [comments, setComments] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [newSuggestion, setNewSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickFeedback = useCallback(async (rating: 'positive' | 'negative') => {
    const feedbackScore = rating === 'positive' ? 5 : 2;
    
    const feedbackData: FeedbackData = {
      messageId,
      conversationId,
      type: 'overall_satisfaction',
      score: feedbackScore,
      context: {
        responseTime: performance.now() // Simplified - would use actual response time
      }
    };

    try {
      // Send feedback to backend
      await submitFeedback(feedbackData);
      onFeedbackSubmitted?.(feedbackData);
      
      if (rating === 'negative') {
        setCurrentStep('detailed');
      } else {
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error submitting quick feedback:', error);
    }
  }, [conversationId, messageId, onFeedbackSubmitted]);

  const handleDetailedFeedback = useCallback(async () => {
    setIsSubmitting(true);
    
    const feedbackData: FeedbackData = {
      messageId,
      conversationId,
      type: selectedType,
      score,
      comments: comments.trim() || undefined,
      improvementSuggestions: suggestions.length > 0 ? suggestions : undefined,
      context: {
        responseTime: performance.now() // Simplified
      }
    };

    try {
      await submitFeedback(feedbackData);
      onFeedbackSubmitted?.(feedbackData);
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error submitting detailed feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [conversationId, messageId, selectedType, score, comments, suggestions, onFeedbackSubmitted]);

  const submitFeedback = async (feedbackData: FeedbackData) => {
    const response = await fetch(`/api/conversations/${conversationId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedbackData),
    });

    if (!response.ok) {
      throw new Error('Failed to submit feedback');
    }

    return response.json();
  };

  const resetForm = () => {
    setCurrentStep('quick');
    setSelectedType('overall_satisfaction');
    setScore(5);
    setComments('');
    setSuggestions([]);
    setNewSuggestion('');
  };

  const addSuggestion = () => {
    if (newSuggestion.trim() && !suggestions.includes(newSuggestion.trim())) {
      setSuggestions([...suggestions, newSuggestion.trim()]);
      setNewSuggestion('');
    }
  };

  const removeSuggestion = (index: number) => {
    setSuggestions(suggestions.filter((_, i) => i !== index));
  };

  if (!isOpen) {
    return (
      <div className={`feedback-widget ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="text-gray-500 hover:text-gray-700"
        >
          <MessageSquare className="w-4 h-4 mr-1" />
          Feedback
        </Button>
      </div>
    );
  }

  return (
    <div className={`feedback-widget-modal ${className}`}>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">Share Your Feedback</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-4">
            {currentStep === 'quick' && (
              <div className="space-y-4">
                <p className="text-gray-600">How was this response?</p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => handleQuickFeedback('positive')}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Helpful
                  </Button>
                  <Button
                    onClick={() => handleQuickFeedback('negative')}
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    Not Helpful
                  </Button>
                </div>
                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={() => setCurrentStep('detailed')}
                    className="text-sm text-gray-500"
                  >
                    Give detailed feedback
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'detailed' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    What would you like to rate?
                  </label>
                  <div className="space-y-2">
                    {FEEDBACK_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.id}
                          onClick={() => setSelectedType(type.id)}
                          className={`w-full p-3 text-left rounded-lg border transition-colors ${
                            selectedType === type.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start">
                            <Icon className="w-4 h-4 mt-1 mr-3 text-gray-500" />
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-sm text-gray-500">{type.description}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Rating (1-5 stars)
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setScore(rating)}
                        className={`p-1 ${
                          rating <= score ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        <Star className="w-6 h-6 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Additional Comments (Optional)
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="What could be improved? What did you like?"
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('suggestions')}
                    className="flex-1"
                  >
                    Add Suggestions
                  </Button>
                  <Button
                    onClick={handleDetailedFeedback}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'suggestions' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Improvement Suggestions
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newSuggestion}
                      onChange={(e) => setNewSuggestion(e.target.value)}
                      placeholder="What would make this better?"
                      className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && addSuggestion()}
                    />
                    <Button onClick={addSuggestion} size="sm">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="secondary" className="flex-1">
                          {suggestion}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSuggestion(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('detailed')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleDetailedFeedback}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit All'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeedbackWidget;



