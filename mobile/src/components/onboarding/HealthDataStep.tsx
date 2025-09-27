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
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

interface HealthDataStepProps {
  onDataChange: (data: HealthData) => void;
  initialData?: Partial<HealthData>;
}

const ACTIVITY_LEVELS = [
  {
    id: 'sedentary',
    title: 'Sedentary',
    description: 'Little to no exercise',
    icon: 'desktop-outline',
    color: '#6b7280',
  },
  {
    id: 'light',
    title: 'Light Activity',
    description: 'Light exercise 1-3 days/week',
    icon: 'walk-outline',
    color: '#3b82f6',
  },
  {
    id: 'moderate',
    title: 'Moderate Activity',
    description: 'Moderate exercise 3-5 days/week',
    icon: 'bicycle-outline',
    color: '#10b981',
  },
  {
    id: 'active',
    title: 'Active',
    description: 'Heavy exercise 6-7 days/week',
    icon: 'fitness-outline',
    color: '#f59e0b',
  },
  {
    id: 'very_active',
    title: 'Very Active',
    description: 'Very heavy exercise, physical job',
    icon: 'flame-outline',
    color: '#ef4444',
  },
];

const GENDER_OPTIONS = [
  { id: 'male', label: 'Male', icon: 'male-outline' },
  { id: 'female', label: 'Female', icon: 'female-outline' },
  { id: 'other', label: 'Other', icon: 'person-outline' },
];

export default function HealthDataStep({ 
  onDataChange, 
  initialData = {},
}: HealthDataStepProps) {
  const [data, setData] = useState<HealthData>({
    age: '',
    height: '',
    weight: '',
    gender: 'male',
    activityLevel: 'moderate',
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenderSelect = (gender: 'male' | 'female' | 'other') => {
    hapticFeedback.selection();
    setData(prev => ({ ...prev, gender }));
  };

  const handleActivityLevelSelect = (activityLevel: HealthData['activityLevel']) => {
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

  const renderActivityLevelSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Activity Level</Text>
      <View style={styles.activityGrid}>
        {ACTIVITY_LEVELS.map((level) => (
          <MobileOptimizedCard
            key={level.id}
            onPress={() => handleActivityLevelSelect(level.id as HealthData['activityLevel'])}
            variant={data.activityLevel === level.id ? 'elevated' : 'outlined'}
            style={StyleSheet.flatten([
              styles.activityCard,
              data.activityLevel === level.id ? { borderColor: level.color } : {},
            ])}
            hapticFeedback="selection"
          >
            <View style={styles.activityContent}>
              <Ionicons
                name={level.icon as any}
                size={18}
                color={data.activityLevel === level.id ? level.color : '#6b7280'}
              />
              <Text style={[
                styles.activityTitle,
                data.activityLevel === level.id && { color: level.color }
              ]}>
                {level.title}
              </Text>
              <Text style={styles.activityDescription}>
                {level.description}
              </Text>
            </View>
          </MobileOptimizedCard>
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
      <View style={styles.content}>
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputRow}>
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

          <View style={styles.inputRow}>
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

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput
              value={data.weight}
              onChangeText={(text) => updateData('weight', text)}
              placeholder="70"
              keyboardType="numeric"
              style={[styles.input, errors.weight && styles.inputError]}
              blurOnSubmit={true}
              returnKeyType="done"
              onFocus={() => hapticFeedback.light()}
            />
            {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
          </View>
        </View>

        {/* BMI Preview */}
        {renderBMIPreview()}

        {/* Gender Selector */}
        {renderGenderSelector()}

        {/* Activity Level Selector */}
        {renderActivityLevelSelector()}
      </View>
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
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  activityCard: {
    width: '48%',
    marginBottom: 4,
  },
  activityContent: {
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  activityTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 2,
    marginBottom: 1,
    textAlign: 'center',
  },
  activityDescription: {
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 11,
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
});
