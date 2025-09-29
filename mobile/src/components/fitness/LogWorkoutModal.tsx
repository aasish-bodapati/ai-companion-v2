import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { fitnessService, ExerciseData as FitnessServiceExerciseData } from '../../services/fitnessService';
import DynamicExerciseForm, { ExerciseData } from './DynamicExerciseForm';
import ExerciseDropdown from './ExerciseDropdown';
import CalendarComponent from '../common/CalendarComponent';
import DateSelector from '../ui/DateSelector';
import { hapticFeedback } from '../../utils/haptics';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../theme/constants';

interface WorkoutData {
  activity_type: string;
  duration_minutes: number;
  exercises: FitnessServiceExerciseData[];
  activity_date?: string;
}

interface LogWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  onWorkoutLogged: () => void;
  todaysWorkout?: any; // Today's workout from routine
}

export default function LogWorkoutModal({
  visible,
  onClose,
  onWorkoutLogged,
  todaysWorkout,
}: LogWorkoutModalProps) {
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [saving, setSaving] = useState(false);
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<{ [key: number]: string }>({});
  const [selectedExercises, setSelectedExercises] = useState<Set<number>>(new Set());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [exerciseDatabase, setExerciseDatabase] = useState<any[]>([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Load exercise database for category lookup
  const loadExerciseDatabase = async () => {
    try {
      const exercises = await fitnessService.getAllExercises(700);
      setExerciseDatabase(exercises);
      console.log('🔍 LogWorkoutModal - Loaded exercise database:', exercises.length, 'exercises');
    } catch (error) {
      console.error('Failed to load exercise database:', error);
    }
  };

  // Exercise categories with colors
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
      name: 'Cardio',
      icon: 'heart-outline',
      color: '#10b981',
    },
    distance_based: {
      name: 'Distance',
      icon: 'walk-outline',
      color: '#8b5cf6',
    },
    general: {
      name: 'General',
      icon: 'fitness-outline',
      color: '#6b7280',
    },
  };

  // Look up exercise category from database
  const getExerciseCategory = (exerciseName: string) => {
    const exercise = exerciseDatabase.find(ex => 
      ex.name && ex.name.toLowerCase() === exerciseName.toLowerCase()
    );
    return exercise?.logging_category || 'general';
  };

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
      // Scroll to show search area when keyboard opens
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 50, animated: true });
      }, 100);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      loadExerciseDatabase();
      if (todaysWorkout) {
        // Pre-populate with today's workout data
        setExercises(todaysWorkout.exercises || []);
        // Mark all pre-populated exercises as selected
        setSelectedExercises(new Set(todaysWorkout.exercises?.map((_: any, index: number) => index) || []));
      } else {
        // Start with empty exercises array
        setExercises([]);
        // Clear selected exercises
        setSelectedExercises(new Set());
      }
      // Clear other state when opening
      setSearchQuery({});
      setOpenDropdownIndex(null);
      setSelectedDate(new Date());
    } else {
      // Clear all state when modal closes
      setExercises([]);
      setSelectedExercises(new Set());
      setSearchQuery({});
      setOpenDropdownIndex(null);
      setSelectedDate(new Date());
    }
  }, [visible, todaysWorkout]);

  const addExercise = () => {
    hapticFeedback.light();
    const newExercise: ExerciseData = {
      exercise_name: '',
      sets: 1,
      reps: '10',
      weight_used: 0,
      weight_unit: 'kg', // Default to kg
      distance_unit: 'km', // Default to km
      category: 'weighted' // Default to weighted exercises
    };
    setExercises(prev => [...prev, newExercise]);
  };

  const addExerciseAfter = (index: number) => {
    hapticFeedback.light();
    const newExercise: ExerciseData = {
      exercise_name: '',
      sets: 0,
      reps: '',
      weight_used: 0,
      weight_unit: 'kg',
      distance_unit: 'km',
      category: 'weighted'
    };
    setExercises(prev => {
      const newExercises = [...prev];
      newExercises.splice(index + 1, 0, newExercise);
      return newExercises;
    });
  };

  const updateExercise = (index: number, field: keyof ExerciseData, value: any) => {
    setExercises(prev => prev.map((exercise, i) => 
      i === index ? { ...exercise, [field]: value } : exercise
    ));
  };

  const handleExerciseFieldFocus = (index: number) => {
    setOpenDropdownIndex(index);
    // Initialize search query if not exists
    if (!searchQuery[index]) {
      setSearchQuery(prev => ({ ...prev, [index]: '' }));
    }
  };

  const handleExerciseFieldChange = (index: number, value: string) => {
    // Only update search query, don't update exercise name until selected
    setSearchQuery(prev => ({ ...prev, [index]: value }));
    // Keep dropdown open when typing
    if (!openDropdownIndex || openDropdownIndex !== index) {
      setOpenDropdownIndex(index);
    }
  };

  const handleExerciseSelected = (exercise: any) => {
    if (openDropdownIndex !== null) {
      updateExercise(openDropdownIndex, 'exercise_name', exercise.name);
      updateExercise(openDropdownIndex, 'logging_category', exercise.logging_category);
      updateExercise(openDropdownIndex, 'category', exercise.logging_category);
      setSearchQuery(prev => ({ ...prev, [openDropdownIndex]: exercise.name }));
      // Mark this exercise as selected
      setSelectedExercises(prev => new Set([...prev, openDropdownIndex]));
      // Close dropdown after selection
      setOpenDropdownIndex(null);
    }
  };

  const handleExerciseFieldBlur = () => {
    // Don't close dropdown on blur - let user manually close it
    // This prevents dropdown from closing when keyboard is dismissed
  };

  const removeExercise = (index: number) => {
    // Don't allow removing the last exercise
    if (exercises.length <= 1) return;
    
    hapticFeedback.light();
    setExercises(prev => prev.filter((_, i) => i !== index));
    // Remove from selected exercises set
    setSelectedExercises(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      // Adjust indices for exercises after the removed one
      const adjustedSet = new Set<number>();
      newSet.forEach(selectedIndex => {
        if (selectedIndex > index) {
          adjustedSet.add(selectedIndex - 1);
        } else {
          adjustedSet.add(selectedIndex);
        }
      });
      return adjustedSet;
    });
  };

  const isFormValid = () => {
    return exercises.length > 0 && exercises.every(ex => ex.exercise_name.trim());
  };


  const handleSaveWorkout = async () => {
    if (!isFormValid()) {
      Alert.alert('Incomplete Workout', 'Please add at least one exercise.');
      return;
    }

    try {
      setSaving(true);

      // Convert DynamicExerciseForm ExerciseData to fitnessService ExerciseData
      const convertedExercises: FitnessServiceExerciseData[] = exercises
        .filter(ex => ex.exercise_name.trim())
        .map(ex => ({
          exercise_name: ex.exercise_name,
          sets: typeof ex.sets === 'string' ? parseInt(ex.sets) || 0 : (ex.sets || 0),
          reps: typeof ex.reps === 'number' ? ex.reps.toString() : (ex.reps || '0'),
          weight_used: typeof ex.weight_used === 'string' ? parseFloat(ex.weight_used) || 0 : (ex.weight_used || 0),
          weight_unit: ex.weight_unit || 'kg',
          duration: typeof ex.duration === 'string' ? parseFloat(ex.duration) || 0 : (ex.duration || 0),
          distance: typeof ex.distance === 'string' ? parseFloat(ex.distance) || 0 : (ex.distance || 0),
          distance_unit: ex.distance_unit || 'km',
          category: ex.category || ex.logging_category || 'weighted',
        }));

      const workoutData: WorkoutData = {
        activity_type: 'weightlifting', // Default to weightlifting
        duration_minutes: 30, // Default duration
        exercises: convertedExercises,
        activity_date: selectedDate.toISOString(),
      };

      console.log('🔍 DEBUG: LogWorkoutModal - Sending workout data:', JSON.stringify(workoutData, null, 2));
      console.log('🔍 DEBUG: LogWorkoutModal - Converted exercises:', convertedExercises);
      console.log('🔍 DEBUG: LogWorkoutModal - Exercise categories:', convertedExercises.map(ex => ({ name: ex.exercise_name, category: ex.category })));

      await fitnessService.logWorkout(workoutData);

      Alert.alert(
        'Workout Logged!',
        'Great job completing your workout!',
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
      Alert.alert('Error', 'Failed to log workout. Please try again.');
    } finally {
      setSaving(false);
    }
  };



  return (
    <Modal visible={visible} animationType="slide" transparent>
      <BlurView intensity={20} style={styles.overlay}>
        <KeyboardAvoidingView 
          style={[
            styles.keyboardAvoidingView,
            keyboardVisible ? styles.keyboardAvoidingViewWithKeyboard : null
          ]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? -20 : 0}
        >
          <View style={[
            styles.modal,
            keyboardVisible ? styles.modalWithKeyboard : null
          ]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>
                {todaysWorkout ? 'Log Today\'s Workout' : 'Log Workout'}
              </Text>
              <Text style={styles.subtitle}>Track your fitness progress</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            ref={scrollViewRef}
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.scrollContent,
              keyboardVisible && styles.scrollContentWithKeyboard
            ]}
          >
            {/* Date Selection */}
            <DateSelector
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              label="Workout Date"
              calendarModalTitle="Select Workout Date"
              showLogsIndicator={false}
            />

            {/* Exercises */}
            <TouchableOpacity 
              style={styles.exercisesSection}
              activeOpacity={1}
              onPress={() => {
                // Close dropdown when tapping outside
                if (openDropdownIndex !== null) {
                  setOpenDropdownIndex(null);
                }
              }}
            >
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Exercises</Text>
                <Text style={styles.exerciseCount}>
                  {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
                </Text>
              </View>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                  <Ionicons name="search-outline" size={20} color={COLORS.text.secondary} style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    value={searchQuery[0] || ''}
                    onChangeText={(text) => handleExerciseFieldChange(0, text)}
                    onFocus={() => handleExerciseFieldFocus(0)}
                    placeholder="Search exercises..."
                    placeholderTextColor={COLORS.text.tertiary}
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                  {searchQuery[0] && (
                    <TouchableOpacity
                      style={styles.clearSearchButton}
                      onPress={() => {
                        setSearchQuery(prev => ({ ...prev, [0]: '' }));
                        setOpenDropdownIndex(null);
                      }}
                    >
                      <Ionicons name="close-circle" size={20} color={COLORS.text.tertiary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Exercise Dropdown - Positioned after search bar */}
              {openDropdownIndex === 0 && searchQuery[0] && searchQuery[0].length > 0 && (
                <View style={[
                  styles.dropdownContainer,
                  keyboardVisible && styles.dropdownContainerWithKeyboard
                ]}>
                  <ExerciseDropdown
                    visible={true}
                    onClose={() => setOpenDropdownIndex(null)}
                    onExerciseSelected={(exercise) => {
                      console.log('🔍 Selected exercise from dropdown:', exercise);
                      console.log('🔍 Exercise logging_category:', exercise.logging_category);
                      // Add the selected exercise to the list
                      const newExercise: ExerciseData = {
                        exercise_name: exercise.name,
                        sets: 0,
                        reps: '',
                        weight_used: 0,
                        weight_unit: 'kg',
                        distance_unit: 'km',
                        category: exercise.logging_category || 'weighted'
                      };
                      console.log('🔍 Adding new exercise to list:', newExercise);
                      setExercises(prev => {
                        const updated = [...prev, newExercise];
                        console.log('🔍 Updated exercises list:', updated);
                        return updated;
                      });
                      setSelectedExercises(prev => new Set([...prev, exercises.length]));
                      // Clear search and close dropdown
                      setSearchQuery(prev => ({ ...prev, [0]: '' }));
                      setOpenDropdownIndex(null);
                    }}
                    searchQuery={searchQuery[0] || ''}
                  />
                </View>
              )}

              <View style={styles.exercisesList}>
                {/* Selected Exercises */}
                {exercises.map((exercise, index) => (
                  <View key={index} style={styles.exerciseItemContainer}>
                    {/* Exercise Display */}
                    <View style={styles.exerciseItem}>
                      <View style={styles.exerciseNumberContainer}>
                        <Text style={styles.exerciseNumber}>{index + 1}</Text>
                      </View>
                      <Text style={styles.exerciseName}>
                        {exercise.exercise_name}
                      </Text>
                      
                      <View style={styles.exerciseActionsGroup}>
                        {(() => {
                          const category = getExerciseCategory(exercise.exercise_name);
                          const categoryConfig = EXERCISE_CATEGORIES[category as keyof typeof EXERCISE_CATEGORIES] || EXERCISE_CATEGORIES.general;
                          return (
                            <View style={[styles.exerciseCategoryBadge, { backgroundColor: categoryConfig.color, borderColor: categoryConfig.color }]}>
                              <Ionicons 
                                name={categoryConfig.icon as any} 
                                size={10} 
                                color={COLORS.background.primary}
                                style={styles.badgeIcon}
                              />
                              <Text style={styles.exerciseCategoryText}>
                                {categoryConfig.name.toUpperCase()}
                              </Text>
                            </View>
                          );
                        })()}
                        
                        {/* Add Exercise Button */}
                        <TouchableOpacity
                          style={styles.addExerciseButton}
                          onPress={() => addExerciseAfter(index)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                        
                        {/* Remove Exercise Button */}
                        <TouchableOpacity
                          style={styles.removeExerciseButton}
                          onPress={() => removeExercise(index)}
                          activeOpacity={0.7}
                        >
                          <Ionicons 
                            name="trash-outline" 
                            size={18} 
                            color={COLORS.danger} 
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Dynamic Form Fields */}
                    <DynamicExerciseForm
                      exercise={exercise}
                      index={index}
                      onUpdate={updateExercise}
                      onRemove={removeExercise}
                      activityType="weightlifting"
                      showRemove={false}
                    />
                  </View>
                ))}

              </View>

            </View>
            </TouchableOpacity>

          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
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
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  keyboardAvoidingViewWithKeyboard: {
    justifyContent: 'flex-start',
    paddingTop: 30,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '92%',
    maxHeight: '88%',
    minHeight: '55%',
    padding: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  modalWithKeyboard: {
    height: '92%',
    maxHeight: '92%',
    marginTop: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 8,
    minHeight: 0, // Allow content to shrink
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding to prevent dropdown clipping
  },
  scrollContentWithKeyboard: {
    paddingBottom: 200, // Extra padding when keyboard is open
  },
  section: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  exerciseCount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
  },
  
  // Search Bar Styles
  searchContainer: {
    marginBottom: SPACING.lg,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text.primary,
  },
  clearSearchButton: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },
  
  // Dropdown Container
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
    marginBottom: SPACING.lg,
    marginTop: -SPACING.sm, // Pull up slightly to align with search bar
    paddingBottom: SPACING.xl, // Extra space to prevent clipping
  },
  dropdownContainerWithKeyboard: {
    marginBottom: SPACING.xl,
    paddingBottom: SPACING.xxl, // Extra space when keyboard is open
  },
  activityTypeScroll: {
    paddingVertical: 4,
  },
  activityTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    marginRight: 8,
    minWidth: 100,
  },
  activityTypeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    overflow: 'hidden',
  },
  unitButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  unitButtonActive: {
    backgroundColor: '#3b82f6',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  unitButtonTextActive: {
    color: '#ffffff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  addButtonText: {
    color: COLORS.text.inverse,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  emptyExercises: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderStyle: 'dashed',
  },
  emptyExercisesText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
  },
  emptyExercisesSubtext: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.tertiary,
    marginTop: SPACING.xs,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  exercisesList: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 6,
    flexGrow: 1, // Allow list to grow with content
    flexShrink: 1, // Allow list to shrink when needed
  },
  exerciseNameInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  removeExerciseButton: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.background.secondary,
  },
  removeExerciseButtonDisabled: {
    opacity: 0.5,
  },
  exerciseItemContainer: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    ...SHADOWS.small,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    justifyContent: 'space-between',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseNumberContainer: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  exerciseNumber: {
    color: COLORS.background.primary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  exerciseIcon: {
    marginRight: SPACING.sm,
  },
  exerciseName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
    marginRight: SPACING.xs,
  },
  exerciseActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  exerciseCategoryBadge: {
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  badgeIcon: {
    marginRight: 2,
  },
  exerciseCategoryText: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.background.primary,
    textTransform: 'uppercase',
  },
  exerciseNamePlaceholder: {
    color: COLORS.text.tertiary,
    fontStyle: 'italic',
  },
  exerciseDetails: {
    marginLeft: 28, // Align with text after icon
  },
  exerciseDetailText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  addExerciseButton: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.background.secondary,
  },
  searchHintIcon: {
    marginLeft: SPACING.sm,
  },
  exerciseInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  exerciseInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  chevronIcon: {
    marginLeft: 8,
  },
  chevronButton: {
    padding: 4,
  },
  exercisesSection: {
    flex: 1,
  },
  exerciseDetailItem: {
    flex: 1,
  },
  exerciseDetailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  exerciseDetailInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF',
  },
});
