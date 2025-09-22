'use client';

import React from 'react';
import { 
  WorkoutInputComponentsWithFormComponents,
  BodyweightWorkoutInputWithFormComponents,
  WeightedWorkoutInputWithFormComponents,
  CardioWorkoutInputWithFormComponents
} from './WorkoutInputComponentsWithFormComponents';
import { WorkoutCategory } from './WorkoutCategorySelector';

interface WorkoutInputProps {
  category: WorkoutCategory;
  values: Record<string, any>;
  onChange: (field: string, value: any) => void;
  className?: string;
}

/**
 * Main WorkoutInputComponents - now uses the new reusable form components
 * This maintains backward compatibility while using the new modular architecture
 */
export function WorkoutInputComponents({ 
  category, 
  values, 
  onChange, 
  className = '' 
}: WorkoutInputProps) {
  return (
    <WorkoutInputComponentsWithFormComponents
      category={category}
      values={values}
      onChange={onChange}
      className={className}
    />
  );
}

/**
 * BodyweightWorkoutInput - now uses the new reusable form components
 */
export function BodyweightWorkoutInput({ 
  values, 
  onChange, 
  className = '' 
}: Omit<WorkoutInputProps, 'category'>) {
  return (
    <BodyweightWorkoutInputWithFormComponents
      values={values}
      onChange={onChange}
      className={className}
    />
  );
}

/**
 * WeightedWorkoutInput - now uses the new reusable form components
 */
export function WeightedWorkoutInput({ 
  values, 
  onChange, 
  className = '' 
}: Omit<WorkoutInputProps, 'category'>) {
  return (
    <WeightedWorkoutInputWithFormComponents
      values={values}
      onChange={onChange}
      className={className}
    />
  );
}

/**
 * CardioWorkoutInput - now uses the new reusable form components
 */
export function CardioWorkoutInput({ 
  values, 
  onChange, 
  className = '' 
}: Omit<WorkoutInputProps, 'category'>) {
  return (
    <CardioWorkoutInputWithFormComponents
      values={values}
      onChange={onChange}
      className={className}
    />
  );
}