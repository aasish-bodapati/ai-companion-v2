import React from 'react';
import { FormField, FormFieldProps } from './form-field';
import { FormSection } from './form-section';
import { FormContainer } from './form-container';
import { cn } from '@/lib/utils';

export interface FormAttribute {
  name: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select';
  label: string;
  required?: boolean;
  placeholder?: string;
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
}

export interface FormSectionConfig {
  title?: string;
  description?: string;
  required?: boolean;
  attributes: FormAttribute[];
  variant?: 'default' | 'card' | 'bordered';
}

export interface DynamicFormProps {
  sections: FormSectionConfig[];
  values: Record<string, any>;
  errors?: Record<string, string>;
  onChange: (name: string, value: any) => void;
  onSubmit?: (values: Record<string, any>) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'card' | 'minimal';
  showActions?: boolean;
  actions?: React.ReactNode;
  title?: string;
  description?: string;
}

export function DynamicForm({
  sections,
  values,
  errors = {},
  onChange,
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
  title,
  description
}: DynamicFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(values);
  };

  const renderField = (attr: FormAttribute) => {
    const fieldProps: FormFieldProps = {
      name: attr.name,
      label: attr.label,
      type: attr.type,
      value: values[attr.name] || '',
      onChange: (value) => onChange(attr.name, value),
      placeholder: attr.placeholder,
      required: attr.required,
      disabled: disabled,
      error: errors[attr.name],
      helpText: attr.helpText,
      min: attr.min,
      max: attr.max,
      step: attr.step,
      maxLength: attr.maxLength,
      autoComplete: attr.autoComplete,
      options: attr.options,
      rows: attr.rows,
      resize: attr.resize
    };

    return <FormField key={attr.name} {...fieldProps} />;
  };

  const renderSection = (section: FormSectionConfig, index: number) => {
    return (
      <FormSection
        key={index}
        title={section.title}
        description={section.description}
        required={section.required}
        variant={section.variant}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {section.attributes.map(renderField)}
        </div>
      </FormSection>
    );
  };

  return (
    <FormContainer
      title={title}
      description={description}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      submitLabel={submitLabel}
      cancelLabel={cancelLabel}
      loading={loading}
      disabled={disabled}
      className={className}
      variant={variant}
      showActions={showActions}
      actions={actions}
    >
      {sections.map(renderSection)}
    </FormContainer>
  );
}
