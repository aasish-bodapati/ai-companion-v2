import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SimpleLoggingItem from '../ui/SimpleLoggingItem';
import { fitnessService, ExerciseType } from '../../services/fitnessService';
import { hapticFeedback } from '../../utils/haptics';
import { COLORS } from '../../theme/constants';
import { useToast } from '../../contexts/ToastContext';
import { CategoryBadge } from '../ui/Badge';

interface WorkoutExercise {
  exercise_name?: string;
  name?: string;
  sets?: number;
  reps?: string;
  weight_kg?: number;
  duration_minutes?: number;
  rest_time?: string;
  notes?: string;
}

interface TodaysWorkout {
  exercises?: WorkoutExercise[];
}

interface WorkoutLoggingModalProps {
  visible: boolean;
  onClose: () => void;
  onWorkoutLogged: () => void;
  todaysWorkout?: TodaysWorkout; // Today's workout from routine
}

export default function WorkoutLoggingModal({
  visible,
  onClose,
  onWorkoutLogged,
  todaysWorkout,
}: WorkoutLoggingModalProps) {
  const [exercises, setExercises] = useState<LoggingItemData[]>([]);
  const exercisesRef = useRef<LoggingItemData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ExerciseType[]>([]);
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setExercises([]);
      setSearchQuery('');
      setSearchResults([]);
      if (todaysWorkout) {
        // Pre-populate with today's workout exercises if available
        if (todaysWorkout.exercises) {
          const workoutExercises = todaysWorkout.exercises.map((exercise: WorkoutExercise, index: number) => {
            return {
            id: `workout-${index}`,
            name: exercise.exercise_name || exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            weight_kg: exercise.weight_kg,
            duration_minutes: exercise.duration_minutes,
            rest_time: exercise.rest_time,
            notes: exercise.notes,
          };
          });
          setExercises(workoutExercises);
        }
      }
    }
  }, [visible, todaysWorkout]);

  // Update ref when exercises changes
  useEffect(() => {
    exercisesRef.current = exercises;
  }, [exercises]);

  const searchExercises = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await fitnessService.searchExercises(query);
      setSearchResults(results);
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
      setSearchResults([]);
    }
  }, []);

  const handleSelectExercise = useCallback(async (exercise: ExerciseType) => {
    // Debug logging for selected exercise
    console.log('🔍 WorkoutLoggingModal - Selected exercise:', {
      name: exercise.name,
      category: exercise.category,
      muscle_group: exercise.muscle_group
    });
    
    // Clear search and close dropdown
    setSearchQuery('');
    setSearchResults([]);
    
    // Check if exercise already exists
    const existingItem = exercisesRef.current.find(item => item.name === exercise.name);
    
    if (existingItem) {
      // Update sets if exercise already exists
      setExercises(prevExercises => 
        prevExercises.map(item =>
          item.name === exercise.name
            ? { ...item, sets: (item.sets || 0) + 1 }
            : item
        )
      );
    } else {
      // Fetch latest workout data for this exercise first
      let latestWorkout = null;
      try {
        console.log('🔍 Fetching latest workout data for exercise:', exercise.name);
        latestWorkout = await fitnessService.getLatestExerciseData(exercise.name);
        console.log('🔍 Raw API response for', exercise.name, ':', latestWorkout);
      } catch {
        // Silent error handling - no console logging to prevent Expo Go notifications
      }
      
      // Add new exercise with latest data if available
      const newItem: LoggingItemData = {
        id: `exercise-${Date.now()}`,
        name: exercise.name,
        sets: latestWorkout?.sets || undefined,
        reps: latestWorkout?.reps || '',
        weight_kg: (latestWorkout?.weight_kg || latestWorkout?.weight_used) || undefined,
        duration_minutes: latestWorkout?.duration_minutes || undefined,
        distance: latestWorkout?.distance || undefined,
        rest_time: latestWorkout?.rest_time || '',
        notes: latestWorkout?.notes || '',
        category: exercise.category,
        muscle_group: exercise.muscle_group,
        equipment: exercise.equipment,
        instructions: exercise.instructions,
        difficulty: exercise.difficulty,
      };
      
      console.log('🔍 WorkoutLoggingModal - Created new exercise item with latest data:', newItem);
      
      // Add the new exercise
      setExercises(prevExercises => [...prevExercises, newItem]);
      
      // Mark this item as newly added
      setNewlyAddedIds(prev => new Set([...prev, newItem.id]));
      
      // Show haptic feedback if data was populated
      if (latestWorkout) {
        hapticFeedback.light();
      }
    }
    
    hapticFeedback.selection();
  }, []);

  const handleRemoveItem = useCallback((id: number | string) => {
    setExercises(prevExercises => prevExercises.filter(item => item.id !== id));
    hapticFeedback.light();
  }, []);

  const handleUpdateItem = useCallback((id: number | string, updates: Partial<LoggingItemData>) => {
    setExercises(prevExercises => prevExercises.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const handleUpdateItemWithCleanup = useCallback((id: number | string, updates: Partial<LoggingItemData>) => {
    handleUpdateItem(id, updates);
    setNewlyAddedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, [handleUpdateItem]);

  const isFormValid = () => {
    if (exercises.length === 0) return false;
    
    // Validate each exercise based on its category
    return exercises.every(exercise => {
      const category = exercise.category;
      
      switch (category) {
        case 'weighted':
        case 'bodyweight':
          // Need sets and reps
          const sets = parseInt(exercise.sets?.toString() || '0') || 0;
          const reps = exercise.reps?.toString() || '';
          return sets > 0 && reps && reps.trim() !== '' && reps !== '0';
          
        case 'distance_based':
          // Need distance
          const distance = parseFloat(exercise.distance?.toString() || '0') || 0;
          return distance > 0;
          
        case 'cardio_duration':
          // Need duration
          const duration = parseFloat(exercise.duration_minutes?.toString() || '0') || 0;
          return duration > 0;
          
        default:
          // For unknown types, check if any field has a value
          const hasAnyValue = Object.values(exercise).some(value => 
            value && value.toString().trim() !== '' && value !== '0'
          );
          return hasAnyValue;
      }
    });
  };

  const getFormData = () => {
    const totalDuration = exercises.reduce((sum, item) => sum + (item.duration_minutes || 0), 0);
    const totalSets = exercises.reduce((sum, item) => sum + (item.sets || 0), 0);

    return {
      activity_type: 'strength_training', // Default to strength training
      activity_name: todaysWorkout?.workout_name || 'Strength Training Workout',
      duration_minutes: totalDuration || 30, // Default 30 minutes if no duration specified
      exercises: JSON.stringify(exercises.map(item => ({
        exercise_name: item.name,
        sets: item.sets,
        reps: item.reps,
        weight_kg: item.weight_kg,
        weight_used: item.weight_used,
        duration_minutes: item.duration_minutes,
        distance: item.distance,
        rest_time: item.rest_time,
        notes: item.notes,
      }))),
      notes: `Workout with ${exercises.length} exercises, ${totalSets} total sets`,
      activity_date: new Date().toISOString(), // Add current timestamp
    };
  };

  const handleSave = async (data: unknown) => {
    if (saving) {
      console.log('🚫 [WORKOUT MODAL] Save already in progress, ignoring duplicate request');
      return;
    }
    
    setSaving(true);
    try {
      // Parse exercises from the data
      let exercises = [];
      if (data.exercises) {
        try {
          exercises = typeof data.exercises === 'string' ? JSON.parse(data.exercises) : data.exercises;
        } catch {
          // Silent error handling - no console logging to prevent Expo Go notifications
          exercises = [];
        }
      }

      if (exercises.length === 0) {
        throw new Error('No exercises to log');
      }

      // Create separate log entries for each exercise
      console.log('🔍 [WORKOUT MODAL] Creating separate log entries for each exercise');
      
      const logPromises = exercises.map((exercise: LoggingItemData, index: number) => {
        const exerciseData = {
          activity_type: 'strength_training',
          activity_name: `${exercise.name} Workout`,
          duration_minutes: exercise.duration_minutes || 10, // Default 10 minutes per exercise
          exercises: JSON.stringify([exercise]), // Single exercise as array
          notes: exercise.notes || '',
          activity_date: (data as { activity_date?: string }).activity_date || new Date().toISOString(),
        };
        
        console.log(`🔍 [WORKOUT MODAL] Logging exercise ${index + 1}:`, exercise.name);
        return fitnessService.logWorkout(exerciseData);
      });

      // Wait for all exercises to be logged
      await Promise.all(logPromises);
      
      console.log('✅ [WORKOUT MODAL] All exercises logged successfully');
      onWorkoutLogged();
      onClose();
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
      throw new Error('Failed to save workout');
    } finally {
      setSaving(false);
    }
  };



  const { showToast } = useToast();


  const getTotalExercises = () => exercises.length;
  const getTotalLogged = () => exercises.filter(ex => isFormValid()).length;

  const handleSaveWorkout = async () => {
    if (saving) {
      return;
    }
    
    setSaving(true);
    try {
      const data = getFormData();
      await handleSave(data);
      showToast('Workout logged successfully!', 'success');
    } catch {
      showToast('Failed to log workout. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>
                {todaysWorkout ? "Log Today's Workout" : "Log Workout"}
              </Text>
              <Text style={styles.subtitle}>
                {todaysWorkout ? `${todaysWorkout.routine_name} - ${todaysWorkout.workout_name}` : "Track your fitness progress"}
              </Text>
              {exercises.length > 0 && (
                <View style={styles.workoutCategories}>
                  {Array.from(new Set(exercises.map(ex => ex.category).filter(Boolean))).map((category, index) => (
                    <CategoryBadge 
                      key={index} 
                      category={category} 
                      size="small" 
                      outline 
                    />
                  ))}
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Search Section */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for exercises..."
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  searchExercises(text);
                }}
                placeholderTextColor="#9ca3af"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <ScrollView style={styles.searchResults} showsVerticalScrollIndicator={false}>
                {searchResults.map((exercise, index) => (
                  <TouchableOpacity
                    key={exercise.id}
                    style={styles.searchResultItem}
                    onPress={() => handleSelectExercise(exercise)}
                  >
                    <View style={styles.searchResultContent}>
                      <Text style={styles.searchResultName}>{exercise.name}</Text>
                      <Text style={styles.searchResultCategory}>{exercise.category}</Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={24} color={COLORS.primary.main} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Exercises List */}
          <ScrollView style={styles.exercisesContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Exercises ({getTotalExercises()})</Text>
            
            {exercises.map((exercise, index) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseTitleRow}>
                    <Text style={styles.exerciseNumber}>#{index + 1}</Text>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    {exercise.category && (
                      <CategoryBadge 
                        category={exercise.category} 
                        size="small" 
                        outline 
                      />
                    )}
                  </View>
                </View>

                <SimpleLoggingItem
                  item={exercise}
                  onUpdate={handleUpdateItemWithCleanup}
                  onRemove={handleRemoveItem}
                />
              </View>
            ))}

            {exercises.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="fitness-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyStateTitle}>No exercises added yet</Text>
                <Text style={styles.emptyStateText}>Search and add exercises to start logging your workout</Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.completionText}>
              {getTotalLogged()} / {getTotalExercises()} exercises logged - workout will be completed
            </Text>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.saveButton, 
                  (saving || !isFormValid()) && styles.saveButtonDisabled
                ]}
                onPress={handleSaveWorkout}
                disabled={saving || !isFormValid()}
              >
                <Text style={[
                  styles.saveButtonText,
                  (saving || !isFormValid()) && styles.saveButtonTextDisabled
                ]}>
                  {saving ? 'Logging...' : 'Log Workout'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  workoutCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  searchResults: {
    maxHeight: 200,
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  searchResultCategory: {
    fontSize: 12,
    color: '#6b7280',
  },
  exercisesContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  exerciseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  exerciseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginRight: 8,
    minWidth: 20,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  completionText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    borderWidth: 1,
    borderColor: '#3b82f6',
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
    borderColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#ffffff',
  },
});
