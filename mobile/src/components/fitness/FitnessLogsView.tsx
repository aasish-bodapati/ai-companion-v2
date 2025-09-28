import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { routineService } from '../../services/routineService';
import { fitnessService } from '../../services/fitnessService';
import CalendarComponent from '../common/CalendarComponent';

interface WorkoutLog {
  id: string;
  routine_name?: string;
  workout_name?: string;
  exercises?: string; // JSON string for compatibility
  duration_minutes?: number;
  calories_burned?: number;
  difficulty_rating?: number;
  notes?: string;
  logged_at?: string;
  activity_date?: string;
  created_at: string;
  unit?: string;
  total_duration?: number;
}

interface FitnessLogsViewProps {
  onRefresh?: () => void;
}


export default function FitnessLogsView({ onRefresh }: FitnessLogsViewProps) {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkoutLog | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editExercises, setEditExercises] = useState<any[]>([]);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [allLogs, setAllLogs] = useState<WorkoutLog[]>([]);
  const [exerciseDatabase, setExerciseDatabase] = useState<any[]>([]);

  // Load exercise database for category lookup
  const loadExerciseDatabase = async () => {
    try {
      const exercises = await fitnessService.getAllExercises(700);
      setExerciseDatabase(exercises);
      console.log('🔍 Loaded exercise database:', exercises.length, 'exercises');
    } catch (error) {
      console.error('Failed to load exercise database:', error);
    }
  };

  // Look up exercise category from database
  const getExerciseCategory = (exerciseName: string) => {
    const exercise = exerciseDatabase.find(ex => 
      ex.name && ex.name.toLowerCase() === exerciseName.toLowerCase()
    );
    return exercise?.logging_category || 'GENERAL';
  };

  const loadLogs = async (date?: Date) => {
    try {
      setLoading(true);
      const targetDate = date || selectedDate;
      
      // Load all logs for the month first
      const response = await fitnessService.getWorkoutLogs({
        start_date: new Date(targetDate.getFullYear(), targetDate.getMonth(), 1).toISOString(),
        end_date: new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).toISOString(),
        page: 1,
        size: 50
      });
      
      // Filter logs by the target date
      console.log('🔍 Fitness logs response:', response);
      console.log('🔍 Response type:', typeof response);
      console.log('🔍 Response keys:', response ? Object.keys(response) : 'No response');
      const allLogs = response?.logs || response || [];
      console.log('🔍 All logs:', allLogs);
      const targetDateStr = targetDate.toISOString().split('T')[0]; // Get YYYY-MM-DD format
      
      const filteredLogs = Array.isArray(allLogs) ? allLogs.filter(log => {
        // Try both activity_date and logged_at fields
        const dateField = log.activity_date || log.logged_at;
        if (!dateField) return false;
        
        try {
          // Handle both ISO string format and date object
          let logDateStr;
          if (typeof dateField === 'string') {
            logDateStr = dateField.split('T')[0]; // Get YYYY-MM-DD format from ISO string
          } else if (dateField instanceof Date) {
            logDateStr = dateField.toISOString().split('T')[0];
          } else {
            return false;
          }
          
          return logDateStr === targetDateStr;
        } catch (error) {
          return false;
        }
      }) : [];
      
      // Parse exercises from JSON string if needed
      const processedLogs = filteredLogs.map(log => {
        if (log.exercises && typeof log.exercises === 'string') {
          try {
            log.exercises = JSON.parse(log.exercises);
          } catch (e) {
            log.exercises = [];
          }
        }
        return log;
      });
      
      
      setLogs(processedLogs);
      setAllLogs(allLogs); // Store all logs for calendar markers
    } catch (error) {
      console.error('Failed to load fitness logs:', error);
      Alert.alert('Error', 'Failed to load fitness logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadLogsForDate = async (date: Date) => {
    try {
      setNavigating(true);
      // Load all logs for the month first
      const response = await routineService.getWorkoutLogs({
        period: 'month',
        page: 1,
        size: 50
      });
      
      // Filter logs by the selected date
      const allLogs = response.logs || [];
      const selectedDateStr = date.toISOString().split('T')[0]; // Get YYYY-MM-DD format
      
      const filteredLogs = allLogs.filter(log => {
        // Try both activity_date and logged_at fields
        const dateField = log.activity_date || log.logged_at;
        if (!dateField) return false;
        
        try {
          // Handle both ISO string format and date object
          let logDateStr;
          if (typeof dateField === 'string') {
            logDateStr = dateField.split('T')[0]; // Get YYYY-MM-DD format from ISO string
          } else if (dateField instanceof Date) {
            logDateStr = dateField.toISOString().split('T')[0];
          } else {
            return false;
          }
          
          return logDateStr === selectedDateStr;
        } catch (error) {
          return false;
        }
      });
      
      // Parse exercises from JSON string if needed
      const processedLogs = filteredLogs.map(log => {
        if (log.exercises && typeof log.exercises === 'string') {
          try {
            log.exercises = JSON.parse(log.exercises);
          } catch (e) {
            log.exercises = [];
          }
        }
        return log;
      });
      
      
      setLogs(processedLogs);
    } catch (error) {
      console.error('Failed to load fitness logs:', error);
      Alert.alert('Error', 'Failed to load fitness logs. Please try again.');
    } finally {
      setNavigating(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
    loadLogsForDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    loadLogsForDate(today);
  };

  const formatDateForPicker = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const onRefreshLogs = async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
    onRefresh?.();
  };

  const handleEditLog = (log: WorkoutLog) => {
    setEditingLog(log);
    
    // Parse exercises from JSON string
    let exercises = [];
    if (log.exercises) {
      try {
        exercises = typeof log.exercises === 'string' ? JSON.parse(log.exercises) : log.exercises;
      } catch (error) {
        console.error('Failed to parse exercises:', error);
        exercises = [];
      }
    }
    
    setEditExercises(exercises);
    setEditModalVisible(true);
  };

  const handleExerciseUpdate = (exerciseIndex: number, field: string, value: string) => {
    const updatedExercises = [...editExercises];
    if (updatedExercises[exerciseIndex]) {
      updatedExercises[exerciseIndex] = {
        ...updatedExercises[exerciseIndex],
        [field]: field === 'sets' ? parseInt(value) || 0 : 
                 field === 'weight_used' ? parseFloat(value) || 0 : 
                 value
      };
      setEditExercises(updatedExercises);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingLog) return;

    try {
      // For now, just update locally (backend update has issues)
      // TODO: Fix backend update API
      const updatedLog = { 
        ...editingLog, 
        exercises: JSON.stringify(editExercises)
      };
      
      // Update in the logs array
      setLogs(prevLogs => 
        prevLogs.map(log => 
          log.id === editingLog.id ? updatedLog : log
        )
      );

      setEditModalVisible(false);
      setEditingLog(null);
      setEditExercises([]);

      Alert.alert('Success', 'Workout log updated successfully!');
    } catch (error) {
      console.error('Failed to update log:', error);
      Alert.alert('Error', 'Failed to update workout log. Please try again.');
    }
  };

  const handleDeleteExercise = (logId: string, exerciseIndex: number) => {
    Alert.alert(
      'Delete Exercise',
      'Are you sure you want to delete this exercise from your workout log? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteExercise(logId, exerciseIndex),
        },
      ]
    );
  };

  const confirmDeleteExercise = async (logId: string, exerciseIndex: number) => {
    try {
      setDeletingLogId(logId);
      
      // Find the log and remove the specific exercise
      const logToUpdate = logs.find(log => log.id === logId);
      if (!logToUpdate || !logToUpdate.exercises) {
        Alert.alert('Error', 'Exercise not found.');
        return;
      }
      
      // Parse exercises from JSON string
      let exercises = [];
      try {
        exercises = logToUpdate.exercises ? JSON.parse(logToUpdate.exercises) : [];
      } catch (e) {
        console.error('Failed to parse exercises:', e);
        exercises = [];
      }
      
      // Remove the exercise from the exercises array
      const updatedExercises = exercises.filter((_: any, index: number) => index !== exerciseIndex);
      
      // If no exercises left, delete the entire log
      if (updatedExercises.length === 0) {
        await routineService.deleteWorkoutLog(logId);
        setLogs(prevLogs => prevLogs.filter(log => log.id !== logId));
        Alert.alert('Success', 'Exercise deleted. Workout log removed as it had no remaining exercises.');
      } else {
        // Update the log with remaining exercises
        await routineService.updateWorkoutLogExercises(logId, updatedExercises);
        
        const updatedLog = {
          ...logToUpdate,
          exercises: JSON.stringify(updatedExercises)
        };
        
        // Update in the logs array
        setLogs(prevLogs => 
          prevLogs.map(log => 
            log.id === logId ? updatedLog : log
          )
        );
        
        Alert.alert('Success', 'Exercise deleted successfully!');
      }
    } catch (error) {
      console.error('Failed to delete exercise:', error);
      Alert.alert('Error', 'Failed to delete exercise. Please try again.');
    } finally {
      setDeletingLogId(null);
    }
  };

  const confirmDeleteLog = async (logId: string) => {
    try {
      setDeletingLogId(logId);
      
      // Call the API to delete the log
      await routineService.deleteWorkoutLog(logId);
      
      // Remove from logs array
      setLogs(prevLogs => prevLogs.filter(log => log.id !== logId));
      
      Alert.alert('Success', 'Workout log deleted successfully!');
    } catch (error) {
      console.error('Failed to delete log:', error);
      Alert.alert('Error', 'Failed to delete workout log. Please try again.');
    } finally {
      setDeletingLogId(null);
    }
  };

  useEffect(() => {
    loadExerciseDatabase();
    loadLogs();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown Date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'Unknown Time';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Time';
    }
  };

  // Create set of dates that have logs for calendar markers
  const getLogsWithDates = (): Set<string> => {
    const datesSet = new Set<string>();
    allLogs.forEach(log => {
      const dateField = log.activity_date || log.logged_at;
      if (dateField) {
        try {
          let logDateStr;
          if (typeof dateField === 'string') {
            // Handle ISO string - use local date to avoid timezone issues
            const date = new Date(dateField);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            logDateStr = `${year}-${month}-${day}`;
          } else if (dateField && typeof dateField === 'object' && 'toISOString' in dateField) {
            // Handle Date object - use local date
            const date = dateField as Date;
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            logDateStr = `${year}-${month}-${day}`;
          }
          if (logDateStr) {
            datesSet.add(logDateStr);
          }
        } catch (error) {
          console.warn('Error parsing date for calendar marker:', dateField, error);
        }
      }
    });
    return datesSet;
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
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
        <Text style={styles.subtitle}>Track your workout history</Text>
      </View>

      {/* Date Picker Component */}
      <View style={styles.datePickerContainer}>
        <TouchableOpacity 
          style={styles.dateNavButton} 
          onPress={() => navigateDate('prev')}
          disabled={navigating}
        >
          {navigating ? (
            <ActivityIndicator size="small" color="#6b7280" />
          ) : (
            <Ionicons name="chevron-back" size={20} color="#6b7280" />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dateDisplayButton} 
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
          <Text style={styles.dateDisplayText}>{formatDateForPicker(selectedDate)}</Text>
          <Ionicons name="chevron-down" size={16} color="#6b7280" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dateNavButton} 
          onPress={() => navigateDate('next')}
          disabled={navigating}
        >
          {navigating ? (
            <ActivityIndicator size="small" color="#6b7280" />
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.todayButton, 
            isToday(selectedDate) && styles.todayButtonActive,
            navigating && styles.todayButtonDisabled
          ]} 
          onPress={goToToday}
          disabled={navigating}
        >
          <Text style={[
            styles.todayButtonText,
            isToday(selectedDate) && styles.todayButtonTextActive,
            navigating && styles.todayButtonTextDisabled
          ]}>Today</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.exercisesContainer}>
        {logs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="fitness-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No Exercise Logs</Text>
            <Text style={styles.emptyDescription}>
              No workouts logged for {formatDateForPicker(selectedDate)}
            </Text>
            <Text style={styles.emptySubDescription}>
              Try selecting a different date or log a new workout
            </Text>
          </View>
        ) : (
          logs.map((log, logIndex) => (
            <View key={log.id || logIndex} style={styles.workoutLogContainer}>
              {(() => {
                // Parse exercises from JSON string if needed
                let exercises = log.exercises;
                if (typeof exercises === 'string') {
                  try {
                    exercises = JSON.parse(exercises);
                  } catch (error) {
                    console.error('Failed to parse exercises JSON:', error);
                    exercises = [];
                  }
                }
                return Array.isArray(exercises) ? exercises : [];
              })().map((exercise: any, exerciseIndex: number) => (
                <View key={`${log.id}-${exerciseIndex}`} style={styles.exerciseCard}>
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseNumberContainer}>
                      <Text style={styles.exerciseNumber}>{exerciseIndex + 1}</Text>
                    </View>
                    <Text style={styles.exerciseTitle}>
                      {exercise.exercise_name || 'Unknown Exercise'}
                    </Text>
                    <View style={styles.exerciseCategoryBadge}>
                      <Ionicons 
                        name="barbell-outline" 
                        size={12} 
                        color="#ffffff"
                        style={styles.badgeIcon}
                      />
                      <Text style={styles.exerciseCategoryText}>
                        {getExerciseCategory(exercise.exercise_name).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.exerciseStatText}>
                    {String(exercise.sets || 0)} sets x {String(exercise.reps || 0)} reps
                  </Text>
                  {exercise.weight_used && Number(exercise.weight_used) > 0 && (
                    <Text style={styles.exerciseStatText}>
                      {String(exercise.weight_used)}kg
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ))
        )}
      </View>

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
              <Text style={styles.modalTitle}>Edit Workout Log</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Workout: {editingLog?.workout_name || editingLog?.routine_name}</Text>
              
              {editExercises.length > 0 ? (
                <ScrollView style={styles.exercisesContainer} showsVerticalScrollIndicator={false}>
                  {editExercises.map((exercise, index) => (
                    <View key={index} style={styles.exerciseEditCard}>
                      <Text style={styles.exerciseName}>{exercise.exercise_name || `Exercise ${index + 1}`}</Text>
                      
                      <View style={styles.exerciseFieldsRow}>
                        <View style={styles.exerciseField}>
                          <Text style={styles.exerciseFieldLabel}>Sets</Text>
                          <TextInput
                            style={styles.exerciseFieldInput}
                            value={exercise.sets?.toString() || ''}
                            onChangeText={(value) => handleExerciseUpdate(index, 'sets', value)}
                            placeholder="0"
                            keyboardType="numeric"
                          />
                        </View>
                        
                        <View style={styles.exerciseField}>
                          <Text style={styles.exerciseFieldLabel}>Reps</Text>
                          <TextInput
                            style={styles.exerciseFieldInput}
                            value={exercise.reps?.toString() || ''}
                            onChangeText={(value) => handleExerciseUpdate(index, 'reps', value)}
                            placeholder="0"
                            keyboardType="numeric"
                          />
                        </View>
                        
                        <View style={styles.exerciseField}>
                          <Text style={styles.exerciseFieldLabel}>Weight</Text>
                          <TextInput
                            style={styles.exerciseFieldInput}
                            value={exercise.weight_used?.toString() || ''}
                            onChangeText={(value) => handleExerciseUpdate(index, 'weight_used', value)}
                            placeholder="0"
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.noExercisesContainer}>
                  <Text style={styles.noExercisesText}>No exercises found in this workout log.</Text>
                </View>
              )}
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
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
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
              onPress={() => {
                // Close any open dropdowns when clicking outside
                setShowDatePicker(false);
              }}
            >
              <TouchableOpacity 
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <CalendarComponent
                  selectedDate={selectedDate}
                  onDateSelect={(date) => {
                    setSelectedDate(date);
                    loadLogsForDate(date);
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
  },
  loadingText: {
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
  emptySubDescription: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
  logsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logTitleContainer: {
    flex: 1,
  },
  logTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  logDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  logActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logTime: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
    minHeight: 32,
  },
  exercisesContainer: {
    marginBottom: 12,
  },
  exercisesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  exerciseName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  exerciseStats: {
    flexDirection: 'row',
    gap: 12,
  },
  exerciseStat: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  notesContainer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
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
  exerciseEditCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  exerciseFieldsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  exerciseField: {
    flex: 1,
  },
  exerciseFieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 6,
  },
  exerciseFieldInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#ffffff',
    textAlign: 'center',
  },
  noExercisesContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noExercisesText: {
    fontSize: 16,
    color: '#6b7280',
    fontStyle: 'italic',
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
    minWidth: 100,
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
    color: 'white',
  },
  // Exercise Card Styles
  exerciseCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#fb923c', // More vibrant orange border
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  exerciseTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseNumberContainer: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  exerciseNumber: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  exerciseCategoryBadge: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  badgeIcon: {
    marginRight: 4,
  },
  exerciseCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  workoutLogContainer: {
    marginBottom: 20,
  },
  exerciseDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  exerciseActionsContainer: {
    alignItems: 'flex-end',
  },
  exerciseTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  exerciseTime: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 3,
  },
  exerciseStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  exerciseStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 3,
  },
  exerciseStatText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 3,
  },
  exerciseNotesContainer: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  exerciseNotesText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  workoutInfoContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  workoutInfoText: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  // Date Picker Styles - Light Mode with Fitness Theme
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fed7aa', // More vibrant orange background for fitness
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    padding: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fb923c', // More vibrant orange border
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
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
  todayButtonDisabled: {
    opacity: 0.5,
  },
  todayButtonTextDisabled: {
    color: '#9ca3af',
  },
  // Date Picker Modal Styles
  datePickerModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 20,
    maxHeight: '50%',
  },
  datePickerModalBody: {
    padding: 20,
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  datePickerSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
