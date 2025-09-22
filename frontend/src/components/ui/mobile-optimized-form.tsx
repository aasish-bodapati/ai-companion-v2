import React from 'react';
import { cn } from '@/lib/utils';
import { MobileOptimizedButton } from './mobile-optimized-button';

interface MobileOptimizedFormProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  showActions?: boolean;
}

export function MobileOptimizedForm({
  children,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  loading = false,
  disabled = false,
  className,
  showActions = true
}: MobileOptimizedFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      <div className="space-y-4">
        {children}
      </div>
      
      {showActions && (
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          {onCancel && (
            <MobileOptimizedButton
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading || disabled}
              className="order-2 sm:order-1"
            >
              {cancelLabel}
            </MobileOptimizedButton>
          )}
          <MobileOptimizedButton
            type="submit"
            disabled={loading || disabled}
            className="order-1 sm:order-2 min-w-[120px]"
            fullWidth
          >
            {loading ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                Saving...
              </>
            ) : (
              submitLabel
            )}
          </MobileOptimizedButton>
        </div>
      )}
    </form>
  );
}
