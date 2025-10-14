import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Removed Zustand store imports

import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../../theme/constants';

import { DebugUtils } from '../../utils/debugUtils';

export interface ExerciseData {
  exercise_name: string;
  sets?: number | string;
  reps?: string | number;
  weight_used?: number | string;
  weight?: number | string; // Alternative field name
  weight_unit?: string;
  duration?: number | string; // in minutes
  distance?: number | string; // in km/miles
  distance_unit?: string;
  intensity?: string; // low, medium, high
  category?: string; // bodyweight, weighted, cardio_duration, distance_based
  logging_category?: string; // Alternative field name
}

interface DynamicExerciseFormProps {
  exercise: ExerciseData;
  index: number;
  onUpdate: (index: number, field: keyof ExerciseData, value: unknown) => void;
  onRemove: (index: number) => void;
  activityType: string;
  showRemove?: boolean;
}

// Categories will be loaded from database

export default function DynamicExerciseForm({
  exercise,
  index,
  onUpdate,
  onRemove,
  activityType,
  showRemove = true
}: DynamicExerciseFormProps) {
  // Removed Zustand store usage - using local state
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      // Load categories logic here
      setLoaded(true);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load categories on component mount if not already loaded
  useEffect(() => {
    if (!loaded && !loading) {
      loadCategories();
    }
  }, [loaded, loading, loadCategories]);

  // Use category from database (backend provides logging_category)
  const getExerciseCategory = (): string => {
    // Use database category first (highest priority)
    if (exercise.logging_category) return exercise.logging_category;
    if (exercise.category) return exercise.category;

    // Fallback to activity type detection if no database category
    if (activityType === 'cardio' || activityType === 'running' || activityType === 'cycling' || activityType === 'swimming') {
      return 'distance_based';
    }
    if (activityType === 'yoga') {
      return 'cardio_duration';
    }

    // Default to weighted for weightlifting
    return 'weighted';
  };

  const category = getExerciseCategory();
  // const categoryConfig = getCategoryConfig(category);

  const renderField = (field: string, isHorizontal: boolean = false) => {
    const containerStyle = isHorizontal ? styles.horizontalFieldContainer : styles.fieldContainer;

    DebugUtils.log(`🔍 [DYNAMIC FORM] Rendering field: ${field}, isHorizontal: ${isHorizontal}`);
    DebugUtils.log(`🔍 [DYNAMIC FORM] Exercise data:`, exercise);
    DebugUtils.log(`🔍 [DYNAMIC FORM] Category:`, category);
    DebugUtils.log(`🔍 [DYNAMIC FORM] Field name check - is distance?:`, field === 'distance');

    switch (field) {
      case 'sets':
        return (
          <View style={[containerStyle, isHorizontal && styles.inlineFieldContainer]}>
            <Text style={[styles.fieldLabel, isHorizontal && styles.inlineFieldLabel]}>Sets</Text>
            <TextInput
              style={[styles.fieldInput, isHorizontal && styles.inlineFieldInput]}
              value={exercise.sets ? exercise.sets.toString() : ''}
              onChangeText={(text) => {
                // Only allow integers
                const numericValue = text.replace(/[^0-9]/g, '');
                onUpdate(index, 'sets', numericValue);
              }}
              keyboardType="numeric"
              placeholder="3"
            />
          </View>
        );

      case 'reps':
        return (
          <View style={[containerStyle, isHorizontal && styles.inlineFieldContainer]}>
            <Text style={[styles.fieldLabel, isHorizontal && styles.inlineFieldLabel]}>Reps</Text>
            <TextInput
              style={[styles.fieldInput, isHorizontal && styles.inlineFieldInput]}
              value={exercise.reps?.toString() || ''}
              onChangeText={(text) => {
                // Only allow integers
                const numericValue = text.replace(/[^0-9]/g, '');
                onUpdate(index, 'reps', numericValue);
              }}
              keyboardType="numeric"
              placeholder="10"
            />
          </View>
        );

      case 'weight_used':
        return (
          <View style={[containerStyle, isHorizontal && styles.inlineFieldContainer]}>
            <Text style={[styles.fieldLabel, isHorizontal && styles.inlineFieldLabel]}>Weight (kg)</Text>
            <TextInput
              style={[styles.fieldInput, isHorizontal && styles.inlineFieldInput]}
              value={(() => {
                const weight = exercise.weight_used || exercise.weight;
                DebugUtils.log(`🔍 [DYNAMIC FORM] Weight field - exercise.weight_used: ${exercise.weight_used}, exercise.weight: ${exercise.weight}, final weight: ${weight}`);
                DebugUtils.log(`🔍 [DYNAMIC FORM] Weight field - Number(weight): ${Number(weight)}, condition: ${weight && Number(weight) > 0}`);
                return weight ? weight.toString() : '';
              })()}
              onChangeText={(text) => {
                // Only allow integers and decimal point
                const numericValue = text.replace(/[^0-9.]/g, '');
                onUpdate(index, 'weight_used', numericValue);
                onUpdate(index, 'weight', numericValue); // Update both fields for compatibility
              }}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
        );

      case 'duration':
        return (
          <View style={[containerStyle, isHorizontal && styles.inlineFieldContainer]}>
            <Text style={[styles.fieldLabel, isHorizontal && styles.inlineFieldLabel]}>Dur (min)</Text>
            <TextInput
              style={[styles.fieldInput, isHorizontal && styles.inlineFieldInput]}
              value={exercise.duration ? exercise.duration.toString() : ''}
              onChangeText={(text) => {
                // Only allow integers
                const numericValue = text.replace(/[^0-9]/g, '');
                onUpdate(index, 'duration', numericValue);
              }}
              keyboardType="numeric"
              placeholder="30"
            />
          </View>
        );

      case 'distance':
        const distanceLabel = "Distance (km)";
        DebugUtils.log('🔍 [DYNAMIC FORM] Distance field - Label text:', distanceLabel);
        DebugUtils.log('🔍 [DYNAMIC FORM] Distance field - Exercise data:', exercise);
        DebugUtils.log('🔍 [DYNAMIC FORM] Distance field - Category:', category);
        return (
          <View style={[containerStyle, isHorizontal && styles.inlineFieldContainer]}>
            <Text style={[styles.fieldLabel, isHorizontal && styles.inlineFieldLabel]}>{distanceLabel}</Text>
            <TextInput
              style={[styles.fieldInput, isHorizontal && styles.inlineFieldInput]}
              value={exercise.distance ? exercise.distance.toString() : ''}
              onChangeText={(text) => {
                // Only allow integers and decimal point
                const numericValue = text.replace(/[^0-9.]/g, '');
                DebugUtils.log('🔍 [DYNAMIC FORM] Distance field - Input changed:', { text, numericValue });
                onUpdate(index, 'distance', numericValue);
              }}
              keyboardType="numeric"
              placeholder="5"
            />
          </View>
        );

      default:
        return null;
    }
  };

  DebugUtils.log('🔍 [DYNAMIC FORM] Main render - Exercise:', exercise);
  DebugUtils.log('🔍 [DYNAMIC FORM] Main render - Category:', category);
  DebugUtils.log('🔍 [DYNAMIC FORM] Main render - Category check for distance_based:', category === 'distance_based');

  return (
    <View style={styles.container}>
      {showRemove && (
        <View style={styles.header}>
          <View style={styles.spacer} />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(index)}
          >
            <Ionicons name="close-circle" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.fieldsContainer}>
        {/* Standardized 3-field layout for all exercise types */}
        <View style={styles.horizontalFieldsRow}>
          {/* Field 1: Sets (for bodyweight/weighted) or Distance (for distance_based) or Duration (for cardio_duration) */}
          <View style={styles.horizontalField}>
            {category === 'bodyweight' || category === 'weighted' ? (
              renderField('sets', true)
            ) : category === 'distance_based' ? (
              renderField('distance', true)
            ) : category === 'cardio_duration' ? (
              renderField('duration', true)
            ) : (
              renderField('sets', true)
            )}
          </View>

          {/* Field 2: Reps (for bodyweight/weighted) or Duration (for distance_based) or empty (for cardio_duration) */}
          <View style={styles.horizontalField}>
            {category === 'bodyweight' || category === 'weighted' ? (
              renderField('reps', true)
            ) : category === 'distance_based' ? (
              renderField('duration', true)
            ) : category === 'cardio_duration' ? (
              <View style={[styles.disabledField, { opacity: 0 }]}>
                <Text style={styles.disabledFieldLabel}>Reps</Text>
                <TextInput
                  style={styles.disabledFieldInput}
                  value=""
                  editable={false}
                  placeholder="-"
                />
              </View>
            ) : (
              renderField('reps', true)
            )}
          </View>

          {/* Field 3: Weight (for weighted) or empty (for others) */}
          <View style={styles.horizontalField}>
            {category === 'weighted' ? (
              renderField('weight_used', true)
            ) : (
              <View style={[styles.disabledField, { opacity: 0 }]}>
                <Text style={styles.disabledFieldLabel}>Weight</Text>
                <TextInput
                  style={styles.disabledFieldInput}
                  value=""
                  editable={false}
                  placeholder="-"
                />
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 6,
    padding: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  spacer: {
    flex: 1,
  },
  removeButton: {
    padding: SPACING.xxs,
  },
  fieldsContainer: {
    gap: 6,
  },
  horizontalFieldsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  horizontalField: {
    width: '30%',
    minHeight: 40,
  },
  fieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  fieldWrapper: {
    minWidth: '45%',
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 6,
  },
  horizontalFieldContainer: {
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 3,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: BORDER_RADIUS.xs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xxs,
    fontSize: FONT_SIZE.md,
    backgroundColor: COLORS.background.primary,
  },
  inlineFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  inlineFieldLabel: {
    marginBottom: 0,
    width: 35,
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  inlineFieldInput: {
    width: 60,
    paddingHorizontal: SPACING.xxs,
    paddingVertical: 3,
    fontSize: 11,
  },
  disabledField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  disabledFieldLabel: {
    marginBottom: 0,
    width: 35,
    fontSize: FONT_SIZE.xs,
    color: COLORS.text.tertiary,
    fontWeight: '500',
  },
  disabledFieldInput: {
    width: 60,
    paddingHorizontal: SPACING.xxs,
    paddingVertical: 3,
    fontSize: 11,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: BORDER_RADIUS.xs,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
});
