import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticFeedback } from '../../utils/haptics';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme/constants';
import { useExerciseCategories, useExerciseCategoriesActions } from '../../stores';
import { CategoryBadge } from './Badge';

export interface LoggingItemData {
  id: number | string;
  name: string;
  quantity?: number;
  quantity_unit?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  duration_minutes?: number;
  distance?: number | string;
  sets?: number;
  reps?: string;
  weight_kg?: number;
  [key: string]: unknown; // Allow additional properties
}

interface LoggingItemProps {
  item: LoggingItemData;
  itemType: 'meal' | 'workout' | 'water' | 'mood' | 'custom';
  onUpdate: (id: number | string, updates: Partial<LoggingItemData>) => void;
  onRemove: (id: number | string) => void;
  editable?: boolean;
  showNutrition?: boolean;
  showExerciseDetails?: boolean;
  isNewlyAdded?: boolean;
  testID?: string;
}

const LoggingItem = React.memo(function LoggingItem({
  item,
  itemType,
  onUpdate,
  onRemove,
  editable = true,
  showNutrition = false,
  showExerciseDetails = false,
  isNewlyAdded = false,
  testID,
  index = 0,
}: LoggingItemProps & { index?: number }) {
  
  const [servingCount, setServingCount] = useState(
    itemType === 'workout' 
      ? (item.sets?.toString() || '') 
      : (item.quantity?.toString() || '1')
  );
  const [repsCount, setRepsCount] = useState(
    itemType === 'workout' 
      ? (item.reps || '') 
      : ''
  );
  
  // Use exercise categories store
  const categories = useExerciseCategories();
  const { loadCategories } = useExerciseCategoriesActions();
  
  // Load categories if not loaded - DISABLED TO PREVENT INFINITE LOOP
  // useEffect(() => {
  //   if (categories.length === 0) {
  //     loadCategories();
  //   }
  // }, [categories.length]); // Removed loadCategories from dependencies to prevent infinite loop

  // Update local state when item prop changes (for auto-population)
  useEffect(() => {
    if (itemType === 'workout') {
      setServingCount(item.sets?.toString() || '');
      setRepsCount(item.reps || '');
    } else {
      setServingCount(item.quantity?.toString() || '1');
    }
  }, [item.sets, item.reps, item.quantity, item.weight_kg, item.duration_minutes, item.distance, itemType]);

  const handleServingChange = (text: string) => {
    setServingCount(text);
    const quantity = parseFloat(text);
    if (!isNaN(quantity) && quantity > 0) {
      onUpdate(item.id, {
        quantity,
        quantity_unit: item.quantity_unit || 'serving',
      });
    }
  };

  const handleRemove = () => {
    onRemove(item.id);
    hapticFeedback.medium();
  };


  const getNutritionDisplay = () => {
    if (!showNutrition) return null;
    
    const nutrition = [];
    if (item.calories) nutrition.push(`${item.calories} cal`);
    if (item.protein_g) nutrition.push(`${item.protein_g}g protein`);
    if (item.carbs_g) nutrition.push(`${item.carbs_g}g carbs`);
    if (item.fat_g) nutrition.push(`${item.fat_g}g fat`);
    
    return nutrition.length > 0 ? nutrition.join(' • ') : null;
  };

  const getExerciseDisplay = () => {
    if (!showExerciseDetails) return null;
    
    const details = [];
    if (item.sets) details.push(`${item.sets} sets`);
    if (item.reps) details.push(`${item.reps} reps`);
    if (item.weight_kg) details.push(`${item.weight_kg}kg`);
    
    return details.length > 0 ? details.join(' • ') : null;
  };


  const getExerciseCategory = useMemo((): string => {
    // Use logging_category first (highest priority), then category
    if (item.logging_category) return item.logging_category;
    if (item.category) return item.category;
    
    // Default to weighted for unknown categories
    return 'weighted';
  }, [item.logging_category, item.category, categories]);

  const getCategoryConfig = (category: string) => {
    const categoryData = categories.find(cat => cat.id === category);
    if (categoryData) {
      return {
        color: categoryData.color,
        icon: categoryData.icon,
        displayName: categoryData.display_name,
      };
    }
    
    // Try alternative matching - maybe the category is stored differently
    const alternativeMatch = categories.find(cat => 
      cat.category === category || 
      cat.name === category ||
      cat.display_name?.toLowerCase() === category?.toLowerCase()
    );
    
    if (alternativeMatch) {
      return {
        color: alternativeMatch.color,
        icon: alternativeMatch.icon,
        displayName: alternativeMatch.display_name,
      };
    }
    
    // Return "Category Not Found" config
    return {
      color: '#6b7280',
      icon: 'help-outline',
      displayName: 'Category Not Found',
    };
  };


  const renderDynamicWorkoutFields = useCallback(() => {
    const category = getExerciseCategory;
    // console.log('🔍 [LOGGING ITEM] getExerciseCategory() returned:', category);
    // console.log('🔍 [LOGGING ITEM] Item category:', item.category);
    
    switch (category) {
      case 'bodyweight':
        return (
          <View style={styles.fieldRow}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Sets</Text>
              <TextInput
                style={styles.workoutInputCompact}
                value={servingCount}
                onChangeText={(text) => {
                  setServingCount(text);
                  const quantity = parseFloat(text);
                  if (!isNaN(quantity) && quantity > 0) {
                    onUpdate(item.id, { sets: quantity });
                  }
                }}
                placeholder=""
                keyboardType="numeric"
                testID={`${testID}-sets-input`}
              />
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Reps</Text>
              <TextInput
                style={styles.workoutInputCompact}
                value={repsCount}
                onChangeText={(text) => {
                  setRepsCount(text);
                  onUpdate(item.id, { reps: text });
                }}
                placeholder=""
                testID={`${testID}-reps-input`}
              />
            </View>
          </View>
        );

      case 'weighted':
        return (
          <View style={styles.fieldRow}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Sets</Text>
              <TextInput
                style={styles.workoutInputCompact}
                value={servingCount}
                onChangeText={(text) => {
                  setServingCount(text);
                  const quantity = parseFloat(text);
                  if (!isNaN(quantity) && quantity > 0) {
                    onUpdate(item.id, { sets: quantity });
                  }
                }}
                placeholder=""
                keyboardType="numeric"
                testID={`${testID}-sets-input`}
              />
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Reps</Text>
              <TextInput
                style={styles.workoutInputCompact}
                value={repsCount}
                onChangeText={(text) => {
                  setRepsCount(text);
                  onUpdate(item.id, { reps: text });
                }}
                placeholder=""
                testID={`${testID}-reps-input`}
              />
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.workoutInputCompact}
                value={item.weight_kg?.toString() || ''}
                onChangeText={(text) => {
                  const weight = parseFloat(text);
                  if (!isNaN(weight)) {
                    onUpdate(item.id, { weight_kg: weight });
                  }
                }}
                placeholder=""
                keyboardType="numeric"
                testID={`${testID}-weight-input`}
              />
            </View>
          </View>
        );

      case 'cardio_duration':
        return (
          <View style={styles.fieldRow}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Time (min)</Text>
              <TextInput
                style={styles.workoutInputCompact}
                value={item.duration_minutes?.toString() || ''}
                onChangeText={(text) => {
                  const duration = parseFloat(text);
                  if (!isNaN(duration)) {
                    onUpdate(item.id, { duration_minutes: duration });
                  }
                }}
                placeholder="30"
                keyboardType="numeric"
                testID={`${testID}-duration-input`}
              />
            </View>
          </View>
        );

      case 'distance_based':
        const distanceLabel = "Distance (km)";
        return (
          <View style={styles.fieldRow}>
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { fontFamily: 'System' }]}>{distanceLabel}</Text>
              <TextInput
                style={styles.workoutInputCompact}
                value={item.distance?.toString() || ''}
                onChangeText={(text) => {
                  const distance = parseFloat(text);
                  if (!isNaN(distance)) {
                    onUpdate(item.id, { distance: distance });
                  }
                }}
                placeholder="5"
                keyboardType="numeric"
                testID={`${testID}-distance-input`}
              />
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Time (min)</Text>
              <TextInput
                style={styles.workoutInputCompact}
                value={item.duration_minutes?.toString() || ''}
                onChangeText={(text) => {
                  const duration = parseFloat(text);
                  if (!isNaN(duration)) {
                    onUpdate(item.id, { duration_minutes: duration });
                  }
                }}
                placeholder="30"
                keyboardType="numeric"
                testID={`${testID}-duration-input`}
              />
            </View>
            <View style={[styles.fieldContainer, { opacity: 0 }]}>
              <Text style={styles.fieldLabel}>-</Text>
              <TextInput
                style={styles.workoutInputCompact}
                value=""
                editable={false}
                placeholder=""
              />
            </View>
          </View>
        );

      default:
        // Default to weighted for unknown categories
        return (
          <View style={styles.fieldRow}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Sets</Text>
              <TextInput
                style={styles.workoutInputCompact}
                value={servingCount}
                onChangeText={(text) => {
                  setServingCount(text);
                  const quantity = parseFloat(text);
                  if (!isNaN(quantity) && quantity > 0) {
                    onUpdate(item.id, { sets: quantity });
                  }
                }}
                placeholder=""
                keyboardType="numeric"
                testID={`${testID}-sets-input`}
              />
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Reps</Text>
              <TextInput
                style={styles.workoutInputCompact}
                value={repsCount}
                onChangeText={(text) => {
                  setRepsCount(text);
                  onUpdate(item.id, { reps: text });
                }}
                placeholder=""
                testID={`${testID}-reps-input`}
              />
            </View>
          </View>
        );
    }
  }, [getExerciseCategory, servingCount, setServingCount, onUpdate, item.id]);

  // Memoize category config to avoid multiple calls
  const categoryConfig = useMemo(() => {
    return getCategoryConfig(getExerciseCategory);
  }, [getExerciseCategory, categories]);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.exerciseTitleRow}>
            <View style={styles.exerciseTitleLeft}>
              <Text style={styles.exerciseNumber}>#{index + 1}</Text>
              <Text style={styles.exerciseName} numberOfLines={1} ellipsizeMode="tail">
                {item.name}
              </Text>
            </View>
            <View style={styles.exerciseTitleRight}>
              {itemType === 'workout' && (
                <CategoryBadge 
                  category={item.category || item.logging_category || ''} 
                  size="small"
                />
              )}
              {editable && (
                <TouchableOpacity
                  onPress={handleRemove}
                  style={styles.actionButton}
                  testID={`${testID}-remove`}
                >
                  <Ionicons name="trash" size={16} color={COLORS.error.main} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {itemType === 'workout' ? (
          <View style={styles.workoutFields}>
            {renderDynamicWorkoutFields()}
          </View>
        ) : (
          <View style={styles.editContainer}>
            <View style={styles.servingRow}>
              <TextInput
                style={styles.servingInput}
                value={servingCount}
                onChangeText={handleServingChange}
                placeholder="1"
                keyboardType="numeric"
                testID={`${testID}-serving-input`}
              />
              <Text style={styles.servingUnit}>
                {item.quantity_unit || 'serving'}
              </Text>
            </View>
            {getNutritionDisplay() && (
              <Text style={styles.nutrition}>
                {getNutritionDisplay()}
              </Text>
            )}
            {getExerciseDisplay() && (
              <Text style={styles.exerciseDetails}>
                {getExerciseDisplay()}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    marginBottom: SPACING.small,
    width: '100%',
  },
  content: {
    padding: SPACING.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.small,
  },
  icon: {
    marginRight: SPACING.small,
  },
  name: {
    flex: 1,
    fontSize: FONT_SIZE.medium,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.small,
    alignItems: 'center',
  },
  actionButton: {
    padding: 2,
    borderRadius: BORDER_RADIUS.small,
    backgroundColor: COLORS.background.primary,
    flexShrink: 0,
    marginTop: -1,
    minWidth: 20,
  },
  editContainer: {
    marginTop: SPACING.small,
  },
  servingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.small,
    marginBottom: SPACING.small,
  },
  servingInput: {
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    borderRadius: BORDER_RADIUS.small,
    paddingHorizontal: SPACING.small,
    paddingVertical: SPACING.xs,
    fontSize: FONT_SIZE.medium,
    color: COLORS.text.primary,
    minWidth: 60,
    textAlign: 'center',
    backgroundColor: COLORS.background.primary,
  },
  servingUnit: {
    fontSize: FONT_SIZE.medium,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  details: {
    gap: SPACING.xs,
  },
  quantity: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  nutrition: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.tertiary,
  },
  exerciseDetails: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.tertiary,
  },
  workoutFields: {
    marginTop: SPACING.xs,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 28,
    paddingHorizontal: 8,
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flex: 1,
    minWidth: 0,
  },
  fieldPosition1: {
    left: 0,
  },
  fieldPosition2: {
    left: '50%',
    transform: [{ translateX: -50 }],
  },
  fieldPosition3: {
    right: 0,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.small,
    fontWeight: '500',
    color: COLORS.text.secondary,
    flexShrink: 1,
    minWidth: 0,
  },
  workoutInputCompact: {
    flex: 1,
    minWidth: 25,
    maxWidth: 35,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    borderRadius: BORDER_RADIUS.small,
    paddingHorizontal: 1,
    paddingVertical: 0,
    fontSize: FONT_SIZE.small,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.primary,
    textAlign: 'center',
  },
  exerciseHeader: {
    marginBottom: SPACING.small,
    flex: 1,
  },
  exerciseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    flexWrap: 'nowrap',
  },
  exerciseTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flex: 1,
    minWidth: 0,
  },
  exerciseTitleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flexShrink: 0,
  },
  exerciseNumber: {
    fontSize: FONT_SIZE.medium,
    fontWeight: '600',
    color: COLORS.text.secondary,
    minWidth: 20,
  },
  exerciseName: {
    fontSize: FONT_SIZE.medium,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
    minHeight: 20,
    flexShrink: 1,
    flexBasis: 0,
    margin: 0,
    padding: 0,
  },
});

export default LoggingItem;
