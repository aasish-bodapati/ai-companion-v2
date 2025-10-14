/**
 * QuickWorkoutLogger - One-tap logging for busy professionals
 * Reduces 577-line complex component to simple, fast logging
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../../contexts/ToastContext';
import { fitnessService } from '../../services/api';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../theme/constants';
import ThumbZoneLayout from '../ui/ThumbZoneLayout';
import MobileButton from '../ui/MobileButton';
import { hapticFeedback } from '../../utils/haptics';

interface QuickWorkoutLoggerProps {
  visible: boolean;
  onClose: () => void;
  onSave: (workout: any) => void;
}

interface QuickWorkout {
  name: string;
  duration: number;
  calories: number;
  type: 'cardio' | 'strength' | 'flexibility';
}

const QUICK_WORKOUTS = [
  { name: 'Running', duration: 30, calories: 300, type: 'cardio' as const, icon: 'walk' },
  { name: 'Push-ups', duration: 15, calories: 100, type: 'strength' as const, icon: 'fitness' },
  { name: 'Yoga', duration: 45, calories: 150, type: 'flexibility' as const, icon: 'leaf' },
  { name: 'Cycling', duration: 60, calories: 400, type: 'cardio' as const, icon: 'bicycle' },
  { name: 'Weight Training', duration: 45, calories: 250, type: 'strength' as const, icon: 'barbell' },
  { name: 'Swimming', duration: 30, calories: 350, type: 'cardio' as const, icon: 'water' },
];

export default function QuickWorkoutLogger({ visible, onClose, onSave }: QuickWorkoutLoggerProps) {
  const { showToast } = useToast();
  const [selectedWorkout, setSelectedWorkout] = useState<QuickWorkout | null>(null);
  const [customDuration, setCustomDuration] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuickLog = async (workout: QuickWorkout) => {
    try {
      setLoading(true);
      hapticFeedback.medium(); // Haptic feedback for mobile UX
      
      const workoutData = {
        name: workout.name,
        duration: workout.duration,
        calories_burned: workout.calories,
        activity_type: workout.type,
        activity_date: new Date().toISOString(),
        notes: `Quick logged ${workout.name}`,
      };

      await onSave(workoutData);
      showToast.success(`${workout.name} logged!`);
      onClose();
    } catch (error) {
      showToast.error('Failed to log workout', 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomLog = async () => {
    if (!selectedWorkout || !customDuration) {
      Alert.alert('Missing Info', 'Please select a workout and enter duration');
      return;
    }

    const duration = parseInt(customDuration);
    if (isNaN(duration) || duration <= 0) {
      Alert.alert('Invalid Duration', 'Please enter a valid duration in minutes');
      return;
    }

    try {
      setLoading(true);
      
      // Calculate calories based on duration
      const caloriesPerMinute = selectedWorkout.calories / selectedWorkout.duration;
      const estimatedCalories = Math.round(caloriesPerMinute * duration);

      const workoutData = {
        name: selectedWorkout.name,
        duration: duration,
        calories_burned: estimatedCalories,
        activity_type: selectedWorkout.type,
        activity_date: new Date().toISOString(),
        notes: `Custom duration: ${duration} minutes`,
      };

      await onSave(workoutData);
      showToast.success(`${selectedWorkout.name} logged for ${duration} minutes!`);
      onClose();
    } catch (error) {
      showToast.error('Failed to log workout', 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <ThumbZoneLayout style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Quick Log Workout</Text>
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={COLORS.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Quick Workouts Grid */}
          <View style={styles.workoutsGrid}>
            {QUICK_WORKOUTS.map((workout, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.workoutCard,
                  selectedWorkout?.name === workout.name && styles.selectedCard
                ]}
                onPress={() => {
                  hapticFeedback.light();
                  setSelectedWorkout(workout);
                }}
                disabled={loading}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              >
                <Ionicons 
                  name={workout.icon as keyof typeof Ionicons.glyphMap} 
                  size={32} 
                  color={selectedWorkout?.name === workout.name ? COLORS.primary : COLORS.text.secondary} 
                />
                <Text style={[
                  styles.workoutName,
                  selectedWorkout?.name === workout.name && styles.selectedText
                ]}>
                  {workout.name}
                </Text>
                <Text style={styles.workoutDuration}>
                  {workout.duration} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Duration */}
          {selectedWorkout && (
            <View style={styles.customSection}>
              <Text style={styles.customLabel}>Custom Duration (minutes)</Text>
              <TextInput
                style={styles.durationInput}
                value={customDuration}
                onChangeText={setCustomDuration}
                placeholder={`Default: ${selectedWorkout.duration} min`}
                keyboardType="numeric"
                editable={!loading}
              />
            </View>
          )}
        </ScrollView>

        {/* Action Buttons - Optimized for thumb zone */}
        <View style={styles.actions}>
          <MobileButton
            title="Quick Log"
            onPress={() => selectedWorkout && handleQuickLog(selectedWorkout)}
            disabled={!selectedWorkout || loading}
            loading={loading}
            icon="flash"
            variant="primary"
            size="large"
            style={styles.quickButton}
          />

          {selectedWorkout && (
            <MobileButton
              title="Custom Log"
              onPress={handleCustomLog}
              disabled={!customDuration || loading}
              icon="time"
              variant="secondary"
              size="large"
              style={styles.customButton}
            />
          )}
        </View>
      </ThumbZoneLayout>
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
    justifyContent: 'flex-end', // Mobile-first: slide up from bottom
    zIndex: 1000,
  },
  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.large,
    borderTopRightRadius: BORDER_RADIUS.large,
    maxHeight: '85%', // Mobile-optimized height
    width: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.large,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text.primary,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  workoutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.large,
  },
  workoutCard: {
    width: '48%',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
    alignItems: 'center',
    marginBottom: SPACING.small,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  workoutName: {
    fontSize: FONT_SIZE.medium,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text.primary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  selectedText: {
    color: COLORS.primary,
  },
  workoutDuration: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  customSection: {
    marginBottom: SPACING.large,
  },
  customLabel: {
    fontSize: FONT_SIZE.medium,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.text.primary,
    marginBottom: SPACING.small,
  },
  durationInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
    fontSize: FONT_SIZE.medium,
    backgroundColor: COLORS.white,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.medium,
    paddingHorizontal: SPACING.large,
    paddingBottom: SPACING.large,
  },
  quickButton: {
    flex: 1,
  },
  customButton: {
    flex: 1,
  },
});
