import React from 'react';

interface IntelligentTypingProps {
  isVisible: boolean;
  userName: string;
  responseLength?: number;
  responseComplexity?: 'simple' | 'medium' | 'complex';
  onTypingComplete?: () => void;
}

export const IntelligentTyping: React.FC<IntelligentTypingProps> = ({
  isVisible,
  userName,
  responseLength = 0,
  responseComplexity = 'medium',
  onTypingComplete
}) => {
  // Simplified: always show thinking state when visible
  if (!isVisible) {
    return null;
  }

  // Always show thinking state - simpler and more reliable
  return (
    <div 
      className="flex items-center space-x-3 p-5 text-gray-600 dark:text-gray-300 animate-fade-in bg-white/80 dark:bg-gray-800/80 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm max-w-md mx-auto" 
      data-testid="assistant-thinking"
    >
      <div className="flex space-x-1">
        <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
        <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
        <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
      </div>
      <span className="text-sm font-medium">{userName} is thinking...</span>
    </div>
  );
};

export default IntelligentTyping;
