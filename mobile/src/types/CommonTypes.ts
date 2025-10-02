/**
 * Common types and interfaces used across the mobile app
 * This provides shared type definitions to reduce duplication
 */

// Common form field types
export type FormFieldType = 'text' | 'email' | 'password' | 'number' | 'phone' | 'date' | 'select' | 'multiselect' | 'textarea';

// Common button variants
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'danger';

// Common modal variants
export type ModalVariant = 'default' | 'bottomSheet' | 'fullScreen' | 'centered';

// Common modal sizes
export type ModalSize = 'small' | 'medium' | 'large' | 'full';

// Common loading states
export interface LoadingState {
  isLoading: boolean;
  error?: string;
  data?: any;
}

// Common form state
export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

// Common search state
export interface SearchState<T> {
  query: string;
  results: T[];
  isSearching: boolean;
  hasSearched: boolean;
  error?: string;
}

// Common pagination state
export interface PaginationState {
  page: number;
  size: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
  isLoading: boolean;
}

// Common item selection state
export interface SelectionState<T> {
  selectedItems: T[];
  isSelecting: boolean;
  selectAll: boolean;
}

// Common date range
export interface DateRange {
  start: string;
  end: string;
}

// Common time period
export type TimePeriod = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom';

// Common gender options
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

// Common activity levels
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

// Common meal types
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// Common workout types
export type WorkoutType = 'cardio' | 'strength' | 'flexibility' | 'sports' | 'other';

// Common intensity levels
export type IntensityLevel = 'low' | 'medium' | 'high';

// Common difficulty levels
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

// Common units
export type WeightUnit = 'kg' | 'lbs';
export type DistanceUnit = 'km' | 'miles' | 'm' | 'ft';
export type VolumeUnit = 'ml' | 'oz' | 'l' | 'cups';
export type TemperatureUnit = 'celsius' | 'fahrenheit';

// Common measurement types
export interface Measurement {
  value: number;
  unit: string;
  timestamp: string;
}

// Common goal types
export interface Goal {
  id: number;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline?: string;
  is_achieved: boolean;
  created_at: string;
  updated_at: string;
}

// Common achievement types
export interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  unlocked_at: string;
  category: string;
}

// Common notification types
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

// Common user preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  units: {
    weight: WeightUnit;
    distance: DistanceUnit;
    volume: VolumeUnit;
    temperature: TemperatureUnit;
  };
  notifications: {
    enabled: boolean;
    workout_reminders: boolean;
    meal_reminders: boolean;
    goal_achievements: boolean;
  };
}

// Common API error types
export type ApiErrorType = 'validation' | 'authentication' | 'authorization' | 'not_found' | 'server_error' | 'network_error';

// Common validation rule types
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | undefined;
  message?: string;
}

// Common form field configuration
export interface FormFieldConfig {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required?: boolean;
  validation?: ValidationRule;
  options?: Array<{ label: string; value: any }>;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  autoFocus?: boolean;
  editable?: boolean;
  maxLength?: number;
  minLength?: number;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  selectTextOnFocus?: boolean;
  textContentType?: 'none' | 'URL' | 'addressCity' | 'addressCityAndState' | 'addressState' | 'countryName' | 'creditCardNumber' | 'emailAddress' | 'familyName' | 'fullStreetAddress' | 'givenName' | 'jobTitle' | 'location' | 'middleName' | 'name' | 'namePrefix' | 'nameSuffix' | 'nickname' | 'organizationName' | 'postalCode' | 'streetAddressLine1' | 'streetAddressLine2' | 'sublocality' | 'telephoneNumber' | 'username' | 'password' | 'newPassword' | 'oneTimeCode';
}
