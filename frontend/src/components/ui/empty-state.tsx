import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: 'default' | 'minimal' | 'card';
}

export function EmptyState({
  title = 'No data available',
  description = 'There are no items to display at the moment.',
  icon,
  action,
  className = '',
  variant = 'default'
}: EmptyStateProps) {
  const content = (
    <div className={`text-center py-8 ${className}`}>
      {icon && (
        <div className="flex justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );

  if (variant === 'card') {
    return (
      <Card>
        <CardContent className="p-6">
          {content}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 dark:text-gray-400">{title}</p>
        {action && (
          <Button variant="outline" size="sm" onClick={action.onClick} className="mt-2">
            {action.label}
          </Button>
        )}
      </div>
    );
  }

  return content;
}
