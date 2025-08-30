import React from 'react';

interface RateLimitIndicatorProps {
  remaining?: string | null;
  limit?: string | null;
  reset?: string | null;
  className?: string;
}

export const RateLimitIndicator: React.FC<RateLimitIndicatorProps> = ({
  remaining,
  limit,
  reset,
  className = ''
}) => {
  if (!remaining || !limit) return null;

  const remainingNum = parseInt(remaining, 10);
  const limitNum = parseInt(limit, 10);
  const percentage = (remainingNum / limitNum) * 100;

  // Determine color based on remaining requests
  let colorClass = 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
  if (percentage < 25) {
    colorClass = 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
  } else if (percentage < 50) {
    colorClass = 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
  }

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${colorClass} ${className}`}>
      <span>Rate Limit: {remaining}/{limit}</span>
      {reset && (
        <span className="text-xs opacity-75">
          (resets in {Math.ceil(parseInt(reset, 10) / 60)}m)
        </span>
      )}
    </div>
  );
};








