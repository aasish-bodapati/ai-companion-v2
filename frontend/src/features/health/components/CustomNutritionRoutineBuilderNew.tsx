'use client';

import { GenericRoutineBuilder } from './GenericRoutineBuilder';
import { nutritionRoutineConfig } from './NutritionRoutineConfig';
import { NutritionRoutine } from '@/lib/nutritionRoutineApi';

interface CustomNutritionRoutineBuilderProps {
  onRoutineCreated?: (routine: NutritionRoutine) => void;
}

export function CustomNutritionRoutineBuilderNew({ onRoutineCreated }: CustomNutritionRoutineBuilderProps) {
  return (
    <GenericRoutineBuilder
      config={nutritionRoutineConfig}
      onRoutineCreated={onRoutineCreated}
    />
  );
}
