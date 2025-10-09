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
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  ffm?: string; // Fat-Free Mass (optional)
  smm?: string; // Skeletal Muscle Mass (optional)
  bodyFat?: string; // Body Fat Percentage (optional)
}

interface HealthDataStepProps {
  onDataChange: (data: HealthData) => void;
  initialData?: Partial<HealthData>;
}


const GENDER_OPTIONS = [
  { id: 'male', label: 'Male', icon: 'male-outline' },
  { id: 'female', label: 'Female', icon: 'female-outline' },
  { id: 'other', label: 'Other', icon: 'person-outline' },
];

const ACTIVITY_LEVEL_OPTIONS = [
  { id: 'sedentary', label: 'Sedentary', icon: 'bed-outline' },
  { id: 'light', label: 'Light', icon: 'walk-outline' },
  { id: 'moderate', label: 'Moderate', icon: 'bicycle-outline' },
  { id: 'active', label: 'Active', icon: 'fitness-outline' },
  { id: 'very_active', label: 'Very Active', icon: 'flash-outline' },
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
    activityLevel: initialData.activityLevel || 'moderate',
    ffm: '',
    smm: '',
    bodyFat: '',
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    onDataChange(data);
  }, [data, onDataChange]);

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

  const calculateFFMI = (height: number, ffm: number): number => {
    const heightInMeters = height / 100;
    return ffm / (heightInMeters * heightInMeters);
  };

  const calculateIdealWeight = (height: number): number => {
    // Ideal Weight = (FFMI × Height²) / (1 - BFₜ)
    // Where FFMI = 22 (ideal), BFₜ = 0.14 (14% body fat)
    const heightInMeters = height / 100;
    const idealFFMI = 22;
    const targetBodyFat = 0.14; // 14%
    
    const idealWeight = (idealFFMI * heightInMeters * heightInMeters) / (1 - targetBodyFat);
    return Math.round(idealWeight * 10) / 10; // Round to 1 decimal place
  };

  const calculateProteinTarget = (weight: number, ffm?: number, smm?: number, bodyFat?: number): number => {
    // Comprehensive protein calculation based on available metrics
    // Case 1: All optional metrics are provided (FFM, SMM, BF%)
    if (ffm && smm && bodyFat) {
      const ffmi = calculateFFMI(Number(data.height), ffm);
      const proteinTarget = ffm * 1.6 * (1 + 0.3 * smm / 30 + 0.1 * (ffmi - 20));
      return Math.round(proteinTarget * 10) / 10;
    }
    
    // Case 2: FFM provided, SMM and FFMI not provided
    if (ffm && !smm && !bodyFat) {
      const proteinTarget = ffm * 1.8;
      return Math.round(proteinTarget * 10) / 10;
    }
    
    // Case 3: SMM and BF% provided, FFM not provided
    if (smm && bodyFat && !ffm) {
      const estimatedFFM = weight * (1 - bodyFat / 100);
      const proteinTarget = estimatedFFM * 1.6 * (1 + 0.3 * smm / 30);
      return Math.round(proteinTarget * 10) / 10;
    }
    
    // Case 4: Only BF% provided, SMM and FFM not provided
    if (bodyFat && !smm && !ffm) {
      const estimatedFFM = weight * (1 - bodyFat / 100);
      const proteinTarget = estimatedFFM * 1.8;
      return Math.round(proteinTarget * 10) / 10;
    }
    
    // Case 5: Only SMM provided, FFM & BF% not provided
    if (smm && !ffm && !bodyFat) {
      const estimatedFFM = smm * 2; // Skeletal muscle is ~50% of FFM
      const proteinTarget = estimatedFFM * 1.6 * (1 + 0.3 * smm / 30);
      return Math.round(proteinTarget * 10) / 10;
    }
    
    // Case 6: None of the optional metrics provided (only height & weight)
    const proteinTarget = weight * 1.6;
    return Math.round(proteinTarget * 10) / 10;
  };

  const validateData = (): boolean => {
    const newErrors: Partial<HealthData> = {};

    if (!data.age || isNaN(Number(data.age)) || Number(data.age) < 13 || Number(data.age) > 120) {
      newErrors.age = 'Please enter a valid age (13-120)';
    }

    if (!data.height || isNaN(Number(data.height)) || Number(data.height) < 100 || Number(data.height) > 250) {
      newErrors.height = 'Please enter a valid height (100-250 cm)';
    }

    if (!data.weight || isNaN(Number(data.weight)) || Number(data.weight) < 30 || Number(data.weight) > 300) {
      newErrors.weight = 'Please enter a valid weight (30-300 kg)';
    }

    if (!data.gender || data.gender === 'Please select your gender') {
      newErrors.gender = 'Please select your gender';
    } else if (data.gender !== 'male' && data.gender !== 'female' && data.gender !== 'other') {
      newErrors.gender = 'Please select your gender';
    }

    // Optional field validation - only validate if provided
    if (data.ffm && (isNaN(Number(data.ffm)) || Number(data.ffm) < 20 || Number(data.ffm) > 100)) {
      newErrors.ffm = 'Please enter a valid FFM (20-100 kg)';
    }

    // Optional field validation - only validate if provided
    if (data.smm && (isNaN(Number(data.smm)) || Number(data.smm) < 10 || Number(data.smm) > 100)) {
      newErrors.smm = 'Please enter a valid SMM (10-100 kg)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenderSelect = (gender: 'male' | 'female' | 'other') => {
    hapticFeedback.selection();
    setData(prev => ({ ...prev, gender }));
  };

  const handleActivityLevelSelect = (activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active') => {
    hapticFeedback.selection();
    setData(prev => ({ ...prev, activityLevel }));
  };


  const calculateBMI = () => {
    const height = Number(data.height) / 100; // Convert cm to m
    const weight = Number(data.weight);
    const bmi = weight / (height * height);
    return bmi.toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: '#3b82f6' };
    if (bmi < 25) return { category: 'Normal', color: '#10b981' };
    if (bmi < 30) return { category: 'Overweight', color: '#f59e0b' };
    return { category: 'Obese', color: '#ef4444' };
  };

  const renderGenderSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Gender</Text>
      <View style={styles.optionGrid}>
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
              styles.optionButton,
              data.gender === option.id ? styles.optionButtonSelected : styles.optionButtonUnselected,
            ]}
          >
            <Ionicons 
              name={option.icon as keyof typeof Ionicons.glyphMap} 
              size={20} 
              color={data.gender === option.id ? '#ffffff' : '#3b82f6'} 
            />
            <Text style={[
              styles.optionButtonText,
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
      <View style={styles.optionGrid}>
        {ACTIVITY_LEVEL_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            onPress={() => {
              hapticFeedback.selection();
              if (option.id === 'sedentary' || option.id === 'light' || option.id === 'moderate' || option.id === 'active' || option.id === 'very_active') {
                handleActivityLevelSelect(option.id);
              }
            }}
            style={[
              styles.optionButton,
              data.activityLevel === option.id ? styles.optionButtonSelected : styles.optionButtonUnselected,
            ]}
          >
            <Ionicons 
              name={option.icon as keyof typeof Ionicons.glyphMap} 
              size={20} 
              color={data.activityLevel === option.id ? '#ffffff' : '#3b82f6'} 
            />
            <Text style={[
              styles.optionButtonText,
              data.activityLevel === option.id ? styles.optionButtonTextSelected : styles.optionButtonTextUnselected,
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.activityLevel && <Text style={styles.errorText}>{errors.activityLevel}</Text>}
    </View>
  );


  const renderBMIPreview = () => {
    if (!data.height || !data.weight) return null;

    const bmi = Number(calculateBMI());
    if (isNaN(bmi)) return null;

    const { category, color } = getBMICategory(bmi);
    
    // Calculate FFMI if FFM is provided
    let ffmi = null;
    if (data.ffm && !isNaN(Number(data.ffm))) {
      ffmi = calculateFFMI(Number(data.height), Number(data.ffm));
    }

    // Calculate ideal weight based on height
    const idealWeight = calculateIdealWeight(Number(data.height));

    // Calculate protein target based on available metrics
    let proteinTarget = null;
    const weight = Number(data.weight);
    const ffm = data.ffm ? Number(data.ffm) : undefined;
    const smm = data.smm ? Number(data.smm) : undefined;
    const bodyFat = data.bodyFat ? Number(data.bodyFat) : undefined;
    
    if (weight && (ffm || smm || bodyFat)) {
      proteinTarget = calculateProteinTarget(weight, ffm, smm, bodyFat);
    }

    return (
      <MobileOptimizedCard
        variant="filled"
        style={styles.bmiCard}
      >
        <View style={styles.bmiContent}>
          <View style={styles.bmiHeader}>
            <Ionicons name="analytics-outline" size={24} color="#3b82f6" />
            <Text style={styles.bmiTitle}>Health Metrics</Text>
          </View>
          <View style={styles.bmiValue}>
            <View style={styles.metricRow}>
              <View style={styles.metricItem}>
                <Text style={[styles.bmiNumber, { color }]}>{calculateBMI()}</Text>
                <Text style={[styles.bmiCategory, { color }]}>BMI - {category}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[styles.bmiNumber, { color: '#3b82f6' }]}>
                  {ffmi ? ffmi.toFixed(1) : '-'}
                </Text>
                <Text style={[styles.bmiCategory, { color: '#3b82f6' }]}>FFMI</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[styles.bmiNumber, { color: '#10b981' }]}>{idealWeight}</Text>
                <Text style={[styles.bmiCategory, { color: '#10b981' }]}>Ideal Weight (kg)</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[styles.bmiNumber, { color: '#f59e0b' }]}>
                  {proteinTarget ? proteinTarget : '-'}
                </Text>
                <Text style={[styles.bmiCategory, { color: '#f59e0b' }]}>Protein (g/day)</Text>
              </View>
            </View>
          </View>
        </View>
      </MobileOptimizedCard>
    );
  };

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
                placeholder="25"
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
                placeholder="175"
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
                placeholder="70"
                keyboardType="numeric"
                style={[styles.input, errors.weight && styles.inputError]}
                blurOnSubmit={true}
                returnKeyType="next"
                onFocus={() => hapticFeedback.light()}
              />
              {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
            </View>
          </View>

          {/* Row 2: SMM, Body Fat, Workout Days */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldColumn}>
              <Text style={styles.inputLabel}>
                SMM (kg)
              </Text>
              <Text style={styles.optionalLabel}>(Optional)</Text>
              <TextInput
                value={data.smm || ''}
                onChangeText={(text) => updateData('smm', text)}
                placeholder="35.5"
                keyboardType="numeric"
                style={[styles.input, errors.smm && styles.inputError]}
                blurOnSubmit={true}
                returnKeyType="next"
                onFocus={() => hapticFeedback.light()}
              />
              <View style={styles.errorContainer}>
                {errors.smm && <Text style={styles.errorText}>{errors.smm}</Text>}
              </View>
            </View>

            <View style={styles.fieldColumn}>
              <Text style={styles.inputLabel}>
                Body Fat (%)
              </Text>
              <Text style={styles.optionalLabel}>(Optional)</Text>
              <TextInput
                value={data.bodyFat || ''}
                onChangeText={(text) => updateData('bodyFat', text)}
                placeholder="15.5"
                keyboardType="numeric"
                style={[styles.input, errors.bodyFat && styles.inputError]}
                blurOnSubmit={true}
                returnKeyType="next"
                onFocus={() => hapticFeedback.light()}
              />
              <View style={styles.errorContainer}>
                {errors.bodyFat && <Text style={styles.errorText}>{errors.bodyFat}</Text>}
              </View>
            </View>

            <View style={styles.fieldColumn}>
              <Text style={styles.inputLabel}>Fat-Free Mass (FFM)</Text>
              <Text style={styles.optionalLabel}>(Optional)</Text>
              <TextInput
                value={data.ffm || ''}
                onChangeText={(text) => updateData('ffm', text)}
                placeholder="55.0"
                keyboardType="numeric"
                style={[styles.input, errors.ffm && styles.inputError]}
                blurOnSubmit={true}
                returnKeyType="next"
                onFocus={() => hapticFeedback.light()}
              />
              <View style={styles.errorContainer}>
                {errors.ffm && <Text style={styles.errorText}>{errors.ffm}</Text>}
              </View>
            </View>
          </View>
        </View>

        {/* BMI Preview */}
        {renderBMIPreview()}

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
  optionButtonTextSelected: {
    color: '#ffffff',
  },
  optionButtonTextUnselected: {
    color: '#3b82f6',
  },
  bmiCard: {
    marginBottom: 16,
  },
  bmiContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  bmiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bmiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  bmiValue: {
    alignItems: 'center',
    width: '100%',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    width: '100%',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 120,
  },
  bmiNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  bmiCategory: {
    fontSize: 12,
    fontWeight: '600',
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
