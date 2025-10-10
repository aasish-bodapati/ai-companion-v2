import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SimpleRoutineWithProgress } from '../../services/routineService';
import RoutineDetailsModal from './RoutineDetailsModal';
import { DifficultyBadge } from '../ui/Badge';

interface Routine {
  id: number;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_weeks: number;
  workout_schedule: {
    day: string;
    workouts: {
      activity_name: string;
      activity_type: string;
      sets?: number;
      reps?: string;
      duration?: number;
    }[];
  }[];
  total_workouts_per_week: number;
}

interface SimpleRoutineDisplayProps {
  routines: Routine[];
  onRoutineSelect?: (routine: Routine) => void;
  onCreateRoutine?: () => void;
  onSetActive?: (routine: Routine) => void;
  activeRoutineId?: number | null;
  settingActiveRoutine?: number | null;
}

export default function SimpleRoutineDisplay({ 
  routines, 
  onRoutineSelect, 
  onCreateRoutine,
  onSetActive,
  activeRoutineId,
  settingActiveRoutine
}: SimpleRoutineDisplayProps) {
  const [selectedRoutine, setSelectedRoutine] = useState<SimpleRoutineWithProgress | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Debug: Log routines to see what we're getting
  console.log('🔍 SimpleRoutineDisplay - routines:', routines, 'type:', typeof routines, 'isArray:', Array.isArray(routines));

  // Handle both array and paginated response formats
  const safeRoutines = Array.isArray(routines) 
    ? routines 
    : (routines && routines.routines) 
      ? routines.routines 
      : [];

  const handleRoutinePress = (routine: SimpleRoutineWithProgress) => {
    setSelectedRoutine(routine);
    setShowDetailsModal(true);
    onRoutineSelect?.(routine);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedRoutine(null);
  };



  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout Routines</Text>
        <TouchableOpacity 
          style={styles.createButton} 
          onPress={onCreateRoutine}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      {safeRoutines.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="fitness-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No Routines Yet</Text>
          <Text style={styles.emptyDescription}>
            Create your first workout routine to get started!
          </Text>
        </View>
      ) : (
        <View style={styles.routineList}>
          {safeRoutines.map((routine) => (
            <TouchableOpacity
              key={routine.id}
              style={styles.routineCard}
              onPress={() => handleRoutinePress(routine)}
              activeOpacity={0.7}
            >
              <View style={styles.routineHeader}>
                <View style={styles.routineInfo}>
                  <Text style={styles.routineName}>{routine.name}</Text>
                  <Text style={styles.routineDescription}>{routine.description}</Text>
                </View>
                <View style={styles.routineMeta}>
                  <DifficultyBadge difficulty={routine.difficulty} size="small" />
                </View>
              </View>

              <View style={styles.routineFooter}>
                <View style={styles.routineDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                    <Text style={styles.detailText}>{routine.duration_weeks} weeks</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="list-outline" size={14} color="#6b7280" />
                    <Text style={styles.detailText}>{routine.total_workouts_per_week}/week</Text>
                  </View>
                </View>
                
                {/* Action Buttons - Now inline with details */}
                <View style={styles.actionButtons}>
                  {activeRoutineId === routine.id ? (
                    <View style={styles.activeBadge}>
                      <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                      <Text style={styles.activeText}>Active</Text>
                    </View>
                  ) : settingActiveRoutine === routine.id ? (
                    <View style={styles.loadingButton}>
                      <Ionicons name="hourglass-outline" size={12} color="#6b7280" />
                      <Text style={styles.loadingText}>Setting...</Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.setActiveButton}
                      onPress={() => {
                        onSetActive?.(routine);
                      }}
                    >
                      <Ionicons name="play-circle-outline" size={12} color="#3b82f6" />
                      <Text style={styles.setActiveText}>Set as Active</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Routine Details Modal */}
      <RoutineDetailsModal
        isVisible={showDetailsModal}
        onClose={handleCloseDetails}
        routine={selectedRoutine}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  routineList: {
    padding: 16,
  },
  routineCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  routineInfo: {
    flex: 1,
    marginRight: 12,
  },
  routineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    lineHeight: 22,
  },
  routineDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  routineMeta: {
    alignItems: 'flex-end',
  },
  routineFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtons: {
    // No margin needed since it's inline now
  },
  setActiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  setActiveText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#3b82f6',
    marginLeft: 2,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  activeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#10b981',
    marginLeft: 2,
  },
  loadingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  loadingText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 2,
  },
  routineDetails: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
    flex: 1,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  exercisePreview: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  exercisePreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  exerciseList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  exerciseItem: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  moreExercises: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  dayWorkouts: {
    marginBottom: 8,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
});
