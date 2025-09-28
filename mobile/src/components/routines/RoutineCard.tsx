import React from 'react';
import { Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SimpleRoutineWithProgress } from '../../services/routineService';
import ActionCard from '../ui/ActionCard';
import { COLORS } from '../../theme/constants';

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
        return COLORS.success;
      case 'intermediate':
        return COLORS.warning;
      case 'advanced':
        return COLORS.danger;
      default:
        return COLORS.text.secondary;
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

  const badges = [
    ...(isActive ? [{ text: 'Active', variant: 'success' as const, icon: 'checkmark-circle' }] : []),
    ...(isUserCreated ? [{ text: 'Custom', variant: 'info' as const, icon: 'star' }] : []),
  ];

  const details = [
    {
      label: 'Difficulty',
      value: routine.difficulty.charAt(0).toUpperCase() + routine.difficulty.slice(1),
      icon: getDifficultyIcon(routine.difficulty),
      color: getDifficultyColor(routine.difficulty),
    },
    {
      label: 'Duration',
      value: `${routine.duration_weeks} weeks`,
      icon: 'calendar-outline',
    },
    {
      label: 'Frequency',
      value: `${routine.total_workouts_per_week} workouts/week`,
      icon: 'barbell-outline',
    },
  ];

  const primaryAction = isActive
    ? {
        label: isLoading ? 'Setting Inactive...' : 'Set to Inactive',
        icon: 'pause',
        onPress: handleStop,
        variant: 'secondary' as const,
        disabled: isLoading,
        loading: isLoading,
      }
    : {
        label: isLoading ? 'Setting Active...' : 'Set as Active',
        icon: 'play',
        onPress: handleStart,
        variant: 'primary' as const,
        disabled: isLoading,
        loading: isLoading,
      };

  const secondaryActions = isUserCreated
    ? [
        {
          label: 'Edit',
          icon: 'pencil',
          onPress: handleEdit,
          variant: 'ghost' as const,
          disabled: isLoading,
        },
        {
          label: 'Delete',
          icon: 'trash',
          onPress: handleDelete,
          variant: 'danger' as const,
          disabled: isLoading,
        },
      ]
    : [];

  const description = routine.description + 
    (routine.workout_schedule && routine.workout_schedule.length > 0
      ? `\n\nIncludes detailed workout plan with ${routine.total_workouts_per_week} workout days.`
      : '\n\nNo detailed workout plan available.');

  return (
    <ActionCard
      title={routine.name}
      description={description}
      icon="fitness-outline"
      iconColor={COLORS.primary}
      badges={badges}
      details={details}
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
      variant="detailed"
    />
  );
}

