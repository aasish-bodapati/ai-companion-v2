import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { routineService, SimpleRoutineWithProgress } from '../../services/RoutineService';
// import { fitnessService } from '../../services/api'; // Unused for now
import { COMMON_STYLES } from '../../theme/constants';
import ConfirmationDialog from '../ui/ConfirmationDialog';
import { confirmationDialogConfigs } from '../ui/ConfirmationDialog.utils';

import { DebugUtils } from '../../utils/debugUtils';

interface RoutineProgressTrackerProps {
  routine: SimpleRoutineWithProgress;
  onWorkoutCompleted?: () => void;
}

interface WorkoutProgress {
  day: string;
  workoutName: string;
  exercises: {
    name: string;
    type: string;
    completed: boolean;
    loggedAt?: string;
  }[];
  completed: boolean;
  completedAt?: string;
}

export default function RoutineProgressTracker({
  routine,
  onWorkoutCompleted,
}: RoutineProgressTrackerProps) {
  const [workoutProgress, setWorkoutProgress] = useState<WorkoutProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadWorkoutProgress = useCallback(async () => {
    try {
      setLoading(true);

      // Get today's workout from the routine
      const todaysWorkout = await routineService.getTodaysWorkout();

      // Handle the case where no workout is scheduled for today
      if (!todaysWorkout) {
        DebugUtils.log('ℹ️ No workout scheduled for today');
        // Continue with progress tracking even if no workout is scheduled
      }

      // Get recent workout logs (for future use)
      // const recentLogs = await fitnessService.getRecentWorkouts(30);

      // Build progress tracking based on routine structure
      const progress: WorkoutProgress[] = routine.workout_schedule.map(day => ({
        day: day.day,
        workoutName: `${day.day} Workout`,
        exercises: day.workouts.map(workout => ({
          name: workout.activity_name,
          type: workout.activity_type,
          completed: false, // TODO: Check against actual logs
          loggedAt: undefined,
        })),
        completed: false, // TODO: Check against actual logs
        completedAt: undefined,
      }));

      setWorkoutProgress(progress);
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
    } finally {
      setLoading(false);
    }
  }, [routine.workout_schedule]);

  useEffect(() => {
    loadWorkoutProgress();
  }, [routine, loadWorkoutProgress]);

  const handleCompleteWorkout = async (dayIndex: number) => {
    try {
      setActionLoading(`${dayIndex}`);

      // Mark workout as completed
      const updatedProgress = [...workoutProgress];
      updatedProgress[dayIndex].completed = true;
      updatedProgress[dayIndex].completedAt = new Date().toISOString();

      setWorkoutProgress(updatedProgress);

      // TODO: Log the workout completion
      // This would typically involve calling the fitness service to log the workout

      setSuccessMessage(`Great job completing your ${updatedProgress[dayIndex].workoutName}!`);
      setShowSuccessDialog(true);
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
      setShowErrorDialog(true);
    } finally {
      setActionLoading(null);
    }
  };

  const getCompletionPercentage = () => {
    if (workoutProgress.length === 0) return 0;
    const completed = workoutProgress.filter(workout => workout.completed).length;
    return Math.round((completed / workoutProgress.length) * 100);
  };

  const getStreakDays = () => {
    // TODO: Calculate actual streak based on workout logs
    return routine.user_progress?.workouts_completed || 0;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading progress...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Progress Overview */}
      <View style={styles.progressOverview}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Progress Overview</Text>
          <Text style={styles.completionPercentage}>{getCompletionPercentage()}%</Text>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${getCompletionPercentage()}%` }
            ]}
          />
        </View>

        <View style={styles.progressStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{getStreakDays()}</Text>
            <Text style={styles.statLabel}>Workouts Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{routine.total_workouts_per_week}</Text>
            <Text style={styles.statLabel}>Per Week</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{routine.duration_weeks}</Text>
            <Text style={styles.statLabel}>Weeks Total</Text>
          </View>
        </View>
      </View>

      {/* Weekly Schedule */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Schedule</Text>
        {workoutProgress.map((workout, index) => (
          <View key={workout.day} style={styles.workoutCard}>
            <View style={styles.workoutHeader}>
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutDay}>{workout.day}</Text>
                <Text style={styles.workoutName}>{workout.workoutName}</Text>
                <Text style={styles.exerciseCount}>
                  {workout.exercises.length} exercises
                </Text>
              </View>
              <View style={styles.workoutStatus}>
                {workout.completed ? (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text style={styles.completedText}>Completed</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => handleCompleteWorkout(index)}
                    disabled={actionLoading === `${index}`}
                  >
                    {actionLoading === `${index}` ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Ionicons name="play" size={16} color="#ffffff" />
                        <Text style={styles.completeButtonText}>Start</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Exercise List */}
            <View style={styles.exercisesList}>
              {workout.exercises.map((exercise, exerciseIndex) => (
                <View key={exerciseIndex} style={styles.exerciseItem}>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseType}>
                      {exercise.type.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.exerciseStatus}>
                    {exercise.completed ? (
                      <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    ) : (
                      <Ionicons name="ellipse-outline" size={20} color="#d1d5db" />
                    )}
                  </View>
                </View>
              ))}
            </View>

            {workout.completedAt && (
              <View style={styles.completionInfo}>
                <Ionicons name="time-outline" size={14} color="#6b7280" />
                <Text style={styles.completionTime}>
                  Completed {new Date(workout.completedAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton}>
            <Ionicons name="barbell-outline" size={24} color="#3b82f6" />
            <Text style={styles.quickActionText}>Log Today's Workout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Ionicons name="analytics-outline" size={24} color="#10b981" />
            <Text style={styles.quickActionText}>View Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Ionicons name="calendar-outline" size={24} color="#f59e0b" />
            <Text style={styles.quickActionText}>Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ConfirmationDialog
        visible={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        onConfirm={() => {
          setShowSuccessDialog(false);
          onWorkoutCompleted?.();
        }}
        title="Workout Completed!"
        message={successMessage}
        confirmText="OK"
        variant="success"
        showCancel={false}
        confirmIcon="checkmark-outline"
        {...confirmationDialogConfigs.saveWorkoutConfirmation}
      />

      <ConfirmationDialog
        visible={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        onConfirm={() => setShowErrorDialog(false)}
        title="Error"
        message="Failed to mark workout as completed. Please try again."
        confirmText="OK"
        variant="danger"
        showCancel={false}
        confirmIcon="alert-circle-outline"
        {...confirmationDialogConfigs.networkError}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COMMON_STYLES.secondaryBackground,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COMMON_STYLES.secondaryBackground,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  progressOverview: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: COMMON_STYLES.standardRadius,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  completionPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  workoutCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: COMMON_STYLES.standardRadius,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutDay: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  workoutName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  exerciseCount: {
    fontSize: 12,
    color: '#9ca3af',
  },
  workoutStatus: {
    alignItems: 'flex-end',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: COMMON_STYLES.standardRadius,
  },
  completedText: {
    fontSize: 12,
    color: '#10b981',
    marginLeft: 4,
    fontWeight: '600',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  exercisesList: {
    marginTop: 8,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 2,
  },
  exerciseType: {
    fontSize: 12,
    color: '#6b7280',
  },
  exerciseStatus: {
    marginLeft: 8,
  },
  completionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  completionTime: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: COMMON_STYLES.standardRadius,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickActionText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
});
