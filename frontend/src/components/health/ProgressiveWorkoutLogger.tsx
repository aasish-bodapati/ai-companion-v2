'use client';

import React from 'react';
import { ProgressiveWorkoutLoggerWithWizard } from './ProgressiveWorkoutLoggerWithWizard';

interface Exercise {
  id: string;
  name: string;
  category: string;
  muscle_groups: string[];
  equipment_needed: string[];
  difficulty_level: string;
  calories_per_minute?: number;
  user_times_performed?: number;
  user_avg_duration?: number;
  user_personal_records?: {
    max_weight_kg?: number;
    max_reps?: number;
    max_distance_km?: number;
  };
}

interface WorkoutData {
  // Step 1: Exercise Selection
  selectedExercise?: Exercise;
  activityType: string;
  activityName: string;
  
  // Step 2: Workout Details
  duration_minutes?: number;
  intensity?: string;
  
  // Step 3: Exercise Specifics (if applicable)
  weight_kg?: number;
  reps?: number;
  sets?: number;
  distance_km?: number;
  
  // Step 4: Context & Notes
  routineId?: string;
  notes?: string;
  mood?: string;
}

interface ProgressiveWorkoutLoggerProps {
  onSuccess?: () => void;
  initialData?: Partial<WorkoutData>;
  routineContext?: {
    id: string;
    name: string;
    todaysExercises?: Exercise[];
  };
}

/**
 * Main ProgressiveWorkoutLogger component - now uses the new reusable wizard components
 * This maintains backward compatibility while using the new modular architecture
 */
export function ProgressiveWorkoutLogger({
  onSuccess,
  initialData,
  routineContext
}: ProgressiveWorkoutLoggerProps) {
  return (
    <ProgressiveWorkoutLoggerWithWizard
      onSuccess={onSuccess}
      initialData={initialData}
      routineContext={routineContext}
    />
  );
}