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
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { fitnessService, ExerciseData as FitnessServiceExerciseData } from '../../services/fitnessService';
import DynamicExerciseForm, { ExerciseData } from './DynamicExerciseForm';
import ExerciseDropdown from './ExerciseDropdown';
import CalendarComponent from '../common/CalendarComponent';

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
  const [exercises, setExercises] = useState<ExerciseData[]>([
    {
      exercise_name: '',
      sets: 1,
      reps: '10',
      weight_used: 0,
      weight_unit: 'kg',
      distance_unit: 'km',
      category: 'weighted'
    }
  ]);
  const [saving, setSaving] = useState(false);
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<{ [key: number]: string }>({});
  const [selectedExercises, setSelectedExercises] = useState<Set<number>>(new Set());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);


  useEffect(() => {
    if (visible) {
      if (todaysWorkout) {
        // Pre-populate with today's workout data
        setExercises(todaysWorkout.exercises || []);
        // Mark all pre-populated exercises as selected
        setSelectedExercises(new Set(todaysWorkout.exercises?.map((_: any, index: number) => index) || []));
      } else {
        // Reset form with one default exercise
        setExercises([{
          exercise_name: '',
          sets: 1,
          reps: '10',
          weight_used: 0,
          weight_unit: 'kg',
          distance_unit: 'km',
          category: 'weighted'
        }]);
        // Clear selected exercises
        setSelectedExercises(new Set());
      }
    }
  }, [visible, todaysWorkout]);

  const addExercise = () => {
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
    updateExercise(index, 'exercise_name', value);
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
    return exercises.length > 0 && exercises.some(ex => ex.exercise_name.trim());
  };

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowCalendar(false);
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
    setSelectedDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
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
        }));

      const workoutData: WorkoutData = {
        activity_type: 'weightlifting', // Default to weightlifting
        duration_minutes: 30, // Default duration
        exercises: convertedExercises,
        activity_date: selectedDate.toISOString(),
      };

      console.log('🔍 DEBUG: LogWorkoutModal - Sending workout data:', JSON.stringify(workoutData, null, 2));
      console.log('🔍 DEBUG: LogWorkoutModal - Converted exercises:', convertedExercises);

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
        <View style={styles.modal}>
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
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Date Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Workout Date</Text>
              <View style={styles.dateSelectorContainer}>
                <TouchableOpacity 
                  style={styles.dateNavButton}
                  onPress={() => navigateDate('prev')}
                >
                  <Ionicons name="chevron-back" size={16} color="#6b7280" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.dateSelector}
                  onPress={() => setShowCalendar(true)}
                >
                  <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                  <Text style={styles.dateSelectorText}>
                    {formatDateForDisplay(selectedDate)}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color="#6b7280" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.dateNavButton}
                  onPress={() => navigateDate('next')}
                >
                  <Ionicons name="chevron-forward" size={16} color="#6b7280" />
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
            </View>

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
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addExercise}
                >
                  <Ionicons name="add" size={20} color="#3b82f6" />
                  <Text style={styles.addButtonText}>Add Exercise</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.exercisesList}>
                {exercises.map((exercise, index) => (
                  <View key={index} style={styles.exerciseItemContainer}>
                    {/* Exercise Name Input */}
                    <View style={styles.exerciseItem}>
                      <View style={styles.exerciseInputContainer}>
                        <TextInput
                          style={styles.exerciseInput}
                          value={exercise.exercise_name}
                          onChangeText={(text) => handleExerciseFieldChange(index, text)}
                          onFocus={() => handleExerciseFieldFocus(index)}
                          onBlur={handleExerciseFieldBlur}
                          placeholder="Select exercise..."
                          placeholderTextColor="#9ca3af"
                        />
                        <TouchableOpacity
                          onPress={() => handleExerciseFieldFocus(index)}
                          style={styles.chevronButton}
                        >
                          <Ionicons 
                            name={openDropdownIndex === index ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color="#6b7280" 
                            style={styles.chevronIcon}
                          />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        style={styles.removeExerciseButton}
                        onPress={() => removeExercise(index)}
                        disabled={exercises.length === 1}
                      >
                        <Ionicons 
                          name="trash-outline" 
                          size={20} 
                          color={exercises.length === 1 ? "#d1d5db" : "#ef4444"} 
                        />
                      </TouchableOpacity>
                    </View>
                    
                    {/* Exercise Dropdown */}
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={(e) => e.stopPropagation()}
                    >
                      <ExerciseDropdown
                        visible={openDropdownIndex === index}
                        onClose={() => setOpenDropdownIndex(null)}
                        onExerciseSelected={handleExerciseSelected}
                        searchQuery={searchQuery[index] || ''}
                      />
                    </TouchableOpacity>

                    {/* Dynamic Form Fields - Only show if exercise is selected from dropdown */}
                    {selectedExercises.has(index) && (
                      <DynamicExerciseForm
                        exercise={exercise}
                        index={index}
                        onUpdate={updateExercise}
                        onRemove={removeExercise}
                        activityType="weightlifting"
                        showRemove={false} // We'll handle removal with the main remove button
                      />
                    )}
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
      </BlurView>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.calendarModalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.calendarModalHeader}>
              <Text style={styles.calendarModalTitle}>Select Workout Date</Text>
              <TouchableOpacity
                style={styles.calendarCloseButton}
                onPress={() => setShowCalendar(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.calendarModalBody}
              activeOpacity={1}
              onPress={() => {
                // Close calendar when clicking outside
                setShowCalendar(false);
              }}
            >
              <TouchableOpacity 
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <CalendarComponent
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  showLogsIndicator={false}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  section: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 0,
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
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyExercises: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 6,
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
    marginLeft: 12,
    padding: 4,
  },
  exerciseItemContainer: {
    position: 'relative',
    marginBottom: 6,
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
  exerciseDetails: {
    flexDirection: 'row',
    gap: 12,
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
  // Date Selector Styles
  dateSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  dateNavButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    minWidth: 160,
    maxWidth: 180,
  },
  dateSelectorText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  todayButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    height: 32,
    justifyContent: 'center',
  },
  todayButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  todayButtonText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
  },
  todayButtonTextActive: {
    color: '#ffffff',
  },
  // Calendar Modal Styles
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  calendarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  calendarModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  calendarCloseButton: {
    padding: 4,
  },
  calendarModalBody: {
    padding: 0,
    alignItems: 'center',
  },
});
