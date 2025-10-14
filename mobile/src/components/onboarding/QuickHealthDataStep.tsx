/**
 * QuickHealthDataStep - Essential health data only
 * Reduced from 662 lines to simple, focused form
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../theme/constants';

interface QuickHealthData {
  age: string;
  height: string;
  weight: string;
  gender: 'male' | 'female' | 'other' | '';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | '';
}

interface QuickHealthDataStepProps {
  onDataChange: (data: QuickHealthData) => void;
  initialData?: Partial<QuickHealthData>;
}

const GENDER_OPTIONS = [
  { id: 'male', label: 'Male', icon: 'male-outline' },
  { id: 'female', label: 'Female', icon: 'female-outline' },
  { id: 'other', label: 'Other', icon: 'person-outline' },
];

const ACTIVITY_LEVELS = [
  { 
    id: 'sedentary', 
    label: 'Sedentary', 
    description: 'Little to no exercise',
    icon: 'bed-outline' 
  },
  { 
    id: 'light', 
    label: 'Light', 
    description: '1-3 days/week',
    icon: 'walk-outline' 
  },
  { 
    id: 'moderate', 
    label: 'Moderate', 
    description: '3-5 days/week',
    icon: 'bicycle-outline' 
  },
  { 
    id: 'active', 
    label: 'Active', 
    description: '6-7 days/week',
    icon: 'fitness-outline' 
  },
  { 
    id: 'very_active', 
    label: 'Very Active', 
    description: 'Heavy exercise + job',
    icon: 'flash-outline' 
  },
];

export default function QuickHealthDataStep({ 
  onDataChange, 
  initialData = {} 
}: QuickHealthDataStepProps) {
  const [data, setData] = useState<QuickHealthData>({
    age: initialData.age || '',
    height: initialData.height || '',
    weight: initialData.weight || '',
    gender: initialData.gender || '',
    activityLevel: initialData.activityLevel || 'moderate',
  });

  useEffect(() => {
    onDataChange(data);
  }, [data]); // Remove onDataChange from dependencies to prevent infinite loop

  const updateData = (field: keyof QuickHealthData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const isComplete = data.age && data.height && data.weight && data.gender;

  // Calculate BMI
  const calculateBMI = () => {
    const height = parseFloat(data.height);
    const weight = parseFloat(data.weight);
    
    if (height && weight && height > 0 && weight > 0) {
      const heightInMeters = height / 100; // Convert cm to meters
      const bmi = weight / (heightInMeters * heightInMeters);
      return Math.round(bmi * 10) / 10; // Round to 1 decimal place
    }
    return null;
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: COLORS.warning };
    if (bmi < 25) return { category: 'Normal', color: COLORS.success };
    if (bmi < 30) return { category: 'Overweight', color: COLORS.warning };
    return { category: 'Obese', color: COLORS.danger };
  };

  const bmi = calculateBMI();
  const bmiInfo = bmi ? getBMICategory(bmi) : null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age *</Text>
            <TextInput
              style={styles.input}
              value={data.age}
              onChangeText={(text) => updateData('age', text)}
              placeholder="25"
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Height (cm) *</Text>
            <TextInput
              style={styles.input}
              value={data.height}
              onChangeText={(text) => updateData('height', text)}
              placeholder="175"
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weight (kg) *</Text>
            <TextInput
              style={styles.input}
              value={data.weight}
              onChangeText={(text) => updateData('weight', text)}
              placeholder="70"
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
          
          {/* BMI Display - Inline with inputs */}
          {bmi && bmiInfo && (
            <View style={styles.bmiGroup}>
              <Text style={styles.label}>BMI</Text>
              <View style={styles.bmiContainer}>
                <Text style={styles.bmiValue}>{bmi}</Text>
                <Text style={[styles.bmiCategoryText, { color: bmiInfo.color }]}>
                  {bmiInfo.category}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Gender */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gender *</Text>
        <View style={styles.optionsGrid}>
          {GENDER_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                data.gender === option.id && styles.selectedOption
              ]}
              onPress={() => updateData('gender', option.id)}
            >
              <View style={styles.optionIconContainer}>
                <Ionicons 
                  name={option.icon as keyof typeof Ionicons.glyphMap} 
                  size={24} 
                  color={data.gender === option.id ? COLORS.text.primary : COLORS.text.secondary} 
                />
              </View>
              <Text style={[
                styles.optionLabel,
                data.gender === option.id && styles.selectedOptionText
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Activity Level */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Level</Text>
        <Text style={styles.sectionSubtitle}>How active are you typically?</Text>
        
        <View style={styles.activityGrid}>
          {ACTIVITY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.activityCard,
                data.activityLevel === level.id && styles.selectedActivity
              ]}
              onPress={() => updateData('activityLevel', level.id)}
            >
              <View style={styles.activityIconContainer}>
                <Ionicons 
                  name={level.icon as keyof typeof Ionicons.glyphMap} 
                  size={20} 
                  color={data.activityLevel === level.id ? COLORS.text.primary : COLORS.text.secondary} 
                />
              </View>
              <Text style={[
                styles.activityLabel,
                data.activityLevel === level.id && styles.selectedActivityText
              ]}>
                {level.label}
              </Text>
              <Text style={[
                styles.activityDescription,
                data.activityLevel === level.id && styles.selectedActivityDescription
              ]}>
                {level.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Completion Status */}
      <View style={styles.statusCard}>
        <Ionicons 
          name={isComplete ? "checkmark-circle" : "information-circle"} 
          size={20} 
          color={isComplete ? COLORS.success : COLORS.text.secondary} 
        />
        <Text style={[
          styles.statusText,
          isComplete && styles.statusTextComplete
        ]}>
          {isComplete ? 'Ready to continue' : 'Fill required fields'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: SPACING.large, // Reduced from xl
  },
  sectionTitle: {
    fontSize: FONT_SIZE.medium, // Reduced from large
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary.light,
    marginBottom: SPACING.small, // Reduced from medium
  },
  sectionSubtitle: {
    fontSize: FONT_SIZE.small, // Reduced from medium
    color: COLORS.primary.light,
    marginBottom: SPACING.small, // Reduced from medium
  },
  inputRow: {
    flexDirection: 'row', // Make inputs horizontal
  },
  inputGroup: {
    flex: 1, // Equal width for each input
    marginBottom: SPACING.small, // Reduced from medium
    marginRight: SPACING.xs, // Add small margin between inputs
  },
  label: {
    fontSize: FONT_SIZE.small, // Reduced from medium
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.primary.light,
    marginBottom: SPACING.xs, // Reduced from small
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.small, // Reduced from medium
    fontSize: FONT_SIZE.medium,
    backgroundColor: COLORS.white,
    height: 44, // Fixed height for consistency
  },
  optionsGrid: {
    flexDirection: 'row',
    gap: SPACING.xs, // Reduced from small
  },
  optionCard: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.medium,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary.light,
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedOption: {
    backgroundColor: COLORS.primary.light,
    borderColor: COLORS.primary.main,
    borderWidth: 2,
  },
  optionIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: FONT_SIZE.xs, // Reduced from small
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.primary.light,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  selectedOptionText: {
    color: COLORS.text.primary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  activityGrid: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  activityCard: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.xs,
    borderWidth: 2,
    borderColor: COLORS.primary.light,
    alignItems: 'center',
    minHeight: 70,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedActivity: {
    backgroundColor: COLORS.primary.light,
    borderColor: COLORS.primary.main,
    borderWidth: 2,
  },
  activityIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  activityLabel: {
    fontSize: 8,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.primary.light,
    textAlign: 'center',
    marginBottom: 1,
  },
  selectedActivityText: {
    color: COLORS.text.primary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  activityDescription: {
    fontSize: 8,
    color: COLORS.primary.light,
    textAlign: 'center',
    lineHeight: 10,
  },
  selectedActivityDescription: {
    color: COLORS.primary.light,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.small, // Reduced from medium
    marginTop: SPACING.medium, // Reduced from large
    gap: SPACING.xs, // Reduced from small
    borderWidth: 1,
    borderColor: COLORS.primary.light,
  },
  statusText: {
    flex: 1,
    fontSize: FONT_SIZE.xs, // Reduced from small
    color: COLORS.primary.light,
    lineHeight: 16, // Tighter line height
  },
  statusTextComplete: {
    color: COLORS.success,
  },
  bmiGroup: {
    flex: 1,
    marginBottom: SPACING.small,
    marginRight: 0, // No right margin for the last item
  },
  bmiContainer: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.small,
    backgroundColor: COLORS.white,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bmiValue: {
    fontSize: FONT_SIZE.small,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary.light,
    lineHeight: 16,
  },
  bmiCategoryText: {
    fontSize: 8,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: 10,
  },
});
