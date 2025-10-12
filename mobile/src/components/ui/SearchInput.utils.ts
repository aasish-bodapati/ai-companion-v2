// Utility functions and presets for SearchInput component

import { SearchInputSize, SearchInputVariant, SearchInputState } from './SearchInput';


export const searchInputPresets = {
  // Small search inputs
  small: {
    size: 'small' as SearchInputSize,
    variant: 'default' as SearchInputVariant,
    debounceMs: 300,
    minLength: 0,
    clearable: true,
    searchable: true,
  },

  // Medium search inputs
  medium: {
    size: 'medium' as SearchInputSize,
    variant: 'default' as SearchInputVariant,
    debounceMs: 300,
    minLength: 0,
    clearable: true,
    searchable: true,
  },

  // Large search inputs
  large: {
    size: 'large' as SearchInputSize,
    variant: 'default' as SearchInputVariant,
    debounceMs: 300,
    minLength: 0,
    clearable: true,
    searchable: true,
  },

  // Minimal search inputs
  minimal: {
    size: 'medium' as SearchInputSize,
    variant: 'minimal' as SearchInputVariant,
    debounceMs: 500,
    minLength: 1,
    clearable: true,
    searchable: true,
  },

  // Filled search inputs
  filled: {
    size: 'medium' as SearchInputSize,
    variant: 'filled' as SearchInputVariant,
    debounceMs: 300,
    minLength: 0,
    clearable: true,
    searchable: true,
  },

  // Outlined search inputs
  outlined: {
    size: 'medium' as SearchInputSize,
    variant: 'outlined' as SearchInputVariant,
    debounceMs: 300,
    minLength: 0,
    clearable: true,
    searchable: true,
  },
};

// Common search input configurations
export const searchInputConfigs = {
  // General search
  general: {
    ...searchInputPresets.medium,
    placeholder: 'Search...',
    leftIcon: 'search-outline' as const,
    returnKeyType: 'search' as const,
  },

  // Exercise search
  exercise: {
    ...searchInputPresets.medium,
    placeholder: 'Search exercises...',
    leftIcon: 'fitness-outline' as const,
    returnKeyType: 'search' as const,
    debounceMs: 200,
    minLength: 1,
  },

  // Workout search
  workout: {
    ...searchInputPresets.medium,
    placeholder: 'Search workouts...',
    leftIcon: 'barbell-outline' as const,
    returnKeyType: 'search' as const,
    debounceMs: 300,
    minLength: 1,
  },

  // Routine search
  routine: {
    ...searchInputPresets.medium,
    placeholder: 'Search routines...',
    leftIcon: 'list-outline' as const,
    returnKeyType: 'search' as const,
    debounceMs: 300,
    minLength: 1,
  },

  // Nutrition search
  nutrition: {
    ...searchInputPresets.medium,
    placeholder: 'Search food...',
    leftIcon: 'nutrition-outline' as const,
    returnKeyType: 'search' as const,
    debounceMs: 200,
    minLength: 1,
  },

  // User search
  user: {
    ...searchInputPresets.medium,
    placeholder: 'Search users...',
    leftIcon: 'people-outline' as const,
    returnKeyType: 'search' as const,
    debounceMs: 300,
    minLength: 1,
  },

  // Quick search (minimal)
  quick: {
    ...searchInputPresets.minimal,
    placeholder: 'Quick search...',
    leftIcon: 'search-outline' as const,
    returnKeyType: 'search' as const,
    debounceMs: 100,
    minLength: 0,
  },

  // Filter search
  filter: {
    ...searchInputPresets.small,
    placeholder: 'Filter...',
    leftIcon: 'filter-outline' as const,
    returnKeyType: 'done' as const,
    debounceMs: 200,
    minLength: 0,
  },

  // Location search
  location: {
    ...searchInputPresets.medium,
    placeholder: 'Search location...',
    leftIcon: 'location-outline' as const,
    returnKeyType: 'search' as const,
    debounceMs: 300,
    minLength: 1,
  },

  // Tag search
  tag: {
    ...searchInputPresets.small,
    placeholder: 'Search tags...',
    leftIcon: 'pricetag-outline' as const,
    returnKeyType: 'done' as const,
    debounceMs: 200,
    minLength: 0,
  },
};

// Helper function to get search input configuration
export const getSearchInputConfig = (type: keyof typeof searchInputConfigs) => {
  return searchInputConfigs[type];
};

// Helper function to create custom search input configuration
export const createSearchInputConfig = (
  baseType: keyof typeof searchInputPresets,
  overrides: Partial<typeof searchInputPresets[keyof typeof searchInputPresets]> = {}
) => {
  return {
    ...searchInputPresets[baseType],
    ...overrides,
  };
};

// Search input utilities
export const searchInputUtils = {
  // Get appropriate size based on context
  getSizeForContext: (context: 'header' | 'modal' | 'card' | 'list' | 'form') => {
    const sizeMap: Record<string, SearchInputSize> = {
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
    const variantMap: Record<string, SearchInputVariant> = {
      'minimal': 'minimal',
      'material': 'filled',
      'ios': 'outlined',
      'custom': 'default',
    };

    return variantMap[design] || 'default';
  },

  // Get appropriate debounce time based on search type
  getDebounceForSearchType: (searchType: 'instant' | 'fast' | 'normal' | 'slow') => {
    const debounceMap: Record<string, number> = {
      'instant': 100,
      'fast': 200,
      'normal': 300,
      'slow': 500,
    };

    return debounceMap[searchType] || 300;
  },

  // Get appropriate icon based on search context
  getIconForContext: (context: string) => {
    const iconMap: Record<string, string> = {
      'exercises': 'fitness-outline',
      'workouts': 'barbell-outline',
      'routines': 'list-outline',
      'nutrition': 'nutrition-outline',
      'users': 'people-outline',
      'location': 'location-outline',
      'tags': 'pricetag-outline',
      'filter': 'filter-outline',
      'general': 'search-outline',
    };

    return iconMap[context] || 'search-outline';
  },

  // Validate search input
  validateSearchInput: (value: string, minLength: number = 0, maxLength?: number) => {
    if (value.length < minLength) {
      return { isValid: false, error: `Minimum ${minLength} characters required` };
    }

    if (maxLength && value.length > maxLength) {
      return { isValid: false, error: `Maximum ${maxLength} characters allowed` };
    }

    return { isValid: true, error: null };
  },

  // Format search query
  formatSearchQuery: (query: string) => {
    return query.trim().toLowerCase();
  },

  // Highlight search terms
  highlightSearchTerms: (text: string, searchTerm: string) => {
    if (!searchTerm) return text;

    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '**$1**');
  },
};

// Search input animations
export const searchInputAnimations = {
  // Focus animation
  focus: {
    scale: 1.02,
    duration: 200,
  },

  // Blur animation
  blur: {
    scale: 1,
    duration: 200,
  },

  // Clear animation
  clear: {
    opacity: 0,
    duration: 150,
  },

  // Search animation
  search: {
    scale: 0.95,
    duration: 100,
  },
};

// Search input colors
export const searchInputColors = {
  primary: '#6366f1',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  muted: '#9ca3af',
  disabled: '#d1d5db',
};
