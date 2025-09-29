import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { routineService } from '../../services/routineService';
import { fitnessService } from '../../services/fitnessService';
import DynamicExerciseForm from '../fitness/DynamicExerciseForm';

const EXERCISE_CATEGORIES = {
  bodyweight: {
    name: 'Bodyweight',
    icon: 'person-outline',
    color: '#3b82f6',
  },
  weighted: {
    name: 'Weighted',
    icon: 'barbell-outline', 
    color: '#ef4444',
  },
  cardio_duration: {
    name: 'Cardio & Duration',
    icon: 'heart-outline',
    color: '#22c55e', 
  },
  distance_based: {
    name: 'Distance-Based',
    icon: 'map-outline',
    color: '#8b5cf6',
  }
};

interface Exercise {
  id: number;
  exercise_name: string;
  logging_category: string;
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  notes?: string;
}

interface WorkoutData {
  routine_id: number;
  routine_name: string;
  day_name: string;
  workout_name: string;
  description?: string;
  exercises: Exercise[];
}

interface LogTodaysWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  onWorkoutLogged: () => void;
}

export default function LogTodaysWorkoutModal({
  visible,
  onClose,
  onWorkoutLogged,
}: LogTodaysWorkoutModalProps) {
  const [workoutData, setWorkoutData] = useState<WorkoutData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exerciseData, setExerciseData] = useState<{ [key: number]: any }>({});
  const [loggedExercises, setLoggedExercises] = useState<Set<number>>(new Set());
  const [skippedExercises, setSkippedExercises] = useState<Set<number>>(new Set());
  const weightInputRefs = useRef<{ [key: number]: TextInput | null }>({});

  useEffect(() => {
    if (visible) {
      loadTodaysWorkout();
    }
  }, [visible]);

  const loadTodaysWorkout = async () => {
    try {
      setLoading(true);
      const response = await routineService.getTodaysWorkout();
      
      // Handle the API response structure - data might be nested
      const data = response.data || response;
      
      setWorkoutData(data);
      
      // Get exercise names for fetching last instances
      const exerciseNames = data.exercises?.map((exercise: Exercise) => exercise.exercise_name) || [];
      
      // Fetch last instances of each exercise from user's workout logs
      let lastInstances = {};
      if (exerciseNames.length > 0) {
        try {
          lastInstances = await fitnessService.getLastExerciseInstances(exerciseNames);
        } catch (error) {
          console.error('Failed to fetch last exercise instances:', error);
          // Continue without last instances if this fails
        }
      }
      
      // Initialize exercise data with last logged values or defaults
      const initialData: { [key: number]: any } = {};
      if (data.exercises && Array.isArray(data.exercises)) {
        data.exercises.forEach((exercise: Exercise) => {
          const lastInstance = (lastInstances as any)[exercise.exercise_name];
          
          initialData[exercise.id] = {
            sets: lastInstance?.sets || '',
            reps: lastInstance?.reps || '',
            weight: lastInstance?.weight_used || '',
            duration: '',
            distance: '',
            notes: lastInstance?.notes || '',
          };
        });
      }
      setExerciseData(initialData);
    } catch (error) {
      console.error('Failed to load today\'s workout:', error);
      Alert.alert('Error', 'Failed to load today\'s workout. Please try again.');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseLog = (exerciseId: number) => {
    const newLogged = new Set(loggedExercises);
    const newSkipped = new Set(skippedExercises);
    
    if (loggedExercises.has(exerciseId)) {
      newLogged.delete(exerciseId);
    } else {
      newLogged.add(exerciseId);
      newSkipped.delete(exerciseId);
    }
    
    setLoggedExercises(newLogged);
    setSkippedExercises(newSkipped);
  };

  const handleExerciseSkip = (exerciseId: number) => {
    const newSkipped = new Set(skippedExercises);
    const newLogged = new Set(loggedExercises);
    
    if (skippedExercises.has(exerciseId)) {
      newSkipped.delete(exerciseId);
    } else {
      newSkipped.add(exerciseId);
      newLogged.delete(exerciseId);
    }
    
    setSkippedExercises(newSkipped);
    setLoggedExercises(newLogged);
  };

  const handleInputChange = (exerciseId: number, field: string, value: string) => {
    setExerciseData(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [field]: field === 'notes' ? value : value, // Keep as string for numeric fields too
      },
    }));
  };

  // Check if all required fields are filled
  const isFormValid = () => {
    if (!workoutData) return false;
    
    
    // Check that EVERY exercise is either completed or explicitly skipped
    for (const exercise of workoutData.exercises) {
      const isSkipped = skippedExercises.has(exercise.id);
      const loggedData = exerciseData[exercise.id] || {};
      const sets = parseInt(loggedData.sets) || 0;
      const reps = loggedData.reps || '';
      
      
      if (isSkipped) {
        // If skipped, that's OK regardless of input values
      } else {
        // If not skipped, must be completed (sets > 0 AND reps filled)
        if (sets > 0) {
          if (!reps || reps.trim() === '' || reps === '0') {
            return false;
          } else {
          }
        } else {
          // If not skipped and sets = 0, this is not allowed
          return false;
        }
      }
    }
    
    // Check if all exercises were skipped
    const allSkipped = workoutData.exercises.every(exercise => skippedExercises.has(exercise.id));
    if (allSkipped) {
      return false;
    }
    
    return true;
  };

  const handleSaveWorkout = async () => {
    if (!isFormValid()) {
      // Find exercises that need attention
      const incompleteExercises = [];
      const unhandledExercises = [];
      
      for (const exercise of workoutData!.exercises) {
        const isSkipped = skippedExercises.has(exercise.id);
        const loggedData = exerciseData[exercise.id] || {};
        const sets = parseInt(loggedData.sets) || 0;
        const reps = loggedData.reps || '';
        
        if (isSkipped) {
          // Skipped exercises are OK
          continue;
        } else if (sets > 0) {
          // Has sets but missing reps
          if (!reps || reps.trim() === '' || reps === '0') {
            incompleteExercises.push(exercise);
          }
        } else {
          // No sets and not skipped - needs to be handled
          unhandledExercises.push(exercise);
        }
      }

      // Check if all exercises were skipped
      const allSkipped = workoutData!.exercises.every(exercise => skippedExercises.has(exercise.id));
      if (allSkipped) {
        Alert.alert(
          'No Exercises Logged',
          'All exercises were skipped. Please complete at least one exercise to log your workout.',
          [{ text: 'OK' }]
        );
      } else if (incompleteExercises.length > 0) {
        const exerciseNames = incompleteExercises.map(ex => ex.exercise_name).join(', ');
        Alert.alert(
          'Incomplete Workout', 
          `Please fill in reps for: ${exerciseNames}`
        );
      } else if (unhandledExercises.length > 0) {
        const exerciseNames = unhandledExercises.map(ex => ex.exercise_name).join(', ');
        Alert.alert(
          'Incomplete Workout', 
          `Please either complete or skip these exercises: ${exerciseNames}`
        );
      } else {
        Alert.alert('Incomplete Workout', 'Please complete or skip all exercises.');
      }
      return;
    }

    try {
      setLoading(true);

      // Prepare exercise data for logging
      const exercises = workoutData!.exercises.map(exercise => {
        const loggedData = exerciseData[exercise.id] || {};
        return {
          exercise_name: exercise.exercise_name,
          sets: parseInt(loggedData.sets) || 0,
          reps: loggedData.reps || '',
          weight_used: parseFloat(loggedData.weight) || null,
          notes: loggedData.notes || ''
        };
      }).filter(ex => ex.sets > 0); // Only include exercises with sets logged

      // Check if all exercises were skipped
      if (exercises.length === 0) {
        Alert.alert(
          'No Exercises Logged',
          'All exercises were skipped. Please complete at least one exercise to log your workout.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      // Calculate total duration (estimate 2 minutes per exercise)
      const estimatedDuration = exercises.length * 2;

      // Create workout log data
      const logData = {
        activity_name: workoutData!.workout_name,
        activity_type: 'weightlifting',
        duration_minutes: estimatedDuration,
        calories_burned: Math.round(estimatedDuration * 8), // Rough estimate
        notes: `Completed ${exercises.length} exercises from ${workoutData!.routine_name}`,
        exercises: JSON.stringify(exercises), // Convert to JSON string
        unit: 'kg'
      };

      // Log the workout using fitness logs API
      await routineService.createWorkoutLog(logData);

      Alert.alert(
        'Workout Logged!',
        `Great job completing your ${workoutData!.workout_name}!`,
        [
          {
            text: 'OK',
            onPress: () => {
              onWorkoutLogged();
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to log workout:', error);
      Alert.alert('Error', 'Failed to log workout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipWorkout = async () => {
    try {
      setLoading(true);
      await routineService.skipTodaysWorkout(workoutData!.routine_id);
      
      Alert.alert(
        'Workout Skipped',
        'Your workout has been marked as skipped.',
        [
          {
            text: 'OK',
            onPress: () => {
              onWorkoutLogged();
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to skip workout:', error);
      Alert.alert('Error', 'Failed to skip workout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTotalLogged = () => loggedExercises.size;
  const getTotalExercises = () => workoutData?.exercises?.length || 0;

  if (!workoutData) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.loadingText}>Loading workout...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Log Today's Workout</Text>
              <Text style={styles.subtitle}>
                {workoutData.routine_name} - {workoutData.workout_name}
              </Text>
              {workoutData.exercises && workoutData.exercises.length > 0 && (
                <View style={styles.workoutCategories}>
                  {Array.from(new Set(workoutData.exercises.map(ex => ex.logging_category).filter(Boolean))).map((category, index) => (
                    <View key={index} style={styles.workoutCategoryBadge}>
                      <Text style={styles.workoutCategoryText}>{category}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>


          {/* Exercises List */}
          <ScrollView style={styles.exercisesContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Exercises ({getTotalExercises()})</Text>
            
            {workoutData.exercises?.map((exercise, index) => {
              const isLogged = loggedExercises.has(exercise.id);
              const isSkipped = skippedExercises.has(exercise.id);
              const currentExerciseData = exerciseData[exercise.id] || {};

              // Convert exercise data to DynamicExerciseForm format
              const exerciseForForm = {
                exercise_name: exercise.exercise_name,
                logging_category: exercise.logging_category,
                sets: currentExerciseData.sets || '',
                reps: currentExerciseData.reps || '',
                weight: currentExerciseData.weight || '',
                weight_used: currentExerciseData.weight || '',
                weight_unit: 'kg', // Default to kg (hidden in UI)
                duration: currentExerciseData.duration || '',
                distance: currentExerciseData.distance || '',
                distance_unit: 'km', // Default to km (hidden in UI)
                category: exercise.logging_category
              };

              return (
                <View key={exercise.id} style={[styles.exerciseCard, isLogged && styles.exerciseCardLogged]}>
                  {/* Exercise Header with Category */}
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseTitleRow}>
                      <Text style={styles.exerciseNumber}>#{index + 1}</Text>
                      <Text style={styles.exerciseName}>{exercise.exercise_name}</Text>
                      {exercise.logging_category && (() => {
                        const categoryConfig = EXERCISE_CATEGORIES[exercise.logging_category as keyof typeof EXERCISE_CATEGORIES] || {
                          name: exercise.logging_category,
                          icon: 'fitness-outline',
                          color: '#6b7280'
                        };
                        return (
                          <View style={[styles.categoryBadge, { backgroundColor: categoryConfig.color + '20' }]}>
                            <Ionicons 
                              name={categoryConfig.icon as any} 
                              size={14} 
                              color={categoryConfig.color} 
                            />
                            <Text style={[styles.categoryText, { color: categoryConfig.color }]}>
                              {categoryConfig.name}
                            </Text>
                          </View>
                        );
                      })()}
                      {isLogged && <Ionicons name="checkmark-circle" size={20} color="#10B981" />}
                    </View>
                    
                    <View style={styles.exerciseActions}>
                      <TouchableOpacity
                        style={styles.skipButton}
                        onPress={() => handleExerciseSkip(exercise.id)}
                      >
                        <View style={[styles.checkbox, isSkipped && styles.checkboxChecked]}>
                          {isSkipped && <Ionicons name="checkmark" size={12} color="#ffffff" />}
                        </View>
                        <Text style={styles.skipText}>Skip</Text>
                      </TouchableOpacity>
                      
                      {isLogged && (
                        <View style={styles.loggedBadge}>
                          <Text style={styles.loggedText}>Logged</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Dynamic Exercise Form */}
                  <DynamicExerciseForm
                    exercise={exerciseForForm}
                    index={exercise.id}
                    onUpdate={(exerciseId, field, value) => {
                      handleInputChange(exerciseId, field, value);
                    }}
                    onRemove={() => {}} // No remove functionality in this modal
                    activityType="weightlifting"
                    showRemove={false}
                  />
                </View>
              );
            })}
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
                  (loading || !isFormValid()) && styles.saveButtonDisabled
                ]}
                onPress={handleSaveWorkout}
                disabled={loading || !isFormValid()}
              >
                <Text style={[
                  styles.saveButtonText,
                  (loading || !isFormValid()) && styles.saveButtonTextDisabled
                ]}>
                  {loading ? 'Logging...' : 'Log Workout'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  modal: {
    backgroundColor: '#fed7aa', // More vibrant orange background for fitness
    borderRadius: 12,
    width: '95%',
    height: '80%', // Further reduced to 80%
    padding: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 8,
    paddingBottom: 6,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 1,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  workoutCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
    gap: 3,
  },
  workoutCategoryBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  workoutCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  closeButton: {
    padding: 4,
  },
  exercisesContainer: {
    flex: 1,
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  exerciseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#fed7aa', // Light orange border
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  exerciseCardLogged: {
    borderColor: '#10B981',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginRight: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#6B7280',
    borderRadius: 3,
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  skipText: {
    fontSize: 12,
    color: '#6b7280',
  },
  loggedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loggedText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  inputFields: {
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  inputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#1f2937',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  inputCompact: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: '#1f2937',
    fontSize: 14,
    textAlign: 'center',
    minWidth: 50,
    borderWidth: 1,
    borderColor: '#d1d5db',
    minHeight: 36,
  },
  footer: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  completionText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});
