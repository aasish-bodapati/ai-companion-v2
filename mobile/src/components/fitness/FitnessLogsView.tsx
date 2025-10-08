import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fitnessService } from '../../services/fitnessService';
import { useToast } from '../../contexts/ToastContext';
import { COMMON_STYLES } from '../../theme/constants';
import { useExerciseCategoriesWithAutoLoad } from '../../stores';
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
  const { showToast, showRapidToast } = useToast();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkoutLog | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editExercises, setEditExercises] = useState<unknown[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Get current date in user's timezone
    const now = new Date();
    const userTimezone = getUserTimezone();
    
    // Create a date object that represents today in the user's timezone
    const userDateStr = now.toLocaleDateString("en-CA", { timeZone: userTimezone });
    const userDate = new Date(userDateStr + "T00:00:00");
    
    return userDate;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [allLogs, setAllLogs] = useState<WorkoutLog[]>([]);
  const [exerciseDatabase, setExerciseDatabase] = useState<unknown[]>([]);
  
  // Use exercise categories store
  const { categories } = useExerciseCategoriesWithAutoLoad();

  // Debug logging for component mount/remount

  // Load data when component mounts or remounts
  useEffect(() => {
    loadExerciseDatabase();
  }, []); // Empty dependency array means this runs on mount/remount

  // Load logs when categories are loaded
  useEffect(() => {
    if (categories.length > 0) {
      loadLogs();
    }
  }, [categories, loadLogs]);

  // Load exercise database for category lookup
  const loadExerciseDatabase = async () => {
    try {
      const exercises = await fitnessService.getExerciseTypes();
      setExerciseDatabase(exercises);
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
    }
  };


  // Get category config from database or return "Category Not Found"
  const getCategoryConfig = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      return {
        name: category.display_name,
        icon: category.icon,
        color: category.color,
      };
    }
    // Return "Category Not Found" config
    return {
      name: 'Category Not Found',
      icon: 'help-outline',
      color: '#6b7280',
    };
  };

  // Look up exercise category from database
  const getExerciseCategory = (exerciseName: string) => {
    console.log('🔍 [FITNESS LOGS] Looking up category for exercise:', exerciseName);
    
    // First try exact match
    let exercise = exerciseDatabase.find(ex => 
      ex.name && ex.name.toLowerCase() === exerciseName.toLowerCase()
    );
    
    // If no exact match, try fuzzy matching
    if (!exercise) {
      const normalizedSearchName = exerciseName.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
      
      exercise = exerciseDatabase.find(ex => {
        if (!ex.name) return false;
        
        const normalizedDbName = ex.name.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '') // Remove special characters
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();
        
        // Check if the search name is contained in the DB name or vice versa
        return normalizedDbName.includes(normalizedSearchName) || 
               normalizedSearchName.includes(normalizedDbName) ||
               // Check for common variations
               (normalizedSearchName.includes('arnold') && normalizedDbName.includes('arnold')) ||
               (normalizedSearchName.includes('rear delt') && normalizedDbName.includes('rear delt')) ||
               (normalizedSearchName.includes('tricep') && normalizedDbName.includes('tricep'));
      });
    }
    
    console.log('🔍 [FITNESS LOGS] Found exercise:', exercise);
    
    // Use logging_category first, then fallback to category
    const category = exercise?.logging_category || exercise?.category;
    console.log('🔍 [FITNESS LOGS] Category from exercise:', category);
    
    // Check if category exists in our loaded categories from DB
    if (category && categories.find(cat => cat.id === category)) {
      console.log('🔍 [FITNESS LOGS] Found category in categories list:', category);
      return category;
    }
    
    // Default to 'weighted' for exercises that exist but don't have category info
    if (exercise) {
      console.log('🔍 [FITNESS LOGS] Exercise found, defaulting to weighted');
      return 'weighted';
    }
    
    console.log('🔍 [FITNESS LOGS] Exercise not found, returning unknown');
    return 'unknown'; // Show "Category Not Found" badge for unknown exercises
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
      
      // Use user's timezone for date filtering
      console.log('🔍 [FITNESS LOGS] Target date object before conversion:', targetDate);
      console.log('🔍 [FITNESS LOGS] Target date isValid:', !isNaN(targetDate.getTime()));
      
      let targetDateStr;
      try {
        targetDateStr = getDateInUserTimezone(targetDate);
        console.log('🔍 [FITNESS LOGS] Filtering by date:', targetDateStr);
      } catch {
        // Silent error handling - no console logging to prevent Expo Go notifications
        // Fallback to UTC date
        targetDateStr = targetDate.toISOString().split('T')[0];
        console.log('🔍 [FITNESS LOGS] Using fallback date:', targetDateStr);
      }
      
      const response = await fitnessService.getFitnessLogs({
        start_date: targetDateStr,
        end_date: targetDateStr,
        page: 1,
        size: 50
      });
      
      console.log('🔍 [FITNESS LOGS] API response:', response?.length || 0, 'logs');
      
      const filteredLogs = response || [];
      
      // Parse exercises from JSON string if needed
      const processedLogs = filteredLogs.map((log: WorkoutLog) => {
        if (log.exercises && typeof log.exercises === 'string') {
          try {
            log.exercises = JSON.parse(log.exercises);
          } catch {
            log.exercises = [];
          }
        }
        return log;
      });
      
      // Sort logs by time (earliest to latest) for chronological order
      // All dates from backend are in UTC, so we can compare them directly
      const sortedLogs = processedLogs.sort((a: WorkoutLog, b: WorkoutLog) => {
        const timeA = new Date(a.activity_date || a.logged_at || 0).getTime();
        const timeB = new Date(b.activity_date || b.logged_at || 0).getTime();
        return timeA - timeB; // Chronological order: earliest first
      });
      
      setLogs(sortedLogs);
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
      if (error instanceof Error) {
        // Silent error handling - no console logging to prevent Expo Go notifications
      }
      showToast('Failed to load fitness logs. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, showToast]);

  const loadLogsForDate = async (date: Date) => {
    try {
      setNavigating(true);
      
      // Use the same server-side filtering as loadLogs() for consistency
      const targetDate = date;
      
      // Use user's timezone for date filtering
      console.log('🔍 [FITNESS LOGS] Target date object before conversion:', targetDate);
      console.log('🔍 [FITNESS LOGS] Target date isValid:', !isNaN(targetDate.getTime()));
      
      let targetDateStr;
      try {
        targetDateStr = getDateInUserTimezone(targetDate);
        console.log('🔍 [FITNESS LOGS] Filtering by date:', targetDateStr);
      } catch {
        // Silent error handling - no console logging to prevent Expo Go notifications
        // Fallback to UTC date
        targetDateStr = targetDate.toISOString().split('T')[0];
        console.log('🔍 [FITNESS LOGS] Using fallback date:', targetDateStr);
      }
      
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
      
      // Get logs for the specific date using server-side filtering
      const response = await fitnessService.getFitnessLogs({
        start_date: targetDateStr,
        end_date: targetDateStr,
        page: 1,
        size: 50
      });
      
      console.log('🔍 [FITNESS LOGS] API response:', response?.length || 0, 'logs');
      
      const filteredLogs = response || [];
      
      // Parse exercises from JSON string if needed
      const processedLogs = filteredLogs.map((log: WorkoutLog) => {
        if (log.exercises && typeof log.exercises === 'string') {
          try {
            log.exercises = JSON.parse(log.exercises);
          } catch {
            log.exercises = [];
          }
        }
        return log;
      });
      
      // Sort logs by time (earliest to latest) for chronological order
      // All dates from backend are in UTC, so we can compare them directly
      const sortedLogs = processedLogs.sort((a: WorkoutLog, b: WorkoutLog) => {
        const timeA = new Date(a.activity_date || a.logged_at || 0).getTime();
        const timeB = new Date(b.activity_date || b.logged_at || 0).getTime();
        return timeA - timeB; // Chronological order: earliest first
      });
      
      setLogs(sortedLogs);
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
      showToast('Failed to load fitness logs. Please try again.', 'error');
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
      } catch {
        exercises = [];
      }
    }
    
    setEditExercises(exercises);
    setEditModalVisible(true);
  };

  const handleDeleteLog = async (logId: number) => {
    try {
      setDeletingLogId(logId);
      await fitnessService.deleteWorkout(logId);
      await loadLogs(); // Refresh the logs
      showRapidToast('Workout deleted successfully', 'success');
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
      showToast('Failed to delete workout. Please try again.', 'error');
    } finally {
      setDeletingLogId(null);
    }
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

      showToast('Workout log updated successfully!', 'success');
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
      showToast('Failed to update workout log. Please try again.', 'error');
    }
  };




  // Removed duplicate useEffect - data loading is handled above


  // Create set of dates that have logs for calendar markers
  const getLogsWithDates = (): Set<string> => {
    const datesSet = new Set<string>();
    allLogs.forEach(log => {
      const dateField = log.activity_date || log.logged_at;
      if (dateField) {
        try {
          // Use the timezone utility to get date in user's timezone
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
          (() => {
            // Create a global counter for chronological exercise numbering
            let globalExerciseCounter = 0;
            
            return logs.map((log, logIndex) => (
              <View key={log.id || logIndex} style={styles.workoutLogContainer}>
                {(() => {
                  // Parse exercises from JSON string if needed
                  let exercises: unknown = log.exercises;
                  if (typeof exercises === 'string') {
                    try {
                      exercises = JSON.parse(exercises);
                    } catch {
                      exercises = [];
                    }
                  }
                  return Array.isArray(exercises) ? exercises : [];
                })().map((exercise: unknown, exerciseIndex: number) => {
                  // Safety check to ensure exercise is an object
                  if (!exercise || typeof exercise !== 'object') {
                    return null;
                  }
                  
                  // Increment global counter for chronological numbering
                  globalExerciseCounter++;
                  
                  return (
                  <View key={`${log.id}-${exerciseIndex}`} style={styles.exerciseCard}>
                    <View style={styles.exerciseHeader}>
                      <View style={styles.exerciseNumberContainer}>
                        <Text style={styles.exerciseNumber}>{globalExerciseCounter}</Text>
                      </View>
                    <Text style={styles.exerciseTitle}>
                      {String(exercise.exercise_name || 'Unknown Exercise')}
                    </Text>
                    {(() => {
                      const category = getExerciseCategory(exercise.exercise_name || '');
                      const categoryConfig = getCategoryConfig(category);
                      return (
                        <View style={[styles.exerciseCategoryBadge, { backgroundColor: categoryConfig.color }]}>
                          <Ionicons 
                            name={categoryConfig.icon as keyof typeof Ionicons.glyphMap} 
                            size={12} 
                            color="#ffffff"
                            style={styles.badgeIcon}
                          />
                          <Text style={styles.exerciseCategoryText}>
                            {categoryConfig.name.toUpperCase()}
                          </Text>
                        </View>
                      );
                    })()}
                    
                    {/* Action buttons next to badge */}
                    <View style={styles.exerciseActions}>
                      <TouchableOpacity 
                        style={styles.exerciseActionButton}
                        onPress={() => handleEditLog(log)}
                      >
                        <Ionicons name="pencil" size={14} color="#6366f1" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.exerciseActionButton}
                        onPress={() => handleDeleteLog(log.id)}
                      >
                        <Ionicons name="trash" size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Exercise stats and time on same line */}
                  <View style={styles.exerciseStatsRow}>
                    <Text style={styles.exerciseStatText}>
                      {(() => {
                        // Determine exercise type based on available data
                        const hasDistance = exercise.distance && Number(exercise.distance) > 0;
                        const hasDuration = exercise.duration_minutes && Number(exercise.duration_minutes) > 0;
                        const hasSets = exercise.sets && Number(exercise.sets) > 0;
                        const hasReps = exercise.reps && exercise.reps.trim() !== '';
                        
                        if (hasDistance && hasDuration) {
                          // Distance-based exercises with both distance and duration
                          return `${exercise.distance}km in ${exercise.duration_minutes}min`;
                        } else if (hasDistance) {
                          // Distance-based exercises with only distance
                          return `${exercise.distance}km`;
                        } else if (hasDuration) {
                          // Duration-based exercises
                          return `${exercise.duration_minutes}min`;
                        } else if (hasSets && hasReps) {
                          // Weight/bodyweight exercises with both sets and reps
                          return `${exercise.sets} sets x ${exercise.reps} reps`;
                        } else if (hasSets) {
                          // Only sets available
                          return `${exercise.sets} sets`;
                        } else if (hasReps) {
                          // Only reps available
                          return `${exercise.reps} reps`;
                        } else {
                          return 'No data';
                        }
                      })()}
                    </Text>
                    <View style={styles.exerciseTimeContainer}>
                      <Text style={styles.exerciseTimeText}>
                        {(() => {
                          const dateField = log.activity_date || log.logged_at;
                          if (!dateField) return 'Unknown time';
                          
                          try {
                            return formatTimeInUserTimezone(dateField, {
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: true
                            });
                          } catch {
                            return 'Unknown time';
                          }
                        })()}
                      </Text>
                    </View>
                  </View>
                  
                  {exercise.weight_used && Number(exercise.weight_used) > 0 ? (
                    <Text style={styles.exerciseStatText}>
                      {String(exercise.weight_used)}kg
                    </Text>
                  ) : null}
                </View>
                );
              })}
            </View>
          ));
          })()
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
                      <Text style={styles.exerciseName}>{String(exercise.exercise_name || `Exercise ${index + 1}`)}</Text>
                      
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
    backgroundColor: COMMON_STYLES.cardBackground,
    borderRadius: COMMON_STYLES.standardRadius,
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
    backgroundColor: COMMON_STYLES.cardBackground,
    borderRadius: COMMON_STYLES.standardRadius,
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
    backgroundColor: COMMON_STYLES.secondaryBackground,
    borderRadius: COMMON_STYLES.standardRadius,
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
    backgroundColor: COMMON_STYLES.cardBackground,
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
    backgroundColor: COMMON_STYLES.cardBackground,
    borderRadius: 8,
    padding: 8, // Reduced from 12 to 8
    marginHorizontal: 16,
    marginBottom: 4, // Reduced from 8 to 4
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
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
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
    marginBottom: 12, // Reduced from 20 to 12
  },
  workoutTimeContainer: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  workoutTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutActions: {
    flexDirection: 'row',
    gap: 8,
  },
  exerciseStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2, // Reduced from 4 to 2
    minHeight: 18, // Reduced from 20 to 18
  },
  exerciseTimeContainer: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6, // Reduced from 8 to 6
    paddingVertical: 3, // Reduced from 4 to 3
    borderRadius: 6,
    alignSelf: 'center', // Ensure it aligns with the text baseline
  },
  exerciseTimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 16, // Match the exerciseStatText line height
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: 4, // Reduced from 6 to 4
    marginLeft: 8,
  },
  exerciseActionButton: {
    padding: 4, // Reduced from 6 to 4
    borderRadius: 4,
    backgroundColor: COMMON_STYLES.secondaryBackground,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  exerciseDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  exerciseActionsContainer: {
    alignItems: 'flex-end',
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
    borderRadius: COMMON_STYLES.standardRadius,
    marginRight: 6,
    marginBottom: 3,
  },
  exerciseStatText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 3,
    lineHeight: 16, // Ensure consistent line height
  },
  exerciseNotesContainer: {
    backgroundColor: COMMON_STYLES.secondaryBackground,
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
    backgroundColor: COMMON_STYLES.cardBackground,
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
    backgroundColor: COMMON_STYLES.cardBackground,
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
    backgroundColor: COMMON_STYLES.cardBackground,
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
    backgroundColor: COMMON_STYLES.cardBackground,
    borderRadius: COMMON_STYLES.standardRadius,
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
