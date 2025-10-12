// Utility functions and presets for FilterBar component

import { FilterBarSize, FilterBarVariant, FilterBarLayout, FilterOption } from './FilterBar';

export const filterBarPresets = {
  // Small filter bars
  small: {
    size: 'small' as FilterBarSize,
    variant: 'default' as FilterBarVariant,
    layout: 'horizontal' as FilterBarLayout,
    multiple: true,
    clearable: true,
  },

  // Medium filter bars
  medium: {
    size: 'medium' as FilterBarSize,
    variant: 'default' as FilterBarVariant,
    layout: 'horizontal' as FilterBarLayout,
    multiple: true,
    clearable: true,
  },

  // Large filter bars
  large: {
    size: 'large' as FilterBarSize,
    variant: 'default' as FilterBarVariant,
    layout: 'horizontal' as FilterBarLayout,
    multiple: true,
    clearable: true,
  },

  // Minimal filter bars
  minimal: {
    size: 'medium' as FilterBarSize,
    variant: 'minimal' as FilterBarVariant,
    layout: 'horizontal' as FilterBarLayout,
    multiple: true,
    clearable: true,
  },

  // Pills filter bars
  pills: {
    size: 'medium' as FilterBarSize,
    variant: 'pills' as FilterBarVariant,
    layout: 'wrap' as FilterBarLayout,
    multiple: true,
    clearable: true,
  },

  // Chips filter bars
  chips: {
    size: 'medium' as FilterBarSize,
    variant: 'chips' as FilterBarVariant,
    layout: 'wrap' as FilterBarLayout,
    multiple: true,
    clearable: true,
  },
};

// Common filter bar configurations
export const filterBarConfigs = {
  // Exercise categories
  exerciseCategories: {
    ...filterBarPresets.pills,
    multiple: true,
    clearable: true,
    maxSelections: 5,
  },

  // Workout types
  workoutTypes: {
    ...filterBarPresets.chips,
    multiple: true,
    clearable: true,
    maxSelections: 3,
  },

  // Difficulty levels
  difficultyLevels: {
    ...filterBarPresets.medium,
    multiple: false,
    clearable: true,
    allowDeselect: true,
  },

  // Body parts
  bodyParts: {
    ...filterBarPresets.pills,
    multiple: true,
    clearable: true,
    maxSelections: 8,
  },

  // Equipment
  equipment: {
    ...filterBarPresets.chips,
    multiple: true,
    clearable: true,
    maxSelections: 6,
  },

  // Time periods
  timePeriods: {
    ...filterBarPresets.medium,
    multiple: false,
    clearable: true,
    allowDeselect: true,
  },

  // Nutrition categories
  nutritionCategories: {
    ...filterBarPresets.pills,
    multiple: true,
    clearable: true,
    maxSelections: 4,
  },

  // Mood levels
  moodLevels: {
    ...filterBarPresets.chips,
    multiple: false,
    clearable: true,
    allowDeselect: true,
  },

  // Activity types
  activityTypes: {
    ...filterBarPresets.pills,
    multiple: true,
    clearable: true,
    maxSelections: 6,
  },

  // Status filters
  statusFilters: {
    ...filterBarPresets.medium,
    multiple: true,
    clearable: true,
    maxSelections: 3,
  },
};

// Helper function to get filter bar configuration
export const getFilterBarConfig = (type: keyof typeof filterBarConfigs) => {
  return filterBarConfigs[type];
};

// Helper function to create custom filter bar configuration
export const createFilterBarConfig = (
  baseType: keyof typeof filterBarPresets,
  overrides: Partial<typeof filterBarPresets[keyof typeof filterBarPresets]> = {}
) => {
  return {
    ...filterBarPresets[baseType],
    ...overrides,
  };
};

// Filter bar utilities
export const filterBarUtils = {
  // Get appropriate size based on context
  getSizeForContext: (context: 'header' | 'modal' | 'card' | 'list' | 'form') => {
    const sizeMap: Record<string, FilterBarSize> = {
      'header': 'small',
      'modal': 'medium',
      'card': 'small',
      'list': 'medium',
      'form': 'medium',
    };

    return sizeMap[context] || 'medium';
  },

  // Get appropriate variant based on design system
  getVariantForDesign: (design: 'minimal' | 'material' | 'ios' | 'custom') => {
    const variantMap: Record<string, FilterBarVariant> = {
      'minimal': 'minimal',
      'material': 'chips',
      'ios': 'pills',
      'custom': 'default',
    };

    return variantMap[design] || 'default';
  },

  // Get appropriate layout based on number of options
  getLayoutForOptions: (optionCount: number, availableWidth?: number) => {
    if (optionCount <= 3) return 'horizontal';
    if (optionCount <= 6) return 'wrap';
    return 'horizontal';
  },

  // Create filter options from data
  createFilterOptions: <T>(
    data: T[],
    labelKey: keyof T,
    valueKey: keyof T,
    iconKey?: keyof T,
    colorKey?: keyof T,
    countKey?: keyof T
  ): FilterOption[] => {
    return data.map((item, index) => ({
      id: String(item[valueKey] || index),
      label: String(item[labelKey] || ''),
      value: item[valueKey],
      icon: iconKey ? (item[iconKey] as keyof typeof import('@expo/vector-icons').Ionicons.glyphMap) : undefined,
      color: colorKey ? String(item[colorKey]) : undefined,
      count: countKey ? Number(item[countKey]) : undefined,
    }));
  },

  // Filter options by search term
  filterOptions: (options: FilterOption[], searchTerm: string): FilterOption[] => {
    if (!searchTerm) return options;
    
    const term = searchTerm.toLowerCase();
    return options.filter(option => 
      option.label.toLowerCase().includes(term)
    );
  },

  // Sort options by label
  sortOptions: (options: FilterOption[]): FilterOption[] => {
    return [...options].sort((a, b) => a.label.localeCompare(b.label));
  },

  // Sort options by count (descending)
  sortOptionsByCount: (options: FilterOption[]): FilterOption[] => {
    return [...options].sort((a, b) => (b.count || 0) - (a.count || 0));
  },

  // Get selected options
  getSelectedOptions: (options: FilterOption[], selectedValues: string[]): FilterOption[] => {
    return options.filter(option => selectedValues.includes(option.id));
  },

  // Get unselected options
  getUnselectedOptions: (options: FilterOption[], selectedValues: string[]): FilterOption[] => {
    return options.filter(option => !selectedValues.includes(option.id));
  },

  // Validate selection
  validateSelection: (
    selectedValues: string[],
    maxSelections?: number,
    minSelections: number = 0
  ) => {
    if (selectedValues.length < minSelections) {
      return { isValid: false, error: `Minimum ${minSelections} selections required` };
    }
    
    if (maxSelections && selectedValues.length > maxSelections) {
      return { isValid: false, error: `Maximum ${maxSelections} selections allowed` };
    }
    
    return { isValid: true, error: null };
  },

  // Get selection summary
  getSelectionSummary: (selectedOptions: FilterOption[], maxDisplay: number = 3): string => {
    if (selectedOptions.length === 0) return 'No filters selected';
    if (selectedOptions.length <= maxDisplay) {
      return selectedOptions.map(option => option.label).join(', ');
    }
    
    const displayed = selectedOptions.slice(0, maxDisplay);
    const remaining = selectedOptions.length - maxDisplay;
    return `${displayed.map(option => option.label).join(', ')} +${remaining} more`;
  },
};

// Common filter option sets
export const commonFilterOptions = {
  // Exercise categories
  exerciseCategories: [
    { id: 'strength', label: 'Strength', icon: 'barbell-outline', color: '#ef4444' },
    { id: 'cardio', label: 'Cardio', icon: 'heart-outline', color: '#f59e0b' },
    { id: 'flexibility', label: 'Flexibility', icon: 'body-outline', color: '#10b981' },
    { id: 'balance', label: 'Balance', icon: 'walk-outline', color: '#3b82f6' },
    { id: 'sports', label: 'Sports', icon: 'football-outline', color: '#8b5cf6' },
    { id: 'yoga', label: 'Yoga', icon: 'leaf-outline', color: '#06b6d4' },
  ],

  // Difficulty levels
  difficultyLevels: [
    { id: 'beginner', label: 'Beginner', color: '#10b981' },
    { id: 'intermediate', label: 'Intermediate', color: '#f59e0b' },
    { id: 'advanced', label: 'Advanced', color: '#ef4444' },
  ],

  // Body parts
  bodyParts: [
    { id: 'chest', label: 'Chest', icon: 'body-outline' },
    { id: 'back', label: 'Back', icon: 'body-outline' },
    { id: 'shoulders', label: 'Shoulders', icon: 'body-outline' },
    { id: 'arms', label: 'Arms', icon: 'body-outline' },
    { id: 'legs', label: 'Legs', icon: 'body-outline' },
    { id: 'core', label: 'Core', icon: 'body-outline' },
    { id: 'glutes', label: 'Glutes', icon: 'body-outline' },
    { id: 'calves', label: 'Calves', icon: 'body-outline' },
  ],

  // Equipment
  equipment: [
    { id: 'bodyweight', label: 'Bodyweight', icon: 'person-outline' },
    { id: 'dumbbells', label: 'Dumbbells', icon: 'fitness-outline' },
    { id: 'barbell', label: 'Barbell', icon: 'barbell-outline' },
    { id: 'kettlebell', label: 'Kettlebell', icon: 'fitness-outline' },
    { id: 'resistance-bands', label: 'Resistance Bands', icon: 'fitness-outline' },
    { id: 'machine', label: 'Machine', icon: 'fitness-outline' },
  ],

  // Time periods
  timePeriods: [
    { id: 'today', label: 'Today', icon: 'today-outline' },
    { id: 'week', label: 'This Week', icon: 'calendar-outline' },
    { id: 'month', label: 'This Month', icon: 'calendar-outline' },
    { id: 'year', label: 'This Year', icon: 'calendar-outline' },
  ],

  // Mood levels
  moodLevels: [
    { id: '1', label: '😢 Very Low', color: '#ef4444' },
    { id: '2', label: '😔 Low', color: '#f59e0b' },
    { id: '3', label: '😐 Neutral', color: '#6b7280' },
    { id: '4', label: '😊 Good', color: '#10b981' },
    { id: '5', label: '😄 Great', color: '#3b82f6' },
  ],
};

// Filter bar animations
export const filterBarAnimations = {
  // Option selection animation
  select: {
    scale: 0.95,
    duration: 100,
  },

  // Option deselection animation
  deselect: {
    scale: 1,
    duration: 100,
  },

  // Clear all animation
  clear: {
    opacity: 0.5,
    duration: 200,
  },

  // Expand animation
  expand: {
    height: 'auto',
    duration: 300,
  },
};

// Filter bar colors
export const filterBarColors = {
  primary: '#6366f1',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  muted: '#9ca3af',
  disabled: '#d1d5db',
};
