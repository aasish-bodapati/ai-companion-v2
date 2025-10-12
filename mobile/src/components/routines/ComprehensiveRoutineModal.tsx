import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BaseModal from '../ui/BaseModal.simple';
import { modalConfigs } from '../ui/BaseModal.utils';
import SearchInput from '../ui/SearchInput';
import FilterBar from '../ui/FilterBar';
import { searchInputConfigs } from '../ui/SearchInput.utils';
import { filterBarConfigs } from '../ui/FilterBar.utils';
import { showToast } from '../../utils/toast';
import { routineService } from '../../services/routineService';
import { apiClient } from '../../services/api';
import { COMMON_STYLES } from '../../theme/constants';

interface ComprehensiveRoutineModalProps {
  isVisible: boolean;
  onClose: () => void;
  onRoutineCreated: () => void;
}

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

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ComprehensiveRoutineModal({
  isVisible,
  onClose,
  onRoutineCreated,
}: ComprehensiveRoutineModalProps) {
  const [routineName, setRoutineName] = useState('');
  const [loading, setLoading] = useState(false);
  
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [currentWorkoutId, setCurrentWorkoutId] = useState<number | null>(null);
  const [loadingExercises, setLoadingExercises] = useState(false);

  const resetForm = () => {
    setRoutineName('');
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
      } catch {
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

    // Filter by single category (legacy)
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(exercise => exercise.logging_category === selectedCategory);
    }

    // Filter by multiple categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(exercise => 
        selectedCategories.includes(exercise.logging_category)
      );
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
  }, [allExercises, selectedCategory, selectedCategories, exerciseSearch]);

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
    setSelectedCategories([]);
    setShowExerciseSelector(false);
    setCurrentWorkoutId(null);
  };

  const handleSearchChange = (query: string) => {
    setExerciseSearch(query);
  };

  const handleCategoriesChange = (categories: string[]) => {
    setSelectedCategories(categories);
  };

  // Create filter options for categories
  const categoryFilterOptions = React.useMemo(() => {
    const uniqueCategories = Array.from(new Set(allExercises.map(ex => ex.logging_category)));
    return uniqueCategories.map(category => ({
      id: category,
      label: category.replace('_', ' ').toUpperCase(),
      value: category,
      icon: 'fitness-outline' as const,
    }));
  }, [allExercises]);

  const getTotalWorkouts = () => {
    return dayWorkouts.reduce((total, day) => total + day.workouts.length, 0);
  };

  const handleCreate = async () => {
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
      
      const routineData = {
        name: routineName.trim(),
        description: `Custom ${routineName.trim()} routine`,
        difficulty: 'beginner',
        duration_weeks: 4,
        is_template: false,
        is_active: true,
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
            activity_name: workout.exercise?.name,
            logging_category: workout.exercise?.logging_category || 'weighted',
            sets: 3,
            reps: 10,
            notes: 'Custom routine exercise'
          })),
        }));

      const requestData = {
        routine_data: routineData,
        workout_days: workoutDaysForAPI
      };

      const createdRoutine = await routineService.createRoutineWithWorkoutPlan(requestData);
      
      showToast.success('Success!', `Routine "${routineName}" created with ${totalWorkouts} workouts`);
      resetForm();
      onClose();
      onRoutineCreated();
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : 'Failed to create routine';
      showToast.error('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      visible={isVisible}
      onClose={handleClose}
      title="Create Custom Routine"
      {...modalConfigs.routineCreation}
    >
      <View style={styles.container}>
        {/* Create Button */}
        <View style={styles.createButtonContainer}>
          <TouchableOpacity
            onPress={handleCreate}
            disabled={loading || !routineName.trim() || getTotalWorkouts() === 0}
            style={[
              styles.createButton,
              (!routineName.trim() || getTotalWorkouts() === 0 || loading) && styles.createButtonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Create</Text>
            )}
          </TouchableOpacity>
        </View>

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

            {/* Day Navigation */}
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
                <SearchInput
                  value={exerciseSearch}
                  onChangeText={handleSearchChange}
                  onSearch={handleSearchChange}
                  onFocus={() => setShowExerciseSelector(true)}
                  placeholder="Search exercises..."
                  testID="routine-exercise-search"
                  {...searchInputConfigs.exercise}
                />
              </View>

              {/* Exercise Dropdown */}
              {showExerciseSelector && (
                <View style={styles.exerciseDropdown}>
                  <View style={styles.dropdownHeader}>
                    <Text style={styles.dropdownTitle}>Select Exercise</Text>
                    <TouchableOpacity
                      style={styles.closeDropdownButton}
                      onPress={() => setShowExerciseSelector(false)}
                    >
                      <Ionicons name="close" size={20} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Category Filter */}
                  <View style={styles.categoryFilter}>
                    <FilterBar
                      options={categoryFilterOptions}
                      selectedValues={selectedCategories}
                      onSelectionChange={handleCategoriesChange}
                      testID="routine-category-filter"
                      {...filterBarConfigs.exerciseCategories}
                    />
                  </View>

                  {/* Exercise List */}
                  <ScrollView style={styles.exerciseList} showsVerticalScrollIndicator={false}>
                    {filteredExercises.map((item) => (
                      <TouchableOpacity
                        key={item.id.toString()}
                        style={styles.exerciseItem}
                        onPress={() => selectExercise(item)}
                      >
                        <View style={styles.exerciseInfo}>
                          <Text style={styles.exerciseName}>{item.name}</Text>
                          <Text style={styles.exerciseCategory}>{item.category}</Text>
                        </View>
                        <Ionicons name="add-circle-outline" size={20} color="#6366f1" />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {dayWorkouts[currentDay].workouts.length === 0 ? (
                <View style={styles.noWorkouts}>
                  <Text style={styles.noWorkoutsText}>No exercises planned for {dayWorkouts[currentDay].dayName}</Text>
                  <Text style={styles.noWorkoutsSubtext}>Search for exercises to add to your workout</Text>
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
      </View>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  createButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COMMON_STYLES.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  createButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
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
    backgroundColor: COMMON_STYLES.cardBackground,
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
    backgroundColor: COMMON_STYLES.cardBackground,
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
    backgroundColor: COMMON_STYLES.cardBackground,
    borderRadius: COMMON_STYLES.standardRadius,
    padding: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exerciseDropdown: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 8,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeDropdownButton: {
    padding: 4,
  },
  categoryFilter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  exerciseList: {
    maxHeight: 200,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  exerciseCategory: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
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
    borderRadius: COMMON_STYLES.standardRadius,
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
    backgroundColor: COMMON_STYLES.cardBackground,
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
    backgroundColor: COMMON_STYLES.cardBackground,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: COMMON_STYLES.cardBackground,
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
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COMMON_STYLES.cardBackground,
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
});