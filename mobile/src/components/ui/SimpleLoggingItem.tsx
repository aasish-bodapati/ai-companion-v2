import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryBadge } from './Badge';
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
  
  // Local state for input values
  const [sets, setSets] = useState(item.sets?.toString() || '');
  const [reps, setReps] = useState(item.reps || '');
  const [weight, setWeight] = useState(item.weight_kg?.toString() || '');
  const [duration, setDuration] = useState(item.duration_minutes?.toString() || '');
  const [distance, setDistance] = useState(item.distance?.toString() || '');
  
  // Update local state when item prop changes
  useEffect(() => {
    setSets(item.sets?.toString() || '');
    setReps(item.reps || '');
    setWeight(item.weight_kg?.toString() || '');
    setDuration(item.duration_minutes?.toString() || '');
    setDistance(item.distance?.toString() || '');
  }, [item.sets, item.reps, item.weight_kg, item.duration_minutes, item.distance]);
  
  // Helper function to update parent
  const updateParent = (field: string, value: string | number) => {
    if (onUpdate) {
      onUpdate(item.id, { [field]: value });
    }
  };
  
  // Handle input changes
  const handleSetsChange = (text: string) => {
    setSets(text);
    const numValue = parseFloat(text);
    if (!isNaN(numValue) && numValue > 0) {
      updateParent('sets', numValue);
    }
  };
  
  const handleRepsChange = (text: string) => {
    setReps(text);
    updateParent('reps', text);
  };
  
  const handleWeightChange = (text: string) => {
    setWeight(text);
    const numValue = parseFloat(text);
    if (!isNaN(numValue) && numValue > 0) {
      updateParent('weight_kg', numValue);
    }
  };
  
  const handleDurationChange = (text: string) => {
    setDuration(text);
    const numValue = parseFloat(text);
    if (!isNaN(numValue) && numValue > 0) {
      updateParent('duration_minutes', numValue);
    }
  };
  
  const handleDistanceChange = (text: string) => {
    setDistance(text);
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
  
  // Field configurations
  const fieldConfigs = {
    sets: {
      label: 'Sets',
      placeholder: '0',
      keyboardType: 'numeric' as const,
      value: sets,
      onChange: handleSetsChange,
      getDisplayValue: () => item.sets || 0
    },
    reps: {
      label: 'Reps',
      placeholder: '0',
      keyboardType: 'numeric' as const,
      value: reps,
      onChange: handleRepsChange,
      getDisplayValue: () => String(item.reps || 'N/A')
    },
    weight_kg: {
      label: 'Weight (kg)',
      placeholder: '0',
      keyboardType: 'numeric' as const,
      value: weight,
      onChange: handleWeightChange,
      getDisplayValue: () => `${item.weight_kg || 0} kg`
    },
    duration_minutes: {
      label: 'Duration (min)',
      placeholder: '0',
      keyboardType: 'numeric' as const,
      value: duration,
      onChange: handleDurationChange,
      getDisplayValue: () => `${item.duration_minutes || 0} min`
    },
    distance: {
      label: 'Distance (km)',
      placeholder: '0',
      keyboardType: 'numeric' as const,
      value: distance,
      onChange: handleDistanceChange,
      getDisplayValue: () => `${item.distance || 0} km`
    },
    rest_time: {
      label: 'Rest (sec)',
      placeholder: '0',
      keyboardType: 'numeric' as const,
      value: String(item.rest_time || ''),
      onChange: (text: string) => {
        updateParent('rest_time', text);
      },
      getDisplayValue: () => `${String(item.rest_time || 0)}s`
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
                category={item.category || ''} 
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
                  <Text style={styles.fieldLabel}>{fieldConfig.label}</Text>
                  {editable ? (
                    <TextInput
                      style={styles.input}
                      value={fieldConfig.value}
                      onChangeText={fieldConfig.onChange}
                      placeholder={fieldConfig.placeholder}
                      keyboardType={fieldConfig.keyboardType}
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{fieldConfig.getDisplayValue()}</Text>
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
