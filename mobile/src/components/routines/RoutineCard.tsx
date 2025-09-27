import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SimpleRoutineWithProgress } from '../../services/routineService';

interface RoutineCardProps {
  routine: SimpleRoutineWithProgress;
  onStart: (routineId: string) => void;
  onStop: (routineId: string) => void;
  onEdit: (routine: SimpleRoutineWithProgress) => void;
  onDelete: (routineId: string) => void;
  isLoading?: boolean;
}

export default function RoutineCard({
  routine,
  onStart,
  onStop,
  onEdit,
  onDelete,
  isLoading = false,
}: RoutineCardProps) {
  const isActive = routine.user_progress?.is_active || false;
  const isUserCreated = !!routine.created_by_user_id;

  const handleStart = () => {
    onStart(routine.id);
  };

  const handleStop = () => {
    onStop(routine.id);
  };

  const handleEdit = () => {
    onEdit(routine);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Routine',
      'Are you sure you want to delete this routine? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(routine.id) },
      ]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '#22c55e'; // green
      case 'intermediate':
        return '#f59e0b'; // amber
      case 'advanced':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'leaf-outline';
      case 'intermediate':
        return 'flame-outline';
      case 'advanced':
        return 'flash-outline';
      default:
        return 'help-outline';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{routine.name}</Text>
          {isActive && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeText}>Active</Text>
            </View>
          )}
        </View>
        {isUserCreated && (
          <View style={styles.userCreatedBadge}>
            <Ionicons name="star" size={12} color="#f59e0b" />
            <Text style={styles.userCreatedText}>Custom</Text>
          </View>
        )}
      </View>

      <Text style={styles.description}>{routine.description}</Text>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons 
            name={getDifficultyIcon(routine.difficulty)} 
            size={16} 
            color={getDifficultyColor(routine.difficulty)} 
          />
          <Text style={[styles.detailText, { color: getDifficultyColor(routine.difficulty) }]}>
            {routine.difficulty.charAt(0).toUpperCase() + routine.difficulty.slice(1)}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{routine.duration_weeks} weeks</Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="barbell-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>
            {routine.total_workouts_per_week} workouts/week
          </Text>
        </View>
      </View>

      {/* Workout Plan Info */}
      {routine.workout_schedule && routine.workout_schedule.length > 0 ? (
        <View style={styles.workoutPlan}>
          <View style={styles.workoutPlanHeader}>
            <Ionicons name="list-outline" size={16} color="#f97316" />
            <Text style={styles.workoutPlanTitle}>Workout Plan</Text>
          </View>
          <Text style={styles.workoutPlanText}>
            {routine.total_workouts_per_week} workout days with detailed exercises
          </Text>
        </View>
      ) : (
        <View style={styles.noWorkoutPlan}>
          <Text style={styles.noWorkoutPlanText}>
            No detailed workout plan available
          </Text>
        </View>
      )}

      {/* Progress Info */}
      {routine.user_progress && (
        <View style={styles.progress}>
          <View style={styles.progressHeader}>
            <Ionicons name="trending-up-outline" size={16} color="#3b82f6" />
            <Text style={styles.progressTitle}>Progress</Text>
          </View>
          <Text style={styles.progressText}>
            {routine.user_progress.workouts_completed} workouts completed
          </Text>
          {routine.user_progress.last_workout_date && (
            <Text style={styles.lastWorkoutText}>
              Last workout: {new Date(routine.user_progress.last_workout_date).toLocaleDateString()}
            </Text>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {isActive ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.stopButton]}
            onPress={handleStop}
            disabled={isLoading}
          >
            <Ionicons name="pause" size={16} color="#6b7280" />
            <Text style={styles.stopButtonText}>
              {isLoading ? 'Setting Inactive...' : 'Set to Inactive'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={handleStart}
            disabled={isLoading}
          >
            <Ionicons name="play" size={16} color="#fff" />
            <Text style={styles.startButtonText}>
              {isLoading ? 'Setting Active...' : 'Set as Active'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Edit/Delete buttons for user-created routines only */}
        {isUserCreated && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={handleEdit}
              disabled={isLoading}
            >
              <Ionicons name="pencil" size={16} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
              disabled={isLoading}
            >
              <Ionicons name="trash" size={16} color="#ffffff" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </>
        )}
        
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 8,
  },
  activeBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  userCreatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  userCreatedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400e',
    marginLeft: 2,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  workoutPlan: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#f97316',
  },
  workoutPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  workoutPlanTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginLeft: 6,
  },
  workoutPlanText: {
    fontSize: 12,
    color: '#a16207',
  },
  noWorkoutPlan: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  noWorkoutPlanText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  progress: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginLeft: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '500',
  },
  lastWorkoutText: {
    fontSize: 11,
    color: '#3b82f6',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 36,
  },
  startButton: {
    flex: 1,
    backgroundColor: '#f97316',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 4,
  },
  stopButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
  },
  stopButtonText: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 4,
  },
  editButton: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: '#dc2626',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
});
