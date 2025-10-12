import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTodaysWorkout } from '../../hooks/useTodaysWorkout';
import { hapticFeedback } from '../../utils/haptics';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../theme/constants';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';
import { loadingStateConfigs } from '../ui/LoadingState.utils';
import { emptyStateConfigs } from '../ui/EmptyState.utils';

interface Exercise {
  exercise_name: string;
  logging_category: string;
  sets?: number;
  reps?: string;
  duration?: number;
  distance?: number;
  difficulty?: string;
  rest_time?: string;
  notes?: string;
}

interface ManualExerciseLoggingCardProps {
  activeRoutineId?: number | null;
  onExercisePress: (exercise: Exercise) => void;
  onLogWorkout: () => void;
}

export default function ManualExerciseLoggingCard({
  activeRoutineId,
  onExercisePress,
  onLogWorkout,
}: ManualExerciseLoggingCardProps) {
  console.log('🔄 [MANUAL EXERCISE CARD] Rendering with activeRoutineId:', activeRoutineId);
  const { todaysWorkout, loading, error } = useTodaysWorkout(activeRoutineId);

  const handleExercisePress = (exercise: Exercise) => {
    hapticFeedback.light();
    onExercisePress(exercise);
  };

  const handleLogWorkoutPress = () => {
    hapticFeedback.light();
    onLogWorkout();
  };

  const getExerciseIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'strength':
        return 'barbell';
      case 'cardio':
        return 'heart';
      case 'flexibility':
        return 'leaf';
      case 'balance':
        return 'footsteps';
      case 'endurance':
        return 'timer';
      default:
        return 'fitness';
    }
  };

  const getExerciseColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'strength':
        return COLORS.primary.main;
      case 'cardio':
        return COLORS.error.main;
      case 'flexibility':
        return COLORS.success;
      case 'balance':
        return COLORS.warning;
      case 'endurance':
        return COLORS.info;
      default:
        return COLORS.text.secondary;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Log Manual Exercise</Text>
        </View>
        <LoadingState
          loading={true}
          message="Loading today's workout..."
          {...loadingStateConfigs.dataFetching}
        />
      </View>
    );
  }

  if (error || !todaysWorkout) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Log Manual Exercise</Text>
          <Ionicons name="fitness" size={24} color={COLORS.primary.main} />
        </View>
        <EmptyState
          title="No Workout Scheduled"
          subtitle="No exercises are scheduled for today. You can still log a manual workout."
          icon="calendar-outline"
          actionText="Log Manual Workout"
          onActionPress={handleLogWorkoutPress}
          actionIcon="add"
          {...emptyStateConfigs.noWorkouts}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Log Manual Exercise</Text>
          <Text style={styles.subtitle}>{todaysWorkout.routine_name}</Text>
        </View>
        <TouchableOpacity
          style={styles.logWorkoutButton}
          onPress={handleLogWorkoutPress}
        >
          <Ionicons name="add" size={20} color={COLORS.text.inverse} />
          <Text style={styles.logWorkoutButtonText}>Log All</Text>
        </TouchableOpacity>
      </View>

      {todaysWorkout.workout_name && (
        <View style={styles.workoutInfo}>
          <Text style={styles.workoutName}>{todaysWorkout.workout_name}</Text>
          {todaysWorkout.description && (
            <Text style={styles.workoutDescription}>{todaysWorkout.description}</Text>
          )}
        </View>
      )}

      <ScrollView 
        style={styles.exercisesContainer}
        showsVerticalScrollIndicator={false}
      >
        {todaysWorkout.exercises.map((exercise, index) => (
          <TouchableOpacity
            key={`${exercise.exercise_name}-${index}`}
            style={styles.exerciseButton}
            onPress={() => handleExercisePress(exercise)}
            activeOpacity={0.7}
          >
            <View style={styles.exerciseContent}>
              <View style={styles.exerciseHeader}>
                <Ionicons
                  name={getExerciseIcon(exercise.logging_category) as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={getExerciseColor(exercise.logging_category)}
                />
                <Text style={styles.exerciseName}>{exercise.exercise_name}</Text>
              </View>
              
              <View style={styles.exerciseDetails}>
                {exercise.sets && exercise.reps && (
                  <Text style={styles.exerciseDetail}>
                    {exercise.sets} sets × {exercise.reps} reps
                  </Text>
                )}
                {exercise.duration && (
                  <Text style={styles.exerciseDetail}>
                    {exercise.duration} min
                  </Text>
                )}
                {exercise.distance && (
                  <Text style={styles.exerciseDetail}>
                    {exercise.distance} km
                  </Text>
                )}
                {exercise.rest_time && (
                  <Text style={styles.exerciseDetail}>
                    Rest: {exercise.rest_time}s
                  </Text>
                )}
              </View>

              {exercise.difficulty && (
                <View style={styles.difficultyContainer}>
                  <Text style={styles.difficultyText}>
                    {exercise.difficulty}
                  </Text>
                </View>
              )}
            </View>
            
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={COLORS.text.tertiary} 
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.large,
    marginHorizontal: SPACING.medium,
    marginBottom: SPACING.medium,
    ...SHADOWS.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.medium,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.secondary,
  },
  logWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary.main,
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    borderRadius: BORDER_RADIUS.medium,
    gap: SPACING.xs,
  },
  logWorkoutButtonText: {
    color: COLORS.text.inverse,
    fontSize: FONT_SIZE.small,
    fontWeight: '600',
  },
  workoutInfo: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
    marginBottom: SPACING.medium,
  },
  workoutName: {
    fontSize: FONT_SIZE.medium,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  workoutDescription: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  exercisesContainer: {
    maxHeight: 300,
  },
  exerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
    marginBottom: SPACING.small,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.small,
  },
  exerciseName: {
    fontSize: FONT_SIZE.medium,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
  },
  exerciseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.small,
    marginBottom: SPACING.xs,
  },
  exerciseDetail: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.secondary,
    backgroundColor: COLORS.background.primary,
    paddingHorizontal: SPACING.small,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.small,
  },
  difficultyContainer: {
    alignSelf: 'flex-start',
  },
  difficultyText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text.tertiary,
    backgroundColor: COLORS.border.light,
    paddingHorizontal: SPACING.small,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.small,
    textTransform: 'capitalize',
  },
});
