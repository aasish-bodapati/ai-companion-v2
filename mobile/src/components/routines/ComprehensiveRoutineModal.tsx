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
import { routineService, CreateRoutineData } from '../../services/routineService';
import { exerciseCategoryService } from '../../services/exerciseCategoryService';
import { apiClient } from '../../services/api';
import { showToast } from '../../utils/toast';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../theme/constants';
import { useExerciseCategoriesWithAutoLoad } from '../../stores';
import { CategoryBadge } from '../ui/Badge';

// Category configuration for exercise categories
const getStaticCategoryConfig = (category: string | undefined) => {
  if (!category) {
    return { color: '#6b7280', icon: 'fitness', displayName: 'Category Not Found' };
  }
  
  const categoryMap: { [key: string]: { color: string; icon: string; displayName: string } } = {
    // Database logging categories (from migration)
    'bodyweight': { color: '#3b82f6', icon: 'user', displayName: 'Bodyweight Exercises' },
    'weighted': { color: '#ef4444', icon: 'dumbbell', displayName: 'Weighted Exercises' },
    'cardio_duration': { color: '#10b981', icon: 'heart', displayName: 'Cardio & Duration' },
    'hold_static': { color: '#8b5cf6', icon: 'clock', displayName: 'Hold & Static' },
    'repetition_only': { color: '#f59e0b', icon: 'repeat', displayName: 'Repetition Only' },
    'distance_based': { color: '#14b8a6', icon: 'map', displayName: 'Distance Based' },
    
    // Legacy/alternative category names for compatibility
    'strength': { color: '#ef4444', icon: 'barbell', displayName: 'Strength' },
    'cardio': { color: '#10b981', icon: 'heart', displayName: 'Cardio' },
    'flexibility': { color: '#10b981', icon: 'leaf', displayName: 'Flexibility' },
    'sports': { color: '#f59e0b', icon: 'football', displayName: 'Sports' },
    'rehabilitation': { color: '#8b5cf6', icon: 'medical', displayName: 'Rehabilitation' },
    'strongman': { color: '#dc2626', icon: 'fitness', displayName: 'Strongman' },
    'powerlifting': { color: '#7c3aed', icon: 'trophy', displayName: 'Powerlifting' },
    'stretching': { color: '#059669', icon: 'expand', displayName: 'Stretching' },
    'olympic_weightlifting': { color: '#d97706', icon: 'medal', displayName: 'Olympic' },
    'plyometrics': { color: '#be185d', icon: 'flash', displayName: 'Plyo' },
    'endurance': { color: '#10b981', icon: 'heart', displayName: 'Endurance' },
    'running': { color: '#10b981', icon: 'walk', displayName: 'Running' },
    'yoga': { color: '#10b981', icon: 'leaf', displayName: 'Yoga' },
    'pilates': { color: '#10b981', icon: 'leaf', displayName: 'Pilates' },
    'swimming': { color: '#10b981', icon: 'water', displayName: 'Swimming' },
    'cycling': { color: '#10b981', icon: 'bicycle', displayName: 'Cycling' },
    'dance': { color: '#f59e0b', icon: 'musical-notes', displayName: 'Dance' },
    'martial_arts': { color: '#dc2626', icon: 'shield', displayName: 'Martial Arts' },
    'crossfit': { color: '#7c3aed', icon: 'fitness', displayName: 'CrossFit' },
    'functional': { color: '#059669', icon: 'construct', displayName: 'Functional' },
  };
  
  return categoryMap[category] || { color: '#6b7280', icon: 'fitness', displayName: 'Category Not Found' };
};

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

interface ComprehensiveRoutineModalProps {
  isVisible: boolean;
  onClose: () => void;
  onRoutineCreated: () => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Categories will be loaded from database

export default function ComprehensiveRoutineModal({
  isVisible,
  onClose,
  onRoutineCreated,
}: ComprehensiveRoutineModalProps) {
  const [routineName, setRoutineName] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [loading, setLoading] = useState(false);
  
  // DISABLED: Use exercise categories store to prevent infinite loops
  // const { categories, loadCategories } = useExerciseCategoriesWithAutoLoad();
  
  // Use static categories to prevent infinite loops
  const categories = [
    { id: 1, name: 'strength', display_name: 'Strength' },
    { id: 2, name: 'cardio', display_name: 'Cardio' },
    { id: 3, name: 'flexibility', display_name: 'Flexibility' },
    { id: 4, name: 'sports', display_name: 'Sports' },
    { id: 5, name: 'rehabilitation', display_name: 'Rehabilitation' },
  ];
  
  // Categories are now auto-loaded via useExerciseCategoriesWithAutoLoad hook
  
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
  // Removed exercise selector functionality

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
    // Removed exercise selector functionality
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getCategoryConfig = (categoryIdOrName: string) => {
    // First try to find by ID (for category selection)
    let category = categories.find(cat => cat.id === categoryIdOrName);
    
    // If not found by ID, try to find by name (for exercise logging_category)
    if (!category) {
      category = categories.find(cat => cat.name === categoryIdOrName);
    }
    
    if (category) {
      // Use the static function to get color and icon
      const staticConfig = getStaticCategoryConfig(category.name);
      return {
        id: category.id,
        name: category.display_name || category.name,
        color: staticConfig.color,
        icon: staticConfig.icon,
      };
    }
    
    // NO FALLBACK - Show the actual category value to debug
    console.log('🔍 [CATEGORY DEBUG] Category not found:', categoryIdOrName);
    console.log('🔍 [CATEGORY DEBUG] Available categories:', categories.map(c => ({ id: c.id, name: c.name })));
    
    return {
      id: categoryIdOrName,
      name: `DEBUG: ${categoryIdOrName}`,
      color: '#ff0000', // Red to make it obvious
      icon: 'warning',
    };
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
        // Silent error handling - no console logging to prevent Expo Go notifications
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
      
      // Sort by relevance using the same scoring system as SearchInput
      filtered.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const queryLower = searchTerm;
        
        // Calculate relevance scores (same as SearchInput)
        const getRelevanceScore = (name: string, query: string) => {
          let score = 0;
          
          // Exact match gets highest score
          if (name === query) return 1000;
          
          // Starts with query gets high score
          if (name.startsWith(query)) score += 100;
          
          // Word boundary matches get medium-high score
          const words = name.split(/\s+/);
          const wordMatches = words.filter(word => word.startsWith(query)).length;
          score += wordMatches * 50;
          
          // Contains query gets lower score
          if (name.includes(query)) score += 10;
          
          // Shorter names get slight bonus (more specific)
          score += Math.max(0, 20 - name.length);
          
          return score;
        };
        
        const aScore = getRelevanceScore(aName, queryLower);
        const bScore = getRelevanceScore(bName, queryLower);
        
        // Higher score first
        if (aScore !== bScore) return bScore - aScore;
        
        // Alphabetical order for ties
        return aName.localeCompare(bName);
      });
    } else {
      // When no search term, sort alphabetically
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredExercises(filtered);
  }, [allExercises, selectedCategory, exerciseSearch]);


  const removeWorkout = (dayIndex: number, workoutId: number) => {
    const updatedDayWorkouts = [...dayWorkouts];
    updatedDayWorkouts[dayIndex].workouts = updatedDayWorkouts[dayIndex].workouts.filter(
      workout => workout.id !== workoutId
    );
    setDayWorkouts(updatedDayWorkouts);
  };

  // Removed selectExercise function - no longer needed


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
            activity_name: workout.exercise?.name,
            activity_type: workout.exercise?.logging_category || 'weighted',
          })),
        }));

      await routineService.createRoutineWithWorkoutPlan(routineData, workoutDaysForAPI);
      
      showToast.success('Success!', `Routine "${routineName}" created with ${totalWorkouts} workouts`);
      resetForm();
      onClose();
      onRoutineCreated();
    } catch (err: any) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      showToast.error('Error', err.response?.data?.detail || err.message || 'Failed to create routine');
    } finally {
      setLoading(false);
    }
  };

  // Removed renderExerciseSelector function - no longer needed
  const renderExerciseSelector = () => (
        <Modal
          visible={showExerciseSelector}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            setExerciseSearch('');
            setSelectedCategory(null);
            // Removed exercise selector functionality
            // Removed exercise selector functionality
          }}
        >
      <View style={styles.exerciseSelectorContainer}>
        <View style={styles.exerciseSelectorHeader}>
          <TouchableOpacity onPress={() => {
            setExerciseSearch('');
            setSelectedCategory(null);
            // Removed exercise selector functionality
            // Removed exercise selector functionality
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
          <Text style={styles.title}>Create Custom Routine</Text>
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

            {/* Search Bar */}
            <View style={styles.searchSection}>
              <View style={[
                styles.searchContainer,
                exerciseSearch.length > 0 && styles.searchContainerFocused
              ]}>
                <Ionicons 
                  name="search" 
                  size={18} 
                  color={exerciseSearch.length > 0 ? COLORS.primary.main : COLORS.text.secondary} 
                  style={styles.searchIcon} 
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search exercises..."
                  placeholderTextColor={COLORS.text.secondary}
                  value={exerciseSearch}
                  onChangeText={setExerciseSearch}
                />
                {exerciseSearch.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearSearchButton}
                    onPress={() => setExerciseSearch('')}
                  >
                    <Ionicons name="close-circle" size={18} color={COLORS.text.secondary} />
                  </TouchableOpacity>
                )}
                
                {/* Search Results Dropdown - positioned relative to search container */}
                {exerciseSearch.length > 0 && filteredExercises.length > 0 && (
                  <View style={styles.searchResultsContainer}>
                    <View style={styles.searchResultsDropdown}>
                      <View style={styles.searchResultsHeader}>
                        <Text style={styles.searchResultsTitle}>
                          {filteredExercises.length} result{filteredExercises.length !== 1 ? 's' : ''}
                        </Text>
                        <TouchableOpacity
                          style={styles.searchResultsCloseButton}
                          onPress={() => setExerciseSearch('')}
                        >
                          <Ionicons name="close" size={16} color={COLORS.text.secondary} />
                        </TouchableOpacity>
                      </View>
                      
                      <ScrollView 
                        style={styles.searchResultsList}
                        showsVerticalScrollIndicator={true}
                        keyboardShouldPersistTaps="handled"
                        bounces={false}
                      >
                        {filteredExercises.slice(0, 5).map((exercise) => (
                          <TouchableOpacity
                            key={exercise.id}
                            style={styles.searchResultItem}
                            onPress={() => {
                              // Create a new workout with the selected exercise
                              const newWorkout: Workout = {
                                id: Date.now(),
                                exercise: exercise,
                              };
                              
                              const updatedDayWorkouts = [...dayWorkouts];
                              updatedDayWorkouts[currentDay].workouts.push(newWorkout);
                              setDayWorkouts(updatedDayWorkouts);
                              
                              // Clear search
                              setExerciseSearch('');
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.searchResultItemText} numberOfLines={1}>
                              {exercise.name}
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color={COLORS.text.tertiary} />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Current Day Workouts */}
            <View style={styles.dayWorkouts}>
              {/* Day header removed - day is already shown in navigation above */}

              {dayWorkouts[currentDay].workouts.length === 0 ? (
                <View style={styles.noWorkouts}>
                  <Text style={styles.noWorkoutsText}>No workouts planned for this day</Text>
                  <Text style={styles.noWorkoutsSubtext}>Use the search bar above to find and add exercises</Text>
                </View>
              ) : (
                <View style={styles.workoutsList}>
                  {dayWorkouts[currentDay].workouts.map((workout, index) => (
                    <View key={workout.id} style={styles.workoutItem}>
                      <View style={styles.workoutContent}>
                        <View style={styles.workoutHeader}>
                          <View style={styles.exerciseTitleRow}>
                            <View style={styles.exerciseTitleLeft}>
                              <Text style={styles.exerciseNumber}>#{index + 1}</Text>
                              <Text style={styles.exerciseName} numberOfLines={1} ellipsizeMode="tail">
                                {workout.exercise ? workout.exercise.name : 'Select Exercise'}
                              </Text>
                            </View>
                            <View style={styles.exerciseTitleRight}>
                              {workout.exercise && workout.exercise.logging_category && (
                                <CategoryBadge 
                                  category={workout.exercise.logging_category} 
                                  size="small"
                                />
                              )}
                              <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => removeWorkout(currentDay, workout.id)}
                              >
                                <Ionicons name="trash" size={16} color={COLORS.error.main} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>

                        {/* Removed exercise name display - no longer needed */}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Removed exercise selector functionality */}
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
  createButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  createButtonText: {
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
  searchSection: {
    position: 'relative',
    zIndex: 1000,
    marginBottom: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.small,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    paddingHorizontal: SPACING.small,
    paddingVertical: 6,
    minHeight: 36,
    position: 'relative',
  },
  searchContainerFocused: {
    borderColor: COLORS.primary.main,
    backgroundColor: COLORS.background.primary,
  },
  searchIcon: {
    marginRight: SPACING.small,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.medium,
    color: COLORS.text.primary,
    paddingVertical: 0,
  },
  clearSearchButton: {
    marginLeft: SPACING.small,
    padding: 2,
  },
  searchResultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 10,
    maxHeight: 200,
    marginTop: SPACING.xs,
  },
  searchResultsDropdown: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    ...SHADOWS.medium,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  searchResultsTitle: {
    fontSize: FONT_SIZE.small,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  searchResultsCloseButton: {
    padding: 2,
  },
  searchResultsList: {
    // No height restrictions - shows all 5 items
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
    backgroundColor: COLORS.background.primary,
  },
  searchResultItemText: {
    flex: 1,
    fontSize: FONT_SIZE.medium,
    color: COLORS.text.primary,
    marginRight: SPACING.small,
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
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    marginBottom: SPACING.small,
    width: '100%',
  },
  workoutContent: {
    padding: SPACING.small,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  exerciseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    flexWrap: 'nowrap',
  },
  exerciseTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flex: 1,
    minWidth: 0,
  },
  exerciseTitleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flexShrink: 0,
  },
  exerciseNumber: {
    fontSize: FONT_SIZE.medium,
    fontWeight: '600',
    color: COLORS.text.secondary,
    minWidth: 20,
  },
  exerciseName: {
    fontSize: FONT_SIZE.medium,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
    minHeight: 20,
    flexShrink: 1,
    flexBasis: 0,
    margin: 0,
    padding: 0,
  },
  actionButton: {
    padding: 2,
    borderRadius: BORDER_RADIUS.small,
    backgroundColor: COLORS.background.primary,
    flexShrink: 0,
    marginTop: -1,
    minWidth: 20,
  },
  exerciseSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    borderRadius: BORDER_RADIUS.small,
    paddingHorizontal: SPACING.small,
    paddingVertical: SPACING.xs,
    marginTop: SPACING.xs,
  },
  exerciseSelectorText: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
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
