import React from 'react';

interface StreamingIndicatorProps {
  isVisible: boolean;
  userName?: string;
}

export const StreamingIndicator: React.FC<StreamingIndicatorProps> = ({
  isVisible,
  userName = "Assistant"
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className="flex items-center space-x-2 p-3 text-blue-600 dark:text-blue-400 animate-pulse"
      data-testid="streaming-indicator"
    >
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.1s]"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
      </div>
      <span className="text-sm font-medium">{userName} is typing...</span>
    </div>
  );
};

export default StreamingIndicator;
