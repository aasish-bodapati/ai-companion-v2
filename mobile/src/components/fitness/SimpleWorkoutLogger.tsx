/**
 * SimpleWorkoutLogger - Basic logging with minimal steps
 * Simplified version of the complex UnifiedWorkoutLogger
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../../contexts/ToastContext';
import { fitnessService } from '../../services/api';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../theme/constants';

interface SimpleWorkoutLoggerProps {
  visible: boolean;
  onClose: () => void;
  onSave: (workout: any) => void;
}

interface Exercise {
  id: number;
  name: string;
  category: string;
  muscle_groups: string[];
}

const COMMON_EXERCISES = [
  { name: 'Push-ups', category: 'strength', muscle_groups: ['chest', 'arms'] },
  { name: 'Squats', category: 'strength', muscle_groups: ['legs', 'glutes'] },
  { name: 'Plank', category: 'strength', muscle_groups: ['core'] },
  { name: 'Running', category: 'cardio', muscle_groups: ['legs'] },
  { name: 'Jumping Jacks', category: 'cardio', muscle_groups: ['full body'] },
  { name: 'Burpees', category: 'cardio', muscle_groups: ['full body'] },
  { name: 'Pull-ups', category: 'strength', muscle_groups: ['back', 'arms'] },
  { name: 'Lunges', category: 'strength', muscle_groups: ['legs'] },
];

export default function SimpleWorkoutLogger({ visible, onClose, onSave }: SimpleWorkoutLoggerProps) {
  const { showToast } = useToast();
  const [workoutName, setWorkoutName] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!workoutName.trim() || !duration.trim()) {
      Alert.alert('Missing Info', 'Please enter workout name and duration');
      return;
    }

    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      Alert.alert('Invalid Duration', 'Please enter a valid duration in minutes');
      return;
    }

    try {
      setLoading(true);
      
      const workoutData = {
        name: workoutName.trim(),
        duration: durationNum,
        calories_burned: calories ? parseInt(calories) || 0 : Math.round(durationNum * 8), // Estimate 8 cal/min
        activity_type: selectedExercises.length > 0 ? 'strength' : 'cardio',
        activity_date: new Date().toISOString(),
        notes: notes.trim() || `Exercises: ${selectedExercises.join(', ')}`,
        exercises: selectedExercises,
      };

      await onSave(workoutData);
      showToast.success('Workout logged successfully!');
      onClose();
      resetForm();
    } catch (error) {
      showToast.error('Failed to log workout', 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setWorkoutName('');
    setDuration('');
    setCalories('');
    setSelectedExercises([]);
    setNotes('');
  };

  const toggleExercise = (exerciseName: string) => {
    setSelectedExercises(prev => 
      prev.includes(exerciseName) 
        ? prev.filter(name => name !== exerciseName)
        : [...prev, exerciseName]
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Log Workout</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Info</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Workout Name *</Text>
              <TextInput
                style={styles.input}
                value={workoutName}
                onChangeText={setWorkoutName}
                placeholder="e.g., Morning Workout"
                editable={!loading}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.small }]}>
                <Text style={styles.label}>Duration (min) *</Text>
                <TextInput
                  style={styles.input}
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="30"
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: SPACING.small }]}>
                <Text style={styles.label}>Calories (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={calories}
                  onChangeText={setCalories}
                  placeholder="Auto"
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>
            </View>
          </View>

          {/* Exercises */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exercises (optional)</Text>
            <Text style={styles.sectionSubtitle}>Tap to add exercises</Text>
            
            <View style={styles.exercisesGrid}>
              {COMMON_EXERCISES.map((exercise, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.exerciseCard,
                    selectedExercises.includes(exercise.name) && styles.selectedExercise
                  ]}
                  onPress={() => toggleExercise(exercise.name)}
                  disabled={loading}
                >
                  <Text style={[
                    styles.exerciseName,
                    selectedExercises.includes(exercise.name) && styles.selectedExerciseText
                  ]}>
                    {exercise.name}
                  </Text>
                  <Text style={styles.exerciseCategory}>
                    {exercise.category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="How did it feel? Any notes..."
              multiline
              numberOfLines={3}
              editable={!loading}
            />
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={loading || !workoutName.trim() || !duration.trim()}
          >
            <Ionicons name="checkmark" size={20} color={COLORS.white} />
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Workout'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.large,
    margin: SPACING.medium,
    maxWidth: 500,
    width: '90%',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.large,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text.primary,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  content: {
    padding: SPACING.large,
  },
  section: {
    marginBottom: SPACING.large,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.large,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.small,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.secondary,
    marginBottom: SPACING.medium,
  },
  inputGroup: {
    marginBottom: SPACING.medium,
  },
  label: {
    fontSize: FONT_SIZE.medium,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
    fontSize: FONT_SIZE.medium,
    backgroundColor: COLORS.white,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  exercisesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.small,
  },
  exerciseCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.small,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 100,
    alignItems: 'center',
  },
  selectedExercise: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  exerciseName: {
    fontSize: FONT_SIZE.small,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  selectedExerciseText: {
    color: COLORS.primary,
  },
  exerciseCategory: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  actions: {
    flexDirection: 'row',
    padding: SPACING.large,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.small,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.medium,
    borderRadius: BORDER_RADIUS.medium,
    gap: SPACING.xs,
  },
  cancelButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.text.secondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.semibold,
  },
});
