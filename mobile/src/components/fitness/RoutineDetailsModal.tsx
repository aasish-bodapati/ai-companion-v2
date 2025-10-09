import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SimpleRoutineWithProgress } from '../../services/routineService';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../theme/constants';
import { CategoryBadge, DifficultyBadge } from '../ui/Badge';

interface RoutineDetailsModalProps {
  isVisible: boolean;
  onClose: () => void;
  routine: SimpleRoutineWithProgress | null;
}

export default function RoutineDetailsModal({
  isVisible,
  onClose,
  routine,
}: RoutineDetailsModalProps) {
  if (!routine) return null;


  const totalWorkouts = routine.workout_schedule.reduce((total, day) => total + (day.exercises?.length || 0), 0);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.text.secondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Routine Details</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Routine Header */}
          <View style={styles.routineHeader}>
            <Text style={styles.routineName}>{routine.name ? routine.name : 'Unknown Routine'}</Text>
            <View style={styles.routineMeta}>
              <DifficultyBadge difficulty={routine.difficulty} size="small" />
              <Text style={styles.durationText}>{routine.duration_weeks} weeks</Text>
            </View>
          </View>

          {/* Routine Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.primary.main} />
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>{routine.duration_weeks} weeks</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="fitness-outline" size={20} color={COLORS.primary.main} />
              <Text style={styles.statLabel}>Total Workouts</Text>
              <Text style={styles.statValue}>{totalWorkouts}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="repeat-outline" size={20} color={COLORS.primary.main} />
              <Text style={styles.statLabel}>Per Week</Text>
              <Text style={styles.statValue}>{routine.total_workouts_per_week}</Text>
            </View>
          </View>

          {/* Description */}
          {routine.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{routine.description}</Text>
            </View>
          )}

          {/* Workout Schedule */}
          <View style={styles.scheduleContainer}>
            <Text style={styles.scheduleTitle}>Workout Schedule</Text>
            {routine.workout_schedule.map((day, dayIndex) => (
              <View key={dayIndex} style={styles.dayContainer}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>{day.day ? day.day : 'Unknown Day'}</Text>
                  <Text style={styles.workoutCount}>
                    {(day.exercises?.length || 0)} workout{(day.exercises?.length || 0) !== 1 ? 's' : ''}
                  </Text>
                </View>
                
                {day.exercises && day.exercises.length > 0 ? (
                  <View style={styles.workoutsList}>
                    {day.exercises.map((exercise, exerciseIndex) => {
                      // Debug: Log exercise data to identify the issue
                      
                      return (
                        <View key={exerciseIndex} style={styles.workoutItem}>
                          <View style={styles.workoutInfo}>
                            <Text style={styles.workoutName}>{exercise.exercise_name ? exercise.exercise_name : 'Unknown Exercise'}</Text>
                            <View style={styles.workoutMeta}>
                              <CategoryBadge category={exercise.logging_category || 'general'} size="small" />
                              {exercise.sets && exercise.sets > 0 && exercise.reps ? (
                                <Text style={styles.workoutDetails}>
                                  {exercise.sets} sets × {exercise.reps} reps
                                </Text>
                              ) : null}
                              {exercise.duration && exercise.duration > 0 ? (
                                <Text style={styles.workoutDetails}>
                                  {exercise.duration} min
                                </Text>
                              ) : null}
                              {exercise.distance && exercise.distance > 0 ? (
                                <Text style={styles.workoutDetails}>
                                  {exercise.distance} {exercise.distance_unit || 'miles'}
                                </Text>
                              ) : null}
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.noWorkoutsText}>Rest day</Text>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    backgroundColor: COLORS.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  title: {
    fontSize: FONT_SIZE.large,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  content: {
    flex: 1,
    padding: SPACING.medium,
  },
  routineHeader: {
    marginBottom: SPACING.large,
  },
  routineName: {
    fontSize: FONT_SIZE.extraLarge,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.small,
  },
  routineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.medium,
  },
  durationText: {
    fontSize: FONT_SIZE.medium,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
    marginBottom: SPACING.large,
    ...SHADOWS.small,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.secondary,
    marginTop: SPACING.tiny,
    marginBottom: SPACING.tiny,
  },
  statValue: {
    fontSize: FONT_SIZE.large,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  descriptionContainer: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
    marginBottom: SPACING.large,
    ...SHADOWS.small,
  },
  descriptionTitle: {
    fontSize: FONT_SIZE.medium,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.small,
  },
  descriptionText: {
    fontSize: FONT_SIZE.medium,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  scheduleContainer: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
    ...SHADOWS.small,
  },
  scheduleTitle: {
    fontSize: FONT_SIZE.large,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.medium,
  },
  dayContainer: {
    marginBottom: SPACING.medium,
    paddingBottom: SPACING.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.small,
  },
  dayName: {
    fontSize: FONT_SIZE.medium,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  workoutCount: {
    fontSize: FONT_SIZE.small,
    color: COLORS.white,
    backgroundColor: COLORS.primary.main,
    paddingHorizontal: SPACING.small,
    paddingVertical: SPACING.tiny,
    borderRadius: BORDER_RADIUS.large,
  },
  workoutsList: {
    gap: SPACING.small,
  },
  workoutItem: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.small,
    padding: SPACING.small,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: FONT_SIZE.medium,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.tiny,
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.small,
  },
  workoutDetails: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.secondary,
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: SPACING.small,
    paddingVertical: SPACING.tiny,
    borderRadius: BORDER_RADIUS.small,
  },
  noWorkoutsText: {
    fontSize: FONT_SIZE.medium,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: SPACING.small,
  },
});
