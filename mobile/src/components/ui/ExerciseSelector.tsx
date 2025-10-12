import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../../theme/constants';
import { CategoryBadge } from './Badge';
import SearchInput from './SearchInput';
import FilterBar from './FilterBar';
import { searchInputConfigs } from './SearchInput.utils';
import { filterBarConfigs, commonFilterOptions } from './FilterBar.utils';

export interface Exercise {
  id: number;
  name: string;
  category?: string;
  difficulty?: string;
  calories_per_minute?: number;
  description?: string;
  logging_category?: string;
  exercise_name?: string;
}

export interface ExerciseSelectorProps {
  // Core props
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  
  // Selection configuration
  allowMultiple?: boolean;
  selectedExercises?: Exercise[];
  onMultipleSelect?: (exercises: Exercise[]) => void;
  
  // Filtering and search
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  categoryFilter?: string;
  onCategoryFilterChange?: (category: string) => void;
  selectedCategories?: string[];
  onCategoriesChange?: (categories: string[]) => void;
  
  // Data source
  exercises: Exercise[];
  loading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  
  // Display options
  showCategories?: boolean;
  showDifficulty?: boolean;
  showCalories?: boolean;
  showDescription?: boolean;
  
  // Styling
  containerStyle?: any;
  itemStyle?: any;
  searchStyle?: any;
  
  // Callbacks
  onExercisePress?: (exercise: Exercise) => void;
  onExerciseLongPress?: (exercise: Exercise) => void;
  
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export default function ExerciseSelector({
  visible,
  onClose,
  onSelect,
  allowMultiple = false,
  selectedExercises = [],
  onMultipleSelect,
  searchQuery = '',
  onSearchChange,
  categoryFilter = '',
  onCategoryFilterChange,
  selectedCategories = [],
  onCategoriesChange,
  exercises,
  loading = false,
  onRefresh,
  refreshing = false,
  showCategories = true,
  showDifficulty = true,
  showCalories = false,
  showDescription = false,
  containerStyle,
  itemStyle,
  searchStyle,
  onExercisePress,
  onExerciseLongPress,
  accessibilityLabel,
  accessibilityHint,
}: ExerciseSelectorProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [localCategoryFilter, setLocalCategoryFilter] = useState(categoryFilter);
  const [localSelectedCategories, setLocalSelectedCategories] = useState(selectedCategories);

  // Update local state when props change
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setLocalCategoryFilter(categoryFilter);
  }, [categoryFilter]);

  useEffect(() => {
    setLocalSelectedCategories(selectedCategories);
  }, [selectedCategories]);

  // Filter exercises based on search and category
  const filteredExercises = useMemo(() => {
    let filtered = exercises;

    // Filter by search query
    if (localSearchQuery.trim()) {
      const query = localSearchQuery.toLowerCase();
      filtered = filtered.filter(exercise => 
        exercise.name.toLowerCase().includes(query) ||
        exercise.exercise_name?.toLowerCase().includes(query) ||
        exercise.description?.toLowerCase().includes(query)
      );
    }

    // Filter by category (legacy single category)
    if (localCategoryFilter) {
      filtered = filtered.filter(exercise => 
        exercise.category === localCategoryFilter ||
        exercise.logging_category === localCategoryFilter
      );
    }

    // Filter by multiple categories
    if (localSelectedCategories.length > 0) {
      filtered = filtered.filter(exercise => 
        localSelectedCategories.some(cat => 
          exercise.category === cat || exercise.logging_category === cat
        )
      );
    }

    return filtered;
  }, [exercises, localSearchQuery, localCategoryFilter, localSelectedCategories]);

  // Get unique categories
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    exercises.forEach(exercise => {
      if (exercise.category) categorySet.add(exercise.category);
      if (exercise.logging_category) categorySet.add(exercise.logging_category);
    });
    return Array.from(categorySet).sort();
  }, [exercises]);

  // Create filter options for categories
  const categoryFilterOptions = useMemo(() => {
    return categories.map(category => ({
      id: category,
      label: category,
      value: category,
      icon: 'fitness-outline' as const,
    }));
  }, [categories]);

  // Handle search change
  const handleSearchChange = useCallback((query: string) => {
    setLocalSearchQuery(query);
    onSearchChange?.(query);
  }, [onSearchChange]);

  // Handle category filter change
  const handleCategoryFilterChange = useCallback((category: string) => {
    const newCategory = category === localCategoryFilter ? '' : category;
    setLocalCategoryFilter(newCategory);
    onCategoryFilterChange?.(newCategory);
  }, [localCategoryFilter, onCategoryFilterChange]);

  // Handle multiple category selection change
  const handleCategoriesChange = useCallback((categories: string[]) => {
    setLocalSelectedCategories(categories);
    onCategoriesChange?.(categories);
  }, [onCategoriesChange]);

  // Handle exercise selection
  const handleExerciseSelect = useCallback((exercise: Exercise) => {
    if (allowMultiple) {
      const isSelected = selectedExercises.some(selected => selected.id === exercise.id);
      let newSelection;
      
      if (isSelected) {
        newSelection = selectedExercises.filter(selected => selected.id !== exercise.id);
      } else {
        newSelection = [...selectedExercises, exercise];
      }
      
      onMultipleSelect?.(newSelection);
    } else {
      onSelect(exercise);
    }
    
    onExercisePress?.(exercise);
  }, [allowMultiple, selectedExercises, onSelect, onMultipleSelect, onExercisePress]);

  // Handle exercise long press
  const handleExerciseLongPress = useCallback((exercise: Exercise) => {
    onExerciseLongPress?.(exercise);
  }, [onExerciseLongPress]);

  // Check if exercise is selected
  const isExerciseSelected = useCallback((exercise: Exercise) => {
    return selectedExercises.some(selected => selected.id === exercise.id);
  }, [selectedExercises]);

  // Render exercise item
  const renderExerciseItem = useCallback(({ item: exercise }: { item: Exercise }) => {
    const isSelected = isExerciseSelected(exercise);
    const displayName = exercise.name || exercise.exercise_name || 'Unknown Exercise';
    const displayCategory = exercise.category || exercise.logging_category || '';

    return (
      <TouchableOpacity
        style={[
          styles.exerciseItem,
          isSelected && styles.exerciseItemSelected,
          itemStyle,
        ]}
        onPress={() => handleExerciseSelect(exercise)}
        onLongPress={() => handleExerciseLongPress(exercise)}
        accessibilityLabel={`${displayName} exercise`}
        accessibilityHint={isSelected ? 'Tap to deselect' : 'Tap to select'}
        accessibilityState={{ selected: isSelected }}
      >
        <View style={styles.exerciseItemContent}>
          {/* Exercise name and category */}
          <View style={styles.exerciseHeader}>
            <Text style={[styles.exerciseName, isSelected && styles.exerciseNameSelected]}>
              {displayName}
            </Text>
            {showCategories && displayCategory && (
              <CategoryBadge
                category={displayCategory}
                size="small"
                outline={!isSelected}
              />
            )}
          </View>

          {/* Exercise details */}
          <View style={styles.exerciseDetails}>
            {showDifficulty && exercise.difficulty && (
              <View style={styles.detailItem}>
                <Ionicons name="fitness" size={14} color={COLORS.text.secondary} />
                <Text style={styles.detailText}>{exercise.difficulty}</Text>
              </View>
            )}
            
            {showCalories && exercise.calories_per_minute && (
              <View style={styles.detailItem}>
                <Ionicons name="flame" size={14} color={COLORS.text.secondary} />
                <Text style={styles.detailText}>{exercise.calories_per_minute} cal/min</Text>
              </View>
            )}
          </View>

          {/* Description */}
          {showDescription && exercise.description && (
            <Text style={styles.exerciseDescription} numberOfLines={2}>
              {exercise.description}
            </Text>
          )}

          {/* Selection indicator */}
          {isSelected && (
            <View style={styles.selectionIndicator}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary.main} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [
    isExerciseSelected,
    showCategories,
    showDifficulty,
    showCalories,
    showDescription,
    handleExerciseSelect,
    handleExerciseLongPress,
    itemStyle,
  ]);


  // Render empty state
  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyState}>
        <Ionicons name="fitness-outline" size={48} color={COLORS.text.disabled} />
        <Text style={styles.emptyStateTitle}>No exercises found</Text>
        <Text style={styles.emptyStateSubtitle}>
          {localSearchQuery ? 'Try adjusting your search terms' : 'No exercises available'}
        </Text>
      </View>
    );
  };

  // Render loading state
  const renderLoadingState = () => {
    if (!loading) return null;

    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="large" color={COLORS.primary.main} />
        <Text style={styles.loadingText}>Loading exercises...</Text>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Search */}
      <View style={[styles.searchContainer, searchStyle]}>
        <SearchInput
          value={localSearchQuery}
          onChangeText={handleSearchChange}
          onSearch={handleSearchChange}
          placeholder="Search exercises..."
          testID="exercise-search"
          {...searchInputConfigs.exercise}
        />
      </View>

      {/* Category Filter */}
      {showCategories && categoryFilterOptions.length > 0 && (
        <View style={styles.categoryFilter}>
          <FilterBar
            options={categoryFilterOptions}
            selectedValues={localSelectedCategories}
            onSelectionChange={handleCategoriesChange}
            testID="exercise-category-filter"
            {...filterBarConfigs.exerciseCategories}
          />
        </View>
      )}

      {/* Exercise List */}
      <View style={styles.listContainer}>
        {loading ? (
          renderLoadingState()
        ) : (
          <FlatList
            data={filteredExercises}
            renderItem={renderExerciseItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[COLORS.primary.main]}
                  tintColor={COLORS.primary.main}
                />
              ) : undefined
            }
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={styles.listContent}
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={accessibilityHint}
          />
        )}
      </View>

      {/* Selection Summary */}
      {allowMultiple && selectedExercises.length > 0 && (
        <View style={styles.selectionSummary}>
          <Text style={styles.selectionSummaryText}>
            {selectedExercises.length} exercise{selectedExercises.length !== 1 ? 's' : ''} selected
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  searchContainer: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  categoryFilter: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.md,
  },
  exerciseItem: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    ...SHADOWS.small,
  },
  exerciseItemSelected: {
    borderColor: COLORS.primary.main,
    backgroundColor: COLORS.primary.light,
  },
  exerciseItemContent: {
    padding: SPACING.md,
    position: 'relative',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  exerciseName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.text.primary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  exerciseNameSelected: {
    color: COLORS.primary.main,
  },
  exerciseDetails: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xs,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  detailText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text.secondary,
  },
  exerciseDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  selectionIndicator: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.text.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyStateSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
  },
  selectionSummary: {
    padding: SPACING.md,
    backgroundColor: COLORS.primary.light,
    borderTopWidth: 1,
    borderTopColor: COLORS.primary.main,
  },
  selectionSummaryText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.primary.main,
    textAlign: 'center',
  },
});
