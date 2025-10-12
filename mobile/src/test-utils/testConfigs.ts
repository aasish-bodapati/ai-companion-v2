/**
 * Test configuration objects for components
 */

// Filter bar configurations
export const filterBarConfigs = {
  exerciseCategories: {
    options: [
      { id: 'strength', label: 'Strength' },
      { id: 'cardio', label: 'Cardio' },
      { id: 'flexibility', label: 'Flexibility' },
    ],
    multiSelect: true,
    placeholder: 'Select categories',
  },
  equipment: {
    options: [
      { id: 'bodyweight', label: 'Bodyweight' },
      { id: 'dumbbells', label: 'Dumbbells' },
      { id: 'barbell', label: 'Barbell' },
    ],
    multiSelect: false,
    placeholder: 'Select equipment',
  },
};

// Input presets
export const inputPresets = {
  search: {
    keyboardType: 'default',
    autoCapitalize: 'words',
    autoCorrect: true,
  },
  sets: {
    keyboardType: 'numeric',
    autoCapitalize: 'none',
    autoCorrect: false,
  },
  reps: {
    keyboardType: 'numeric',
    autoCapitalize: 'none',
    autoCorrect: false,
  },
  weight: {
    keyboardType: 'numeric',
    autoCapitalize: 'none',
    autoCorrect: false,
  },
  duration: {
    keyboardType: 'numeric',
    autoCapitalize: 'none',
    autoCorrect: false,
  },
};

// Modal configurations
export const modalConfigs = {
  workoutLogging: {
    size: 'large',
    showCloseButton: true,
    closeOnBackdropPress: false,
  },
  nutritionLogging: {
    size: 'medium',
    showCloseButton: true,
    closeOnBackdropPress: true,
  },
  routineSelection: {
    size: 'large',
    showCloseButton: true,
    closeOnBackdropPress: true,
  },
};

// Chart configurations
export const chartConfigs = {
  lineChart: {
    showGrid: true,
    showLegend: true,
    showDataPoints: true,
  },
  barChart: {
    showGrid: true,
    showLegend: false,
    showDataPoints: false,
  },
  pieChart: {
    showLegend: true,
    showPercentage: true,
  },
};

// Loading state configurations
export const loadingConfigs = {
  default: {
    size: 'large',
    color: '#007AFF',
  },
  small: {
    size: 'small',
    color: '#007AFF',
  },
  custom: {
    size: 'large',
    color: '#FF3B30',
  },
};

// Empty state configurations
export const emptyStateConfigs = {
  noData: {
    icon: 'ios-information-circle-outline',
    title: 'No data',
    message: 'There is no data to display',
  },
  noResults: {
    icon: 'ios-search-outline',
    title: 'No results',
    message: 'No results found for your search',
  },
  error: {
    icon: 'ios-warning-outline',
    title: 'Error',
    message: 'Something went wrong',
  },
};

// Confirmation dialog configurations
export const confirmationConfigs = {
  delete: {
    icon: 'ios-trash-outline',
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    confirmColor: '#FF3B30',
  },
  save: {
    icon: 'ios-save-outline',
    title: 'Save Changes',
    message: 'Do you want to save your changes?',
    confirmText: 'Save',
    cancelText: 'Cancel',
    confirmColor: '#007AFF',
  },
};
