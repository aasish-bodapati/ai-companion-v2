import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fitnessService } from '../../services/fitnessService';
import { useToast } from '../../contexts/ToastContext';
import { useExerciseCategories, useExerciseCategoriesLoaded, useExerciseCategoriesLoading, useExerciseCategoriesStore } from '../../stores';
import { CategoryBadge } from '../ui/Badge';
import { exerciseCategoryService } from '../../services/exerciseCategoryService';
import { getExerciseCategory } from '../../utils/exerciseCategoryUtils';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';
import { loadingStateConfigs } from '../ui/LoadingState.utils';
import { emptyStateConfigs } from '../ui/EmptyState.utils';
import DataTable from '../ui/DataTable';
import Pagination from '../ui/Pagination';
import { dataTableConfigs } from '../ui/DataTable.utils';
import { paginationConfigs } from '../ui/Pagination.utils';
import { 
  formatTimeInUserTimezone, 
  formatDateInUserTimezone, 
  getDateInUserTimezone,
  getUserTimezone
} from '../../utils/timezoneUtils';
import CalendarComponent from '../common/CalendarComponent';

interface WorkoutLog {
  id: number;
  routine_name?: string;
  workout_name?: string;
  exercises?: string;
  duration_minutes?: number;
  notes?: string;
  logged_at?: string;
  activity_date?: string;
  created_at: string;
}

interface SimpleFitnessLogsProps {
  onRefresh?: () => void;
}

export default function SimpleFitnessLogs({ onRefresh }: SimpleFitnessLogsProps) {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  // DataTable columns configuration
  const columns = [
    {
      key: 'routine_name',
      title: 'Routine',
      dataIndex: 'routine_name',
      sortable: true,
      width: 120,
      render: (value: string, record: WorkoutLog) => (
        <Text style={styles.tableText} numberOfLines={1}>
          {value || record.workout_name || 'Manual Workout'}
        </Text>
      ),
    },
    {
      key: 'exercises',
      title: 'Exercises',
      dataIndex: 'exercises',
      sortable: false,
      render: (value: any, record: WorkoutLog) => {
        if (!value || !Array.isArray(value) || value.length === 0) {
          return <Text style={styles.tableText}>No exercises</Text>;
        }
        return (
          <View style={styles.exercisesList}>
            {value.slice(0, 2).map((exercise: any, index: number) => {
              const category = getExerciseCategory(exercise);
              const categoryConfig = getCategoryConfig(category);
              return (
                <View key={index} style={styles.exerciseItem}>
                  <CategoryBadge
                    category={String(category || '')}
                    name={categoryConfig.name}
                    icon={categoryConfig.icon}
                    color={categoryConfig.color}
                    size="small"
                  />
                  <Text style={styles.exerciseName} numberOfLines={1}>
                    {exercise.exercise_name || exercise.name || 'Exercise'}
                  </Text>
                </View>
              );
            })}
            {value.length > 2 && (
              <Text style={styles.moreExercises}>+{value.length - 2} more</Text>
            )}
          </View>
        );
      },
    },
    {
      key: 'duration_minutes',
      title: 'Duration',
      dataIndex: 'duration_minutes',
      sortable: true,
      width: 80,
      align: 'center' as const,
      render: (value: number) => (
        <Text style={styles.tableText}>
          {value ? `${value}min` : '-'}
        </Text>
      ),
    },
    {
      key: 'logged_at',
      title: 'Logged',
      dataIndex: 'logged_at',
      sortable: true,
      width: 100,
      align: 'center' as const,
      render: (value: string) => (
        <Text style={styles.tableText}>
          {value ? formatTimeInUserTimezone(value) : '-'}
        </Text>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      dataIndex: 'actions',
      sortable: false,
      width: 80,
      align: 'center' as const,
      render: (value: any, record: WorkoutLog) => (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditLog(record)}
          >
            <Ionicons name="pencil-outline" size={16} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteLog(record.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      ),
    },
  ];
  
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const userTimezone = getUserTimezone();
    const userDateStr = now.toLocaleDateString("en-CA", { timeZone: userTimezone });
    const userDate = new Date(userDateStr + "T00:00:00");
    return userDate;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkoutLog | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [allLogs, setAllLogs] = useState<WorkoutLog[]>([]);
  const [exerciseDatabase, setExerciseDatabase] = useState<unknown[]>([]);
  
  // Use ref to avoid stale closure issues
  const selectedDateRef = useRef(selectedDate);
  
  // Use individual selectors (safe - no infinite loops)
  const categories = useExerciseCategories();
  const loaded = useExerciseCategoriesLoaded();
  const categoriesLoading = useExerciseCategoriesLoading();
  
  // Get actions directly from store (avoid useExerciseCategoriesActions)
  const loadCategories = useExerciseCategoriesStore.getState().loadCategories;
  
  // Update ref when selectedDate changes
  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);
  
  // Load categories on component mount if not already loaded
  useEffect(() => {
    if (!loaded && !categoriesLoading) {
      loadCategories();
    }
  }, [loaded, categoriesLoading, loadCategories]);

  // Load logs on component mount
  useEffect(() => {
    loadLogs();
    loadExerciseDatabase();
    loadCategoryConfigs();
  }, []); // Only run once on mount

  // Load logs when selectedDate changes
  useEffect(() => {
    loadLogs(selectedDate);
  }, [selectedDate]);

  const loadExerciseDatabase = async () => {
    try {
      const exercises = await fitnessService.getExerciseTypes();
      setExerciseDatabase(exercises);
    } catch (_error) {
      console.error('Error loading exercise database:', _error);
    }
  };

  const loadCategoryConfigs = async () => {
    try {
      const categories = await exerciseCategoryService.getCategories();
      console.log('Loaded categories:', categories.length);
    } catch (_error) {
      console.log('Error loading category configs:', _error);
    }
  };

  const loadLogs = useCallback(async (date?: Date) => {
    try {
      setLoading(true);
      const targetDate = date || selectedDateRef.current;
      
      // Load all logs for the month first for calendar indicators
      const allLogsResponse = await fitnessService.getFitnessLogs({
        period: 'month',
        page: 1,
        size: 50
      });
      
      // Process all logs for calendar indicators
      const processedAllLogs = (allLogsResponse || []).map((log: WorkoutLog) => {
        if (log.exercises && typeof log.exercises === 'string') {
          try {
            log.exercises = JSON.parse(log.exercises);
          } catch {
            log.exercises = [];
          }
        }
        return log;
      });
      setAllLogs(processedAllLogs);
      
      // Get date string in user's timezone
      let targetDateStr;
      try {
        targetDateStr = getDateInUserTimezone(targetDate);
      } catch {
        targetDateStr = targetDate.toISOString().split('T')[0];
      }
      
      const response = await fitnessService.getFitnessLogs({
        start_date: targetDateStr,
        end_date: targetDateStr,
        page: 1,
        size: 50
      });
      
      // Parse exercises from JSON string if needed
      const processedLogs = (response || []).map((log: WorkoutLog) => {
        if (log.exercises && typeof log.exercises === 'string') {
          try {
            log.exercises = JSON.parse(log.exercises);
          } catch {
            log.exercises = [];
          }
        }
        return log;
      });
      
      // Sort by time (earliest first)
      const sortedLogs = processedLogs.sort((a: WorkoutLog, b: WorkoutLog) => {
        const timeA = new Date(a.activity_date || a.logged_at || 0).getTime();
        const timeB = new Date(b.activity_date || b.logged_at || 0).getTime();
        return timeA - timeB;
      });
      
      setLogs(sortedLogs);
    } catch (_error) {
      console.error('Error loading logs:', _error);
      showToast('Failed to load fitness logs', 'error');
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies to prevent infinite loops

  const onRefreshLogs = async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
    onRefresh?.();
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
  };

  const formatDateForDisplay = (date: Date) => {
    return formatDateInUserTimezone(date.toISOString(), {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const getLogsWithDates = () => {
    const dates = allLogs.map(log => {
      const logDate = log.activity_date || log.logged_at || log.created_at;
      return new Date(logDate).toISOString().split('T')[0];
    });
    return new Set(dates);
  };

  // Pagination logic
  const totalPages = Math.ceil(logs.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedLogs = logs.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEditLog = (log: WorkoutLog) => {
    setEditingLog(log);
    setEditNotes(log.notes || '');
    setEditModalVisible(true);
  };

  const handleDeleteLog = (logId: number) => {
    // Add delete confirmation logic here
    showToast('Delete functionality coming soon', 'info');
  };


  const getCategoryConfig = (categoryId: string) => {
    // Simplified category config without store dependency
    const categoryConfigs: { [key: string]: { name: string; icon: string; color: string } } = {
      'bodyweight': { name: 'Bodyweight', icon: 'body-outline', color: '#3b82f6' },
      'weighted': { name: 'Weighted', icon: 'barbell-outline', color: '#f97316' },
      'cardio_duration': { name: 'Cardio', icon: 'heart-outline', color: '#10b981' },
      'distance_based': { name: 'Distance', icon: 'walk-outline', color: '#8b5cf6' },
      'unknown': { name: 'Other', icon: 'help-outline', color: '#6b7280' }
    };
    
    return categoryConfigs[categoryId] || categoryConfigs['unknown'];
  };

  const handleSaveEdit = async () => {
    if (!editingLog) return;
    
    try {
      // Here you would call your API to update the log
      // await fitnessService.updateLog(editingLog.id, { notes: editNotes });
      
      // For now, just update local state
      setLogs(prevLogs => 
        prevLogs.map(log => 
          log.id === editingLog.id 
            ? { ...log, notes: editNotes }
            : log
        )
      );
      
      setEditModalVisible(false);
      setEditingLog(null);
      setEditNotes('');
      showToast('Log updated successfully', 'success');
    } catch (error) {
      console.error('Error updating log:', error);
      showToast('Failed to update log', 'error');
    }
  };

  if (loading) {
    return (
      <LoadingState
        loading={true}
        message="Loading fitness logs..."
        {...loadingStateConfigs.dataFetching}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Fitness Logs</Text>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>{formatDateForDisplay(selectedDate)}</Text>
          <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Date Navigation */}
      <View style={styles.dateNavigation}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateDate('prev')}
        >
          <Ionicons name="chevron-back" size={24} color="#3b82f6" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.todayButton}
          onPress={goToToday}
        >
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateDate('next')}
        >
          <Ionicons name="chevron-forward" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Logs List */}
      <ScrollView 
        style={styles.logsContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefreshLogs}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
      >
        {logs.length === 0 ? (
          <EmptyState
            title="No workouts logged"
            subtitle="Start logging your workouts to see them here"
            icon="fitness-outline"
            actionText="Log Workout"
            onActionPress={() => {
              // This would typically open the workout logging modal
              showToast('Open workout logging modal', 'info');
            }}
            {...emptyStateConfigs.noWorkouts}
          />
        ) : (
          <>
            <DataTable
              data={paginatedLogs}
              columns={columns}
              loading={loading}
              refreshing={refreshing}
              onRefresh={onRefreshLogs}
              testID="fitness-logs-table"
              {...dataTableConfigs.exerciseLogs}
            />
            
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                testID="fitness-logs-pagination"
                {...paginationConfigs.dataTable}
              />
            )}
          </>
        )}
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePicker(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <CalendarComponent
              selectedDate={selectedDate}
              onDateSelect={(date) => {
                setSelectedDate(date);
                setShowDatePicker(false);
              }}
              logsWithDates={getLogsWithDates()}
              showLogsIndicator={true}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Workout Notes</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                value={editNotes}
                onChangeText={setEditNotes}
                placeholder="Add notes about your workout..."
                multiline
                numberOfLines={4}
              />
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3b82f6',
    marginRight: 8,
  },
  dateNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  navButton: {
    padding: 8,
  },
  todayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  todayButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  logsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  logEntry: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  exercisesContainer: {
    marginBottom: 12,
  },
  exerciseItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  exerciseNameContainer: {
    flex: 1,
    marginRight: 12,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginRight: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  exerciseTime: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  exerciseHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  exerciseStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  exerciseStat: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontWeight: '500',
  },
  exerciseNotes: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  workoutInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  workoutDuration: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  workoutNotes: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
  },
  editModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#f9fafb',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  // DataTable styles
  tableText: {
    fontSize: 14,
    color: '#1f2937',
  },
  exercisesList: {
    flexDirection: 'column',
    gap: 4,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseName: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  moreExercises: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
});