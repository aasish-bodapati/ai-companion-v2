import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BaseModal from '../ui/BaseModal.simple';
import { modalConfigs } from '../ui/BaseModal.utils';
import ExerciseSelector, { exerciseSelectorConfigs } from '../ui/ExerciseSelector';
import SimpleLoggingItem from '../ui/SimpleLoggingItem';
import { fitnessService, ExerciseType } from '../../services/FitnessService';
import { hapticFeedback } from '../../utils/haptics';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../theme/constants';
import { useToast } from '../../contexts/ToastContext';
import { CategoryBadge } from '../ui/Badge';

import { DebugUtils } from '../../utils/debugUtils';

interface WorkoutExercise {
  exercise_name?: string;
  name?: string;
  sets?: number;
  reps?: string;
  weight_kg?: number;
  duration_minutes?: number;
  rest_time?: string;
  notes?: string;
}

interface TodaysWorkout {
  exercises?: WorkoutExercise[];
}

interface WorkoutLoggingModalProps {
  visible: boolean;
  onClose: () => void;
  onWorkoutLogged: () => void;
  todaysWorkout?: TodaysWorkout; // Today's workout from routine
}

export default function WorkoutLoggingModal({
  visible,
  onClose,
  onWorkoutLogged,
  todaysWorkout,
}: WorkoutLoggingModalProps) {
  const [exercises, setExercises] = useState<LoggingItemData[]>([]);
  const exercisesRef = useRef<LoggingItemData[]>([]);
  const [saving, setSaving] = useState(false);
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string | number>>(new Set());
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<ExerciseType[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setExercises([]);
      setNewlyAddedIds(new Set());
      if (todaysWorkout) {
        // Pre-populate with today's workout exercises if available
        if (todaysWorkout.exercises) {
          const workoutExercises = todaysWorkout.exercises.map((exercise: WorkoutExercise, index: number) => {
            return {
            id: `workout-${index}`,
            name: String(exercise.exercise_name || exercise.name || 'Exercise'),
            sets: exercise.sets,
            reps: exercise.reps,
            weight_kg: exercise.weight_kg,
            duration_minutes: exercise.duration_minutes,
            rest_time: exercise.rest_time,
            notes: exercise.notes,
          };
          });
          setExercises(workoutExercises);
        }
      }
    }
  }, [visible, todaysWorkout]);

  // Update ref when exercises changes
  useEffect(() => {
    exercisesRef.current = exercises;
  }, [exercises]);

  // Load available exercises for selector
  const loadAvailableExercises = useCallback(async () => {
    try {
      setLoadingExercises(true);
      const exercises = await fitnessService.getExercises();
      setAvailableExercises(exercises);
    } catch (error) {
      DebugUtils.error('Error loading exercises:', error);
      setAvailableExercises([]);
    } finally {
      setLoadingExercises(false);
    }
  }, []);

  // Handle exercise selection from selector
  const handleExerciseSelectorSelect = useCallback((exercise: ExerciseType) => {
    // Check if exercise already exists
    const existingItem = exercisesRef.current.find(item => item.name === exercise.name);

    if (existingItem) {
      // Update sets if exercise already exists
      const updatedExercises = exercisesRef.current.map(item =>
        item.name === exercise.name
          ? { ...item, sets: (item.sets || 0) + 1 }
          : item
      );
      setExercises(updatedExercises);
    } else {
      // Add new exercise
      const newExercise: LoggingItemData = {
        id: `exercise-${Date.now()}-${Math.random()}`,
        name: exercise.name,
        sets: 1,
        reps: '8-12',
        weight_kg: 0,
        duration_minutes: 0,
        distance: 0,
        category: exercise.category || exercise.logging_category || '',
        notes: '',
      };

      const updatedExercises = [...exercisesRef.current, newExercise];
      setExercises(updatedExercises);
      setNewlyAddedIds(prev => new Set([...prev, newExercise.id]));
    }

    setShowExerciseSelector(false);
    hapticFeedback.impact('light');
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

  const handleUpdateItemWithCleanup = useCallback((id: number | string, updates: Partial<LoggingItemData>) => {
    handleUpdateItem(id, updates);
    setNewlyAddedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, [handleUpdateItem]);

  const isFormValid = () => {
    if (exercises.length === 0) return false;

    // Validate each exercise based on its category
    return exercises.every(exercise => {
      const category = exercise.category;

      switch (category) {
        case 'weighted':
        case 'bodyweight':
          // Need sets and reps
          const sets = parseInt(exercise.sets?.toString() || '0') || 0;
          const reps = exercise.reps?.toString() || '';
          return sets > 0 && reps && reps.trim() !== '' && reps !== '0';

        case 'distance_based':
          // Need distance
          const distance = parseFloat(exercise.distance?.toString() || '0') || 0;
          return distance > 0;

        case 'cardio_duration':
          // Need duration
          const duration = parseFloat(exercise.duration_minutes?.toString() || '0') || 0;
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

  const handleSave = async (data: unknown) => {
    if (saving) {
      return;
    }

    setSaving(true);
    try {
      // Parse exercises from the data
      let exercises = [];
      if (data.exercises) {
        try {
          exercises = typeof data.exercises === 'string' ? JSON.parse(data.exercises) : data.exercises;
        } catch {
          // Silent error handling - no console logging to prevent Expo Go notifications
          exercises = [];
        }
      }

      if (exercises.length === 0) {
        throw new Error('No exercises to log');
      }

      // Create separate log entries for each exercise

      const logPromises = exercises.map((exercise: LoggingItemData, index: number) => {
        const exerciseData = {
          activity_type: 'strength_training',
          activity_name: `${exercise.name || 'Exercise'} Workout`,
          duration_minutes: exercise.duration_minutes || 10, // Default 10 minutes per exercise
          exercises: JSON.stringify([exercise]), // Single exercise as array
          notes: exercise.notes || '',
          activity_date: (data as { activity_date?: string }).activity_date || new Date().toISOString(),
        };

        return fitnessService.logWorkout(exerciseData);
      });

      // Wait for all exercises to be logged
      await Promise.all(logPromises);

      onWorkoutLogged();
      onClose();
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
      throw new Error('Failed to save workout');
    } finally {
      setSaving(false);
    }
  };

  const { showToast } = useToast();

  const getTotalExercises = () => exercises.length;
  const getTotalLogged = () => exercises.filter(ex => isFormValid()).length;

  const handleSaveWorkout = async () => {
    if (saving) {
      return;
    }

    setSaving(true);
    try {
      const data = getFormData();
      await handleSave(data);
      showToast('Workout logged successfully!', 'success');
    } catch {
      showToast('Failed to log workout. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      title={todaysWorkout ? "Log Today's Workout" : "Log Workout"}
      {...modalConfigs.workoutLogging}
    >
      <View style={styles.container}>
        {/* Subtitle */}
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>
            {todaysWorkout ? `${String(todaysWorkout.routine_name || '')} - ${String(todaysWorkout.workout_name || '')}` : "Track your fitness progress"}
          </Text>
          {exercises.length > 0 && (
            <View style={styles.workoutCategories}>
              {Array.from(new Set(exercises.map(ex => ex.category).filter(Boolean))).map((category, index) => (
                <CategoryBadge
                  key={index}
                  category={String(category || '')}
                  size="small"
                  outline
                />
              ))}
            </View>
          )}
        </View>

          {/* Add Exercise Button */}
          <View style={styles.addExerciseContainer}>
            <TouchableOpacity
              style={styles.addExerciseButton}
              onPress={() => {
                loadAvailableExercises();
                setShowExerciseSelector(true);
              }}
            >
              <Ionicons name="add-circle" size={24} color={COLORS.primary.main} />
              <Text style={styles.addExerciseText}>Add Exercise</Text>
            </TouchableOpacity>
          </View>

          {/* Exercises List */}
          <ScrollView style={styles.exercisesContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Exercises ({getTotalExercises()})</Text>

            {exercises.map((exercise, index) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseTitleRow}>
                    <Text style={styles.exerciseNumber}>#{index + 1}</Text>
                    <Text style={styles.exerciseName}>{String(exercise.name || 'Exercise')}</Text>
                    {exercise.category && (
                      <CategoryBadge
                        category={String(exercise.category)}
                        size="small"
                        outline
                      />
                    )}
                  </View>
                </View>

                <SimpleLoggingItem
                  item={exercise}
                  onUpdate={handleUpdateItemWithCleanup}
                  onRemove={handleRemoveItem}
                />
              </View>
            ))}

            {exercises.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="fitness-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyStateTitle}>No exercises added yet</Text>
                <Text style={styles.emptyStateText}>Search and add exercises to start logging your workout</Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.completionText}>
              {getTotalLogged()} / {getTotalExercises()} exercises logged - workout will be completed
            </Text>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (saving || !isFormValid()) && styles.saveButtonDisabled
                ]}
                onPress={handleSaveWorkout}
                disabled={saving || !isFormValid()}
              >
                <Text style={[
                  styles.saveButtonText,
                  (saving || !isFormValid()) && styles.saveButtonTextDisabled
                ]}>
                  {saving ? 'Logging...' : 'Log Workout'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
      </View>

      {/* Exercise Selector Modal */}
      <BaseModal
        visible={showExerciseSelector}
        onClose={() => setShowExerciseSelector(false)}
        title="Select Exercise"
        {...modalConfigs.exerciseBrowser}
      >
        <ExerciseSelector
          visible={showExerciseSelector}
          onClose={() => setShowExerciseSelector(false)}
          onSelect={handleExerciseSelectorSelect}
          exercises={availableExercises}
          loading={loadingExercises}
          onRefresh={loadAvailableExercises}
          refreshing={loadingExercises}
          {...exerciseSelectorConfigs.workoutLogging}
        />
      </BaseModal>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  subtitleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  workoutCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addExerciseContainer: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary.light,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary.main,
  },
  addExerciseText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.primary.main,
    marginLeft: SPACING.sm,
  },
  exercisesContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  exerciseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  exerciseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginRight: 8,
    minWidth: 20,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  completionText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    borderWidth: 1,
    borderColor: '#3b82f6',
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
    borderColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#ffffff',
  },
});
