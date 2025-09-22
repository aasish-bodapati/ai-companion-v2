'use client';

import React from 'react';
import { FormField } from '@/components/ui/form-field';
import { FormSection } from '@/components/ui/form-section';
import { WorkoutCategory } from './WorkoutCategorySelector';

interface WorkoutInputProps {
  category: WorkoutCategory;
  values: Record<string, any>;
  onChange: (field: string, value: any) => void;
  className?: string;
}

export function WorkoutInputComponentsWithFormComponents({ 
  category, 
  values, 
  onChange, 
  className = '' 
}: WorkoutInputProps) {
  // Convert category attributes to FormField props
  const convertAttributeToFormField = (attr: any, isRequired: boolean = false) => {
    const fieldProps = {
      name: attr.name,
      label: attr.label,
      value: values[attr.name] || '',
      onChange: (value: any) => onChange(attr.name, value),
      placeholder: `Enter ${attr.label.toLowerCase()}`,
      required: isRequired,
      min: attr.min,
      max: attr.max,
      maxLength: attr.max_length,
      className: ''
    };

    // Determine field type and specific props
    switch (attr.type) {
      case 'number':
        return {
          ...fieldProps,
          type: 'number' as const
        };
      
      case 'select':
        return {
          ...fieldProps,
          type: 'select' as const,
          options: attr.options?.map((option: string) => ({
            value: option,
            label: option
          })) || []
        };
      
      case 'text':
        if (attr.max_length && attr.max_length > 100) {
          return {
            ...fieldProps,
            type: 'textarea' as const,
            rows: 3,
            className: 'min-h-[80px]'
          };
        }
        return {
          ...fieldProps,
          type: 'text' as const
        };
      
      default:
        return {
          ...fieldProps,
          type: 'text' as const
        };
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Required Fields Section */}
      {category.loggingAttributes.required.length > 0 && (
        <FormSection
          title="Required Fields"
          required={true}
          variant="bordered"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.loggingAttributes.required.map((attr) => (
              <FormField
                key={attr.name}
                {...convertAttributeToFormField(attr, true)}
              />
            ))}
          </div>
        </FormSection>
      )}

      {/* Optional Fields Section */}
      {category.loggingAttributes.optional.length > 0 && (
        <FormSection
          title="Optional Fields"
          description="Additional information to help track your progress"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.loggingAttributes.optional.map((attr) => (
              <FormField
                key={attr.name}
                {...convertAttributeToFormField(attr, false)}
              />
            ))}
          </div>
        </FormSection>
      )}
    </div>
  );
}

// Specific component for Bodyweight exercises
export function BodyweightWorkoutInputWithFormComponents({ 
  values, 
  onChange, 
  className = '' 
}: Omit<WorkoutInputProps, 'category'>) {
  return (
    <div className={`space-y-6 ${className}`}>
      <FormSection
        title="Exercise Details"
        required={true}
        variant="bordered"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="sets"
            label="Sets"
            type="number"
            value={values.sets || ''}
            onChange={(value) => onChange('sets', value)}
            placeholder="Enter number of sets"
            required={true}
            min={1}
            max={50}
          />
          
          <FormField
            name="reps"
            label="Reps"
            type="number"
            value={values.reps || ''}
            onChange={(value) => onChange('reps', value)}
            placeholder="Enter number of reps"
            required={true}
            min={1}
            max={1000}
          />
        </div>
      </FormSection>

      <FormSection
        title="Additional Information"
        description="Optional notes about your workout"
      >
        <FormField
          name="notes"
          label="Notes"
          type="textarea"
          value={values.notes || ''}
          onChange={(value) => onChange('notes', value)}
          placeholder="Add any additional notes..."
          maxLength={500}
          rows={3}
          className="min-h-[80px]"
        />
      </FormSection>
    </div>
  );
}

// Specific component for Weighted exercises
export function WeightedWorkoutInputWithFormComponents({ 
  values, 
  onChange, 
  className = '' 
}: Omit<WorkoutInputProps, 'category'>) {
  return (
    <div className={`space-y-6 ${className}`}>
      <FormSection
        title="Exercise Details"
        required={true}
        variant="bordered"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            name="sets"
            label="Sets"
            type="number"
            value={values.sets || ''}
            onChange={(value) => onChange('sets', value)}
            placeholder="Enter number of sets"
            required={true}
            min={1}
            max={50}
          />
          
          <FormField
            name="reps"
            label="Reps"
            type="number"
            value={values.reps || ''}
            onChange={(value) => onChange('reps', value)}
            placeholder="Enter number of reps"
            required={true}
            min={1}
            max={1000}
          />
          
          <FormField
            name="weight"
            label="Weight"
            type="number"
            value={values.weight || ''}
            onChange={(value) => onChange('weight', value)}
            placeholder="Enter weight"
            required={true}
            min={0}
            max={1000}
          />
        </div>
      </FormSection>

      <FormSection
        title="Weight Settings"
        description="Configure weight measurement"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="weight_unit"
            label="Weight Unit"
            type="select"
            value={values.weight_unit || 'lbs'}
            onChange={(value) => onChange('weight_unit', value)}
            options={[
              { value: 'lbs', label: 'lbs' },
              { value: 'kg', label: 'kg' }
            ]}
          />
        </div>
      </FormSection>

      <FormSection
        title="Additional Information"
        description="Optional notes about your workout"
      >
        <FormField
          name="notes"
          label="Notes"
          type="textarea"
          value={values.notes || ''}
          onChange={(value) => onChange('notes', value)}
          placeholder="Add any additional notes..."
          maxLength={500}
          rows={3}
          className="min-h-[80px]"
        />
      </FormSection>
    </div>
  );
}

// Specific component for Cardio exercises
export function CardioWorkoutInputWithFormComponents({ 
  values, 
  onChange, 
  className = '' 
}: Omit<WorkoutInputProps, 'category'>) {
  return (
    <div className={`space-y-6 ${className}`}>
      <FormSection
        title="Exercise Details"
        required={true}
        variant="bordered"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="duration"
            label="Duration (minutes)"
            type="number"
            value={values.duration || ''}
            onChange={(value) => onChange('duration', value)}
            placeholder="Enter duration in minutes"
            required={true}
            min={1}
            max={600}
          />
          
          <FormField
            name="distance"
            label="Distance"
            type="number"
            value={values.distance || ''}
            onChange={(value) => onChange('distance', value)}
            placeholder="Enter distance"
            min={0}
            max={1000}
          />
        </div>
      </FormSection>

      <FormSection
        title="Additional Metrics"
        description="Optional metrics to track your cardio performance"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            name="distance_unit"
            label="Distance Unit"
            type="select"
            value={values.distance_unit || 'miles'}
            onChange={(value) => onChange('distance_unit', value)}
            options={[
              { value: 'miles', label: 'miles' },
              { value: 'km', label: 'km' },
              { value: 'meters', label: 'meters' }
            ]}
          />
          
          <FormField
            name="intensity"
            label="Intensity"
            type="select"
            value={values.intensity || ''}
            onChange={(value) => onChange('intensity', value)}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' }
            ]}
          />
          
          <FormField
            name="heart_rate"
            label="Heart Rate (bpm)"
            type="number"
            value={values.heart_rate || ''}
            onChange={(value) => onChange('heart_rate', value)}
            placeholder="Enter heart rate"
            min={40}
            max={220}
          />
        </div>
      </FormSection>

      <FormSection
        title="Additional Information"
        description="Optional notes about your workout"
      >
        <FormField
          name="notes"
          label="Notes"
          type="textarea"
          value={values.notes || ''}
          onChange={(value) => onChange('notes', value)}
          placeholder="Add any additional notes..."
          maxLength={500}
          rows={3}
          className="min-h-[80px]"
        />
      </FormSection>
    </div>
  );
}
