import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface FormContainerProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'card' | 'minimal';
  showActions?: boolean;
  actions?: React.ReactNode;
}

export function FormContainer({
  title,
  description,
  children,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  loading = false,
  disabled = false,
  className,
  variant = 'default',
  showActions = true,
  actions
}: FormContainerProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  const content = (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}
      
      <div className="space-y-6">
        {children}
      </div>
      
      {showActions && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          {actions || (
            <>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading || disabled}
                >
                  {cancelLabel}
                </Button>
              )}
              <Button
                type="submit"
                disabled={loading || disabled}
                className="min-w-[100px]"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Saving...
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            </>
          )}
        </div>
      )}
    </form>
  );

  if (variant === 'card') {
    return (
      <Card>
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'minimal') {
    return content;
  }

  return content;
}
