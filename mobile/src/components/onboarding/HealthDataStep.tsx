import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MobileOptimizedInput from '../ui/MobileOptimizedInput';
import MobileOptimizedCard from '../ui/MobileOptimizedCard';
import { hapticFeedback } from '../../utils/haptics';

interface HealthData {
  age: string;
  height: string;
  weight: string;
  gender: 'male' | 'female' | 'other';
  workoutDays: string;
  smm?: string; // Skeletal Muscle Mass (optional)
  bodyFat?: string; // Body Fat Percentage (optional)
}

interface HealthDataStepProps {
  onDataChange: (data: HealthData) => void;
  initialData?: Partial<HealthData>;
  isPrePopulated?: boolean;
}


const GENDER_OPTIONS = [
  { id: 'male', label: 'Male', icon: 'male-outline' },
  { id: 'female', label: 'Female', icon: 'female-outline' },
  { id: 'other', label: 'Other', icon: 'person-outline' },
];

export default function HealthDataStep({ 
  onDataChange, 
  initialData = {},
  isPrePopulated = false,
}: HealthDataStepProps) {
  const [data, setData] = useState<HealthData>({
    age: '',
    height: '',
    weight: '',
    gender: 'male',
    workoutDays: '',
    smm: '',
    bodyFat: '',
    ...initialData,
  });

  const [errors, setErrors] = useState<Partial<HealthData>>({});

  useEffect(() => {
    onDataChange(data);
  }, [data, onDataChange]);

  const updateData = (field: keyof HealthData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
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

    if (!data.workoutDays || isNaN(Number(data.workoutDays)) || Number(data.workoutDays) < 0 || Number(data.workoutDays) > 7) {
      newErrors.workoutDays = 'Please enter valid workout days (0-7)';
    }

    // Optional field validation - only validate if provided
    if (data.smm && (isNaN(Number(data.smm)) || Number(data.smm) < 10 || Number(data.smm) > 100)) {
      newErrors.smm = 'Please enter a valid SMM (10-100 kg)';
    }

    if (data.bodyFat && (isNaN(Number(data.bodyFat)) || Number(data.bodyFat) < 3 || Number(data.bodyFat) > 50)) {
      newErrors.bodyFat = 'Please enter a valid body fat percentage (3-50%)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenderSelect = (gender: 'male' | 'female' | 'other') => {
    hapticFeedback.selection();
    setData(prev => ({ ...prev, gender }));
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
              handleGenderSelect(option.id as HealthData['gender']);
            }}
            style={[
              styles.optionButton,
              data.gender === option.id ? styles.optionButtonSelected : styles.optionButtonUnselected,
            ]}
          >
            <Ionicons 
              name={option.icon as any} 
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
    </View>
  );


  const renderBMIPreview = () => {
    if (!data.height || !data.weight) return null;

    const bmi = Number(calculateBMI());
    if (isNaN(bmi)) return null;

    const { category, color } = getBMICategory(bmi);

    return (
      <MobileOptimizedCard
        variant="filled"
        style={styles.bmiCard}
      >
        <View style={styles.bmiContent}>
          <View style={styles.bmiHeader}>
            <Ionicons name="analytics-outline" size={24} color="#3b82f6" />
            <Text style={styles.bmiTitle}>Your BMI</Text>
          </View>
          <View style={styles.bmiValue}>
            <Text style={[styles.bmiNumber, { color }]}>{calculateBMI()}</Text>
            <Text style={[styles.bmiCategory, { color }]}>{category}</Text>
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
        {/* Pre-populated indicator */}
        {isPrePopulated && (
          <View style={styles.prePopulatedIndicator}>
            <Ionicons name="information-circle-outline" size={16} color="#3b82f6" />
            <Text style={styles.prePopulatedText}>Your existing data has been pre-filled</Text>
          </View>
        )}
        
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
              <Text style={styles.inputLabel}>Workout Days</Text>
              <Text style={styles.optionalLabel}></Text>
              <TextInput
                value={data.workoutDays || ''}
                onChangeText={(text) => updateData('workoutDays', text)}
                placeholder="3"
                keyboardType="numeric"
                style={[styles.input, errors.workoutDays && styles.inputError]}
                blurOnSubmit={true}
                returnKeyType="next"
                onFocus={() => hapticFeedback.light()}
                maxLength={1}
              />
              <View style={styles.errorContainer}>
                {errors.workoutDays && <Text style={styles.errorText}>{errors.workoutDays}</Text>}
              </View>
            </View>
          </View>
        </View>

        {/* BMI Preview */}
        {renderBMIPreview()}

        {/* Gender Selector */}
        {renderGenderSelector()}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  inputRow: {
    marginBottom: 6,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  fieldColumn: {
    flex: 1,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#1f2937',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  inputError: {
    borderColor: '#ef4444',
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
    gap: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
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
    marginBottom: 8,
  },
  bmiContent: {
    alignItems: 'center',
  },
  bmiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bmiTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 6,
  },
  bmiValue: {
    alignItems: 'center',
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
    fontWeight: '400',
    height: 16,
    lineHeight: 16,
  },
  helpText: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
