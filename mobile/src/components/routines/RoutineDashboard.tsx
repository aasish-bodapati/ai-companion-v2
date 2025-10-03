import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { routineService, SimpleRoutineWithProgress } from '../../services/routineService';

interface RoutineDashboardProps {
  onRoutineSelected?: () => void;
  onCreateRoutine?: () => void;
  onEditRoutine?: (routine: SimpleRoutineWithProgress) => void;
  onDeleteRoutine?: (routineId: number) => void;
}


export default function RoutineDashboard({
  onRoutineSelected,
  onCreateRoutine,
  onEditRoutine,
  onDeleteRoutine,
}: RoutineDashboardProps) {
  const [routines, setRoutines] = useState<SimpleRoutineWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch user routines, templates, and active routine
      const [userRoutinesResponse, templatesResponse, activeRoutineResponse] = await Promise.allSettled([
        routineService.getRoutines({ limit: 50 }),
        routineService.getTemplates({ limit: 50 }),
        routineService.getActiveRoutine()
      ]);
      
      const allRoutines: SimpleRoutineWithProgress[] = [];
      const activeRoutine = activeRoutineResponse.status === 'fulfilled' ? activeRoutineResponse.value : null;
      
      console.log('🔍 Active routine:', activeRoutine ? {
        id: activeRoutine.id,
        name: activeRoutine.name,
        isTemplate: activeRoutine.is_template
      } : 'None');
      
      // Add user routines if successful
      if (userRoutinesResponse.status === 'fulfilled') {
        allRoutines.push(...(userRoutinesResponse.value.routines || []));
      }
      
      // Add templates if successful, and mark as active if they match the active routine
      if (templatesResponse.status === 'fulfilled') {
        const templates = templatesResponse.value.routines || [];
        for (const template of templates) {
          // If this template is the active routine, use the active routine data instead
          if (activeRoutine && activeRoutine.id === template.id) {
            console.log(`✅ Template ${template.id} is active, using active routine data`);
            allRoutines.push(activeRoutine);
          } else {
            allRoutines.push(template);
          }
        }
      }
      
      setRoutines(allRoutines);
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartRoutine = async (routineId: number) => {
    try {
      setActionLoading(routineId);
      
      // Find the routine to check if it's a template
      const routine = routines.find(r => r.id === routineId);
      if (!routine) {
        throw new Error('Routine not found');
      }

      console.log('🔄 Starting routine:', {
        routineId: routine.id,
        routineName: routine.name,
        isTemplate: routine.is_template
      });

      if (routine.is_template) {
        console.log('📋 Template routine detected, starting directly...');
        // Start template routine directly - no copy needed
        await routineService.startRoutine(routine.id);
      } else {
        console.log('👤 User-created routine, starting directly...');
        // Start the user routine directly
        await routineService.startRoutine(routineId);
      }
      
      await loadData();
      onRoutineSelected?.();
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
    } finally {
      setActionLoading(null);
    }
  };

  const handleStopRoutine = async (routineId: number) => {
    try {
      setActionLoading(routineId);
      await routineService.stopRoutine(routineId);
      await loadData();
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteRoutine = async (routineId: number) => {
    Alert.alert(
      'Delete Routine',
      'Are you sure you want to delete this routine? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              setActionLoading(routineId);
              await routineService.deleteRoutine(routineId);
              await loadData();
              onDeleteRoutine?.(routineId);
            } catch (error) {
              // Silent error handling - no console logging to prevent Expo Go notifications
              Alert.alert('Error', 'Failed to delete routine. Please try again.');
            } finally {
              setActionLoading(null);
            }
          }
        },
      ]
    );
  };


  const RoutineCard = ({ routine }: { routine: SimpleRoutineWithProgress }) => (
    <View style={styles.routineCard}>
      <View style={styles.routineHeader}>
        <View style={styles.routineInfo}>
          <Text style={styles.routineName}>{routine.name}</Text>
          <Text style={styles.routineDescription}>{routine.description}</Text>
          <View style={styles.routineMeta}>
            <View style={styles.routineMetaItem}>
              <Ionicons name="time-outline" size={14} color="#6b7280" />
              <Text style={styles.routineMetaText}>{routine.duration_weeks} weeks</Text>
            </View>
            <View style={styles.routineMetaItem}>
              <Ionicons name="barbell-outline" size={14} color="#6b7280" />
              <Text style={styles.routineMetaText}>{routine.total_workouts_per_week} workouts/week</Text>
            </View>
            <View style={styles.routineMetaItem}>
              <Ionicons name="trending-up-outline" size={14} color="#6b7280" />
              <Text style={styles.routineMetaText}>{routine.difficulty}</Text>
            </View>
          </View>
        </View>
        <View style={styles.routineActions}>
          {routine.user_progress?.is_active ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.stopButton]}
              onPress={() => handleStopRoutine(routine.id)}
              disabled={actionLoading === routine.id}
            >
              {actionLoading === routine.id ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="pause" size={16} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Stop</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.startButton]}
              onPress={() => handleStartRoutine(routine.id)}
              disabled={actionLoading === routine.id}
            >
              {actionLoading === routine.id ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="play" size={16} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Start</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onEditRoutine?.(routine)}
          >
            <Ionicons name="pencil" size={16} color="#6b7280" />
          </TouchableOpacity>
          {routine.created_by_user_id && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteRoutine(routine.id)}
              disabled={actionLoading === routine.id}
            >
              <Ionicons name="trash" size={16} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {routine.user_progress && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progress</Text>
            <Text style={styles.progressText}>
              {routine.user_progress.workouts_completed} workouts completed
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min((routine.user_progress.workouts_completed / (routine.total_workouts_per_week * routine.duration_weeks)) * 100, 100)}%` 
                }
              ]} 
            />
          </View>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading routines...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Routine Dashboard</Text>
        <TouchableOpacity style={styles.createButton} onPress={onCreateRoutine}>
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.createButtonText}>Create Routine</Text>
        </TouchableOpacity>
      </View>



      {/* All Routines */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Routines</Text>
        {routines.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="barbell-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No Routines Yet</Text>
            <Text style={styles.emptyText}>
              Create your first routine to start your fitness journey
            </Text>
            <TouchableOpacity style={styles.emptyCreateButton} onPress={onCreateRoutine}>
              <Ionicons name="add-circle" size={20} color="#3b82f6" />
              <Text style={styles.emptyCreateButtonText}>Create Your First Routine</Text>
            </TouchableOpacity>
          </View>
        ) : (
          routines.map((routine) => (
            <RoutineCard key={routine.id} routine={routine} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
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
    borderRadius: 20,
  },
  createButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 4,
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
  routineCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
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
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routineInfo: {
    flex: 1,
    marginRight: 12,
  },
  routineName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  routineDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  routineMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  routineMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routineMetaText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  routineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  startButton: {
    backgroundColor: '#10b981',
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  editButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  deleteButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  progressSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  emptyCreateButtonText: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});
