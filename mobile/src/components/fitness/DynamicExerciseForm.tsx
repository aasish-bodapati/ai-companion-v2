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
          <View style={containerStyle}>
            <Text style={styles.fieldLabel}>Sets</Text>
            <TextInput
              style={styles.fieldInput}
              value={exercise.sets?.toString() || ''}
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
          <View style={containerStyle}>
            <Text style={styles.fieldLabel}>Reps</Text>
            <TextInput
              style={styles.fieldInput}
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
          <View style={containerStyle}>
            <Text style={styles.fieldLabel}>Weight (kg)</Text>
            <TextInput
              style={styles.fieldInput}
              value={(exercise.weight_used || exercise.weight)?.toString() || ''}
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
          <View style={containerStyle}>
            <Text style={styles.fieldLabel}>Duration (min)</Text>
            <TextInput
              style={styles.fieldInput}
              value={exercise.duration?.toString() || ''}
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
          <View style={containerStyle}>
            <Text style={styles.fieldLabel}>Distance (km)</Text>
            <TextInput
              style={styles.fieldInput}
              value={exercise.distance?.toString() || ''}
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
        {/* Horizontal row for sets, reps, weight */}
        {(category === 'weighted' || category === 'bodyweight') && (
          <View style={styles.horizontalFieldsRow}>
            {categoryConfig.fields.includes('sets') && (
              <View style={styles.horizontalField}>
                {renderField('sets', true)}
              </View>
            )}
            {categoryConfig.fields.includes('reps') && (
              <View style={styles.horizontalField}>
                {renderField('reps', true)}
              </View>
            )}
            {categoryConfig.fields.includes('weight_used') && (
              <View style={styles.horizontalField}>
                {renderField('weight_used', true)}
              </View>
            )}
          </View>
        )}
        
        {/* Horizontal row for distance and duration for cardio */}
        {category === 'distance_based' && (
          <View style={styles.horizontalFieldsRow}>
            {categoryConfig.fields.includes('distance') && (
              <View style={styles.horizontalField}>
                {renderField('distance', true)}
              </View>
            )}
            {categoryConfig.fields.includes('duration') && (
              <View style={styles.horizontalField}>
                {renderField('duration', true)}
              </View>
            )}
          </View>
        )}
        
        {/* Other fields in grid layout */}
        <View style={styles.fieldsGrid}>
          {categoryConfig.fields
            .filter(field => {
              // Exclude fields that are in horizontal rows
              if (category === 'weighted' || category === 'bodyweight') {
                return !['sets', 'reps', 'weight_used'].includes(field);
              }
              if (category === 'distance_based') {
                return !['distance', 'duration'].includes(field);
              }
              return true;
            })
            .map((field) => (
              <View key={field} style={styles.fieldWrapper}>
                {renderField(field)}
              </View>
            ))}
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
  },
  horizontalField: {
    flex: 1,
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
});
