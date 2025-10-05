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
import { exerciseCategoryService } from '../../services/exerciseCategoryService';
import { useToast } from '../../contexts/ToastContext';
import { createLoadingState } from '../../utils/duplicateCodeUtils';
import { isFeatureEnabled } from '../../config/featureFlags';

interface Exercise {
  id: string | number;
  name?: string;
  exercise_name?: string;
  category?: string;
  logging_category?: string;
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  difficulty?: string;
  day?: string;
  notes?: string;
}

interface WorkoutData {
  routine_id: string | number;
  routine_name: string;
  day_name: string;
  workout_name?: string;
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
  const { showToast } = useToast();
  const [workoutData, setWorkoutData] = useState<WorkoutData | null>(null);
  
  // Always call hooks, but conditionally use the result
  const newLoadingState = createLoadingState();
  const [loading, setLoading] = useState(false);
  
  // Use new loading state management if feature is enabled
  const loadingState = isFeatureEnabled('USE_NEW_LOADING_UTILS') 
    ? newLoadingState
    : { loading, setLoading, withLoading: async (fn: () => Promise<any>) => fn(), resetError: () => {} };
  const [exerciseData, setExerciseData] = useState<{ [key: string | number]: any }>({});
  const [loggedExercises, setLoggedExercises] = useState<Set<string | number>>(new Set());
  const [skippedExercises, setSkippedExercises] = useState<Set<string | number>>(new Set());
  const [exercisesLoggedToday, setExercisesLoggedToday] = useState<Set<string | number>>(new Set());
  const [categories, setCategories] = useState<any[]>([]);
  const weightInputRefs = useRef<{ [key: string | number]: TextInput | null }>({});

  useEffect(() => {
    if (visible) {
      loadTodaysWorkout();
      loadCategories();
    }
  }, [visible]);

  const loadCategories = async () => {
    try {
      const categoriesData = await exerciseCategoryService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
    }
  };

  // Function to get category display info (same as other components)
  const getCategoryInfo = (category: string) => {
    const categoryMap: { [key: string]: { name: string; color: string; icon: string } } = {
      'bodyweight': { name: 'Bodyweight', color: '#3b82f6', icon: 'person-outline' },
      'weighted': { name: 'Weighted', color: '#f59e0b', icon: 'barbell-outline' },
      'cardio_duration': { name: 'Cardio', color: '#ef4444', icon: 'heart-outline' },
      'distance_based': { name: 'Distance', color: '#10b981', icon: 'walk-outline' },
      'mixed': { name: 'Mixed', color: '#8b5cf6', icon: 'fitness-outline' }
    };
    
    return categoryMap[category] || { name: category, color: '#6b7280', icon: 'fitness-outline' };
  };


  const loadTodaysWorkout = async () => {
    try {
      setLoading(true);
      const response = await routineService.getTodaysWorkout();
      
      // Handle the case where no workout is scheduled for today
      if (!response) {
        console.log('ℹ️ No workout scheduled for today');
        setLoading(false); // Stop loading immediately
        setWorkoutData(null);
        // Don't show toast here - we'll show a proper UI instead
        return;
      }
      
      // Handle the API response structure - data might be nested
      const data = response.data || response;
      
      setWorkoutData(data);
      
      // Auto-populate exercise data with previous logged values and check if logged today
      const initialData: { [key: string | number]: any } = {};
      const loggedTodaySet = new Set<string | number>();
      
      if (data && data.exercises && Array.isArray(data.exercises)) {
        // Fetch latest data and check if logged today for each exercise in parallel
        const exercisePromises = data.exercises.map(async (exercise: Exercise) => {
          try {
            const exerciseName = exercise.name || exercise.exercise_name;
            console.log(`🔍 [LOG TODAY'S WORKOUT] Fetching latest data for: ${exerciseName}`);
            
            // Check both latest data and if logged today in parallel
            const [latestData, isLoggedToday] = await Promise.all([
              fitnessService.getLatestExerciseData(exerciseName),
              fitnessService.isExerciseLoggedToday(exerciseName)
            ]);
            
            if (isLoggedToday) {
              console.log(`✅ [LOG TODAY'S WORKOUT] Exercise ${exerciseName} was logged today`);
              loggedTodaySet.add(exercise.id);
            }
            
            if (latestData) {
              console.log(`✅ [LOG TODAY'S WORKOUT] Found previous data for ${exerciseName}:`, latestData);
              return {
                id: exercise.id,
                data: {
                  sets: latestData.sets?.toString() || '',
                  reps: latestData.reps?.toString() || '',
                  weight: (latestData.weight_kg || latestData.weight_used)?.toString() || '',
                  duration: latestData.duration_minutes?.toString() || '',
                  distance: latestData.distance?.toString() || '',
                  notes: latestData.notes || '',
                }
              };
            } else {
              console.log(`🔍 [LOG TODAY'S WORKOUT] No previous data for ${exerciseName}`);
              return {
                id: exercise.id,
                data: {
                  sets: '',
                  reps: '',
                  weight: '',
                  duration: '',
                  distance: '',
                  notes: '',
                }
              };
            }
          } catch (error) {
            // Silent error handling - no console logging to prevent Expo Go notifications
            return {
              id: exercise.id,
              data: {
                sets: '',
                reps: '',
                weight: '',
                duration: '',
                distance: '',
                notes: '',
              }
            };
          }
        });
        
        // Wait for all exercise data to be fetched
        const exerciseResults = await Promise.all(exercisePromises);
        
        // Convert results to the expected format
        exerciseResults.forEach(result => {
          initialData[result.id] = result.data;
        });
      }
      
      setExerciseData(initialData);
      setExercisesLoggedToday(loggedTodaySet);
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      
      // Handle different error types
      if (error.response?.status === 404) {
        const errorMessage = error.response?.data?.detail || 'No workout scheduled for today';
        Alert.alert(
          'No Workout Today', 
          errorMessage + '\n\nYou can still log a custom workout or check your routine schedule.',
          [
            { text: 'Cancel', style: 'cancel', onPress: onClose },
            { text: 'Log Custom Workout', onPress: () => {
              onClose();
              // You could navigate to a custom workout logging screen here
            }}
          ]
        );
      } else {
        showToast('Failed to load today\'s workout. Please try again.', 'error');
        onClose();
      }
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
    setExerciseData(prev => {
      const newData = {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          [field]: field === 'notes' ? value : value, // Keep as string for numeric fields too
        },
      };
      
      // Auto-mark exercise as logged if it has valid data
      const exerciseData = newData[exerciseId] || {};
      const exercise = workoutData?.exercises.find(ex => ex.id === exerciseId);
      
      if (exercise) {
        const isCompleted = checkExerciseCompletion(exercise, exerciseData);
        
        if (isCompleted) {
          // Exercise has valid data, mark as logged
          console.log(`✅ [AUTO LOG] Exercise ${exerciseId} (${exercise.logging_category}) has valid data - marking as logged`);
          setLoggedExercises(prev => new Set([...prev, exerciseId]));
          setSkippedExercises(prev => {
            const newSkipped = new Set(prev);
            newSkipped.delete(exerciseId);
            return newSkipped;
          });
        } else {
          // Exercise doesn't have valid data, unmark as logged
          console.log(`❌ [AUTO LOG] Exercise ${exerciseId} (${exercise.logging_category}) doesn't have valid data - unmarking as logged`);
          setLoggedExercises(prev => {
            const newLogged = new Set(prev);
            newLogged.delete(exerciseId);
            return newLogged;
          });
        }
      }
      
      return newData;
    });
  };

  // Check if all required fields are filled
  const isFormValid = () => {
    if (!workoutData) return false;
    
    console.log('🔍 [FORM VALIDATION] Checking form validity...');
    console.log('🔍 [FORM VALIDATION] Skipped exercises:', Array.from(skippedExercises));
    console.log('🔍 [FORM VALIDATION] Exercise data:', exerciseData);
    
    // Check that EVERY exercise is either completed or explicitly skipped
    for (const exercise of workoutData.exercises) {
      const isSkipped = skippedExercises.has(exercise.id);
      const loggedData = exerciseData[exercise.id] || {};
      
      const exerciseName = exercise.exercise_name || exercise.name || 'Unknown';
      console.log(`🔍 [FORM VALIDATION] Exercise ${exerciseName} (${exercise.logging_category}):`, {
        isSkipped,
        loggedData
      });
      
      if (isSkipped) {
        // If skipped, that's OK regardless of input values
        console.log(`✅ [FORM VALIDATION] Exercise ${exerciseName} is skipped - OK`);
      } else {
        // Check completion based on exercise type
        const isCompleted = checkExerciseCompletion(exercise, loggedData);
        
        if (!isCompleted) {
          console.log(`❌ [FORM VALIDATION] Exercise ${exerciseName} is not completed - INVALID`);
          return false;
        } else {
          console.log(`✅ [FORM VALIDATION] Exercise ${exerciseName} is completed - OK`);
        }
      }
    }
    
    // Check if all exercises were skipped
    const allSkipped = workoutData.exercises.every(exercise => skippedExercises.has(exercise.id));
    if (allSkipped) {
      console.log('❌ [FORM VALIDATION] All exercises were skipped - INVALID');
      return false;
    }
    
    console.log('✅ [FORM VALIDATION] Form is valid!');
    return true;
  };

  // Check if an exercise is completed based on its type
  const checkExerciseCompletion = (exercise: Exercise, loggedData: any) => {
    const category = exercise.logging_category;
    const exerciseName = exercise.exercise_name || exercise.name || 'Unknown';
    
    console.log(`🔍 [EXERCISE COMPLETION] Checking ${exerciseName} (${category}):`, loggedData);
    
    switch (category) {
      case 'weighted':
      case 'bodyweight':
        // Weight/bodyweight exercises need sets and reps
        const sets = parseInt(loggedData.sets) || 0;
        const reps = loggedData.reps || '';
        const isCompleted = sets > 0 && reps && reps.trim() !== '' && reps !== '0';
        console.log(`🔍 [EXERCISE COMPLETION] ${exerciseName} - sets: ${sets}, reps: "${reps}", completed: ${isCompleted}`);
        return isCompleted;
        
      case 'distance_based':
        // Distance-based exercises need distance
        const distance = parseFloat(loggedData.distance) || 0;
        const isDistanceCompleted = distance > 0;
        console.log(`🔍 [EXERCISE COMPLETION] ${exerciseName} - distance: ${distance}, completed: ${isDistanceCompleted}`);
        return isDistanceCompleted;
        
      case 'cardio_duration':
        // Duration-based exercises need duration
        const duration = parseFloat(loggedData.duration) || 0;
        const isDurationCompleted = duration > 0;
        console.log(`🔍 [EXERCISE COMPLETION] ${exerciseName} - duration: ${duration}, completed: ${isDurationCompleted}`);
        return isDurationCompleted;
        
      default:
        // For unknown types, check if any field has a value
        const hasAnyValue = Object.values(loggedData).some(value => 
          value && value.toString().trim() !== '' && value !== '0'
        );
        console.log(`🔍 [EXERCISE COMPLETION] ${exerciseName} - hasAnyValue: ${hasAnyValue}`);
        return hasAnyValue;
    }
  };

  const handleSaveWorkout = async () => {
    if (loading) {
      console.log('🚫 [LOG TODAYS WORKOUT MODAL] Save already in progress, ignoring duplicate request');
      return;
    }

    if (!isFormValid()) {
      // Find exercises that need attention using the new validation logic
      const incompleteExercises = [];
      const unhandledExercises = [];
      
      for (const exercise of workoutData!.exercises) {
        const isSkipped = skippedExercises.has(exercise.id);
        const loggedData = exerciseData[exercise.id] || {};
        
        if (isSkipped) {
          // Skipped exercises are OK
          continue;
        } else {
          // Check if exercise is completed using the new logic
          const isCompleted = checkExerciseCompletion(exercise, loggedData);
          if (!isCompleted) {
            incompleteExercises.push(exercise);
          }
        }
      }

      // Check if all exercises were skipped
      const allSkipped = workoutData!.exercises.every(exercise => skippedExercises.has(exercise.id));
      if (allSkipped) {
        showToast('All exercises were skipped. Please complete at least one exercise to log your workout.', 'warning');
      } else if (incompleteExercises.length > 0) {
        const exerciseNames = incompleteExercises.map(ex => ex.exercise_name).join(', ');
        showToast(`Please complete these exercises: ${exerciseNames}`, 'warning');
      } else {
        showToast('Please complete or skip all exercises.', 'warning');
      }
      return;
    }

    try {
      setLoading(true);

      // Prepare exercise data for logging - only include completed exercises
      console.log('🔍 [SAVE WORKOUT] Starting to prepare exercise data...');
      console.log('🔍 [SAVE WORKOUT] Workout data exercises:', workoutData!.exercises);
      
      // Debug: Log each exercise structure
      workoutData!.exercises.forEach((exercise, index) => {
        console.log(`🔍 [SAVE WORKOUT] Exercise ${index + 1} structure:`, {
          id: exercise.id,
          name: exercise.name,
          exercise_name: exercise.exercise_name,
          category: exercise.category,
          logging_category: exercise.logging_category,
          allKeys: Object.keys(exercise)
        });
      });
      
      const exercises = workoutData!.exercises
        .filter(exercise => {
          const isSkipped = skippedExercises.has(exercise.id);
          const loggedData = exerciseData[exercise.id] || {};
          const isCompleted = checkExerciseCompletion(exercise, loggedData);
          console.log(`🔍 [SAVE WORKOUT] Exercise ${exercise.exercise_name || exercise.name} - skipped: ${isSkipped}, completed: ${isCompleted}`);
          return !isSkipped && isCompleted;
        })
        .map(exercise => {
          const loggedData = exerciseData[exercise.id] || {};
          const exerciseName = exercise.exercise_name || exercise.name || 'Unknown';
          console.log(`🔍 [SAVE WORKOUT] Mapping exercise: ${exerciseName}`, loggedData);
          return {
            exercise_name: exerciseName,
            exercise_id: exercise.id, // Add exercise ID for reference
            sets: parseInt(loggedData.sets) || 0,
            reps: loggedData.reps || '',
            weight_used: parseFloat(loggedData.weight) || null,
            duration_minutes: parseFloat(loggedData.duration) || null,
            distance: parseFloat(loggedData.distance) || null,
            notes: loggedData.notes || ''
          };
        });
      
      console.log('🔍 [SAVE WORKOUT] Filtered exercises for logging:', exercises);

      // Check if all exercises were skipped
      if (exercises.length === 0) {
        showToast('All exercises were skipped. Please complete at least one exercise to log your workout.', 'warning');
        setLoading(false);
        return;
      }

      // Calculate total duration (estimate 2 minutes per exercise)
      const estimatedDuration = exercises.length * 2;

      // Create separate log entries for each exercise
      console.log('🔍 [WORKOUT LOG] Creating separate log entries for each exercise');
      
      const logPromises = exercises.map(async (exercise, index) => {
        const logData = {
          activity_name: exercise.exercise_name,
          activity_type: 'weightlifting',
          duration_minutes: exercise.duration_minutes || 2, // Use exercise duration or default 2 minutes
          calories_burned: Math.round((exercise.duration_minutes || 2) * 8), // Rough estimate
          notes: `From ${workoutData!.routine_name} - ${workoutData!.workout_name}`,
          exercises: JSON.stringify([exercise]), // Single exercise as array
          unit: 'kg',
          // Add exercise-specific data
          sets: exercise.sets,
          reps: exercise.reps,
          weight_used: exercise.weight_used,
          distance: exercise.distance
        };

        console.log(`🔍 [WORKOUT LOG] Creating log for exercise ${index + 1}:`, logData);
        return routineService.createWorkoutLog(logData);
      });

      // Wait for all logs to be created
      const results = await Promise.all(logPromises);
      console.log('✅ [WORKOUT LOG] Workout logged successfully:', results);

      // Update the exercisesLoggedToday state to reflect the newly logged exercises
      const newlyLoggedIds = new Set(exercises.map(exercise => 
        workoutData!.exercises.find(ex => ex.exercise_name === exercise.exercise_name)?.id
      ).filter(id => id !== undefined));
      
      setExercisesLoggedToday(prev => new Set([...prev, ...newlyLoggedIds]));

      showToast(`Great job! ${exercises.length} exercises from ${workoutData!.workout_name} have been logged individually.`, 'success');
      onWorkoutLogged();
      onClose();
    } catch (error) {
      console.error('❌ [SAVE WORKOUT] Error saving workout:', error);
      showToast('Failed to log workout. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipWorkout = async () => {
    try {
      setLoading(true);
      await routineService.skipTodaysWorkout(workoutData!.routine_id);
      
      showToast('Your workout has been marked as skipped.', 'info');
      onWorkoutLogged();
      onClose();
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      showToast('Failed to skip workout. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getTotalLogged = () => loggedExercises.size;
  const getTotalExercises = () => workoutData?.exercises?.length || 0;

  if (!workoutData) {
    // Show a proper message when no workout is scheduled
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.title}>Log Today's Workout</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* No Workout Message */}
            <View style={styles.noWorkoutContainer}>
              <Ionicons name="fitness-outline" size={64} color="#9ca3af" />
              <Text style={styles.noWorkoutTitle}>No Workout Scheduled</Text>
              <Text style={styles.noWorkoutMessage}>
                You don't have an active routine set. Please select a routine from the Fitness tab to start logging your workouts.
              </Text>
              <TouchableOpacity 
                style={styles.goToRoutinesButton}
                onPress={() => {
                  onClose();
                  // Navigate to routines tab - this would need to be passed as a prop
                }}
              >
                <Text style={styles.goToRoutinesButtonText}>Go to Routines</Text>
              </TouchableOpacity>
            </View>
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
                  {Array.from(new Set(workoutData.exercises.map(ex => ex.category || ex.logging_category).filter(Boolean))).map((category, index) => {
                    const categoryInfo = getCategoryInfo(category);
                    return (
                      <View key={index} style={[styles.workoutCategoryBadge, { backgroundColor: categoryInfo.color + '20', borderColor: categoryInfo.color }]}>
                        <Ionicons name={categoryInfo.icon as any} size={12} color={categoryInfo.color} />
                        <Text style={[styles.workoutCategoryText, { color: categoryInfo.color }]}>{categoryInfo.name}</Text>
                      </View>
                    );
                  })}
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
              const isLogged = exercisesLoggedToday.has(exercise.id);
              const isSkipped = skippedExercises.has(exercise.id);
              const currentExerciseData = exerciseData[exercise.id] || {};

              // Convert exercise data to DynamicExerciseForm format
              // Pre-populate with latest logged data if available
              const exerciseForForm = {
                exercise_name: exercise.name || exercise.exercise_name,
                logging_category: exercise.category || exercise.logging_category,
                sets: currentExerciseData.sets || '', // Pre-populate with latest data
                reps: currentExerciseData.reps || '', // Pre-populate with latest data
                weight: currentExerciseData.weight || '', // Pre-populate with latest data
                weight_used: currentExerciseData.weight || '', // Pre-populate with latest data
                weight_unit: 'kg', // Default to kg (hidden in UI)
                duration: currentExerciseData.duration || exercise.duration || '', // Pre-populate with latest data
                distance: currentExerciseData.distance || exercise.distance || '', // Pre-populate with latest data
                distance_unit: 'km', // Default to km (hidden in UI)
                category: exercise.category || exercise.logging_category
              };
              
              // Debug logging for auto-population
              console.log(`🔍 [LOG TODAY'S WORKOUT] Exercise: ${exercise.name || exercise.exercise_name}`);
              console.log(`🔍 [LOG TODAY'S WORKOUT] Current data:`, currentExerciseData);
              console.log(`🔍 [LOG TODAY'S WORKOUT] Form data:`, exerciseForForm);

              return (
                <View key={exercise.id} style={[styles.exerciseCard, isLogged && styles.exerciseCardLogged]}>
                  {/* Exercise Header with Category */}
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseTitleRow}>
                      <Text style={styles.exerciseNumber}>#{index + 1}</Text>
                      <Text style={styles.exerciseName}>{exercise.name || exercise.exercise_name}</Text>
                      {(exercise.category || exercise.logging_category) && (() => {
                        const categoryInfo = getCategoryInfo(exercise.category || exercise.logging_category);
                        
                        return (
                          <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color + '20', borderColor: categoryInfo.color }]}>
                            <Ionicons 
                              name={categoryInfo.icon as any} 
                              size={12} 
                              color={categoryInfo.color} 
                            />
                            <Text style={[styles.categoryText, { color: categoryInfo.color }]}>
                              {categoryInfo.name}
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
    backgroundColor: '#ffffff', // Clean white background to match rest of app
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  workoutCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    borderColor: '#E5E7EB', // Light gray border to match white theme
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  noWorkoutContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noWorkoutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noWorkoutMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  goToRoutinesButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  goToRoutinesButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  guidanceContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  guidanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  guidanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  guidanceItem: {
    width: '48%',
    marginBottom: 6,
  },
  guidanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 2,
  },
  guidanceText: {
    fontSize: 11,
    color: '#374151',
  },
});
