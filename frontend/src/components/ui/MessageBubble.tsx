import React from 'react';
import { cn } from '../../lib/utils';

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  timestamp?: string;
  isStreaming?: boolean;
  userName?: string;
  assistantName?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  content,
  isUser,
  timestamp,
  isStreaming = false,
  userName = "You",
  assistantName = "Assistant"
}) => {
  const displayName = isUser ? userName : assistantName;
  
  // Format content with proper line breaks and spacing
  const formatContent = (text: string) => {
    if (!text) return text;
    
    // Split on line breaks and trim each line
    const lines = text.split('\n').map(line => line.trim());
    
    // Filter out empty lines and join with proper spacing
    return lines.filter(line => line.length > 0).join('\n\n');
  };
  
  const formattedContent = formatContent(content);
  
  return (
    <div 
      className={cn(
        "flex w-full mb-6", // Increased margin bottom for better spacing
        isUser ? "justify-end" : "justify-start"
      )}
      data-testid={isUser ? "user-message" : "assistant-response"}
    >
      <div className={cn(
        "max-w-[85%] rounded-2xl px-5 py-4 shadow-sm", // Increased padding and max width
        isUser 
          ? "bg-blue-500 text-white rounded-br-md" 
          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-200 dark:border-gray-700",
        isStreaming && "animate-pulse border-blue-300 dark:border-blue-600"
      )}>
        {!isUser && (
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            {displayName}
          </div>
        )}
        
        <div className="whitespace-pre-wrap break-words leading-relaxed">
          {formattedContent}
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-current opacity-75 animate-pulse ml-2" />
          )}
        </div>
        
        {timestamp && (
          <div 
            className={cn(
              "text-xs mt-3 opacity-70", // Increased top margin
              isUser ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
            )}
            data-testid="message-timestamp"
          >
            {new Date(timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
