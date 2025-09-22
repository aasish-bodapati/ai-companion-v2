import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { MobileOptimizedButton } from './mobile-optimized-button';
import { cn } from '@/lib/utils';

export interface EnhancedFormContainerProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'card' | 'minimal';
  showActions?: boolean;
  actions?: React.ReactNode;
  // Enhanced props
  showProgress?: boolean;
  currentStep?: number;
  totalSteps?: number;
  stepTitle?: string;
  validationErrors?: Record<string, string>;
  showSuccessMessage?: boolean;
  successMessage?: string;
  showWarningMessage?: boolean;
  warningMessage?: string;
  autoSave?: boolean;
  autoSaveInterval?: number;
  lastSaved?: Date;
}

export function EnhancedFormContainer({
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
  actions,
  showProgress = false,
  currentStep = 1,
  totalSteps = 1,
  stepTitle,
  validationErrors = {},
  showSuccessMessage = false,
  successMessage = 'Changes saved successfully!',
  showWarningMessage = false,
  warningMessage,
  autoSave = false,
  autoSaveInterval = 30000, // 30 seconds
  lastSaved
}: EnhancedFormContainerProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showAutoSave, setShowAutoSave] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && hasUnsavedChanges) {
      const interval = setInterval(() => {
        setShowAutoSave(true);
        // Trigger auto-save (this would be handled by parent component)
        setTimeout(() => setShowAutoSave(false), 2000);
      }, autoSaveInterval);

      return () => clearInterval(interval);
    }
  }, [autoSave, hasUnsavedChanges, autoSaveInterval]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
    setHasUnsavedChanges(false);
  };

  const hasErrors = Object.keys(validationErrors).length > 0;
  const progressPercentage = totalSteps > 1 ? (currentStep / totalSteps) * 100 : 100;

  const content = (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Progress Bar */}
      {showProgress && totalSteps > 1 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {stepTitle || `Step ${currentStep} of ${totalSteps}`}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              {Math.round(progressPercentage)}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Messages */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3"
          >
            <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span className="text-green-800 dark:text-green-200">{successMessage}</span>
          </motion.div>
        )}
        
        {showWarningMessage && warningMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center gap-3"
          >
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <span className="text-yellow-800 dark:text-yellow-200">{warningMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Content */}
      <div className="space-y-4">
        {children}
      </div>
      
      {/* Auto-save indicator */}
      {autoSave && (
        <AnimatePresence>
          {showAutoSave && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-sm text-gray-500 dark:text-gray-400 text-center"
            >
              Auto-saving...
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Last saved indicator */}
      {lastSaved && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Last saved: {lastSaved.toLocaleTimeString()}
        </div>
      )}
      
      {/* Actions */}
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
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              {cancelLabel}
            </MobileOptimizedButton>
          )}
          
          {actions || (
            <MobileOptimizedButton
              type="submit"
              disabled={loading || disabled || hasErrors}
              className={cn(
                "order-1 sm:order-2 min-w-[120px]",
                hasErrors && "opacity-50 cursor-not-allowed"
              )}
              fullWidth
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <span>{submitLabel}</span>
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </>
              )}
            </MobileOptimizedButton>
          )}
        </div>
      )}

      {/* Validation Summary */}
      {hasErrors && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-red-800 dark:text-red-200">
                Please fix the following errors:
              </h4>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                {Object.entries(validationErrors).map(([field, error]) => (
                  <li key={field} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
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

  return (
    <div className="space-y-6">
      {(title || description) && (
        <div>
          {title && <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>}
          {description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">{description}</p>
          )}
        </div>
      )}
      {content}
    </div>
  );
}
