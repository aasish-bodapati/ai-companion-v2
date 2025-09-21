'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { WorkoutCategory } from './WorkoutCategorySelector';

interface WorkoutInputProps {
  category: WorkoutCategory;
  values: Record<string, any>;
  onChange: (field: string, value: any) => void;
  className?: string;
}

export function WorkoutInputComponents({ category, values, onChange, className = '' }: WorkoutInputProps) {
  const renderInput = (attr: any, isRequired: boolean = false) => {
    const value = values[attr.name] || '';
    const requiredClass = isRequired ? 'required' : '';

    switch (attr.type) {
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(attr.name, e.target.value ? Number(e.target.value) : '')}
            min={attr.min}
            max={attr.max}
            placeholder={`Enter ${attr.label.toLowerCase()}`}
            className={`${requiredClass}`}
          />
        );
      
      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(val) => onChange(attr.name, val)}
          >
            <SelectTrigger className={requiredClass}>
              <SelectValue placeholder={`Select ${attr.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {attr.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'text':
        if (attr.max_length && attr.max_length > 100) {
          return (
            <Textarea
              value={value}
              onChange={(e) => onChange(attr.name, e.target.value)}
              placeholder={`Enter ${attr.label.toLowerCase()}`}
              maxLength={attr.max_length}
              className={`${requiredClass} min-h-[80px]`}
            />
          );
        }
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(attr.name, e.target.value)}
            placeholder={`Enter ${attr.label.toLowerCase()}`}
            maxLength={attr.max_length}
            className={requiredClass}
          />
        );
      
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(attr.name, e.target.value)}
            placeholder={`Enter ${attr.label.toLowerCase()}`}
            className={requiredClass}
          />
        );
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Required Fields */}
      {category.loggingAttributes.required.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
            Required Fields
            <span className="ml-2 text-red-500">*</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.loggingAttributes.required.map((attr) => (
              <div key={attr.name} className="space-y-2">
                <Label htmlFor={attr.name} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {attr.label}
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                {renderInput(attr, true)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional Fields */}
      {category.loggingAttributes.optional.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Optional Fields
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.loggingAttributes.optional.map((attr) => (
              <div key={attr.name} className="space-y-2">
                <Label htmlFor={attr.name} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {attr.label}
                </Label>
                {renderInput(attr, false)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Specific component for Bodyweight exercises
export function BodyweightWorkoutInput({ values, onChange, className = '' }: Omit<WorkoutInputProps, 'category'>) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Sets <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            value={values.sets || ''}
            onChange={(e) => onChange('sets', e.target.value ? Number(e.target.value) : '')}
            min={1}
            max={50}
            placeholder="Enter number of sets"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Reps <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            value={values.reps || ''}
            onChange={(e) => onChange('reps', e.target.value ? Number(e.target.value) : '')}
            min={1}
            max={1000}
            placeholder="Enter number of reps"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Notes
        </Label>
        <Textarea
          value={values.notes || ''}
          onChange={(e) => onChange('notes', e.target.value)}
          placeholder="Add any additional notes..."
          maxLength={500}
          className="min-h-[80px]"
        />
      </div>
    </div>
  );
}

// Specific component for Weighted exercises
export function WeightedWorkoutInput({ values, onChange, className = '' }: Omit<WorkoutInputProps, 'category'>) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Sets <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            value={values.sets || ''}
            onChange={(e) => onChange('sets', e.target.value ? Number(e.target.value) : '')}
            min={1}
            max={50}
            placeholder="Enter number of sets"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Reps <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            value={values.reps || ''}
            onChange={(e) => onChange('reps', e.target.value ? Number(e.target.value) : '')}
            min={1}
            max={1000}
            placeholder="Enter number of reps"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Weight <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            value={values.weight || ''}
            onChange={(e) => onChange('weight', e.target.value ? Number(e.target.value) : '')}
            min={0}
            max={1000}
            placeholder="Enter weight"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Weight Unit
          </Label>
          <Select
            value={values.weight_unit || 'lbs'}
            onValueChange={(val) => onChange('weight_unit', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lbs">lbs</SelectItem>
              <SelectItem value="kg">kg</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Notes
        </Label>
        <Textarea
          value={values.notes || ''}
          onChange={(e) => onChange('notes', e.target.value)}
          placeholder="Add any additional notes..."
          maxLength={500}
          className="min-h-[80px]"
        />
      </div>
    </div>
  );
}

// Specific component for Cardio exercises
export function CardioWorkoutInput({ values, onChange, className = '' }: Omit<WorkoutInputProps, 'category'>) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Duration (minutes) <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            value={values.duration || ''}
            onChange={(e) => onChange('duration', e.target.value ? Number(e.target.value) : '')}
            min={1}
            max={600}
            placeholder="Enter duration in minutes"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Distance
          </Label>
          <Input
            type="number"
            value={values.distance || ''}
            onChange={(e) => onChange('distance', e.target.value ? Number(e.target.value) : '')}
            min={0}
            max={1000}
            placeholder="Enter distance"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Distance Unit
          </Label>
          <Select
            value={values.distance_unit || 'miles'}
            onValueChange={(val) => onChange('distance_unit', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="miles">miles</SelectItem>
              <SelectItem value="km">km</SelectItem>
              <SelectItem value="meters">meters</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Intensity
          </Label>
          <Select
            value={values.intensity || ''}
            onValueChange={(val) => onChange('intensity', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select intensity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Heart Rate (bpm)
          </Label>
          <Input
            type="number"
            value={values.heart_rate || ''}
            onChange={(e) => onChange('heart_rate', e.target.value ? Number(e.target.value) : '')}
            min={40}
            max={220}
            placeholder="Enter heart rate"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Notes
        </Label>
        <Textarea
          value={values.notes || ''}
          onChange={(e) => onChange('notes', e.target.value)}
          placeholder="Add any additional notes..."
          maxLength={500}
          className="min-h-[80px]"
        />
      </div>
    </div>
  );
}

