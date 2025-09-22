import React from 'react';
import { cn } from '@/lib/utils';

export interface FormSectionProps {
  title?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'card' | 'bordered';
}

export function FormSection({
  title,
  description,
  required = false,
  children,
  className,
  variant = 'default'
}: FormSectionProps) {
  const baseClasses = 'space-y-4';
  
  const variantClasses = {
    default: '',
    card: 'p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
    bordered: 'p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-r-lg'
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className={cn(
              'text-sm font-semibold text-gray-900 dark:text-white',
              required && 'flex items-center'
            )}>
              {title}
              {required && (
                <span className="ml-2 text-red-500">*</span>
              )}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}
      
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}
