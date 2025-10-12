
import { View, StyleSheet, Text } from 'react-native';
import React from 'react';

import { UnifiedForm, formPresets } from './UnifiedForm';
import { UnifiedInput, inputPresets } from './UnifiedInput';
import { COLORS, SPACING } from '../../theme/constants';

import { DebugUtils } from '../../utils/debugUtils';

// Example: User Registration Form
interface RegistrationData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  bio: string;
  termsAccepted: boolean;
}

export function RegistrationFormExample() {
  const handleSubmit = async (data: RegistrationData) => {
    DebugUtils.log('Registration data:', data);
    // Handle registration logic
  };

  const validationRules = {
    fullName: {
      required: true,
      minLength: 2,
      message: 'Full name must be at least 2 characters',
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address',
    },
    password: {
      required: true,
      minLength: 8,
      message: 'Password must be at least 8 characters',
    },
    confirmPassword: {
      required: true,
      custom: (value: string, allValues: RegistrationData) => {
        return value === allValues.password ? null : 'Passwords do not match';
      },
    },
    phone: {
      pattern: /^[\+]?[1-9][\d]{0,15}$/,
      message: 'Please enter a valid phone number',
    },
    bio: {
      maxLength: 500,
      message: 'Bio must be no more than 500 characters',
    },
    termsAccepted: {
      required: true,
      custom: (value: boolean) => {
        return value ? null : 'You must accept the terms and conditions';
      },
    },
  };

  const fields = [
    {
      name: 'fullName',
      label: 'Full Name',
      type: 'text' as const,
      placeholder: 'Enter your full name',
      required: true,
      icon: 'person-outline',
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email' as const,
      placeholder: 'Enter your email',
      required: true,
      icon: 'mail-outline',
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password' as const,
      placeholder: 'Enter your password',
      required: true,
      icon: 'lock-closed-outline',
    },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      type: 'password' as const,
      placeholder: 'Confirm your password',
      required: true,
      icon: 'lock-closed-outline',
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'phone' as const,
      placeholder: 'Enter your phone number',
      icon: 'call-outline',
    },
    {
      name: 'bio',
      label: 'Bio',
      type: 'multiline' as const,
      placeholder: 'Tell us about yourself...',
      multiline: true,
      numberOfLines: 4,
      maxLength: 500,
    },
    {
      name: 'termsAccepted',
      label: 'Accept Terms and Conditions',
      type: 'toggle' as const,
      required: true,
    },
  ];

  return (
    <UnifiedForm
      initialValues={{
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        bio: '',
        termsAccepted: false,
      }}
      validationRules={validationRules}
      onSubmit={handleSubmit}
      fields={fields}
      title="Create Account"
      subtitle="Join our community and start your health journey"
      variant="modal"
      size="large"
      primaryAction={{
        label: 'Create Account',
        onPress: () => {},
        variant: 'primary',
        icon: 'person-add-outline',
      }}
      secondaryAction={{
        label: 'Cancel',
        onPress: () => {},
        variant: 'outline',
      }}
      showBackButton
      onBack={() => DebugUtils.log('Back pressed')}
      validateOnChange
      validateOnBlur
      validateOnSubmit
    />
  );
}

// Example: Quick Settings Form
interface SettingsData {
  notifications: boolean;
  darkMode: boolean;
  language: string;
  units: string;
}

export function SettingsFormExample() {
  const handleSubmit = async (data: SettingsData) => {
    DebugUtils.log('Settings updated:', data);
    // Handle settings update
  };

  const fields = [
    {
      name: 'notifications',
      label: 'Push Notifications',
      type: 'toggle' as const,
      helperText: 'Receive notifications about your health progress',
    },
    {
      name: 'darkMode',
      label: 'Dark Mode',
      type: 'toggle' as const,
      helperText: 'Use dark theme throughout the app',
    },
    {
      name: 'language',
      label: 'Language',
      type: 'select' as const,
      placeholder: 'Select language',
      options: [
        { label: 'English', value: 'en' },
        { label: 'Spanish', value: 'es' },
        { label: 'French', value: 'fr' },
        { label: 'German', value: 'de' },
      ],
      onIconPress: () => DebugUtils.log('Open language picker'),
    },
    {
      name: 'units',
      label: 'Units',
      type: 'select' as const,
      placeholder: 'Select measurement units',
      options: [
        { label: 'Metric (kg, cm)', value: 'metric' },
        { label: 'Imperial (lbs, ft)', value: 'imperial' },
      ],
      onIconPress: () => DebugUtils.log('Open units picker'),
    },
  ];

  return (
    <UnifiedForm
      initialValues={{
        notifications: true,
        darkMode: false,
        language: 'en',
        units: 'metric',
      }}
      onSubmit={handleSubmit}
      fields={fields}
      title="Settings"
      variant="default"
      size="medium"
      primaryAction={{
        label: 'Save Changes',
        onPress: () => {},
        variant: 'success',
        icon: 'checkmark-outline',
      }}
      secondaryAction={{
        label: 'Reset',
        onPress: () => {},
        variant: 'outline',
      }}
      {...formPresets.settings}
    />
  );
}

// Example: Health Data Form
interface HealthData {
  age: string;
  height: string;
  weight: string;
  gender: string;
  activityLevel: string;
}

export function HealthDataFormExample() {
  const handleSubmit = async (data: HealthData) => {
    DebugUtils.log('Health data saved:', data);
    // Handle health data submission
  };

  const validationRules = {
    age: {
      required: true,
      min: 13,
      max: 120,
      message: 'Age must be between 13 and 120',
    },
    height: {
      required: true,
      min: 100,
      max: 250,
      message: 'Height must be between 100 and 250 cm',
    },
    weight: {
      required: true,
      min: 30,
      max: 300,
      message: 'Weight must be between 30 and 300 kg',
    },
    gender: {
      required: true,
      message: 'Please select your gender',
    },
    activityLevel: {
      required: true,
      message: 'Please select your activity level',
    },
  };

  const fields = [
    {
      name: 'age',
      label: 'Age',
      type: 'numeric' as const,
      placeholder: 'Enter your age',
      required: true,
      icon: 'calendar-outline',
    },
    {
      name: 'height',
      label: 'Height (cm)',
      type: 'numeric' as const,
      placeholder: 'Enter your height',
      required: true,
      icon: 'resize-outline',
    },
    {
      name: 'weight',
      label: 'Weight (kg)',
      type: 'numeric' as const,
      placeholder: 'Enter your weight',
      required: true,
      icon: 'fitness-outline',
    },
    {
      name: 'gender',
      label: 'Gender',
      type: 'select' as const,
      placeholder: 'Select your gender',
      required: true,
      options: [
        { label: 'Male', value: 'male', icon: 'male-outline' },
        { label: 'Female', value: 'female', icon: 'female-outline' },
        { label: 'Other', value: 'other', icon: 'person-outline' },
      ],
      onIconPress: () => DebugUtils.log('Open gender picker'),
    },
    {
      name: 'activityLevel',
      label: 'Activity Level',
      type: 'select' as const,
      placeholder: 'Select your activity level',
      required: true,
      options: [
        { label: 'Sedentary', value: 'sedentary' },
        { label: 'Light', value: 'light' },
        { label: 'Moderate', value: 'moderate' },
        { label: 'Active', value: 'active' },
        { label: 'Very Active', value: 'very_active' },
      ],
      onIconPress: () => DebugUtils.log('Open activity level picker'),
    },
  ];

  return (
    <UnifiedForm
      initialValues={{
        age: '',
        height: '',
        weight: '',
        gender: '',
        activityLevel: '',
      }}
      validationRules={validationRules}
      onSubmit={handleSubmit}
      fields={fields}
      title="Health Information"
      subtitle="Help us personalize your experience"
      variant="fullscreen"
      size="large"
      primaryAction={{
        label: 'Save & Continue',
        onPress: () => {},
        variant: 'primary',
        icon: 'arrow-forward-outline',
      }}
      showBackButton
      onBack={() => DebugUtils.log('Back pressed')}
      {...formPresets.profile}
    />
  );
}

// Example: Quick Add Form (Bottom Sheet)
interface QuickAddData {
  name: string;
  calories: string;
  notes: string;
}

export function QuickAddFormExample() {
  const handleSubmit = async (data: QuickAddData) => {
    DebugUtils.log('Quick add:', data);
    // Handle quick add
  };

  const fields = [
    {
      name: 'name',
      label: 'Item Name',
      type: 'text' as const,
      placeholder: 'What did you eat?',
      required: true,
      icon: 'restaurant-outline',
    },
    {
      name: 'calories',
      label: 'Calories',
      type: 'numeric' as const,
      placeholder: '0',
      icon: 'flame-outline',
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'multiline' as const,
      placeholder: 'Any additional notes...',
      multiline: true,
      numberOfLines: 3,
    },
  ];

  return (
    <UnifiedForm
      initialValues={{
        name: '',
        calories: '',
        notes: '',
      }}
      onSubmit={handleSubmit}
      fields={fields}
      title="Quick Add"
      variant="bottomSheet"
      size="small"
      primaryAction={{
        label: 'Add',
        onPress: () => {},
        variant: 'success',
        icon: 'add-outline',
      }}
      secondaryAction={{
        label: 'Cancel',
        onPress: () => {},
        variant: 'ghost',
      }}
      {...formPresets.quick}
    />
  );
}

// Example: Using UnifiedInput standalone
export function StandaloneInputExample() {
  const [value, setValue] = React.useState('');

  return (
    <View style={styles.container}>
      <UnifiedInput
        value={value}
        onChangeText={setValue}
        label="Search"
        placeholder="Search exercises..."
        type="search"
        icon="search"
        showClearButton
        onClear={() => setValue('')}
        {...inputPresets.search}
      />

      <UnifiedInput
        value={value}
        onChangeText={setValue}
        label="Email"
        placeholder="Enter your email"
        type="email"
        required
        validation={(val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)}
        {...inputPresets.email}
      />

      <UnifiedInput
        value={value}
        onChangeText={setValue}
        label="Comments"
        placeholder="Enter your comments..."
        type="multiline"
        multiline
        numberOfLines={4}
        maxLength={500}
        {...inputPresets.multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    backgroundColor: COLORS.background.primary,
  },
});

export default {
  RegistrationFormExample,
  SettingsFormExample,
  HealthDataFormExample,
  QuickAddFormExample,
  StandaloneInputExample,
};
