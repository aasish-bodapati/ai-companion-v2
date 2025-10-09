import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryBadge } from './Badge';

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
  console.log('🔄 [SIMPLE LOGGING ITEM] Rendering:', item.name);
  
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
    switch (category) {
      case 'bodyweight':
        return { 
          color: '#10b981', 
          icon: 'person', 
          name: 'BODYWEIGHT',
          fields: ['sets', 'reps'] // Standard bodyweight exercises use sets and reps
        };
      case 'weighted':
        return { 
          color: '#f59e0b', 
          icon: 'barbell', 
          name: 'WEIGHTED',
          fields: ['sets', 'reps', 'weight_kg', 'rest_time']
        };
      case 'cardio_duration':
        return { 
          color: '#ef4444', 
          icon: 'heart', 
          name: 'CARDIO',
          fields: ['duration_minutes']
        };
      case 'distance_based':
        return { 
          color: '#3b82f6', 
          icon: 'walk', 
          name: 'DISTANCE',
          fields: ['distance', 'duration_minutes']
        };
      case 'flexibility':
        return { 
          color: '#8b5cf6', 
          icon: 'leaf', 
          name: 'FLEXIBILITY',
          fields: ['duration_minutes', 'reps'] // Reps for hold counts
        };
      case 'sports':
        return { 
          color: '#06b6d4', 
          icon: 'football', 
          name: 'SPORTS',
          fields: ['duration_minutes', 'distance']
        };
      default:
        return { 
          color: '#6b7280', 
          icon: 'fitness', 
          name: 'EXERCISE',
          fields: ['sets', 'reps', 'weight_kg', 'duration_minutes', 'distance'] // Show all for unknown types
        };
    }
  };
  
  const categoryConfig = getCategoryConfig(item.category || '');
  
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
      getDisplayValue: () => item.reps || 'N/A'
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
      value: item.rest_time || '',
      onChange: (text: string) => {
        updateParent('rest_time', text);
      },
      getDisplayValue: () => `${item.rest_time || 0}s`
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.exerciseTitleRow}>
            <View style={styles.exerciseTitleLeft}>
              <Text style={styles.exerciseTitle}>
                {item.name}
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
                >
                  <Ionicons name="trash" size={16} color="#ef4444" />
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
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 12,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  exerciseTitleRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutFields: {
    marginTop: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fieldContainer: {
    flex: 1,
    minWidth: '30%',
  },
  fieldLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  removeButton: {
    marginLeft: 8,
    padding: 4,
  },
});
