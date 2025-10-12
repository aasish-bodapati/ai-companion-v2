import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fitnessService } from '../../services/fitnessService';
import { useToast } from '../../contexts/ToastContext';
import { useExerciseCategoriesWithAutoLoad } from '../../stores';
import { CategoryBadge } from '../ui/Badge';
import { exerciseCategoryService } from '../../services/exerciseCategoryService';
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
  // Use exercise categories store with manual loading
  const { categories, loadCategories, loaded, loading: categoriesLoading } = useExerciseCategoriesWithAutoLoad();
  
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
  }, [loadLogs]);

  // Categories are now auto-loaded via useExerciseCategoriesWithAutoLoad hook

  const loadExerciseDatabase = async () => {
    try {
      const exercises = await fitnessService.getExerciseTypes();
      // Log a few sample exercises to see the structure
      if (exercises.length > 0) {
        // Look for Romanian Deadlift specifically
        const romanianDeadlift = exercises.find(ex => ex.name && ex.name.toLowerCase().includes('romanian'));
        if (romanianDeadlift) {
        } else {
          // Check if there are any exercises with ID 455
          const exercise455 = exercises.find(ex => ex.id === 455);
          if (exercise455) {
          } else {
          }
          // Log some exercise IDs to see the range
          const ids = exercises.map(ex => ex.id).sort((a, b) => a - b);
          console.log('🔍 [FITNESS LOGS] Exercise ID range:', ids.slice(0, 10), '...', ids.slice(-10));
        }
      }
      setExerciseDatabase(exercises);
    } catch (_error) {
      console.error('Error loading exercise database:', _error);
    }
  };

  const loadCategoryConfigs = async () => {
    try {
      const categories = await exerciseCategoryService.getCategories();
      const configMap: { [key: string]: { name: string; icon: string; color: string } } = {};
      categories.forEach(category => {
        configMap[category.id] = {
          name: category.display_name,
          icon: category.icon,
          color: category.color,
        };
      });
      setCategoryConfigs(configMap);
    } catch (_error) {
      console.log('Error loading category configs:', _error);
    }
  };

  const loadLogs = useCallback(async (date?: Date) => {
    try {
      setLoading(true);
      const targetDate = date || selectedDate;
      
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
  }, [selectedDate, showToast]);

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
    loadLogs(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    loadLogs(today);
  };

  const formatDateForDisplay = (date: Date) => {
    return formatDateInUserTimezone(date.toISOString(), {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleEditLog = (log: WorkoutLog) => {
    setEditingLog(log);
    setEditNotes(log.notes || '');
    setEditModalVisible(true);
  };

  const handleDeleteLog = async (logId: number) => {
    try {
      await fitnessService.deleteWorkout(logId);
      await loadLogs();
      showToast('Workout deleted successfully', 'success');
    } catch {
      showToast('Failed to delete workout', 'error');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingLog) return;

    try {
      // Update the log with new notes
      const updatedLog = { ...editingLog, notes: editNotes };
      
      // Update in the logs array
      setLogs(prevLogs => 
        prevLogs.map(log => 
          log.id === editingLog.id ? updatedLog : log
        )
      );

      setEditModalVisible(false);
      setEditingLog(null);
      setEditNotes('');
      showToast('Workout updated successfully', 'success');
    } catch {
      showToast('Failed to update workout', 'error');
    }
  };

  // Get category config from database or return "Category Not Found"
  const getCategoryConfig = (categoryId: string) => {
    // Simplified category config without store dependency
    const categoryConfigs: { [key: string]: { name: string; icon: string; color: string } } = {
      'bodyweight': { name: 'Bodyweight', icon: 'body-outline', color: '#3b82f6' },
      'weighted': { name: 'Weighted', icon: 'barbell-outline', color: '#f97316' },
      'cardio_duration': { name: 'Cardio', icon: 'heart-outline', color: '#ef4444' },
      'distance_based': { name: 'Distance', icon: 'walk-outline', color: '#10b981' },
      'hold_static': { name: 'Hold', icon: 'time-outline', color: '#8b5cf6' },
      'repetition_only': { name: 'Reps', icon: 'repeat-outline', color: '#f59e0b' },
      'unknown': { name: 'Unknown', icon: 'help-outline', color: '#6b7280' },
    };
    
    return categoryConfigs[categoryId] || categoryConfigs['unknown'];
  };

  // Look up exercise category from database
  const getExerciseCategory = (exercise: { exercise_name?: string; name?: string; [key: string]: unknown }) => {
    const exerciseName = exercise.exercise_name || exercise.name || 'Exercise Not Found';
    // First check for common exercise mappings
    const commonExerciseMappings: { [key: string]: string } = {
      'run': 'distance_based',
      'running': 'distance_based',
      'jog': 'distance_based',
      'jogging': 'distance_based',
      'walk': 'distance_based',
      'walking': 'distance_based',
      'cycle': 'distance_based',
      'cycling': 'distance_based',
      'bike': 'distance_based',
      'biking': 'distance_based',
      'swim': 'distance_based',
      'swimming': 'distance_based',
      'pushup': 'bodyweight',
      'push-ups': 'bodyweight',
      'push ups': 'bodyweight',
      'situp': 'bodyweight',
      'sit-ups': 'bodyweight',
      'sit ups': 'bodyweight',
      'pullup': 'bodyweight',
      'pull-ups': 'bodyweight',
      'pull ups': 'bodyweight',
      'squat': 'bodyweight',
      'squats': 'bodyweight',
      'plank': 'hold_static',
      'yoga': 'cardio_duration',
      'meditation': 'cardio_duration',
    };
    
    const normalizedName = exerciseName.toLowerCase().trim();
    
    if (commonExerciseMappings[normalizedName]) {
      return commonExerciseMappings[normalizedName];
    }
    
    // First try to find by exercise_id if available
    let dbExercise = null;
    if (exercise.exercise_id) {
      dbExercise = exerciseDatabase.find(ex => ex.id === exercise.exercise_id);
    }
    
    // If not found by ID, try exact name match
    if (!dbExercise) {
      dbExercise = exerciseDatabase.find(ex => 
        ex.name && ex.name.toLowerCase() === exerciseName.toLowerCase()
      );
    }
    
    // If no exact match, try fuzzy matching
    if (!dbExercise) {
      const normalizedSearchName = exerciseName.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      dbExercise = exerciseDatabase.find(ex => {
        if (!ex.name) return false;
        
        const normalizedDbName = ex.name.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        return normalizedDbName.includes(normalizedSearchName) || 
               normalizedSearchName.includes(normalizedDbName);
      });
    }
    
    // Use logging_category first, then fallback to category
    const category = dbExercise?.logging_category || dbExercise?.category;
    
    // Check if category is valid
    const validCategories = ['bodyweight', 'weighted', 'cardio_duration', 'distance_based', 'hold_static', 'repetition_only'];
    if (category && validCategories.includes(category)) {
      return category;
    }
    
    // Default to 'weighted' for exercises that exist but don't have category info
    if (dbExercise) {
      return 'weighted';
    }
    
    return 'unknown';
  };

  // Create set of dates that have logs for calendar markers
  const getLogsWithDates = (): Set<string> => {
    const datesSet = new Set<string>();
    allLogs.forEach(log => {
      const dateField = log.activity_date || log.logged_at;
      if (dateField) {
        try {
          const logDateStr = getDateInUserTimezone(new Date(dateField));
          datesSet.add(logDateStr);
        } catch {
          // Ignore invalid dates
        }
      }
    });
    return datesSet;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading fitness logs...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefreshLogs}
          colors={['#6366f1']}
          tintColor="#6366f1"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Fitness Logs</Text>
        <Text style={styles.subtitle}>Your workout history</Text>
      </View>

      {/* Date Navigation */}
      <View style={styles.datePickerContainer}>
        <TouchableOpacity 
          style={styles.dateNavButton} 
          onPress={() => navigateDate('prev')}
        >
          <Ionicons name="chevron-back" size={20} color="#6b7280" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dateDisplayButton} 
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
          <Text style={styles.dateDisplayText}>{formatDateForDisplay(selectedDate)}</Text>
          <Ionicons name="chevron-down" size={16} color="#6b7280" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dateNavButton} 
          onPress={() => navigateDate('next')}
        >
          <Ionicons name="chevron-forward" size={20} color="#6b7280" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.todayButton, 
            isToday(selectedDate) && styles.todayButtonActive
          ]} 
          onPress={goToToday}
        >
          <Text style={[
            styles.todayButtonText,
            isToday(selectedDate) && styles.todayButtonTextActive
          ]}>Today</Text>
        </TouchableOpacity>
      </View>

      {logs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="fitness-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No Workouts Logged</Text>
          <Text style={styles.emptyDescription}>
            No workouts logged for {formatDateForDisplay(selectedDate)}
          </Text>
          <Text style={styles.emptySubDescription}>
            Try selecting a different date or log a new workout
          </Text>
        </View>
      ) : (
        <View style={styles.logsContainer}>
          {logs.map((log, index) => (
            <View key={log.id || index} style={styles.logEntry}>
              {/* Exercise Details */}
              {log.exercises && Array.isArray(log.exercises) && log.exercises.length > 0 && (
                <View style={styles.exercisesContainer}>
                  {log.exercises.map((exercise: { exercise_name?: string; name?: string; [key: string]: unknown }, exerciseIndex: number) => {
                    console.log('🔍 [FITNESS LOGS] Exercise for category lookup:', exercise);
                    const category = getExerciseCategory(exercise);
                    console.log('🔍 [FITNESS LOGS] Resolved category:', category);
                    const categoryConfig = getCategoryConfig(category);
                    console.log('🔍 [FITNESS LOGS] Category config:', categoryConfig);
                    
                    return (
                      <View key={exerciseIndex} style={styles.exerciseItem}>
                        <View style={styles.exerciseHeader}>
                          <View style={styles.exerciseNameContainer}>
                            <View style={styles.exerciseNameRow}>
                              <Text style={styles.logNumber}>#{index + 1}</Text>
                              <Text style={styles.exerciseName}>
                                {exercise.exercise_name || `Exercise ${exerciseIndex + 1}`}
                              </Text>
                            </View>
                            <Text style={styles.exerciseTime}>
                              {log.activity_date ? 
                                formatTimeInUserTimezone(log.activity_date, {
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  hour12: true
                                }) : 
                                'Unknown time'
                              }
                            </Text>
                          </View>
                          <View style={styles.exerciseHeaderRight}>
                            <CategoryBadge 
                              category={category} 
                              size="small"
                            />
                            <View style={styles.exerciseActions}>
                              <TouchableOpacity 
                                style={styles.actionButton}
                                onPress={() => handleEditLog(log)}
                              >
                                <Ionicons name="pencil" size={12} color="#6366f1" />
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={styles.actionButton}
                                onPress={() => handleDeleteLog(log.id)}
                              >
                                <Ionicons name="trash" size={12} color="#ef4444" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                        <View style={styles.exerciseStats}>
                          {exercise.sets && (
                            <Text style={styles.exerciseStat}>Sets: {exercise.sets}</Text>
                          )}
                          {exercise.reps && (
                            <Text style={styles.exerciseStat}>Reps: {exercise.reps}</Text>
                          )}
                          {exercise.weight_used && (
                            <Text style={styles.exerciseStat}>{exercise.weight_used}kg</Text>
                          )}
                          {exercise.duration_minutes && (
                            <Text style={styles.exerciseStat}>{exercise.duration_minutes}min</Text>
                          )}
                          {exercise.distance && (
                            <Text style={styles.exerciseStat}>{exercise.distance}km</Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
              
              
            </View>
          ))}
        </View>
      )}

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
              <Text style={styles.modalLabel}>Notes:</Text>
              <TextInput
                style={styles.notesInput}
                value={editNotes}
                onChangeText={setEditNotes}
                placeholder="Add workout notes..."
                multiline
                numberOfLines={4}
              />
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Calendar Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.datePickerModalBody}
              activeOpacity={1}
              onPress={() => setShowDatePicker(false)}
            >
              <TouchableOpacity 
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <CalendarComponent
                  selectedDate={selectedDate}
                  onDateSelect={(date) => {
                    setSelectedDate(date);
                    loadLogs(date);
                    setShowDatePicker(false);
                  }}
                  logsWithDates={getLogsWithDates()}
                  showLogsIndicator={true}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
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
  logsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logEntry: {
    marginBottom: 8,
  },
  logNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    minWidth: 24,
    textAlign: 'center',
  },
  // Date Navigation Styles
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fed7aa',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    padding: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fb923c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateNavButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDisplayButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  dateDisplayText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '500',
  },
  todayButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  todayButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  todayButtonTextActive: {
    color: '#ffffff',
  },
  actionButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Exercise Details Styles
  exercisesContainer: {
    marginBottom: 4,
  },
  exercisesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  exerciseItem: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  exerciseNameContainer: {
    flex: 1,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 10,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    lineHeight: 20,
  },
  exerciseTime: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  exerciseStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
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
  // Modal Styles
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
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  emptySubDescription: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
  // Exercise Category Badge Styles
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  exerciseHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: 2,
  },
  // Calendar Modal Styles
  datePickerModal: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 20,
    maxHeight: '50%',
  },
  datePickerModalBody: {
    padding: 20,
    alignItems: 'center',
  },
});
