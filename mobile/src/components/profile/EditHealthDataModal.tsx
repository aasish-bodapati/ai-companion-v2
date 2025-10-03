import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MobileOptimizedModal from '../ui/MobileOptimizedModal';
import MobileOptimizedInput from '../ui/MobileOptimizedInput';
import TouchOptimizedButton from '../ui/TouchOptimizedButton';
import MobileOptimizedCard from '../ui/MobileOptimizedCard';
import { onboardingService, HealthData } from '../../services/onboardingService';
import { hapticFeedback } from '../../utils/haptics';
import { showToast } from '../../utils/toast';

interface EditHealthDataModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: HealthData) => void;
  initialData?: HealthData;
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

export default function EditHealthDataModal({
  visible,
  onClose,
  onSave,
  initialData,
}: EditHealthDataModalProps) {
  const [data, setData] = useState<HealthData>({
    age: '',
    height: '',
    weight: '',
    gender: 'male',
    activityLevel: 'moderate',
    ...initialData,
  });

  const [errors, setErrors] = useState<Partial<HealthData>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && initialData) {
      setData(initialData);
    }
  }, [visible, initialData]);

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

  const handleSave = async () => {
    if (!validateData()) {
      hapticFeedback.warning();
      return;
    }

    try {
      setLoading(true);
      hapticFeedback.success();
      
      await onboardingService.updateHealthData(data);
      onSave(data);
      onClose();
      
      showToast.success('Success!', 'Health data updated successfully');
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      hapticFeedback.error();
      showToast.error('Error', 'Failed to save health data');
    } finally {
      setLoading(false);
    }
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
    <MobileOptimizedModal
      visible={visible}
      onClose={onClose}
      title="Edit Health Data"
      variant="bottomSheet"
      size="large"
      hapticFeedback={true}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
              onFocus={() => hapticFeedback.light()}
            />
            {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
          </View>
        </View>

        {/* BMI Preview */}
        {renderBMIPreview()}

        {/* Gender Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gender</Text>
          <View style={styles.optionGrid}>
            {GENDER_OPTIONS.map((option) => (
              <TouchOptimizedButton
                key={option.id}
                title={option.label}
                icon={option.icon}
                onPress={() => handleGenderSelect(option.id as HealthData['gender'])}
                variant={data.gender === option.id ? 'primary' : 'outline'}
                size="medium"
                hapticFeedback="selection"
                style={styles.optionButton}
              />
            ))}
          </View>
        </View>

        {/* Activity Level Selector */}
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
                    size={24}
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

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchOptimizedButton
            title="Cancel"
            onPress={onClose}
            variant="outline"
            size="large"
            hapticFeedback="light"
            style={styles.cancelButton}
          />
          <TouchOptimizedButton
            title="Save Changes"
            onPress={handleSave}
            variant="primary"
            size="large"
            hapticFeedback="success"
            loading={loading}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </MobileOptimizedModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 16,
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
  bmiCard: {
    marginBottom: 24,
  },
  bmiContent: {
    alignItems: 'center',
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
  },
  bmiNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bmiCategory: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
  },
  activityGrid: {
    gap: 12,
  },
  activityCard: {
    marginBottom: 0,
  },
  activityContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});
