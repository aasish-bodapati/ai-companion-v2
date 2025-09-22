import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select';
  value: string | number;
  onChange: (value: string | number) => void;
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
}

export function FormField({
  name,
  label,
  type = 'text',
  value,
  onChange,
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
  resize = 'vertical'
}: FormFieldProps) {
  const baseInputClasses = cn(
    'transition-colors',
    error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
    disabled && 'opacity-50 cursor-not-allowed'
  );

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <Textarea
            id={name}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            rows={rows}
            className={cn(baseInputClasses, className)}
            style={{ resize }}
          />
        );

      case 'select':
        return (
          <Select
            value={value.toString()}
            onValueChange={(val) => onChange(val)}
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
          <Input
            id={name}
            name={name}
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            className={cn(baseInputClasses, className)}
          />
        );

      default:
        return (
          <Input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            autoComplete={autoComplete}
            className={cn(baseInputClasses, className)}
          />
        );
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label 
        htmlFor={name} 
        className={cn(
          'text-sm font-medium text-gray-700 dark:text-gray-300',
          required && 'after:content-["*"] after:ml-1 after:text-red-500'
        )}
      >
        {label}
      </Label>
      
      {renderInput()}
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      
      {helpText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
    </div>
  );
}
