import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { routineService, CreateRoutineData, SimpleRoutineWithProgress } from '../../services/routineService';
import { exerciseCategoryService } from '../../services/exerciseCategoryService';
import { apiClient } from '../../services/api';
import { showToast } from '../../utils/toast';

interface Exercise {
  id: number;
  name: string;
  logging_category: string;
  difficulty: string;
  calories_per_minute: number;
  description: string;
}

interface Workout {
  id: number;
  exercise: Exercise | null;
}

interface DayWorkout {
  day: string;
  dayName: string;
  workouts: Workout[];
}

interface EditRoutineModalProps {
  isVisible: boolean;
  onClose: () => void;
  onRoutineUpdated: () => void;
  routine: SimpleRoutineWithProgress | null;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Categories will be loaded from database

export default function EditRoutineModal({
  isVisible,
  onClose,
  onRoutineUpdated,
  routine,
}: EditRoutineModalProps) {
  const [routineName, setRoutineName] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [loading, setLoading] = useState(false);
  const [loadingRoutineData, setLoadingRoutineData] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Workout planning state
  const [currentDay, setCurrentDay] = useState(0);
  const [dayWorkouts, setDayWorkouts] = useState<DayWorkout[]>(
    DAYS.map(day => ({
      day: day.toLowerCase(),
      dayName: day,
      workouts: [],
    }))
  );
  
  // Exercise selection state
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [currentWorkoutId, setCurrentWorkoutId] = useState<number | null>(null);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await exerciseCategoryService.getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  const getCategoryConfig = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      return {
        id: category.id,
        name: category.display_name,
        color: category.color,
        icon: category.icon,
      };
    }
    // Return "Category Not Found" config
    return {
      id: categoryId,
      name: 'Category Not Found',
      color: '#6b7280',
      icon: 'help-outline',
    };
  };

  // Load routine data when modal opens
  useEffect(() => {
    const loadRoutineData = async () => {
      if (isVisible && routine) {
        setRoutineName(routine.name);
        setDifficulty(routine.difficulty);
        setDurationWeeks(routine.duration_weeks);
        
        // Fetch full routine details with workout data
        try {
          setLoadingRoutineData(true);
          
          // Use appropriate method based on routine type
          console.log('🔍 [EDIT MODAL] Fetching routine data:', {
            routineId: routine.id,
            routineName: routine.name,
            isTemplate: routine.is_template,
            method: routine.is_template ? 'getTemplateRoutine' : 'getRoutine'
          });
          
          const fullRoutine = routine.is_template 
            ? await routineService.getTemplateRoutine(routine.id)
            : await routineService.getRoutine(routine.id);
            
          console.log('🔍 [EDIT MODAL] Full routine data:', fullRoutine);
          
          // Convert routine workout schedule to dayWorkouts format
          const convertedDayWorkouts: DayWorkout[] = DAYS.map(day => ({
            day: day.toLowerCase(),
            dayName: day,
            workouts: [],
          }));

          if (fullRoutine.workout_schedule && fullRoutine.workout_schedule.length > 0) {
            console.log('🔍 [EDIT MODAL] Workout schedule found:', fullRoutine.workout_schedule);
            fullRoutine.workout_schedule.forEach((workoutDay, dayIdx) => {
              console.log(`🔍 [EDIT MODAL] Processing day ${dayIdx}:`, workoutDay);
              console.log(`🔍 [EDIT MODAL] Day exercises:`, workoutDay.exercises);
              console.log(`🔍 [EDIT MODAL] Is exercises array?`, Array.isArray(workoutDay.exercises));
              
              // Match day name to DAYS array
              const dayIndex = DAYS.findIndex(d => d.toLowerCase() === workoutDay.day.toLowerCase());
              console.log(`🔍 [EDIT MODAL] Day match for "${workoutDay.day}":`, dayIndex);
              
              if (dayIndex !== -1) {
                if (workoutDay.exercises && Array.isArray(workoutDay.exercises)) {
                  convertedDayWorkouts[dayIndex].workouts = (workoutDay.exercises as any[]).map((exercise: any, index: number) => ({
                    id: dayIndex * 1000 + index, // Generate unique number ID
                    exercise: {
                      id: 0, // We don't have exercise ID in the routine data
                      name: exercise.exercise_name,
                      logging_category: exercise.logging_category || 'weighted',
                      difficulty: 'medium',
                      calories_per_minute: 0,
                      description: '',
                    },
                  })) as Workout[];
                } else {
                  console.log(`🔍 [EDIT MODAL] No exercises array for day ${workoutDay.day}`);
                }
              } else {
                console.log(`🔍 [EDIT MODAL] Day ${workoutDay.day} not found in DAYS array`);
              }
            });
          } else {
            console.log('🔍 [EDIT MODAL] No workout schedule found');
          }

          console.log('🔍 [EDIT MODAL] Final converted day workouts:', convertedDayWorkouts);
          setDayWorkouts(convertedDayWorkouts);
        } catch (error) {
          console.error('❌ [EDIT MODAL] Failed to load full routine data:', error);
          console.error('❌ [EDIT MODAL] Error details:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            routineId: routine.id,
            isTemplate: routine.is_template
          });
          showToast.error('Error', 'Failed to load routine details. Please try again.');
        } finally {
          setLoadingRoutineData(false);
        }
      }
    };

    loadRoutineData();
  }, [isVisible, routine]);

  const resetForm = () => {
    setRoutineName('');
    setDifficulty('beginner');
    setDurationWeeks(4);
    setDayWorkouts(
      DAYS.map(day => ({
        day: day.toLowerCase(),
        dayName: day,
        workouts: [],
      }))
    );
    setCurrentDay(0);
    setSelectedCategory(null);
    setExerciseSearch('');
    setShowExerciseSelector(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Load exercises on component mount
  useEffect(() => {
    const loadExercises = async () => {
      try {
        setLoadingExercises(true);
        const response = await apiClient.get('/health/exercises/all?limit=500');
        setAllExercises(response.data.exercises || []);
        setFilteredExercises(response.data.exercises || []);
      } catch (error) {
        console.error('Failed to load exercises:', error);
        showToast.error('Error', 'Failed to load exercises');
      } finally {
        setLoadingExercises(false);
      }
    };

    if (isVisible) {
      loadExercises();
    }
  }, [isVisible]);

  // Filter exercises based on search and category
  useEffect(() => {
    let filtered = allExercises;

    if (selectedCategory) {
      filtered = filtered.filter(exercise => exercise.logging_category === selectedCategory);
    }

    if (exerciseSearch.trim()) {
      const searchTerm = exerciseSearch.toLowerCase();
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(searchTerm)
      );
      
      // Sort by relevance: exact matches first, then partial matches
      filtered.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Exact match gets highest priority
        if (aName === searchTerm && bName !== searchTerm) return -1;
        if (bName === searchTerm && aName !== searchTerm) return 1;
        
        // Starts with search term gets second priority
        if (aName.startsWith(searchTerm) && !bName.startsWith(searchTerm)) return -1;
        if (bName.startsWith(searchTerm) && !aName.startsWith(searchTerm)) return 1;
        
        // Then alphabetical order
        return aName.localeCompare(bName);
      });
    } else {
      // When no search term, sort alphabetically
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredExercises(filtered);
  }, [allExercises, selectedCategory, exerciseSearch]);

  const addWorkout = (dayIndex: number) => {
    const newWorkout: Workout = {
      id: Date.now(),
      exercise: null,
    };

    const updatedDayWorkouts = [...dayWorkouts];
    updatedDayWorkouts[dayIndex].workouts.push(newWorkout);
    setDayWorkouts(updatedDayWorkouts);
  };

  const removeWorkout = (dayIndex: number, workoutId: number) => {
    const updatedDayWorkouts = [...dayWorkouts];
    updatedDayWorkouts[dayIndex].workouts = updatedDayWorkouts[dayIndex].workouts.filter(
      workout => workout.id !== workoutId
    );
    setDayWorkouts(updatedDayWorkouts);
  };

  const selectExercise = (exercise: Exercise) => {
    if (!currentWorkoutId) return;

    const updatedDayWorkouts = [...dayWorkouts];
    const dayIndex = currentDay;
    const workoutIndex = updatedDayWorkouts[dayIndex].workouts.findIndex(
      workout => workout.id === currentWorkoutId
    );

    if (workoutIndex !== -1) {
      updatedDayWorkouts[dayIndex].workouts[workoutIndex].exercise = exercise;
      setDayWorkouts(updatedDayWorkouts);
    }

    // Clear search and close modal
    setExerciseSearch('');
    setSelectedCategory(null);
    setShowExerciseSelector(false);
    setCurrentWorkoutId(null);
  };

  const getTotalWorkouts = () => {
    return dayWorkouts.reduce((total, day) => total + day.workouts.length, 0);
  };

  const handleUpdate = async () => {
    if (!routine) return;

    if (!routineName.trim()) {
      showToast.error('Error', 'Please enter a routine name');
      return;
    }

    const totalWorkouts = getTotalWorkouts();
    if (totalWorkouts === 0) {
      showToast.error('Error', 'Please add at least one workout to your routine');
      return;
    }

    try {
      setLoading(true);

      const routineData: CreateRoutineData = {
        name: routineName.trim(),
        description: `Custom ${difficulty} routine`,
        difficulty,
        duration_weeks: durationWeeks,
      };

      // Prepare workout days for API
      const workoutDaysForAPI = dayWorkouts
        .filter(day => day.workouts.length > 0)
        .map(day => ({
          day: day.day,
          day_order: DAYS.indexOf(day.dayName),
          workout_name: `${day.dayName} Workout`,
          description: `${day.workouts.length} exercises`,
          workouts: day.workouts.map(workout => ({
            activity_name: workout.exercise?.name || 'Unknown Exercise',
            activity_type: workout.exercise?.logging_category || 'weighted',
          })),
        }));

      await routineService.updateRoutineWithWorkoutPlan(routine.id, routineData, workoutDaysForAPI);
      
      showToast.success('Success!', `Routine "${routineName}" updated with ${totalWorkouts} workouts`);
      resetForm();
      onClose();
      onRoutineUpdated();
    } catch (err: any) {
      console.error('Failed to update routine:', err);
      showToast.error('Error', err.response?.data?.detail || err.message || 'Failed to update routine');
    } finally {
      setLoading(false);
    }
  };

  const renderExerciseSelector = () => (
    <Modal
      visible={showExerciseSelector}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        setExerciseSearch('');
        setSelectedCategory(null);
        setShowExerciseSelector(false);
        setCurrentWorkoutId(null);
      }}
    >
      <View style={styles.exerciseSelectorContainer}>
        <View style={styles.exerciseSelectorHeader}>
          <TouchableOpacity onPress={() => {
            setExerciseSearch('');
            setSelectedCategory(null);
            setShowExerciseSelector(false);
            setCurrentWorkoutId(null);
          }}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.exerciseSelectorTitle}>Select Exercise</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Category Filter */}
        <View style={styles.categoryFilter}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.categoryChip,
                !selectedCategory && styles.categoryChipSelected,
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[
                styles.categoryChipText,
                !selectedCategory && styles.categoryChipTextSelected,
              ]}>
                All
              </Text>
            </TouchableOpacity>
            {categories.map(category => {
              const categoryConfig = getCategoryConfig(category.id);
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category.id && styles.categoryChipSelected,
                    { borderColor: categoryConfig.color },
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Ionicons
                    name={categoryConfig.icon as any}
                    size={16}
                    color={selectedCategory === category.id ? '#fff' : categoryConfig.color}
                  />
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategory === category.id && styles.categoryChipTextSelected,
                    { color: selectedCategory === category.id ? '#fff' : categoryConfig.color },
                  ]}>
                    {categoryConfig.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            value={exerciseSearch}
            onChangeText={setExerciseSearch}
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Exercise List */}
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.exerciseItem}
              onPress={() => selectExercise(item)}
            >
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{item.name}</Text>
                <Text style={styles.exerciseDetails}>
                  {item.difficulty} • {item.calories_per_minute} cal/min
                </Text>
                <Text style={styles.exerciseCategory}>
                  {item.logging_category.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color="#d1d5db" />
              <Text style={styles.emptyStateText}>No exercises found</Text>
              <Text style={styles.emptyStateSubtext}>
                Try adjusting your search or category filter
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );

  if (!routine) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} disabled={loading}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Routine</Text>
          <TouchableOpacity
            onPress={handleUpdate}
            disabled={loading || !routineName.trim() || getTotalWorkouts() === 0}
            style={[
              styles.updateButton,
              (!routineName.trim() || getTotalWorkouts() === 0 || loading) && styles.updateButtonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.updateButtonText}>Update</Text>
            )}
          </TouchableOpacity>
        </View>

        {loadingRoutineData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Loading routine details...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Routine Details */}
            <View style={styles.section}>
              <Text style={styles.label}>Routine Name *</Text>
              <TextInput
                style={styles.input}
                value={routineName}
                onChangeText={setRoutineName}
                placeholder="e.g., My Custom Workout"
                placeholderTextColor="#9ca3af"
                maxLength={100}
              />
            </View>

          {/* Workout Plan */}
          <View style={styles.section}>
            <View style={styles.workoutPlanHeader}>
              <View>
                <Text style={styles.label}>Weekly Workout Plan</Text>
                <Text style={styles.sectionDescription}>
                  Plan your exercises for each day of the week
                </Text>
              </View>
              <View style={styles.workoutCount}>
                <Text style={styles.workoutCountText}>{getTotalWorkouts()} total workouts</Text>
              </View>
            </View>

            {/* Day Navigation - Circular Loop */}
            <View style={styles.dayNavigation}>
              <TouchableOpacity
                style={styles.dayNavButton}
                onPress={() => {
                  const prevDay = currentDay === 0 ? DAYS.length - 1 : currentDay - 1;
                  setCurrentDay(prevDay);
                }}
              >
                <Ionicons name="chevron-back" size={20} color="#6b7280" />
              </TouchableOpacity>
              
              <Text style={styles.currentDay}>{dayWorkouts[currentDay].dayName}</Text>
              
              <TouchableOpacity
                style={styles.dayNavButton}
                onPress={() => {
                  const nextDay = currentDay === DAYS.length - 1 ? 0 : currentDay + 1;
                  setCurrentDay(nextDay);
                }}
              >
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Current Day Workouts */}
            <View style={styles.dayWorkouts}>
              <View style={styles.dayHeader}>
                <View style={styles.dayTitle}>
                  <View style={styles.dayIcon}>
                    <Text style={styles.dayIconText}>{dayWorkouts[currentDay].dayName[0]}</Text>
                  </View>
                  <Text style={styles.dayName}>{dayWorkouts[currentDay].dayName}</Text>
                </View>
                <TouchableOpacity
                  style={styles.addWorkoutButton}
                  onPress={() => addWorkout(currentDay)}
                >
                  <Ionicons name="add" size={16} color="#6366f1" />
                  <Text style={styles.addWorkoutText}>Add Workout</Text>
                </TouchableOpacity>
              </View>

              {dayWorkouts[currentDay].workouts.length === 0 ? (
                <View style={styles.noWorkouts}>
                  <Text style={styles.noWorkoutsText}>No workouts planned for {dayWorkouts[currentDay].dayName}</Text>
                  <Text style={styles.noWorkoutsSubtext}>Click 'Add Workout' to get started</Text>
                </View>
              ) : (
                <View style={styles.workoutsList}>
                  {dayWorkouts[currentDay].workouts.map((workout, index) => (
                    <View key={workout.id} style={styles.workoutItem}>
                      <View style={styles.workoutHeader}>
                        <Text style={styles.workoutNumber}>Exercise {index + 1}</Text>
                        <View style={styles.workoutActions}>
                          {workout.exercise && (
                            <View style={styles.workoutCategory}>
                              <Text style={styles.workoutCategoryText}>
                                {workout.exercise.logging_category.replace('_', ' ').toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => removeWorkout(currentDay, workout.id)}
                          >
                            <Ionicons name="trash" size={16} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.exerciseSelector}
                        onPress={() => {
                          setCurrentWorkoutId(workout.id);
                          setShowExerciseSelector(true);
                        }}
                      >
                        <Text style={styles.exerciseSelectorText}>
                          {workout.exercise ? workout.exercise.name : 'Select Exercise'}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color="#6b7280" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
        )}

        {renderExerciseSelector()}
      </View>
    </Modal>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  updateButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  updateButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  workoutPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  workoutCount: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  workoutCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dayNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dayNavButton: {
    padding: 8,
  },
  currentDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  dayWorkouts: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dayIconText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dayName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addWorkoutText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  noWorkouts: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noWorkoutsText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  noWorkoutsSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  workoutsList: {
    gap: 16,
  },
  workoutItem: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  workoutActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workoutCategory: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  workoutCategoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  deleteButton: {
    padding: 4,
  },
  exerciseSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  exerciseSelectorText: {
    fontSize: 16,
    color: '#1f2937',
  },
  // Exercise Selector Modal Styles
  exerciseSelectorContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  exerciseSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  exerciseSelectorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  categoryFilter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 4,
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 8,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  exerciseCategory: {
    fontSize: 12,
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
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
});
