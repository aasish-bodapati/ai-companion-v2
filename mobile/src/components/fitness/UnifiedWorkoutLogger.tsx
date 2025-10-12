import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fitnessService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../../theme/constants';
import { STYLE_PRESETS } from '../../theme/duplicateStyles';

import { DebugUtils } from '../../utils/debugUtils';

interface Exercise {
  id: number;
  name: string;
  category: string;
  muscle_groups: string[];
  equipment?: string;
  instructions?: string;
  difficulty?: string;
  logging_category?: string;
}

interface ExerciseApiResponse {
  id: number;
  name: string;
  category: string;
  muscle_group: string;
  equipment?: string;
  instructions?: string;
  difficulty?: string;
  logging_category?: string;
}

interface WorkoutSet {
  id: string;
  exercise_id: string;
  reps: number;
  weight: number;
  duration: number;
  rest_time: number;
  notes: string;
}

interface WorkoutLog {
  id?: string;
  name: string;
  date: string;
  duration: number;
  calories_burned: number;
  notes: string;
  sets: WorkoutSet[];
  routine_id?: string;
}

interface UnifiedWorkoutLoggerProps {
  visible: boolean;
  onClose: () => void;
  onSave: (workout: WorkoutLog) => void;
  initialWorkout?: WorkoutLog;
  routineId?: string;
}

export default function UnifiedWorkoutLogger({
  visible,
  onClose,
  onSave,
  initialWorkout,
  routineId,
}: UnifiedWorkoutLoggerProps) {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [workout, setWorkout] = useState<WorkoutLog>({
    name: 'Workout Not Found',
    date: new Date().toISOString().split('T')[0],
    duration: 0,
    calories_burned: 0,
    notes: '',
    sets: [],
    routine_id: routineId,
  });
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const isLoadingRef = useRef(false);

  const steps = [
    { title: 'Workout Details', icon: 'fitness' },
    { title: 'Add Exercises', icon: 'add-circle' },
    { title: 'Log Sets', icon: 'list' },
    { title: 'Review & Save', icon: 'checkmark' },
  ];

  useEffect(() => {
    if (visible) {
      loadExercises();
      if (initialWorkout) {
        setWorkout(initialWorkout);
      }
    }
  }, [visible, initialWorkout]);

  const loadExercises = async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      DebugUtils.log('Exercise loading already in progress, skipping');
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Exercise loading timeout')), 10000)
      );

      const dataPromise = fitnessService.getExercises();
      const data = await Promise.race([dataPromise, timeoutPromise]) as unknown;

      // Map ExerciseType to Exercise format
      const mappedExercises: Exercise[] = (data as ExerciseApiResponse[]).map(exercise => ({
        id: exercise.id,
        name: exercise.name,
        category: exercise.category,
        muscle_groups: [exercise.muscle_group],
        equipment: exercise.equipment,
        instructions: exercise.instructions,
        difficulty: exercise.difficulty,
        logging_category: exercise.logging_category
      }));
      setExercises(mappedExercises);
    } catch (error) {
      DebugUtils.error('Error loading exercises:', error);
      showToast.error('Failed to load exercises', 'Please try again later');
      // Set empty array as fallback to prevent UI issues
      setExercises([]);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await onSave(workout);
      showToast.success('Workout saved successfully!');
      onClose();
      resetForm();
    } catch (error) {
      DebugUtils.error('Error saving workout:', error);
      showToast.error('Failed to save workout', 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setWorkout({
      name: 'Workout Not Found',
      date: new Date().toISOString().split('T')[0],
      duration: 0,
      calories_burned: 0,
      notes: '',
      sets: [],
      routine_id: routineId,
    });
    setSelectedExercise(null);
    setSearchQuery('');
  };

  const addExercise = (exercise: Exercise) => {
    const newSet: WorkoutSet = {
      id: Date.now().toString(),
      exercise_id: exercise.id.toString(),
      reps: 0,
      weight: 0,
      duration: 0,
      rest_time: 60,
      notes: '',
    };

    setWorkout(prev => ({
      ...prev,
      sets: [...prev.sets, newSet],
    }));
    setSelectedExercise(null);
    setSearchQuery('');
  };

  const updateSet = (setId: string, updates: Partial<WorkoutSet>) => {
    setWorkout(prev => ({
      ...prev,
      sets: prev.sets.map(set =>
        set.id === setId ? { ...set, ...updates } : set
      ),
    }));
  };

  const removeSet = (setId: string) => {
    setWorkout(prev => ({
      ...prev,
      sets: prev.sets.filter(set => set.id !== setId),
    }));
  };

  const filteredExercises = exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.muscle_groups.some(muscle =>
      muscle.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Workout Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Workout Name</Text>
              <TextInput
                style={styles.input}
                value={workout.name}
                onChangeText={(text) => setWorkout(prev => ({ ...prev, name: text }))}
                placeholder="Enter workout name"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                value={workout.date}
                onChangeText={(text) => setWorkout(prev => ({ ...prev, date: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Duration (min)</Text>
                <TextInput
                  style={styles.input}
                  value={workout.duration.toString()}
                  onChangeText={(text) => setWorkout(prev => ({
                    ...prev,
                    duration: parseInt(text) || 0
                  }))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Calories Burned</Text>
                <TextInput
                  style={styles.input}
                  value={workout.calories_burned.toString()}
                  onChangeText={(text) => setWorkout(prev => ({
                    ...prev,
                    calories_burned: parseInt(text) || 0
                  }))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={workout.notes}
                onChangeText={(text) => setWorkout(prev => ({ ...prev, notes: text }))}
                placeholder="Add any notes about your workout"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Add Exercises</Text>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search exercises..."
                placeholderTextColor="#9ca3af"
              />
            </View>

            <ScrollView style={styles.exercisesList} showsVerticalScrollIndicator={false}>
              {filteredExercises.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  style={styles.exerciseItem}
                  onPress={() => addExercise(exercise)}
                >
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseCategory}>{exercise.category}</Text>
                    <Text style={styles.exerciseMuscles}>
                      {exercise.muscle_groups.join(', ')}
                    </Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color="#3b82f6" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Log Sets</Text>

            <ScrollView style={styles.setsList} showsVerticalScrollIndicator={false}>
              {workout.sets.map((set, index) => {
                const exercise = exercises.find(e => e.id.toString() === set.exercise_id);
                return (
                  <View key={set.id} style={styles.setCard}>
                    <View style={styles.setHeader}>
                      <Text style={styles.setTitle}>
                        {exercise?.name} #{index + 1}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeSet(set.id)}
                        style={styles.removeButton}
                      >
                        <Ionicons name="close-circle" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.setInputs}>
                      <View style={styles.setInputGroup}>
                        <Text style={styles.setLabel}>Reps</Text>
                        <TextInput
                          style={styles.setInput}
                          value={set.reps.toString()}
                          onChangeText={(text) => updateSet(set.id, {
                            reps: parseInt(text) || 0
                          })}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>

                      <View style={styles.setInputGroup}>
                        <Text style={styles.setLabel}>Weight (kg)</Text>
                        <TextInput
                          style={styles.setInput}
                          value={set.weight.toString()}
                          onChangeText={(text) => updateSet(set.id, {
                            weight: parseFloat(text) || 0
                          })}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>

                      <View style={styles.setInputGroup}>
                        <Text style={styles.setLabel}>Duration (s)</Text>
                        <TextInput
                          style={styles.setInput}
                          value={set.duration.toString()}
                          onChangeText={(text) => updateSet(set.id, {
                            duration: parseInt(text) || 0
                          })}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>

                      <View style={styles.setInputGroup}>
                        <Text style={styles.setLabel}>Rest (s)</Text>
                        <TextInput
                          style={styles.setInput}
                          value={set.rest_time.toString()}
                          onChangeText={(text) => updateSet(set.id, {
                            rest_time: parseInt(text) || 0
                          })}
                          keyboardType="numeric"
                          placeholder="60"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                    </View>

                    <TextInput
                      style={[styles.setInput, styles.setNotes]}
                      value={set.notes}
                      onChangeText={(text) => updateSet(set.id, { notes: text })}
                      placeholder="Set notes (optional)"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                );
              })}
            </ScrollView>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Review & Save</Text>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>{workout.name}</Text>
              <Text style={styles.reviewDate}>{workout.date}</Text>

              <View style={styles.reviewStats}>
                <View style={styles.reviewStat}>
                  <Text style={styles.reviewStatValue}>{workout.duration}</Text>
                  <Text style={styles.reviewStatLabel}>Minutes</Text>
                </View>
                <View style={styles.reviewStat}>
                  <Text style={styles.reviewStatValue}>{workout.calories_burned}</Text>
                  <Text style={styles.reviewStatLabel}>Calories</Text>
                </View>
                <View style={styles.reviewStat}>
                  <Text style={styles.reviewStatValue}>{workout.sets.length}</Text>
                  <Text style={styles.reviewStatLabel}>Sets</Text>
                </View>
              </View>

              {workout.notes && (
                <View style={styles.reviewNotes}>
                  <Text style={styles.reviewNotesLabel}>Notes:</Text>
                  <Text style={styles.reviewNotesText}>{workout.notes}</Text>
                </View>
              )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log Workout</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Progress Steps */}
        <View style={styles.progressContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepContainer}>
              <View style={[
                styles.stepCircle,
                { backgroundColor: index <= currentStep ? '#3b82f6' : '#e5e7eb' }
              ]}>
                <Ionicons
                  name={step.icon as keyof typeof Ionicons.glyphMap}
                  size={16}
                  color={index <= currentStep ? '#ffffff' : '#6b7280'}
                />
              </View>
              <Text style={[
                styles.stepText,
                { color: index <= currentStep ? '#3b82f6' : '#6b7280' }
              ]}>
                {step.title}
              </Text>
            </View>
          ))}
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderStepContent()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handlePrevious}
            >
              <Text style={styles.secondaryButtonText}>Previous</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              { flex: currentStep === 0 ? 1 : 0.6 }
            ]}
            onPress={currentStep === steps.length - 1 ? handleSave : handleNext}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {currentStep === steps.length - 1 ? 'Save Workout' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: SPACING.xxs,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  placeholder: {
    width: 32,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text.primary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text.primary,
  },
  exercisesList: {
    maxHeight: 300,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  exerciseCategory: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  exerciseMuscles: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.tertiary,
  },
  setsList: {
    maxHeight: 400,
  },
  setCard: {
    backgroundColor: COLORS.background.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  setHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  setTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
    color: COLORS.text.primary,
    flex: 1,
  },
  removeButton: {
    padding: SPACING.xxs,
  },
  setInputs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  setInputGroup: {
    flex: 1,
    minWidth: '45%',
  },
  setLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  setInput: {
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
    fontSize: FONT_SIZE.md,
    color: COLORS.text.primary,
  },
  setNotes: {
    marginTop: 8,
    width: '100%',
  },
  reviewCard: {
    backgroundColor: COLORS.background.primary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reviewTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
    marginBottom: 16,
  },
  reviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  reviewStat: {
    alignItems: 'center',
  },
  reviewStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  reviewStatLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
  },
  reviewNotes: {
    marginTop: 8,
  },
  reviewNotesLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  reviewNotesText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background.primary,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  button: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary.main,
  },
  primaryButtonText: {
    color: COLORS.text.inverse,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: COLORS.background.tertiary,
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
  },
});
