import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  EyeIcon, 
  EyeSlashIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { MobileOptimizedInput } from './mobile-optimized-input';
import { MobileOptimizedButton } from './mobile-optimized-button';
import { Label } from './label';
import { Textarea } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { cn } from '@/lib/utils';

export interface EnhancedFormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select';
  value: string | number;
  onChange: (value: string | number) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
  // Input specific props
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  autoComplete?: string;
  // Select specific props
  options?: Array<{ value: string; label: string }>;
  // Textarea specific props
  rows?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  // Enhanced props
  showSuccessState?: boolean;
  showCharacterCount?: boolean;
  validationRules?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: string | number) => string | null;
  };
  icon?: React.ComponentType<{ className?: string }>;
  iconPosition?: 'left' | 'right';
}

export function EnhancedFormField({
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  error,
  helpText,
  className,
  min,
  max,
  step,
  maxLength,
  autoComplete,
  options = [],
  rows = 3,
  resize = 'vertical',
  showSuccessState = true,
  showCharacterCount = false,
  validationRules,
  icon: Icon,
  iconPosition = 'left'
}: EnhancedFormFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  // Real-time validation
  useEffect(() => {
    if (hasInteracted && validationRules) {
      const validationError = validateValue(value, validationRules);
      setInternalError(validationError);
    }
  }, [value, validationRules, hasInteracted]);

  const validateValue = (val: string | number, rules: any): string | null => {
    if (rules.min !== undefined && val < rules.min) {
      return `Must be at least ${rules.min}`;
    }
    if (rules.max !== undefined && val > rules.max) {
      return `Must be at most ${rules.max}`;
    }
    if (rules.pattern && typeof val === 'string' && !rules.pattern.test(val)) {
      return 'Invalid format';
    }
    if (rules.custom) {
      return rules.custom(val);
    }
    return null;
  };

  const handleBlur = () => {
    setHasInteracted(true);
    onBlur?.();
  };

  const handleChange = (newValue: string | number) => {
    onChange(newValue);
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  const displayError = error || internalError;
  const isValid = !displayError && hasInteracted && value !== '' && value !== 0;
  const showSuccess = showSuccessState && isValid;

  const baseInputClasses = cn(
    'transition-all duration-200',
    displayError && 'border-red-500 focus:border-red-500 focus:ring-red-500',
    showSuccess && 'border-green-500 focus:border-green-500 focus:ring-green-500',
    disabled && 'opacity-50 cursor-not-allowed',
    Icon && iconPosition === 'left' && 'pl-10',
    Icon && iconPosition === 'right' && 'pr-10'
  );

  const renderInput = () => {
    const commonProps = {
      id: name,
      name,
      value,
      onChange: (e: any) => handleChange(e.target.value),
      onBlur: handleBlur,
      onFocus: () => setIsFocused(true),
      placeholder,
      disabled,
      className: cn(baseInputClasses, className),
      maxLength: showCharacterCount ? maxLength : undefined
    };

    switch (type) {
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            rows={rows}
            style={{ resize }}
            onChange={(e) => handleChange(e.target.value)}
          />
        );

      case 'select':
        return (
          <Select
            value={value.toString()}
            onValueChange={(val) => handleChange(val)}
            disabled={disabled}
          >
            <SelectTrigger className={cn(baseInputClasses, className)}>
              <SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'number':
        return (
          <MobileOptimizedInput
            {...commonProps}
            type="number"
            onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
            min={min}
            max={max}
            step={step}
          />
        );

      case 'password':
        return (
          <div className="relative">
            <MobileOptimizedInput
              {...commonProps}
              type={showPassword ? 'text' : 'password'}
              autoComplete={autoComplete}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        );

      default:
        return (
          <MobileOptimizedInput
            {...commonProps}
            type={type}
            autoComplete={autoComplete}
          />
        );
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      <Label 
        htmlFor={name} 
        className={cn(
          'text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2',
          required && 'after:content-["*"] after:ml-1 after:text-red-500'
        )}
      >
        {label}
        {helpText && (
          <InformationCircleIcon className="h-4 w-4 text-gray-400" title={helpText} />
        )}
      </Label>
      
      {/* Input Container */}
      <div className="relative">
        {/* Icon */}
        {Icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Icon className="h-5 w-5" />
          </div>
        )}
        
        {/* Input */}
        {renderInput()}
        
        {/* Right Icon */}
        {Icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Icon className="h-5 w-5" />
          </div>
        )}
        
        {/* Status Icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <AnimatePresence>
            {displayError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-red-500"
              >
                <ExclamationCircleIcon className="h-5 w-5" />
              </motion.div>
            )}
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-green-500"
              >
                <CheckCircleIcon className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Character Count */}
      {showCharacterCount && maxLength && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
          {String(value).length}/{maxLength}
        </div>
      )}
      
      {/* Error Message */}
      <AnimatePresence>
        {displayError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-red-500 flex items-center gap-1"
          >
            <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" />
            <span>{displayError}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Help Text */}
      {helpText && !displayError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1"
        >
          <InformationCircleIcon className="h-4 w-4 flex-shrink-0" />
          <span>{helpText}</span>
        </motion.div>
      )}
    </div>
  );
}
