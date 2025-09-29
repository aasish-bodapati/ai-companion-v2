import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  onUpdate: (index: number, field: keyof ExerciseData, value: any) => void;
  onRemove: (index: number) => void;
  activityType: string;
  showRemove?: boolean;
}

const EXERCISE_CATEGORIES = {
  bodyweight: {
    name: 'Bodyweight',
    icon: 'person-outline',
    color: '#3b82f6',
    fields: ['sets', 'reps']
  },
  weighted: {
    name: 'Weighted',
    icon: 'barbell-outline', 
    color: '#ef4444',
    fields: ['sets', 'reps', 'weight_used']
  },
  cardio_duration: {
    name: 'Cardio & Duration',
    icon: 'heart-outline',
    color: '#22c55e', 
    fields: ['duration']
  },
  distance_based: {
    name: 'Distance-Based',
    icon: 'map-outline',
    color: '#8b5cf6',
    fields: ['distance', 'duration']
  }
};



export default function DynamicExerciseForm({
  exercise,
  index,
  onUpdate,
  onRemove,
  activityType,
  showRemove = true
}: DynamicExerciseFormProps) {
  
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
  const categoryConfig = EXERCISE_CATEGORIES[category as keyof typeof EXERCISE_CATEGORIES];

  const renderField = (field: string, isHorizontal: boolean = false) => {
    const containerStyle = isHorizontal ? styles.horizontalFieldContainer : styles.fieldContainer;
    
    switch (field) {
      case 'sets':
        return (
          <View style={[containerStyle, isHorizontal && styles.inlineFieldContainer]}>
            <Text style={[styles.fieldLabel, isHorizontal && styles.inlineFieldLabel]}>Sets</Text>
            <TextInput
              style={[styles.fieldInput, isHorizontal && styles.inlineFieldInput]}
              value={exercise.sets && Number(exercise.sets) > 0 ? exercise.sets.toString() : ''}
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
                return weight && Number(weight) > 0 ? weight.toString() : '';
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
              value={exercise.duration && Number(exercise.duration) > 0 ? exercise.duration.toString() : ''}
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
        return (
          <View style={[containerStyle, isHorizontal && styles.inlineFieldContainer]}>
            <Text style={[styles.fieldLabel, isHorizontal && styles.inlineFieldLabel]}>Dist (km)</Text>
            <TextInput
              style={[styles.fieldInput, isHorizontal && styles.inlineFieldInput]}
              value={exercise.distance && Number(exercise.distance) > 0 ? exercise.distance.toString() : ''}
              onChangeText={(text) => {
                // Only allow integers and decimal point
                const numericValue = text.replace(/[^0-9.]/g, '');
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
    backgroundColor: '#ffffff',
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
    padding: 4,
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
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 3,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    backgroundColor: '#ffffff',
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
    fontSize: 10,
    fontWeight: '500',
  },
  inlineFieldInput: {
    width: 60,
    paddingHorizontal: 4,
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
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '500',
  },
  disabledFieldInput: {
    width: 60,
    paddingHorizontal: 4,
    paddingVertical: 3,
    fontSize: 11,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
