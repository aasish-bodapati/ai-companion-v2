'use client';

import React from 'react';
import { ProgressiveNutritionLoggerWithWizard } from './ProgressiveNutritionLoggerWithWizard';
import { MealData } from '@/services/nutritionLoggerService';

interface ProgressiveNutritionLoggerProps {
  onSuccess?: () => void;
  initialData?: Partial<MealData>;
  routineContext?: {
    id: string;
    name: string;
    todaysMeals?: any[];
  };
}

/**
 * Main ProgressiveNutritionLogger component - now uses the new reusable wizard components
 * This maintains backward compatibility while using the new modular architecture
 */
export function ProgressiveNutritionLogger({
  onSuccess,
  initialData,
  routineContext
}: ProgressiveNutritionLoggerProps) {
  return (
    <ProgressiveNutritionLoggerWithWizard
      onSuccess={onSuccess}
      initialData={initialData}
            routineContext={routineContext}
          />
  );
}