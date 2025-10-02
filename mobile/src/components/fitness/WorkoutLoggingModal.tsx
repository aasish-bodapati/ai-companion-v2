import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LoggingModal from '../ui/LoggingModal';
import LoggingItem, { LoggingItemData } from '../ui/LoggingItem';
import { fitnessService, ExerciseType } from '../../services/fitnessService';
import { exerciseCategoryService } from '../../services/exerciseCategoryService';
import { hapticFeedback } from '../../utils/haptics';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme/constants';

interface WorkoutData {
  duration_minutes: number;
  exercises: {
    exercise_name: string;
    sets?: number;
    reps?: string;
    weight_kg?: number;
    duration_minutes?: number;
    rest_time?: string;
    notes?: string;
  }[];
  activity_date?: string;
}

interface WorkoutLoggingModalProps {
  visible: boolean;
  onClose: () => void;
  onWorkoutLogged: () => void;
  todaysWorkout?: any; // Today's workout from routine
}

export default function WorkoutLoggingModal({
  visible,
  onClose,
  onWorkoutLogged,
  todaysWorkout,
}: WorkoutLoggingModalProps) {
  const [exercises, setExercises] = useState<LoggingItemData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ExerciseType[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string | number>>(new Set());

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setExercises([]);
      setSearchQuery('');
      setSearchResults([]);
      if (todaysWorkout) {
        // Pre-populate with today's workout exercises if available
        if (todaysWorkout.exercises) {
          const workoutExercises = todaysWorkout.exercises.map((ex: any, index: number) => ({
            id: `workout-${index}`,
            name: ex.exercise_name || ex.name,
            sets: ex.sets,
            reps: ex.reps,
            weight_kg: ex.weight_kg,
            duration_minutes: ex.duration_minutes,
            rest_time: ex.rest_time,
            notes: ex.notes,
          }));
          setExercises(workoutExercises);
        }
      }
    }
  }, [visible, todaysWorkout]);

  const searchExercises = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await fitnessService.searchExercises(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching exercises:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSelectExercise = useCallback(async (exercise: ExerciseType) => {
    // Debug logging for selected exercise
    console.log('🔍 WorkoutLoggingModal - Selected exercise:', {
      name: exercise.name,
      category: exercise.category,
      muscle_group: exercise.muscle_group
    });
    
    // Check if exercise already exists
    const existingItem = exercises.find(item => item.name === exercise.name);
    
    if (existingItem) {
      // Update sets if exercise already exists
      setExercises(prevExercises => 
        prevExercises.map(item =>
          item.name === exercise.name
            ? { ...item, sets: (item.sets || 0) + 1 }
            : item
        )
      );
    } else {
      // Fetch latest workout data for this exercise first
      let latestWorkout = null;
      try {
        console.log('🔍 Fetching latest workout data for exercise:', exercise.name);
        latestWorkout = await fitnessService.getLatestExerciseData(exercise.name);
        console.log('🔍 Raw API response for', exercise.name, ':', latestWorkout);
      } catch (error) {
        console.error('Error fetching latest workout data:', error);
      }
      
      // Add new exercise with latest data if available
      const newItem: LoggingItemData = {
        id: `exercise-${Date.now()}`,
        name: exercise.name,
        sets: latestWorkout?.sets || undefined,
        reps: latestWorkout?.reps || '',
        weight_kg: (latestWorkout?.weight_kg || latestWorkout?.weight_used) || undefined,
        duration_minutes: latestWorkout?.duration_minutes || undefined,
        distance: latestWorkout?.distance || undefined,
        rest_time: latestWorkout?.rest_time || '',
        notes: latestWorkout?.notes || '',
        category: exercise.category,
        muscle_group: exercise.muscle_group,
        equipment: exercise.equipment,
        instructions: exercise.instructions,
        difficulty: exercise.difficulty,
      };
      
      console.log('🔍 WorkoutLoggingModal - Created new exercise item with latest data:', newItem);
      
      // Add the new exercise
      setExercises(prevExercises => [...prevExercises, newItem]);
      
      // Mark this item as newly added
      setNewlyAddedIds(prev => new Set([...prev, newItem.id]));
      
      // Show haptic feedback if data was populated
      if (latestWorkout) {
        hapticFeedback.light();
      }
    }
    
    hapticFeedback.selection();
  }, [exercises]);

  const handleAddItem = useCallback((item: LoggingItemData) => {
    setExercises(prevExercises => [...prevExercises, item]);
  }, []);

  const handleRemoveItem = useCallback((id: number | string) => {
    setExercises(prevExercises => prevExercises.filter(item => item.id !== id));
    hapticFeedback.light();
  }, []);

  const handleUpdateItem = useCallback((id: number | string, updates: Partial<LoggingItemData>) => {
    setExercises(prevExercises => prevExercises.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchResults([]);
  }, []);

  const isFormValid = () => {
    if (exercises.length === 0) return false;
    
    // Validate each exercise based on its category
    return exercises.every(exercise => {
      const category = exercise.category;
      
      switch (category) {
        case 'weighted':
        case 'bodyweight':
          // Need sets and reps
          const sets = parseInt(exercise.sets) || 0;
          const reps = exercise.reps || '';
          return sets > 0 && reps && reps.trim() !== '' && reps !== '0';
          
        case 'distance_based':
          // Need distance
          const distance = parseFloat(exercise.distance) || 0;
          return distance > 0;
          
        case 'cardio_duration':
          // Need duration
          const duration = parseFloat(exercise.duration_minutes) || 0;
          return duration > 0;
          
        default:
          // For unknown types, check if any field has a value
          const hasAnyValue = Object.values(exercise).some(value => 
            value && value.toString().trim() !== '' && value !== '0'
          );
          return hasAnyValue;
      }
    });
  };

  const getFormData = () => {
    const totalDuration = exercises.reduce((sum, item) => sum + (item.duration_minutes || 0), 0);
    const totalSets = exercises.reduce((sum, item) => sum + (item.sets || 0), 0);

    return {
      activity_type: 'strength_training', // Default to strength training
      activity_name: todaysWorkout?.workout_name || 'Strength Training Workout',
      duration_minutes: totalDuration || 30, // Default 30 minutes if no duration specified
      exercises: JSON.stringify(exercises.map(item => ({
        exercise_name: item.name,
        sets: item.sets,
        reps: item.reps,
        weight_kg: item.weight_kg,
        weight_used: item.weight_used,
        duration_minutes: item.duration_minutes,
        distance: item.distance,
        rest_time: item.rest_time,
        notes: item.notes,
      }))),
      notes: `Workout with ${exercises.length} exercises, ${totalSets} total sets`,
      activity_date: new Date().toISOString(), // Add current timestamp
    };
  };

  const handleSave = async (data: any) => {
    if (saving) {
      console.log('🚫 [WORKOUT MODAL] Save already in progress, ignoring duplicate request');
      return;
    }
    
    setSaving(true);
    try {
      await fitnessService.logWorkout(data);
      onWorkoutLogged();
      onClose();
    } catch (error) {
      console.error('Error logging workout:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const renderExerciseItem = useCallback((item: LoggingItemData, index: number) => {
    // Debug logging for exercise data
    console.log('🔍 WorkoutLoggingModal - Rendering exercise item:', {
      id: item.id,
      name: item.name,
      category: item.category,
      index
    });
    
    return (
      <LoggingItem
        key={`${item.id}-${item.name}`}
        item={item}
        itemType="workout"
        index={index}
        onUpdate={(id, updates) => {
          handleUpdateItem(id, updates);
          // Remove from newly added set when updated
          setNewlyAddedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        }}
        onRemove={handleRemoveItem}
        showExerciseDetails={true}
        isNewlyAdded={newlyAddedIds.has(item.id)}
        testID={`exercise-item-${index}`}
      />
    );
  }, [handleUpdateItem, handleRemoveItem, newlyAddedIds]);


  return (
    <LoggingModal
      visible={visible}
      onClose={onClose}
      onSave={handleSave}
      title={todaysWorkout ? "Log Today's Workout" : "Log Workout"}
      subtitle="Track your fitness progress"
      formType="workout"
      searchPlaceholder="Search for exercises..."
      searchResults={searchResults}
      onSearch={searchExercises}
      onSelectItem={handleSelectExercise}
      onClearSearch={handleClearSearch}
      searchLoading={searching}
      items={exercises}
      onAddItem={handleAddItem}
      onRemoveItem={handleRemoveItem}
      onUpdateItem={handleUpdateItem}
      renderItem={renderExerciseItem}
      isFormValid={isFormValid}
      getFormData={getFormData}
      additionalFields={null}
      saving={saving}
      variant="fullScreen"
      testID="workout-logging-modal"
    />
  );
}

const styles = StyleSheet.create({
});
