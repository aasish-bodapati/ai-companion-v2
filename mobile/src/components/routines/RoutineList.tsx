import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { routineService, SimpleRoutineWithProgress } from '../../services/routineService';
import { showToast } from '../../utils/toast';
import RoutineCard from './RoutineCard';
import EditRoutineModal from './EditRoutineModal';

interface RoutineListProps {
  onRoutineSelected?: () => void;
  onCreateRoutine?: () => void;
}

export default function RoutineList({ onRoutineSelected, onCreateRoutine }: RoutineListProps) {
  const [routines, setRoutines] = useState<SimpleRoutineWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<SimpleRoutineWithProgress | null>(null);

  const loadRoutines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
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
        allRoutines.push(...userRoutinesResponse.value.routines);
      }
      
      // Add templates if successful, and mark as active if they match the active routine
      if (templatesResponse.status === 'fulfilled') {
        const templates = templatesResponse.value.routines;
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
      
      console.log('📋 Loaded routines:', allRoutines.map(r => ({
        id: r.id,
        name: r.name,
        isTemplate: r.is_template,
        isActive: r.user_progress?.is_active || false
      })));
      setRoutines(allRoutines);
    } catch (err: any) {
      console.error('Failed to load routines:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load routines');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoutines();
  }, [loadRoutines]);

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
        showToast.success('Success!', 'Routine set as active');
      } else {
        console.log('👤 User-created routine, starting directly...');
        // Start the user routine directly
        await routineService.startRoutine(routineId);
        showToast.success('Success!', 'Routine set as active');
      }
      
      console.log('🔄 Refreshing routine list after starting routine...');
      await loadRoutines();
      console.log('✅ Routine list refreshed');
      onRoutineSelected?.();
    } catch (err: any) {
      console.error('❌ Failed to start routine:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      showToast.error('Error', err.response?.data?.detail || err.message || 'Failed to set routine as active');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStopRoutine = async (routineId: number) => {
    try {
      setActionLoading(routineId);
      await routineService.stopRoutine(routineId);
      showToast.success('Success!', 'Routine set to inactive');
      await loadRoutines();
    } catch (err: any) {
      console.error('Failed to stop routine:', err);
      showToast.error('Error', err.response?.data?.detail || err.message || 'Failed to set routine to inactive');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditRoutine = async (routine: SimpleRoutineWithProgress) => {
    try {
      console.log('🔄 Starting edit routine process:', {
        routineId: routine.id,
        routineName: routine.name,
        isTemplate: routine.is_template,
        createdByUser: routine.created_by_user_id
      });

      // If it's a template, create a user copy first (templates can't be edited directly)
      if (routine.is_template) {
        console.log('📋 Template routine detected, creating user copy for editing...');
        const userCopy = await routineService.createFromTemplate(routine.id, routine.name);
        console.log('✅ User copy created for editing:', {
          newId: userCopy.id,
          newName: userCopy.name,
          isTemplate: userCopy.is_template
        });
        setSelectedRoutine(userCopy);
        showToast.success('Success!', 'Template copied for editing');
      } else {
        console.log('👤 User-created routine, using directly');
        setSelectedRoutine(routine);
      }
      setShowEditModal(true);
    } catch (error) {
      console.error('❌ Failed to prepare routine for editing:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      showToast.error('Error', 'Failed to prepare routine for editing. Please try again.');
    }
  };

  const handleDeleteRoutine = async (routineId: number) => {
    // Find the routine to check if it's a template
    const routine = routines.find(r => r.id === routineId);
    if (routine?.is_template) {
      showToast.error('Error', 'Template routines cannot be deleted. Create a copy to customize.');
      return;
    }

    try {
      setActionLoading(routineId);
      await routineService.deleteRoutine(routineId);
      showToast.success('Success!', 'Routine deleted successfully');
      await loadRoutines();
    } catch (err: any) {
      console.error('Failed to delete routine:', err);
      
      let errorMessage = 'Failed to delete routine. Please try again.';
      if (err.response?.status === 403) {
        errorMessage = 'You are not authorized to delete this routine. Only user-created routines can be deleted.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Routine not found. It may have already been deleted.';
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      showToast.error('Error', errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoutineUpdated = async () => {
    setShowEditModal(false);
    setSelectedRoutine(null);
    await loadRoutines();
    onRoutineSelected?.();
  };

  const handleRefresh = () => {
    loadRoutines();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading routines...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Failed to Load Routines</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Routines</Text>
        <TouchableOpacity style={styles.createButton} onPress={onCreateRoutine}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Routines List */}
      {routines.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="barbell-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Routines Yet</Text>
          <Text style={styles.emptyText}>
            Create your first routine to start tracking your fitness journey
          </Text>
          <TouchableOpacity style={styles.emptyCreateButton} onPress={onCreateRoutine}>
            <Ionicons name="add-circle" size={20} color="#f97316" />
            <Text style={styles.emptyCreateButtonText}>Create Your First Routine</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {routines.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              onStart={handleStartRoutine}
              onStop={handleStopRoutine}
              onEdit={handleEditRoutine}
              onDelete={handleDeleteRoutine}
              isLoading={actionLoading === routine.id}
            />
          ))}
        </ScrollView>
      )}

      {/* Edit Routine Modal */}
      <EditRoutineModal
        isVisible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedRoutine(null);
        }}
        onRoutineUpdated={handleRoutineUpdated}
        routine={selectedRoutine}
      />
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
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
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#f97316',
  },
  emptyCreateButtonText: {
    color: '#f97316',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});
