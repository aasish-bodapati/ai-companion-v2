'use client';

import { GenericRoutineBuilder } from './GenericRoutineBuilder';
import { fitnessRoutineConfig } from './FitnessRoutineConfig';
import { SimpleRoutine } from '@/lib/simpleRoutineApi';

interface CustomFitnessRoutineBuilderProps {
  onRoutineCreated?: (routine: SimpleRoutine) => void;
}

export function CustomFitnessRoutineBuilder({ onRoutineCreated }: CustomFitnessRoutineBuilderProps) {
  return (
    <GenericRoutineBuilder
      config={fitnessRoutineConfig}
      onRoutineCreated={onRoutineCreated}
    />
  );
}
