import React from 'react';

interface TypingIndicatorProps {
  isVisible: boolean;
  userName?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  isVisible, 
  userName = "Assistant" 
}) => {
  if (!isVisible) return null;

  return (
    <div className="flex items-center space-x-2 p-4 text-gray-500 animate-fade-in" data-testid="assistant-thinking">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
      </div>
      <span className="text-sm italic">{userName} is thinking...</span>
    </div>
  );
};

export default TypingIndicator;
