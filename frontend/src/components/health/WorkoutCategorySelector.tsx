'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  UserIcon, 
  WrenchScrewdriverIcon, 
  HeartIcon, 
  MapIcon 
} from '@heroicons/react/24/outline';
import api from '@/lib/api';

export interface WorkoutCategory {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  loggingAttributes: {
    required: Array<{
      name: string;
      type: string;
      label: string;
      min?: number;
      max?: number;
      options?: string[];
    }>;
    optional: Array<{
      name: string;
      type: string;
      label: string;
      max_length?: number;
      options?: string[];
    }>;
  };
}

// Categories for workout logging (with sets/reps/weight)
export const WORKOUT_CATEGORIES: WorkoutCategory[] = [
  {
    id: 'bodyweight',
    name: 'bodyweight',
    displayName: 'Bodyweight Exercises',
    description: 'Exercises using only your body weight and repetition-based exercises',
    icon: UserIcon,
    color: 'blue',
    loggingAttributes: {
      required: [
        { name: 'sets', type: 'number', label: 'Sets', min: 1, max: 50 },
        { name: 'reps', type: 'number', label: 'Reps', min: 1, max: 1000 }
      ],
      optional: [
        { name: 'total_reps', type: 'number', label: 'Total Reps' },
        { name: 'notes', type: 'text', label: 'Notes', max_length: 500 }
      ]
    }
  },
  {
    id: 'weighted',
    name: 'weighted',
    displayName: 'Weighted Exercises',
    description: 'Exercises with external weights',
    icon: WrenchScrewdriverIcon,
    color: 'red',
    loggingAttributes: {
      required: [
        { name: 'sets', type: 'number', label: 'Sets', min: 1, max: 50 },
        { name: 'reps', type: 'number', label: 'Reps', min: 1, max: 1000 },
        { name: 'weight', type: 'number', label: 'Weight', min: 0, max: 1000 }
      ],
      optional: [
        { name: 'notes', type: 'text', label: 'Notes', max_length: 500 }
      ]
    }
  },
  {
    id: 'cardio_duration',
    name: 'cardio_duration',
    displayName: 'Cardio & Duration',
    description: 'Cardiovascular exercises and static holds tracked by time',
    icon: HeartIcon,
    color: 'green',
    loggingAttributes: {
      required: [
        { name: 'duration', type: 'number', label: 'Duration (minutes)', min: 1, max: 600 }
      ],
      optional: [
        { name: 'distance', type: 'number', label: 'Distance' },
        { name: 'distance_unit', type: 'select', label: 'Distance Unit', options: ['miles', 'km', 'meters'] },
        { name: 'intensity', type: 'select', label: 'Intensity', options: ['low', 'medium', 'high'] },
        { name: 'heart_rate', type: 'number', label: 'Heart Rate (bpm)' },
        { name: 'difficulty', type: 'select', label: 'Difficulty', options: ['beginner', 'intermediate', 'advanced'] },
        { name: 'notes', type: 'text', label: 'Notes', max_length: 500 }
      ]
    }
  },
  {
    id: 'distance_based',
    name: 'distance_based',
    displayName: 'Distance Based',
    description: 'Exercises tracked by distance and time',
    icon: MapIcon,
    color: 'teal',
    loggingAttributes: {
      required: [
        { name: 'distance', type: 'number', label: 'Distance', min: 0.1, max: 1000 },
        { name: 'time', type: 'number', label: 'Time (minutes)', min: 1, max: 600 }
      ],
      optional: [
        { name: 'distance_unit', type: 'select', label: 'Distance Unit', options: ['miles', 'km', 'meters'] },
        { name: 'pace', type: 'text', label: 'Pace (e.g., 8:30/mile)', max_length: 20 },
        { name: 'notes', type: 'text', label: 'Notes', max_length: 500 }
      ]
    }
  }
];

interface Exercise {
  id: number;
  name: string;
  logging_category: string;
  logging_category_info: {
    id: number;
    name: string;
    display_name: string;
  };
  difficulty: string;
  calories_per_minute: number;
  description: string;
}

interface WorkoutCategorySelectorProps {
  selectedCategory: string | null;
  selectedExercise: Exercise | null;
  onCategorySelect: (category: WorkoutCategory) => void;
  onExerciseSelect: (exercise: Exercise) => void;
  className?: string;
}

export function WorkoutCategorySelector({ 
  selectedCategory, 
  selectedExercise,
  onCategorySelect, 
  onExerciseSelect,
  className = '' 
}: WorkoutCategorySelectorProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);

  // Load exercises when category is selected
  useEffect(() => {
    const loadExercises = async () => {
      if (!selectedCategory) {
        setExercises([]);
        return;
      }

      try {
        setLoadingExercises(true);
        // Use backend filtering instead of client-side filtering
        const response = await api.get(`/health/exercises/all?logging_category=${selectedCategory}&limit=500`);
        const exercises = response.exercises || [];
        
        setExercises(exercises);
      } catch (error) {
        console.error('Failed to load exercises:', error);
        setExercises([]);
      } finally {
        setLoadingExercises(false);
      }
    };

    loadExercises();
  }, [selectedCategory]);

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'border-blue-200 bg-blue-50 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30',
      red: 'border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:hover:bg-red-900/30',
      green: 'border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:hover:bg-green-900/30',
      purple: 'border-purple-200 bg-purple-50 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-900/20 dark:hover:bg-purple-900/30',
      orange: 'border-orange-200 bg-orange-50 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-900/20 dark:hover:bg-orange-900/30',
      teal: 'border-teal-200 bg-teal-50 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-900/20 dark:hover:bg-teal-900/30'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getIconColorClasses = (color: string) => {
    const colorMap = {
      blue: 'text-blue-600 dark:text-blue-400',
      red: 'text-red-600 dark:text-red-400',
      green: 'text-green-600 dark:text-green-400',
      purple: 'text-purple-600 dark:text-purple-400',
      orange: 'text-orange-600 dark:text-orange-400',
      teal: 'text-teal-600 dark:text-teal-400'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Choose Workout Type
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select the type of workout you want to log
        </p>
      </div>
      
      <div className="space-y-4">
        <Select
          value={selectedCategory || ''}
          onValueChange={(value) => {
            const category = WORKOUT_CATEGORIES.find(cat => cat.id === value);
            if (category) {
              onCategorySelect(category);
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select workout type..." />
          </SelectTrigger>
          <SelectContent>
            {WORKOUT_CATEGORIES.map((category) => {
              const IconComponent = category.icon;
              return (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-4 w-4" />
                    <span>{category.displayName}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        
        {selectedCategory && (() => {
          const category = WORKOUT_CATEGORIES.find(cat => cat.id === selectedCategory);
          if (!category) return null;
          
          return (
            <div className="mt-4 space-y-4">
              {/* Category Preview */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${getColorClasses(category.color)}`}>
                    <category.icon className={`h-5 w-5 ${getIconColorClasses(category.color)}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      {category.displayName}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {category.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {category.loggingAttributes.required.map((attr) => (
                        <span
                          key={attr.name}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        >
                          {attr.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Exercise Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Exercise
                </label>
                <Select
                  value={selectedExercise?.id.toString() || ''}
                  onValueChange={(value) => {
                    const exercise = exercises.find(ex => ex.id.toString() === value);
                    if (exercise) {
                      onExerciseSelect(exercise);
                    }
                  }}
                  disabled={loadingExercises || exercises.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={
                      loadingExercises 
                        ? "Loading exercises..." 
                        : exercises.length === 0 
                          ? "No exercises available for this category"
                          : "Select an exercise..."
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {exercises.map((exercise) => (
                      <SelectItem key={exercise.id} value={exercise.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{exercise.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {exercise.difficulty} • {exercise.calories_per_minute} cal/min
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Exercise Preview */}
              {selectedExercise && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-800">
                      <category.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        {selectedExercise.name}
                      </h5>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                        {selectedExercise.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                          {selectedExercise.difficulty}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                          {selectedExercise.calories_per_minute} cal/min
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// Categories for routine creation (without sets/reps/weight - just exercise selection)
export const ROUTINE_CREATION_CATEGORIES: WorkoutCategory[] = [
  {
    id: 'bodyweight',
    name: 'bodyweight',
    displayName: 'Bodyweight Exercises',
    description: 'Exercises using only your body weight and repetition-based exercises',
    icon: UserIcon,
    color: 'blue',
    loggingAttributes: {
      required: [],
      optional: [
        { name: 'notes', type: 'text', label: 'Notes', max_length: 500 }
      ]
    }
  },
  {
    id: 'weighted',
    name: 'weighted',
    displayName: 'Weighted Exercises',
    description: 'Exercises with external weights',
    icon: WrenchScrewdriverIcon,
    color: 'red',
    loggingAttributes: {
      required: [],
      optional: [
        { name: 'notes', type: 'text', label: 'Notes', max_length: 500 }
      ]
    }
  },
  {
    id: 'cardio_duration',
    name: 'cardio_duration',
    displayName: 'Cardio & Duration',
    description: 'Cardiovascular exercises and static holds tracked by time',
    icon: HeartIcon,
    color: 'green',
    loggingAttributes: {
      required: [],
      optional: [
        { name: 'notes', type: 'text', label: 'Notes', max_length: 500 }
      ]
    }
  },
  {
    id: 'distance_based',
    name: 'distance_based',
    displayName: 'Distance-Based',
    description: 'Running, cycling, and other distance-based activities',
    icon: MapIcon,
    color: 'purple',
    loggingAttributes: {
      required: [],
      optional: [
        { name: 'notes', type: 'text', label: 'Notes', max_length: 500 }
      ]
    }
  }
];

