import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BaseModal from '../ui/BaseModal';
import { customBodyTypeGoalService, CreateBodyTypeGoalRequest } from '../../services/CustomBodyTypeGoalService';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../../theme/constants';

interface CustomBodyTypeGoalCreatorProps {
  visible: boolean;
  onClose: () => void;
  onGoalCreated: (goalId: string) => void;
  userGender?: 'male' | 'female';
}

const GOAL_COLORS = [
  { name: 'Blue', value: '#3b82f6', icon: 'water' },
  { name: 'Green', value: '#10b981', icon: 'leaf' },
  { name: 'Purple', value: '#8b5cf6', icon: 'flower' },
  { name: 'Orange', value: '#f59e0b', icon: 'flame' },
  { name: 'Red', value: '#ef4444', icon: 'heart' },
  { name: 'Pink', value: '#ec4899', icon: 'heart-circle' },
];

const GOAL_ICONS = [
  'fitness',
  'barbell',
  'bicycle',
  'walk',
  'heart',
  'flash',
  'star',
  'trophy',
  'medal',
  'ribbon',
];

const SMM_LEVELS = ['low', 'moderate', 'high', 'very_high'];
const CALORIE_TARGETS = ['deficit', 'maintenance', 'surplus'];
const WORKOUT_FOCUS_OPTIONS = [
  'strength training',
  'cardio focused',
  'balanced strength and cardio',
  'bodyweight training',
  'flexibility and mobility',
  'sports specific',
];

export default function CustomBodyTypeGoalCreator({
  visible,
  onClose,
  onGoalCreated,
  userGender = 'male',
}: CustomBodyTypeGoalCreatorProps) {
  const [loading, setLoading] = useState(false);
  const [goalData, setGoalData] = useState<CreateBodyTypeGoalRequest>({
    name: '',
    icon: '',
    color: '',
    target_bmi: 0,
    target_body_fat: undefined,
    target_attributes: customBodyTypeGoalService.generateDefaultTargetAttributes(0, undefined, userGender),
  });


  const handleCreateGoal = async () => {
    try {
      setLoading(true);

      // Validate goal data
      const validation = customBodyTypeGoalService.validateGoalData(goalData);
      if (!validation.isValid) {
        Alert.alert('Validation Error', validation.errors.join('\n'));
        return;
      }

      // Create the goal
      const createdGoal = await customBodyTypeGoalService.createGoal(goalData);
      
      Alert.alert(
        'Success!',
        'Your custom body type goal has been created successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              onGoalCreated(createdGoal.id);
              handleClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating custom goal:', error);
      Alert.alert('Error', 'Failed to create custom goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGoalData({
      name: '',
      icon: '',
      color: '',
      target_bmi: 0,
      target_body_fat: undefined,
      target_attributes: customBodyTypeGoalService.generateDefaultTargetAttributes(0, undefined, userGender),
    });
    onClose();
  };

  const updateTargetAttribute = (key: string, field: string, value: number | string) => {
    const numericValue = typeof value === 'string' ? (value === '' ? 0 : parseFloat(value) || 0) : value;
    setGoalData(prev => ({
      ...prev,
      target_attributes: {
        ...prev.target_attributes,
        [key]: {
          ...prev.target_attributes[key],
          [field]: numericValue,
        },
      },
    }));
  };

  const renderForm = () => (
    <View style={styles.formContent}>
      {/* Basic Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Goal Name *</Text>
          <TextInput
            style={styles.textInput}
            value={goalData.name}
            onChangeText={(text) => setGoalData({ ...goalData, name: text })}
            placeholder="e.g., Lean & Athletic"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Visual Style */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Visual Style</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Icon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconSelector}>
            <TouchableOpacity
              style={[
                styles.iconOption,
                !goalData.icon && styles.iconOptionSelected,
              ]}
              onPress={() => setGoalData({ ...goalData, icon: '' })}
            >
              <Text style={styles.noSelectionText}>None</Text>
            </TouchableOpacity>
            {GOAL_ICONS.map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconOption,
                  goalData.icon === icon && styles.iconOptionSelected,
                ]}
                onPress={() => setGoalData({ ...goalData, icon })}
              >
                <Ionicons
                  name={icon as any}
                  size={24}
                  color={goalData.icon === icon ? '#fff' : '#6b7280'}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorSelector}>
            <TouchableOpacity
              style={[
                styles.colorOption,
                styles.noColorOption,
                !goalData.color && styles.colorOptionSelected,
              ]}
              onPress={() => setGoalData({ ...goalData, color: '' })}
            >
              {!goalData.color && (
                <Ionicons name="checkmark" size={20} color="#fff" />
              )}
            </TouchableOpacity>
            {GOAL_COLORS.map((color) => (
              <TouchableOpacity
                key={color.value}
                style={[
                  styles.colorOption,
                  { backgroundColor: color.value },
                  goalData.color === color.value && styles.colorOptionSelected,
                ]}
                onPress={() => setGoalData({ ...goalData, color: color.value })}
              >
                {goalData.color === color.value && (
                  <Ionicons name="checkmark" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Target Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Target Metrics</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Target BMI *</Text>
          <TextInput
            style={styles.textInput}
            value={goalData.target_bmi === 0 ? '' : goalData.target_bmi.toString()}
            onChangeText={(text) => {
              if (text === '') {
                setGoalData({
                  ...goalData,
                  target_bmi: 0,
                });
              } else {
                const bmi = parseFloat(text);
                if (!isNaN(bmi)) {
                  setGoalData({
                    ...goalData,
                    target_bmi: bmi,
                    target_attributes: customBodyTypeGoalService.generateDefaultTargetAttributes(
                      bmi,
                      goalData.target_body_fat,
                      userGender
                    ),
                  });
                }
              }
            }}
            placeholder="22.0"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Target Body Fat % (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={goalData.target_body_fat?.toString() || ''}
            onChangeText={(text) => {
              if (text === '') {
                setGoalData({
                  ...goalData,
                  target_body_fat: undefined,
                  target_attributes: customBodyTypeGoalService.generateDefaultTargetAttributes(
                    goalData.target_bmi,
                    undefined,
                    userGender
                  ),
                });
              } else {
                const bodyFat = parseFloat(text);
                if (!isNaN(bodyFat)) {
                  setGoalData({
                    ...goalData,
                    target_body_fat: bodyFat,
                    target_attributes: customBodyTypeGoalService.generateDefaultTargetAttributes(
                      goalData.target_bmi,
                      bodyFat,
                      userGender
                    ),
                  });
                }
              }
            }}
            placeholder="15.0"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Preview</Text>
          <View style={[
            styles.goalPreview, 
            { 
              backgroundColor: goalData.color || '#f3f4f6',
              borderWidth: goalData.color ? 0 : 2,
              borderColor: goalData.color ? 'transparent' : '#d1d5db',
              borderStyle: goalData.color ? 'solid' : 'dashed',
            }
          ]}>
            {goalData.icon ? (
              <Ionicons name={goalData.icon as any} size={32} color={goalData.color ? "#fff" : "#6b7280"} />
            ) : (
              <Ionicons name="help-outline" size={32} color={goalData.color ? "#fff" : "#6b7280"} />
            )}
            <Text style={[
              styles.goalPreviewName,
              { color: goalData.color ? "#fff" : "#6b7280" }
            ]}>
              {goalData.name || 'Your Goal'}
            </Text>
          </View>
        </View>
      </View>

      {/* Advanced Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Advanced Settings</Text>
        
        {/* SMM Level */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Skeletal Muscle Mass Level</Text>
          <View style={styles.optionSelector}>
            {SMM_LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.optionButton,
                  goalData.target_attributes.smm_level === level && styles.optionButtonSelected,
                ]}
                onPress={() => setGoalData({
                  ...goalData,
                  target_attributes: {
                    ...goalData.target_attributes,
                    smm_level: level,
                  },
                })}
              >
                <Text style={[
                  styles.optionButtonText,
                  goalData.target_attributes.smm_level === level && styles.optionButtonTextSelected,
                ]}>
                  {level.replace('_', ' ').toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Calorie Target */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Calorie Target</Text>
          <View style={styles.optionSelector}>
            {CALORIE_TARGETS.map((target) => (
              <TouchableOpacity
                key={target}
                style={[
                  styles.optionButton,
                  goalData.target_attributes.calorie_target === target && styles.optionButtonSelected,
                ]}
                onPress={() => setGoalData({
                  ...goalData,
                  target_attributes: {
                    ...goalData.target_attributes,
                    calorie_target: target,
                  },
                })}
              >
                <Text style={[
                  styles.optionButtonText,
                  goalData.target_attributes.calorie_target === target && styles.optionButtonTextSelected,
                ]}>
                  {target.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Workout Focus */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Workout Focus</Text>
          <View style={styles.optionSelector}>
            {WORKOUT_FOCUS_OPTIONS.map((focus) => (
              <TouchableOpacity
                key={focus}
                style={[
                  styles.optionButton,
                  goalData.target_attributes.workout_focus === focus && styles.optionButtonSelected,
                ]}
                onPress={() => setGoalData({
                  ...goalData,
                  target_attributes: {
                    ...goalData.target_attributes,
                    workout_focus: focus,
                  },
                })}
              >
                <Text style={[
                  styles.optionButtonText,
                  goalData.target_attributes.workout_focus === focus && styles.optionButtonTextSelected,
                ]}>
                  {focus.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Range Inputs */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Workout Frequency (days/week)</Text>
          <View style={styles.rangeInputContainer}>
            <TextInput
              style={styles.rangeInput}
              value={goalData.target_attributes.workout_frequency.min === 0 ? '' : goalData.target_attributes.workout_frequency.min.toString()}
              onChangeText={(text) => updateTargetAttribute('workout_frequency', 'min', text)}
              placeholder="Min"
              keyboardType="numeric"
            />
            <Text style={styles.rangeSeparator}>-</Text>
            <TextInput
              style={styles.rangeInput}
              value={goalData.target_attributes.workout_frequency.max === 0 ? '' : goalData.target_attributes.workout_frequency.max.toString()}
              onChangeText={(text) => updateTargetAttribute('workout_frequency', 'max', text)}
              placeholder="Max"
              keyboardType="numeric"
            />
            <TextInput
              style={styles.rangeInput}
              value={goalData.target_attributes.workout_frequency.recommended === 0 ? '' : goalData.target_attributes.workout_frequency.recommended.toString()}
              onChangeText={(text) => updateTargetAttribute('workout_frequency', 'recommended', text)}
              placeholder="Rec"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cardio Minutes (per week)</Text>
          <View style={styles.rangeInputContainer}>
            <TextInput
              style={styles.rangeInput}
              value={goalData.target_attributes.cardio_minutes.min === 0 ? '' : goalData.target_attributes.cardio_minutes.min.toString()}
              onChangeText={(text) => updateTargetAttribute('cardio_minutes', 'min', text)}
              placeholder="Min"
              keyboardType="numeric"
            />
            <Text style={styles.rangeSeparator}>-</Text>
            <TextInput
              style={styles.rangeInput}
              value={goalData.target_attributes.cardio_minutes.max === 0 ? '' : goalData.target_attributes.cardio_minutes.max.toString()}
              onChangeText={(text) => updateTargetAttribute('cardio_minutes', 'max', text)}
              placeholder="Max"
              keyboardType="numeric"
            />
            <TextInput
              style={styles.rangeInput}
              value={goalData.target_attributes.cardio_minutes.recommended === 0 ? '' : goalData.target_attributes.cardio_minutes.recommended.toString()}
              onChangeText={(text) => updateTargetAttribute('cardio_minutes', 'recommended', text)}
              placeholder="Rec"
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <BaseModal
      visible={visible}
      onClose={handleClose}
      title="Create Custom Goal"
      size="large"
      position="center"
      scrollable={true}
      keyboardAvoiding={true}
    >
      <View style={styles.formContent}>
        {renderForm()}
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateGoal}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating...' : 'Create Goal'}
          </Text>
        </TouchableOpacity>
      </View>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  formContent: {
    padding: 20,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: SPACING.sm,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.text.primary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  iconSelector: {
    flexDirection: 'row',
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  iconOptionSelected: {
    backgroundColor: COLORS.primary,
  },
  noSelectionText: {
    fontSize: FONT_SIZE.sm,
    color: '#6b7280',
    fontWeight: '500',
  },
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noColorOption: {
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  previewContainer: {
    marginTop: SPACING.lg,
  },
  previewTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  goalPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  goalPreviewName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: '#fff',
    marginLeft: SPACING.sm,
  },
  advancedSettings: {
    maxHeight: 300,
  },
  optionSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  optionButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  optionButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionButtonText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  optionButtonTextSelected: {
    color: '#fff',
  },
  rangeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  rangeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  rangeSeparator: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#f9fafb',
  },
  cancelButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  createButton: {
    flex: 2,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  createButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  createButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#fff',
  },
});