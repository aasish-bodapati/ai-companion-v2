import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryBadge } from './Badge';
import SmartInput from './SmartInput';
import { inputPresets } from '../../test-utils/testConfigs';
import { COLORS, BORDER_RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme/constants';

export interface SimpleLoggingItemData {
  id: number | string;
  name: string;
  sets?: number;
  reps?: string;
  weight_kg?: number;
  duration_minutes?: number;
  distance?: number;
  category?: string;
}

interface SimpleLoggingItemProps {
  item: SimpleLoggingItemData;
  onUpdate?: (id: number | string, updates: Partial<SimpleLoggingItemData>) => void;
  onRemove?: (id: number | string) => void;
  editable?: boolean;
}

export default function SimpleLoggingItem({ item, onUpdate, onRemove, editable = true }: SimpleLoggingItemProps) {

  // Helper function to update parent
  const updateParent = (field: string, value: string | number) => {
    if (onUpdate) {
      onUpdate(item.id, { [field]: value });
    }
  };

  // Handle input changes with SmartInput
  const handleSetsChange = (text: string) => {
    const numValue = parseFloat(text);
    if (!isNaN(numValue) && numValue > 0) {
      updateParent('sets', numValue);
    }
  };

  const handleRepsChange = (text: string) => {
    updateParent('reps', text);
  };

  const handleWeightChange = (text: string) => {
    const numValue = parseFloat(text);
    if (!isNaN(numValue) && numValue > 0) {
      updateParent('weight_kg', numValue);
    }
  };

  const handleDurationChange = (text: string) => {
    const numValue = parseFloat(text);
    if (!isNaN(numValue) && numValue > 0) {
      updateParent('duration_minutes', numValue);
    }
  };

  const handleDistanceChange = (text: string) => {
    const numValue = parseFloat(text);
    if (!isNaN(numValue) && numValue > 0) {
      updateParent('distance', numValue);
    }
  };

  // Get category configuration
  const getCategoryConfig = (category: string) => {
    const safeCategory = category || '';
    switch (safeCategory) {
      case 'bodyweight':
        return {
          color: COLORS.success, // '#10b981' -> COLORS.success
          icon: 'person',
          name: 'BODYWEIGHT',
          fields: ['sets', 'reps'] // Standard bodyweight exercises use sets and reps
        };
      case 'weighted':
        return {
          color: COLORS.warning, // '#f59e0b' -> COLORS.warning
          icon: 'barbell',
          name: 'WEIGHTED',
          fields: ['sets', 'reps', 'weight_kg', 'rest_time']
        };
      case 'cardio_duration':
        return {
          color: COLORS.danger, // '#ef4444' -> COLORS.danger
          icon: 'heart',
          name: 'CARDIO',
          fields: ['duration_minutes']
        };
      case 'distance_based':
        return {
          color: COLORS.primary.main, // '#3b82f6' -> COLORS.primary.main
          icon: 'walk',
          name: 'DISTANCE',
          fields: ['distance', 'duration_minutes']
        };
      case 'flexibility':
        return {
          color: '#8b5cf6', // Keep as is - not in theme constants
          icon: 'leaf',
          name: 'FLEXIBILITY',
          fields: ['duration_minutes', 'reps'] // Reps for hold counts
        };
      case 'sports':
        return {
          color: '#06b6d4', // Keep as is - not in theme constants
          icon: 'football',
          name: 'SPORTS',
          fields: ['duration_minutes', 'distance']
        };
      default:
        return {
          color: COLORS.text.secondary, // '#6b7280' -> COLORS.text.secondary
          icon: 'fitness',
          name: 'EXERCISE',
          fields: ['sets', 'reps', 'weight_kg', 'duration_minutes', 'distance'] // Show all for unknown types
        };
    }
  };

  const categoryConfig = getCategoryConfig(String(item.category || ''));

  // Field configurations using SmartInput presets
  const fieldConfigs = {
    sets: {
      ...inputPresets.sets,
      value: item.sets?.toString() || '',
      onChangeText: handleSetsChange,
    },
    reps: {
      ...inputPresets.reps,
      value: item.reps || '',
      onChangeText: handleRepsChange,
    },
    weight_kg: {
      ...inputPresets.weight,
      value: item.weight_kg?.toString() || '',
      onChangeText: handleWeightChange,
    },
    duration_minutes: {
      ...inputPresets.duration,
      value: item.duration_minutes?.toString() || '',
      onChangeText: handleDurationChange,
    },
    distance: {
      ...inputPresets.distance,
      value: item.distance?.toString() || '',
      onChangeText: handleDistanceChange,
    },
    rest_time: {
      type: 'numeric' as const,
      placeholder: '0',
      value: item.rest_time?.toString() || '',
      onChangeText: (text: string) => updateParent('rest_time', text),
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.exerciseTitleRow}>
            <View style={styles.exerciseTitleLeft}>
              <Text style={styles.exerciseTitle}>
                {String(item.name || 'Exercise')}
              </Text>
            </View>
            <View style={styles.exerciseTitleRight}>
              <CategoryBadge
                category={String(item.category || '')}
                size="small"
              />
              {editable && onRemove && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => onRemove(item.id)}
                  testID="remove-button"
                >
                  <Ionicons name="trash" size={FONT_SIZE.lg} color={COLORS.danger} /> {/* 16 -> FONT_SIZE.lg, '#ef4444' -> COLORS.danger */}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.workoutFields}>
          <View style={styles.fieldRow}>
            {categoryConfig.fields.map((fieldKey) => {
              const fieldConfig = fieldConfigs[fieldKey as keyof typeof fieldConfigs];
              if (!fieldConfig) return null;

              return (
                <View key={fieldKey} style={styles.fieldContainer}>
                  {editable ? (
                    <SmartInput
                      {...fieldConfig}
                      size="small"
                      containerStyle={styles.smartInputContainer}
                    />
                  ) : (
                    <View style={styles.displayField}>
                      <Text style={styles.fieldLabel}>{fieldConfig.label}</Text>
                      <Text style={styles.fieldValue}>{fieldConfig.value || 'N/A'}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.primary, // '#ffffff' -> COLORS.background.primary
    borderRadius: BORDER_RADIUS.lg, // 12 -> BORDER_RADIUS.lg
    marginHorizontal: SPACING.lg, // 16 -> SPACING.lg
    marginBottom: SPACING.md, // 12 -> SPACING.md
    ...SHADOWS.small, // Replaced individual shadow properties with SHADOWS.small
  },
  content: {
    padding: SPACING.lg, // 16 -> SPACING.lg
  },
  header: {
    marginBottom: SPACING.md, // 12 -> SPACING.md
  },
  exerciseTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseTitleLeft: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: FONT_SIZE.lg, // 16 -> FONT_SIZE.lg
    fontWeight: FONT_WEIGHT.semibold, // '600' -> FONT_WEIGHT.semibold
    color: COLORS.text.primary, // '#1f2937' -> COLORS.text.primary
  },
  exerciseTitleRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutFields: {
    marginTop: SPACING.sm, // 8 -> SPACING.sm
  },
  fieldRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md, // 12 -> SPACING.md
  },
  fieldContainer: {
    flex: 1,
    minWidth: '30%',
  },
  fieldLabel: {
    fontSize: FONT_SIZE.sm, // 12 -> FONT_SIZE.sm
    color: COLORS.text.secondary, // '#6b7280' -> COLORS.text.secondary
    marginBottom: SPACING.xs, // 4 -> SPACING.xs
  },
  smartInputContainer: {
    marginBottom: 0, // Override SmartInput's default margin
  },
  displayField: {
    paddingVertical: SPACING.xs, // 4 -> SPACING.xs
  },
  fieldValue: {
    fontSize: FONT_SIZE.md, // 14 -> FONT_SIZE.md
    fontWeight: FONT_WEIGHT.medium, // '500' -> FONT_WEIGHT.medium
    color: COLORS.text.primary, // '#1f2937' -> COLORS.text.primary
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border.medium, // '#d1d5db' -> COLORS.border.medium
    borderRadius: BORDER_RADIUS.sm, // 6 -> BORDER_RADIUS.sm
    paddingHorizontal: SPACING.sm, // 8 -> SPACING.sm
    paddingVertical: SPACING.xs, // 6 -> SPACING.xs
    fontSize: FONT_SIZE.md, // 14 -> FONT_SIZE.md
    color: COLORS.text.primary, // '#1f2937' -> COLORS.text.primary
    backgroundColor: COLORS.background.primary, // '#ffffff' -> COLORS.background.primary
  },
  removeButton: {
    marginLeft: SPACING.sm, // 8 -> SPACING.sm
    padding: SPACING.xs, // 4 -> SPACING.xs
  },
});
