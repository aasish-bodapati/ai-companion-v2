import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MobileOptimizedCard from '../ui/MobileOptimizedCard';
import { hapticFeedback } from '../../utils/haptics';
import { COMMON_STYLES } from '../../theme/constants';

interface HealthData {
  age: string;
  height: string;
  weight: string;
  gender: 'male' | 'female' | 'other' | '' | 'Please select your gender';
  activityLevel: 'sedentary' | 'light' | 'active' | 'very_active' | '';
}

interface HealthDataStepProps {
  onDataChange: (data: HealthData) => void;
  initialData?: Partial<HealthData>;
}

// Form constants - using existing theme system approach
const FORM_PLACEHOLDERS = {
  AGE: '25',
  HEIGHT: '175', 
  WEIGHT: '70',
};

const GENDER_OPTIONS = [
  { id: 'male', label: 'Male', icon: 'male-outline' },
  { id: 'female', label: 'Female', icon: 'female-outline' },
  { id: 'other', label: 'Other', icon: 'person-outline' },
];

const ACTIVITY_LEVEL_OPTIONS = [
  { 
    id: 'sedentary', 
    label: 'Sedentary', 
    icon: 'bed-outline',
    refinement: 'Start with activation goals',
    description: 'low-effort movement + nutrition awareness'
  },
  { 
    id: 'light', 
    label: 'Light', 
    icon: 'walk-outline',
    refinement: 'Sustain and build foundation',
    description: 'add light training, optimize meals'
  },
  { 
    id: 'active', 
    label: 'Active', 
    icon: 'fitness-outline',
    refinement: 'Performance boost',
    description: 'structured training + macro precision'
  },
  { 
    id: 'very_active', 
    label: 'Very Active', 
    icon: 'flash-outline',
    refinement: 'Recovery & optimization',
    description: 'fuel properly, avoid under-eating'
  },
];

export default function HealthDataStep({
  onDataChange,
  initialData = {},
}: HealthDataStepProps) {
  const [data, setData] = useState<HealthData>({
    age: '',
    height: '',
    weight: '',
    gender: initialData.gender || '', // No pre-selection for new users
    activityLevel: initialData.activityLevel || '', // No pre-selection for new users
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    onDataChange(data);
  }, [data]); // Remove onDataChange from dependencies to prevent infinite loop

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

  // Removed FFMI calculation - no longer needed

  // Simple BMI calculation
  const calculateBMI = () => {
    const height = Number(data.height);
    const weight = Number(data.weight);
    
    if (height && weight && height > 0 && weight > 0) {
      const heightInMeters = height / 100; // Convert cm to meters
      const bmi = weight / (heightInMeters * heightInMeters);
      return Math.round(bmi * 10) / 10; // Round to 1 decimal place
    }
    return null;
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { 
      category: 'Underweight', 
      color: '#3b82f6',
      interpretation: 'muscle & nutrition focus'
    };
    if (bmi < 22) return { 
      category: 'Lean', 
      color: '#10b981',
      interpretation: 'muscle gain or maintenance'
    };
    if (bmi < 25) return { 
      category: 'Healthy', 
      color: '#10b981',
      interpretation: 'recomposition (tone up, maintain)'
    };
    if (bmi < 30) return { 
      category: 'Overweight', 
      color: '#f59e0b',
      interpretation: 'gentle fat balance'
    };
    return { 
      category: 'Obese', 
      color: '#ef4444',
      interpretation: 'metabolic health focus'
    };
  };

  const getActivityLevelRefinement = (activityLevel: string) => {
    const option = ACTIVITY_LEVEL_OPTIONS.find(opt => opt.id === activityLevel);
    if (!option) return null;
    return {
      refinement: option.refinement,
      description: option.description
    };
  };

  // validateData function removed - unused for now

  const handleGenderSelect = (gender: 'male' | 'female' | 'other') => {
    hapticFeedback.selection();
    setData(prev => ({ ...prev, gender }));
  };

  const handleActivityLevelSelect = (activityLevel: 'sedentary' | 'light' | 'active' | 'very_active' | '') => {
    hapticFeedback.selection();
    setData(prev => ({ ...prev, activityLevel }));
  };

  // Removed BMI calculation functions - no longer needed

  const renderGenderSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Gender</Text>
      <View style={styles.genderGrid}>
        {GENDER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            onPress={() => {
              hapticFeedback.selection();
              if (option.id === 'male' || option.id === 'female' || option.id === 'other') {
                handleGenderSelect(option.id);
              }
            }}
            style={[
              styles.genderButton,
              data.gender === option.id ? styles.optionButtonSelected : styles.optionButtonUnselected,
            ]}
          >
            <Ionicons
              name={option.icon as keyof typeof Ionicons.glyphMap}
              size={20}
              color={data.gender === option.id ? '#ffffff' : '#3b82f6'}
            />
            <Text style={[
              styles.genderButtonText,
              data.gender === option.id ? styles.optionButtonTextSelected : styles.optionButtonTextUnselected,
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
    </View>
  );

  const renderActivityLevelSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Activity Level</Text>
      <View style={styles.activityLevelGrid}>
        {ACTIVITY_LEVEL_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            onPress={() => {
              hapticFeedback.selection();
              if (option.id === 'sedentary' || option.id === 'light' || option.id === 'active' || option.id === 'very_active') {
                handleActivityLevelSelect(option.id as 'sedentary' | 'light' | 'active' | 'very_active');
              }
            }}
            style={[
              styles.activityLevelButton,
              data.activityLevel === option.id ? styles.optionButtonSelected : styles.optionButtonUnselected,
            ]}
          >
            <Ionicons
              name={option.icon as keyof typeof Ionicons.glyphMap}
              size={14}
              color={data.activityLevel === option.id ? '#ffffff' : '#3b82f6'}
            />
            <Text style={[
              styles.activityLevelButtonText,
              data.activityLevel === option.id ? styles.optionButtonTextSelected : styles.optionButtonTextUnselected,
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Activity Level Refinement Display */}
      {data.activityLevel && (() => {
        const refinement = getActivityLevelRefinement(data.activityLevel);
        if (refinement) {
          return (
            <View style={styles.activityRefinementContainer}>
              <Text style={styles.activityRefinementTitle}>
                {refinement.refinement}
              </Text>
              <Text style={styles.activityRefinementDescription}>
                {refinement.description}
              </Text>
            </View>
          );
        }
        return null;
      })()}
      
      {errors.activityLevel && <Text style={styles.errorText}>{errors.activityLevel}</Text>}
    </View>
  );

  // Removed renderBMIPreview function - no longer needed

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          {/* Row 1: Age, Height, Weight */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldColumn}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                value={data.age}
                onChangeText={(text) => updateData('age', text)}
                placeholder={FORM_PLACEHOLDERS.AGE}
                keyboardType="numeric"
                style={[styles.input, errors.age && styles.inputError]}
                blurOnSubmit={true}
                returnKeyType="next"
                onFocus={() => hapticFeedback.light()}
              />
              {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
            </View>

            <View style={styles.fieldColumn}>
              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput
                value={data.height}
                onChangeText={(text) => updateData('height', text)}
                placeholder={FORM_PLACEHOLDERS.HEIGHT}
                keyboardType="numeric"
                style={[styles.input, errors.height && styles.inputError]}
                blurOnSubmit={true}
                returnKeyType="next"
                onFocus={() => hapticFeedback.light()}
              />
              {errors.height && <Text style={styles.errorText}>{errors.height}</Text>}
            </View>

            <View style={styles.fieldColumn}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                value={data.weight}
                onChangeText={(text) => updateData('weight', text)}
                placeholder={FORM_PLACEHOLDERS.WEIGHT}
                keyboardType="numeric"
                style={[styles.input, errors.weight && styles.inputError]}
                blurOnSubmit={true}
                returnKeyType="next"
                onFocus={() => hapticFeedback.light()}
              />
              {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
            </View>
          </View>

          {/* BMI Display - Always visible */}
          <View style={styles.bmiContainer}>
            <Text style={styles.bmiLabel}>Body Mass Index</Text>
            {(() => {
              const bmi = calculateBMI();
              if (bmi) {
                const bmiInfo = getBMICategory(bmi);
                return (
                  <View style={styles.bmiInfoContainer}>
                    <Text style={[styles.bmiValue, { color: bmiInfo.color }]}>
                      {bmi} ({bmiInfo.category})
                    </Text>
                    <Text style={[styles.bmiInterpretation, { color: bmiInfo.color }]}>
                      {bmiInfo.interpretation}
                    </Text>
                  </View>
                );
              }
              return (
                <Text style={[styles.bmiValue, { color: '#9ca3af' }]}>
                  Enter height & weight
                </Text>
              );
            })()}
          </View>

          {/* Removed advanced metrics row - SMM, Body Fat %, and FFMI */}
        </View>

        {/* Removed BMI Preview section */}

        {/* Gender Selector */}
        {renderGenderSelector()}

        {/* Activity Level Selector */}
        {renderActivityLevelSelector()}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COMMON_STYLES.secondaryBackground,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  inputRow: {
    marginBottom: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  fieldColumn: {
    flex: 1,
    minWidth: 0, // Prevents flex items from overflowing
  },
  input: {
    width: '100%',
    height: 52,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: COMMON_STYLES.standardRadius,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#1f2937',
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  inputError: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  errorContainer: {
    minHeight: 20,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  optionGrid: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  genderGrid: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  activityLevelGrid: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'space-between',
  },
  optionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: COMMON_STYLES.standardRadius,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    minHeight: 48,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: COMMON_STYLES.standardRadius,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    minHeight: 48,
  },
  activityLevelButton: {
    width: '22%', // Fixed width to fit 4 buttons
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: COMMON_STYLES.standardRadius,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 3,
    minHeight: 55,
  },
  optionButtonSelected: {
    backgroundColor: '#3b82f6',
  },
  optionButtonUnselected: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activityLevelButtonText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
  },
  activityRefinementContainer: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  activityRefinementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c4a6e',
    textAlign: 'center',
    marginBottom: 4,
  },
  activityRefinementDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0369a1',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  optionButtonTextSelected: {
    color: '#ffffff',
  },
  optionButtonTextUnselected: {
    color: '#3b82f6',
  },
  // BMI display styles
  bmiContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bmiLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  bmiValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bmiInfoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  bmiInterpretation: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  prePopulatedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  prePopulatedText: {
    fontSize: 14,
    color: '#1e40af',
    marginLeft: 6,
    fontWeight: '500',
  },
  optionalLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    height: 16,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
