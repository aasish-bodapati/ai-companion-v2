import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FormLayout from '../ui/FormLayout';
import FormSection from '../ui/FormSection';
import FormField from '../ui/FormField';
import TouchOptimizedButton from '../ui/TouchOptimizedButton';
import { FormValidator, CommonRules, ValidationPatterns } from '../../utils/formValidation';
import { hapticFeedback } from '../../utils/haptics';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme/constants';

interface HealthData {
  age: string;
  height: string;
  weight: string;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  ffm?: string; // Fat-Free Mass (optional)
  smm?: string; // Skeletal Muscle Mass (optional)
  bodyFat?: string; // Body Fat Percentage (optional)
}

interface HealthDataFormProps {
  initialData?: Partial<HealthData>;
  onSubmit: (data: HealthData) => void;
  onCancel?: () => void;
  loading?: boolean;
  showAdvanced?: boolean;
  variant?: 'default' | 'modal' | 'fullscreen';
  testID?: string;
}

const GENDER_OPTIONS = [
  { id: 'male', label: 'Male', icon: 'male-outline' },
  { id: 'female', label: 'Female', icon: 'female-outline' },
  { id: 'other', label: 'Other', icon: 'person-outline' },
];

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
  { id: 'light', label: 'Light', description: 'Light exercise 1-3 days/week' },
  { id: 'moderate', label: 'Moderate', description: 'Moderate exercise 3-5 days/week' },
  { id: 'active', label: 'Active', description: 'Heavy exercise 6-7 days/week' },
  { id: 'very_active', label: 'Very Active', description: 'Very heavy exercise, physical job' },
];

const validationRules = {
  age: CommonRules.age(),
  height: CommonRules.height(),
  weight: CommonRules.weight(),
  gender: CommonRules.required('Please select a gender'),
  activityLevel: CommonRules.required('Please select an activity level'),
  ffm: {
    pattern: ValidationPatterns.decimal,
    custom: (value: string) => {
      if (!value) return undefined;
      const ffm = parseFloat(value);
      if (ffm < 20 || ffm > 150) {
        return 'Fat-free mass must be between 20 and 150 kg';
      }
      return undefined;
    },
  },
  smm: {
    pattern: ValidationPatterns.decimal,
    custom: (value: string) => {
      if (!value) return undefined;
      const smm = parseFloat(value);
      if (smm < 10 || smm > 80) {
        return 'Skeletal muscle mass must be between 10 and 80 kg';
      }
      return undefined;
    },
  },
  bodyFat: {
    pattern: ValidationPatterns.decimal,
    custom: (value: string) => {
      if (!value) return undefined;
      const bodyFat = parseFloat(value);
      if (bodyFat < 3 || bodyFat > 50) {
        return 'Body fat percentage must be between 3% and 50%';
      }
      return undefined;
    },
  },
};

export default function HealthDataForm({
  initialData = {},
  onSubmit,
  onCancel,
  loading = false,
  showAdvanced = false,
  variant = 'default',
  testID,
}: HealthDataFormProps) {
  const [data, setData] = useState<HealthData>({
    age: '',
    height: '',
    weight: '',
    gender: 'male',
    activityLevel: 'moderate',
    ffm: '',
    smm: '',
    bodyFat: '',
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvancedFields, setShowAdvancedFields] = useState(showAdvanced);
  const [formValidator] = useState(new FormValidator(validationRules));

  const updateData = (field: keyof HealthData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateField = (field: keyof HealthData) => {
    const error = formValidator.validateField(field, data[field] || '');
    setErrors(prev => {
      if (error) {
        return { ...prev, [field]: error };
      } else {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
    });
    return !error;
  };

  const validateForm = () => {
    const newErrors = formValidator.validateForm(data);
    setErrors(newErrors);
    return !formValidator.hasErrors(newErrors);
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      hapticFeedback.error();
      return;
    }

    hapticFeedback.success();
    onSubmit(data);
  };

  const handleCancel = () => {
    hapticFeedback.light();
    onCancel?.();
  };

  const renderGenderSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Gender *</Text>
      <View style={styles.selectorButtons}>
        {GENDER_OPTIONS.map((option) => (
          <TouchOptimizedButton
            key={option.id}
            title={option.label}
            onPress={() => updateData('gender', option.id)}
            variant={data.gender === option.id ? 'primary' : 'outline'}
            icon={option.icon}
            size="small"
            style={styles.selectorButton}
            testID={`gender-${option.id}`}
          />
        ))}
      </View>
      {errors.gender && (
        <Text style={styles.errorText}>{errors.gender}</Text>
      )}
    </View>
  );

  const renderActivityLevelSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Activity Level *</Text>
      <View style={styles.activityLevelContainer}>
        {ACTIVITY_LEVELS.map((level) => (
          <TouchOptimizedButton
            key={level.id}
            title={level.label}
            onPress={() => updateData('activityLevel', level.id)}
            variant={data.activityLevel === level.id ? 'primary' : 'outline'}
            size="small"
            style={styles.activityLevelButton}
            testID={`activity-${level.id}`}
          />
        ))}
      </View>
      {errors.activityLevel && (
        <Text style={styles.errorText}>{errors.activityLevel}</Text>
      )}
    </View>
  );

  const renderAdvancedFields = () => (
    <FormSection
      title="Advanced Metrics"
      subtitle="Optional body composition data for more accurate calculations"
      collapsible
      defaultCollapsed={!showAdvancedFields}
      variant="outlined"
    >
      <FormField
        name="ffm"
        label="Fat-Free Mass (kg)"
        value={data.ffm || ''}
        onChangeText={(value) => updateData('ffm', value)}
        onBlur={() => validateField('ffm')}
        error={errors.ffm}
        keyboardType="numeric"
        placeholder="e.g., 60.5"
        testID="ffm-input"
      />
      
      <FormField
        name="smm"
        label="Skeletal Muscle Mass (kg)"
        value={data.smm || ''}
        onChangeText={(value) => updateData('smm', value)}
        onBlur={() => validateField('smm')}
        error={errors.smm}
        keyboardType="numeric"
        placeholder="e.g., 30.2"
        testID="smm-input"
      />
      
      <FormField
        name="bodyFat"
        label="Body Fat Percentage (%)"
        value={data.bodyFat || ''}
        onChangeText={(value) => updateData('bodyFat', value)}
        onBlur={() => validateField('bodyFat')}
        error={errors.bodyFat}
        keyboardType="numeric"
        placeholder="e.g., 15.5"
        testID="bodyfat-input"
      />
    </FormSection>
  );

  return (
    <FormLayout
      title="Health Information"
      subtitle="Tell us about your health metrics for personalized recommendations"
      primaryAction={{
        label: loading ? 'Saving...' : 'Continue',
        onPress: handleSubmit,
        loading,
        disabled: loading,
        testID: 'submit-button',
      }}
      secondaryAction={onCancel ? {
        label: 'Cancel',
        onPress: handleCancel,
        variant: 'outline',
        testID: 'cancel-button',
      } : undefined}
      variant={variant}
      testID={testID}
    >
      <FormSection
        title="Basic Information"
        subtitle="Essential health metrics"
        variant="card"
      >
        <FormField
          name="age"
          label="Age"
          value={data.age}
          onChangeText={(value) => updateData('age', value)}
          onBlur={() => validateField('age')}
          error={errors.age}
          keyboardType="numeric"
          placeholder="e.g., 25"
          required
          testID="age-input"
        />
        
        <FormField
          name="height"
          label="Height (cm)"
          value={data.height}
          onChangeText={(value) => updateData('height', value)}
          onBlur={() => validateField('height')}
          error={errors.height}
          keyboardType="numeric"
          placeholder="e.g., 175"
          required
          testID="height-input"
        />
        
        <FormField
          name="weight"
          label="Weight (kg)"
          value={data.weight}
          onChangeText={(value) => updateData('weight', value)}
          onBlur={() => validateField('weight')}
          error={errors.weight}
          keyboardType="numeric"
          placeholder="e.g., 70"
          required
          testID="weight-input"
        />
      </FormSection>

      <FormSection
        title="Gender"
        subtitle="Used for personalized calculations"
        variant="card"
      >
        {renderGenderSelector()}
      </FormSection>

      <FormSection
        title="Activity Level"
        subtitle="How active are you on a regular basis?"
        variant="card"
      >
        {renderActivityLevelSelector()}
      </FormSection>

      {renderAdvancedFields()}
    </FormLayout>
  );
}

const styles = StyleSheet.create({
  selectorContainer: {
    marginBottom: SPACING.medium,
  },
  selectorLabel: {
    fontSize: FONT_SIZE.medium,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.small,
  },
  selectorButtons: {
    flexDirection: 'row',
    gap: SPACING.small,
  },
  selectorButton: {
    flex: 1,
  },
  activityLevelContainer: {
    gap: SPACING.small,
  },
  activityLevelButton: {
    // Individual activity level button styling
  },
  errorText: {
    fontSize: FONT_SIZE.small,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
});
