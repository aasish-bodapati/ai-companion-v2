import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  InformationCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  SaveIcon
} from '@heroicons/react/24/outline';
import { EnhancedFormContainer } from './enhanced-form-container';
import { EnhancedFormField } from './enhanced-form-field';
import { useFormValidation, ValidationRules } from '@/hooks/useFormValidation';
import { cn } from '@/lib/utils';

export interface SmartFormField {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
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
  icon?: React.ComponentType<{ className?: string }>;
  iconPosition?: 'left' | 'right';
  // Conditional rendering
  showWhen?: (values: Record<string, any>) => boolean;
  // Custom validation
  customValidation?: (value: any, allValues: Record<string, any>) => string | null;
}

export interface SmartFormProps {
  title?: string;
  description?: string;
  fields: SmartFormField[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'card' | 'minimal';
  showActions?: boolean;
  // Enhanced props
  showProgress?: boolean;
  currentStep?: number;
  totalSteps?: number;
  stepTitle?: string;
  autoSave?: boolean;
  autoSaveInterval?: number;
  onAutoSave?: (values: Record<string, any>) => void | Promise<void>;
  // Validation
  validationRules?: ValidationRules;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  // Success/Error handling
  showSuccessMessage?: boolean;
  successMessage?: string;
  showWarningMessage?: boolean;
  warningMessage?: string;
  // Layout
  columns?: 1 | 2 | 3;
  spacing?: 'sm' | 'md' | 'lg';
}

export function SmartForm({
  title,
  description,
  fields,
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  loading = false,
  disabled = false,
  className,
  variant = 'default',
  showActions = true,
  showProgress = false,
  currentStep = 1,
  totalSteps = 1,
  stepTitle,
  autoSave = false,
  autoSaveInterval = 30000,
  onAutoSave,
  validationRules = {},
  validateOnChange = true,
  validateOnBlur = true,
  showSuccessMessage = false,
  successMessage = 'Changes saved successfully!',
  showWarningMessage = false,
  warningMessage,
  columns = 1,
  spacing = 'md'
}: SmartFormProps) {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Build validation rules from field definitions
  const builtValidationRules: ValidationRules = React.useMemo(() => {
    const rules: ValidationRules = { ...validationRules };
    
    fields.forEach(field => {
      if (!rules[field.name]) {
        rules[field.name] = {};
      }
      
      if (field.required) {
        rules[field.name].required = true;
      }
      
      if (field.min !== undefined) {
        rules[field.name].min = field.min;
      }
      
      if (field.max !== undefined) {
        rules[field.name].max = field.max;
      }
      
      if (field.minLength !== undefined) {
        rules[field.name].minLength = field.minLength;
      }
      
      if (field.maxLength !== undefined) {
        rules[field.name].maxLength = field.maxLength;
      }
      
      if (field.type === 'email') {
        rules[field.name].email = true;
      }
      
      if (field.type === 'url') {
        rules[field.name].url = true;
      }
      
      if (field.customValidation) {
        rules[field.name].custom = (value) => field.customValidation!(value, values);
      }
    });
    
    return rules;
  }, [fields, validationRules, values]);

  const {
    errors,
    hasErrors,
    hasFieldError,
    getFieldError,
    isFieldTouched,
    validateForm,
    handleFieldChange,
    handleFieldBlur,
    clearErrors
  } = useFormValidation({
    rules: builtValidationRules,
    validateOnChange,
    validateOnBlur
  });

  // Handle field value changes
  const handleValueChange = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);
    handleFieldChange(name, value);
  }, [handleFieldChange]);

  // Handle field blur
  const handleValueBlur = useCallback((name: string) => {
    handleFieldBlur(name, values[name]);
  }, [handleFieldBlur, values]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && hasUnsavedChanges && onAutoSave) {
      const interval = setInterval(async () => {
        try {
          await onAutoSave(values);
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }, autoSaveInterval);

      return () => clearInterval(interval);
    }
  }, [autoSave, hasUnsavedChanges, values, onAutoSave, autoSaveInterval]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formErrors = validateForm(values);
    if (Object.keys(formErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Form submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm, onSubmit]);

  // Filter visible fields based on showWhen conditions
  const visibleFields = fields.filter(field => 
    !field.showWhen || field.showWhen(values)
  );

  // Get grid classes based on columns
  const getGridClasses = () => {
    switch (columns) {
      case 2:
        return 'grid grid-cols-1 md:grid-cols-2 gap-4';
      case 3:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
      default:
        return 'space-y-4';
    }
  };

  // Get spacing classes
  const getSpacingClasses = () => {
    switch (spacing) {
      case 'sm':
        return 'space-y-3';
      case 'lg':
        return 'space-y-6';
      default:
        return 'space-y-4';
    }
  };

  return (
    <EnhancedFormContainer
      title={title}
      description={description}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      submitLabel={submitLabel}
      cancelLabel={cancelLabel}
      loading={loading || isSubmitting}
      disabled={disabled}
      className={className}
      variant={variant}
      showActions={showActions}
      showProgress={showProgress}
      currentStep={currentStep}
      totalSteps={totalSteps}
      stepTitle={stepTitle}
      validationErrors={errors}
      showSuccessMessage={showSuccessMessage}
      successMessage={successMessage}
      showWarningMessage={showWarningMessage}
      warningMessage={warningMessage}
      autoSave={autoSave}
      autoSaveInterval={autoSaveInterval}
      lastSaved={lastSaved || undefined}
    >
      <div className={cn(
        columns > 1 ? getGridClasses() : getSpacingClasses()
      )}>
        {visibleFields.map((field) => (
          <EnhancedFormField
            key={field.name}
            name={field.name}
            label={field.label}
            type={field.type}
            value={values[field.name] || ''}
            onChange={(value) => handleValueChange(field.name, value)}
            onBlur={() => handleValueBlur(field.name)}
            placeholder={field.placeholder}
            required={field.required}
            disabled={disabled || field.disabled}
            error={getFieldError(field.name)}
            helpText={field.helpText}
            min={field.min}
            max={field.max}
            step={field.step}
            maxLength={field.maxLength}
            autoComplete={field.autoComplete}
            options={field.options}
            rows={field.rows}
            resize={field.resize}
            showSuccessState={field.showSuccessState}
            showCharacterCount={field.showCharacterCount}
            icon={field.icon}
            iconPosition={field.iconPosition}
            validationRules={{
              min: field.min,
              max: field.max,
              pattern: field.type === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/ : undefined,
              custom: field.customValidation ? (value) => field.customValidation!(value, values) : undefined
            }}
          />
        ))}
      </div>
    </EnhancedFormContainer>
  );
}
