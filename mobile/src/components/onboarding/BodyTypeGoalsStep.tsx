import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MobileOptimizedCard from '../ui/MobileOptimizedCard';
import { hapticFeedback } from '../../utils/haptics';
import { 
  BODY_TYPE_GOALS, 
  getAvailableBodyTypes, 
  getBodyTypeCategories,
  calculateBodyTypeGoal,
  calculateWaterGoal,
  calculateCalorieTarget,
  calculateProteinTarget,
  UserAttributes,
  BodyTypeGoal
} from '../../services/bodyTypeGoals';

interface BodyTypeGoalsStepProps {
  onBodyTypeChange: (bodyTypeId: string, editedGoal?: BodyTypeGoal) => void;
  initialBodyType?: string;
  userData: UserAttributes;
  isPrePopulated?: boolean;
}

export default function BodyTypeGoalsStep({ 
  onBodyTypeChange, 
  initialBodyType = '',
  userData,
  isPrePopulated = false,
}: BodyTypeGoalsStepProps) {
  const [selectedBodyType, setSelectedBodyType] = useState<string>(initialBodyType);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [availableBodyTypes, setAvailableBodyTypes] = useState(BODY_TYPE_GOALS);
  const [isEditing, setIsEditing] = useState(false);
  const [editedGoal, setEditedGoal] = useState<BodyTypeGoal | null>(null);

  useEffect(() => {
    // Get available body types based on user's current state
    const available = getAvailableBodyTypes(userData);
    setAvailableBodyTypes(available);
  }, [userData]);

  useEffect(() => {
    // Only call onBodyTypeChange when a body type is actually selected
    if (selectedBodyType) {
      onBodyTypeChange(selectedBodyType);
    }
  }, [selectedBodyType, onBodyTypeChange]);

  const handleBodyTypeSelect = (bodyTypeId: string) => {
    hapticFeedback.selection();
    setSelectedBodyType(bodyTypeId);
  };

  const handleEditGoal = () => {
    if (!selectedBodyType) return;
    
    const bodyType = BODY_TYPE_GOALS.find(bt => bt.id === selectedBodyType);
    if (bodyType) {
      // Calculate water goal based on user's gender and activity level
      const calculatedWaterGoal = calculateWaterGoal(userData.gender, userData.activityLevel);
      
      // Calculate target weight based on target BMI
      const targetWeight = Math.round((userData.height / 100) ** 2 * bodyType.targetBMI);
      
      // Calculate calorie target based on user data and target weight
      const isWeightLoss = bodyType.category === 'weight_loss';
      const calculatedCalorieTarget = calculateCalorieTarget(userData, targetWeight, isWeightLoss);
      
      // Calculate protein target based on target weight and body type's protein per kg
      const calculatedProteinTarget = calculateProteinTarget(targetWeight, bodyType.targetAttributes.proteinTarget);
      
      // Create edited goal with calculated values
      const editedGoalData = {
        ...bodyType,
        targetAttributes: {
          ...bodyType.targetAttributes,
          targetWeight: targetWeight,
          waterGoal: calculatedWaterGoal,
          calorieTarget: calculatedCalorieTarget,
          proteinTarget: calculatedProteinTarget
        }
      };
      
      setEditedGoal(editedGoalData);
      setIsEditing(true);
    }
  };

  const validateEditedGoal = (): string | null => {
    if (!editedGoal) return null;
    
    // Check if this is a system template being edited without changing the name
    const originalGoal = BODY_TYPE_GOALS.find(bt => bt.id === selectedBodyType);
    if (originalGoal && originalGoal.createdBy === 'system') {
      // If it's a system goal and the name hasn't changed, show error
      if (editedGoal.name === originalGoal.name) {
        return 'Please change the name to create a custom version of this template. System templates cannot be modified directly.';
      }
    }
    
    return null;
  };

  const handleSaveEditedGoal = () => {
    if (!editedGoal) return;
    
    const validationError = validateEditedGoal();
    if (validationError) {
      Alert.alert(
        'Cannot Modify System Template',
        validationError,
        [{ text: 'OK' }]
      );
      return;
    }
    
    onBodyTypeChange(selectedBodyType, editedGoal);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedGoal(null);
    setIsEditing(false);
  };

  const updateEditedGoal = (field: keyof BodyTypeGoal, value: any) => {
    if (!editedGoal) return;
    
    setEditedGoal(prev => {
      if (!prev) return null;
      
      if (field === 'targetAttributes') {
        return {
          ...prev,
          targetAttributes: {
            ...prev.targetAttributes,
            ...value,
          },
        };
      }
      
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleCategorySelect = (categoryId: string) => {
    hapticFeedback.light();
    setSelectedCategory(prev => prev === categoryId ? null : categoryId);
  };

  const getBodyTypesByCategory = (categoryId: string) => {
    return availableBodyTypes.filter(bodyType => bodyType.category === categoryId);
  };

  const getFilteredBodyTypes = () => {
    if (selectedCategory) {
      return getBodyTypesByCategory(selectedCategory);
    }
    return availableBodyTypes.slice(0, 6);
  };

  const getTargetBodyFatForGender = (bodyType: any, gender: string) => {
    if (!bodyType.targetBodyFat) return 'N/A';
    
    if (gender === 'male') {
      return `${bodyType.targetBodyFat}%`;
    } else if (gender === 'female') {
      // Add 6% to the male target for female
      const femaleTarget = bodyType.targetBodyFat + 6;
      return `${femaleTarget}%`;
    } else {
      // For 'other' gender, show both targets
      const femaleTarget = bodyType.targetBodyFat + 6;
      return `${bodyType.targetBodyFat}% (M) / ${femaleTarget}% (F)`;
    }
  };

  const getTargetMuscleMassForGender = (bodyType: any, gender: string, userWeight: number) => {
    if (!bodyType.targetBodyFat) return 'N/A';
    
    // Calculate muscle mass based on body fat percentage
    const calculateMuscleFromBodyFat = (bodyFatPct: number, weight: number) => {
      const fatMass = weight * (bodyFatPct / 100);
      const leanBodyMass = weight - fatMass;
      const muscleMass = leanBodyMass * 0.5; // Muscle is ~50% of lean body mass
      return Math.round(muscleMass * 10) / 10;
    };
    
    if (gender === 'male') {
      const targetMuscle = calculateMuscleFromBodyFat(bodyType.targetBodyFat, userWeight);
      return `${targetMuscle}kg`;
    } else if (gender === 'female') {
      const femaleTargetBodyFat = bodyType.targetBodyFat + 6;
      const targetMuscle = calculateMuscleFromBodyFat(femaleTargetBodyFat, userWeight) * 0.8;
      return `${Math.round(targetMuscle * 10) / 10}kg`;
    } else {
      // For 'other' gender, show both targets
      const maleTargetMuscle = calculateMuscleFromBodyFat(bodyType.targetBodyFat, userWeight);
      const femaleTargetBodyFat = bodyType.targetBodyFat + 6;
      const femaleTargetMuscle = calculateMuscleFromBodyFat(femaleTargetBodyFat, userWeight) * 0.8;
      return `${maleTargetMuscle}kg (M) / ${Math.round(femaleTargetMuscle * 10) / 10}kg (F)`;
    }
  };

  const getTargetBMIForGender = (bodyType: any, gender: string) => {
    if (!bodyType.targetBMI) return 'N/A';
    
    const target = Math.round(bodyType.targetBMI * 10) / 10;
    return `BMI ${target}`;
  };

  const renderCategoryFilter = () => {
    const categories = getBodyTypeCategories();
    
    return (
      <View style={styles.categoryFilter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            onPress={() => {
              hapticFeedback.light();
              setSelectedCategory(null);
            }}
            style={[
              styles.categoryButton,
              selectedCategory === null ? styles.categoryButtonSelected : styles.categoryButtonUnselected,
            ]}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === null ? styles.categoryButtonTextSelected : styles.categoryButtonTextUnselected,
            ]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              onPress={() => {
                hapticFeedback.light();
                handleCategorySelect(category.id);
              }}
              style={[
                styles.categoryButton,
                selectedCategory === category.id ? styles.categoryButtonSelected : styles.categoryButtonUnselected,
              ]}
            >
              <Ionicons 
                name={category.icon as any} 
                size={16} 
                color={selectedCategory === category.id ? '#ffffff' : category.color} 
              />
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category.id ? styles.categoryButtonTextSelected : styles.categoryButtonTextUnselected,
              ]}>
                {category.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderBodyTypeCard = (bodyType: any) => {
    const isSelected = selectedBodyType === bodyType.id;
    let calculation = null;
    
    try {
      calculation = calculateBodyTypeGoal(userData, bodyType.id);
    } catch (error) {
      console.error('Error calculating body type goal:', error);
    }
    
    return (
      <MobileOptimizedCard
        key={bodyType.id}
        onPress={() => handleBodyTypeSelect(bodyType.id)}
        variant={isSelected ? 'elevated' : 'outlined'}
        style={StyleSheet.flatten([
          styles.bodyTypeCard,
          isSelected ? { borderColor: bodyType.color } : {},
        ])}
        hapticFeedback="selection"
      >
        <View style={styles.bodyTypeContent}>
          <View style={styles.bodyTypeHeader}>
            <Text style={[
              styles.bodyTypeTitle,
              isSelected && { color: bodyType.color }
            ]}>
              {bodyType.name}
            </Text>
            <View style={styles.iconContainer}>
              <Ionicons
                name={bodyType.icon as any}
                size={20}
                color={isSelected ? bodyType.color : '#6b7280'}
              />
              {isSelected && (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={bodyType.color}
                  style={styles.checkIcon}
                />
              )}
            </View>
          </View>
          
          <Text style={styles.bodyTypeDescription}>
            {bodyType.description}
          </Text>
          
          {calculation && (
            <View style={styles.calculationPreview}>
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Target Weight:</Text>
                <Text style={styles.calculationValue}>
                  {calculation.bodyType.targetAttributes.targetWeight}kg
                </Text>
              </View>
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Goal BMI:</Text>
                <Text style={styles.calculationValue}>
                  {getTargetBMIForGender(bodyType, userData.gender)}
                </Text>
              </View>
              {calculation.targetBodyFat && (
                <View style={styles.calculationRow}>
                  <Text style={styles.calculationLabel}>Body Fat:</Text>
                  <Text style={styles.calculationValue}>
                    {getTargetBodyFatForGender(bodyType, userData.gender)}
                  </Text>
                </View>
              )}
              {calculation.targetMuscleMass && (
                <View style={styles.calculationRow}>
                  <Text style={styles.calculationLabel}>Muscle:</Text>
                  <Text style={styles.calculationValue}>
                    {getTargetMuscleMassForGender(bodyType, userData.gender, userData.weight)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </MobileOptimizedCard>
    );
  };


  const renderBodyTypesGrid = () => {
    const bodyTypes = getFilteredBodyTypes();
    
    return (
      <View style={styles.bodyTypesGrid}>
        {bodyTypes.map(bodyType => renderBodyTypeCard(bodyType))}
      </View>
    );
  };

  const renderSelectedBodyTypeSummary = () => {
    if (!selectedBodyType) return null;
    
    const bodyType = isEditing && editedGoal ? editedGoal : BODY_TYPE_GOALS.find(bt => bt.id === selectedBodyType);
    if (!bodyType) return null;
    
    let calculation = null;
    try {
      calculation = calculateBodyTypeGoal(userData, selectedBodyType);
    } catch (error) {
      console.error('Error calculating selected body type:', error);
    }
    
    return (
      <MobileOptimizedCard
        variant="filled"
        style={styles.summaryCard}
      >
        <View style={styles.summaryContent}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryTitleContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <View style={styles.titleAndBadge}>
                {isEditing ? (
                  <View style={styles.nameInputContainer}>
                    <TextInput
                      style={[
                        styles.editableTitle,
                        bodyType.createdBy === 'system' && editedGoal?.name === BODY_TYPE_GOALS.find(bt => bt.id === selectedBodyType)?.name && styles.nameInputError
                      ]}
                      value={bodyType.name}
                      onChangeText={(text) => updateEditedGoal('name', text)}
                      placeholder="Goal name"
                      maxLength={50}
                    />
                    {bodyType.createdBy === 'system' && editedGoal?.name === BODY_TYPE_GOALS.find(bt => bt.id === selectedBodyType)?.name && (
                      <Text style={styles.nameInputWarning}>
                        Change the name to create a custom version
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text style={styles.summaryTitle}>
                    {bodyType.name} Selected
                  </Text>
                )}
                <View style={[
                  styles.templateBadge,
                  bodyType.createdBy === 'system' ? styles.systemBadge : styles.userBadge
                ]}>
                  <Text style={styles.templateBadgeText}>
                    {bodyType.createdBy === 'system' ? 'Template' : 'Custom'}
                  </Text>
                </View>
              </View>
            </View>
            {isEditing ? (
              <View style={styles.editActions}>
                <TouchableOpacity
                  onPress={handleCancelEdit}
                  style={styles.cancelButton}
                  hapticFeedback="light"
                >
                  <Ionicons name="close-outline" size={16} color="#6b7280" />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveEditedGoal}
                  style={styles.saveButton}
                  hapticFeedback="success"
                >
                  <Ionicons name="checkmark-outline" size={16} color="#ffffff" />
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleEditGoal}
                style={styles.editButton}
                hapticFeedback="light"
              >
                <Ionicons name="create-outline" size={20} color="#3b82f6" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {calculation && (
            <View style={styles.summaryDetails}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Target Weight:</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.editableValue}
                    value={bodyType.targetAttributes.targetWeight.toString()}
                    onChangeText={(text) => {
                      const weight = parseFloat(text);
                      if (!isNaN(weight) && weight > 0) {
                        updateEditedGoal('targetAttributes', { targetWeight: weight });
                      }
                    }}
                    placeholder="70"
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.summaryValue}>
                    {calculation?.bodyType?.targetAttributes?.targetWeight || bodyType.targetAttributes.targetWeight}kg
                  </Text>
                )}
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Goal BMI:</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.editableValue}
                    value={bodyType.targetBMI?.toString() || ''}
                    onChangeText={(text) => {
                      const bmi = parseFloat(text);
                      if (!isNaN(bmi) && bmi > 0) {
                        updateEditedGoal('targetBMI', bmi);
                      }
                    }}
                    placeholder="22.0"
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.summaryValue}>
                    {getTargetBMIForGender(bodyType, userData.gender)}
                  </Text>
                )}
              </View>
              {calculation.targetBodyFat && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Target Body Fat:</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.editableValue}
                      value={bodyType.targetBodyFat?.toString() || ''}
                      onChangeText={(text) => {
                        const bodyFat = parseFloat(text);
                        if (!isNaN(bodyFat) && bodyFat > 0) {
                          updateEditedGoal('targetBodyFat', bodyFat);
                        }
                      }}
                      placeholder="15.0"
                      keyboardType="numeric"
                    />
                  ) : (
                    <Text style={styles.summaryValue}>
                      {getTargetBodyFatForGender(bodyType, userData.gender)}
                    </Text>
                  )}
                </View>
              )}
              {calculation.targetMuscleMass && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Target Muscle:</Text>
                  <Text style={styles.summaryValue}>
                    {getTargetMuscleMassForGender(bodyType, userData.gender, userData.weight)}
                  </Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Weight Change:</Text>
                <Text style={[
                  styles.summaryValue,
                  { color: calculation.bodyType.targetAttributes.weightChange > 0 ? '#10b981' : '#ef4444' }
                ]}>
                  {calculation.bodyType.targetAttributes.weightChange > 0 ? '+' : ''}
                  {calculation.bodyType.targetAttributes.weightChange}kg
                </Text>
              </View>
              
              {/* Additional Editable Fields */}
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Calorie Target:</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.editableValue}
                    value={bodyType.targetAttributes.calorieTarget.toString()}
                    onChangeText={(text) => {
                      const calories = parseFloat(text);
                      if (!isNaN(calories) && calories > 0) {
                        updateEditedGoal('targetAttributes', { calorieTarget: calories });
                      }
                    }}
                    placeholder="2000"
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.summaryValue}>
                    {calculation?.calorieTarget || bodyType.targetAttributes.calorieTarget} cal/day
                  </Text>
                )}
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Workouts/Week:</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.editableValue}
                    value={bodyType.targetAttributes.workoutFrequency.toString()}
                    onChangeText={(text) => {
                      const frequency = parseFloat(text);
                      if (!isNaN(frequency) && frequency >= 0 && frequency <= 7) {
                        updateEditedGoal('targetAttributes', { workoutFrequency: frequency });
                      }
                    }}
                    placeholder="4"
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.summaryValue}>
                    {bodyType.targetAttributes.workoutFrequency} days
                  </Text>
                )}
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Protein Target:</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.editableValue}
                    value={bodyType.targetAttributes.proteinTarget.toString()}
                    onChangeText={(text) => {
                      const protein = parseFloat(text);
                      if (!isNaN(protein) && protein > 0) {
                        updateEditedGoal('targetAttributes', { proteinTarget: protein });
                      }
                    }}
                    placeholder="150"
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.summaryValue}>
                    {calculation?.proteinTarget || bodyType.targetAttributes.proteinTarget}g/day
                  </Text>
                )}
              </View>
              
            </View>
          )}
        </View>
      </MobileOptimizedCard>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Pre-populated indicator */}
        {isPrePopulated && (
          <View style={styles.prePopulatedIndicator}>
            <Ionicons name="information-circle-outline" size={16} color="#3b82f6" />
            <Text style={styles.prePopulatedText}>Your current body type goal has been pre-selected</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>What's your body type goal?</Text>
          <Text style={styles.subtitle}>
            Choose the body type you want to achieve. We'll calculate personalized targets for you.
          </Text>
        </View>

        {/* Category Filter */}
        {renderCategoryFilter()}

        {/* Selected Body Type Summary */}
        {renderSelectedBodyTypeSummary()}

        {/* Body Types Grid */}
        {renderBodyTypesGrid()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  categoryFilter: {
    marginBottom: 12,
  },
  categoryButton: {
    marginRight: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  categoryButtonSelected: {
    backgroundColor: '#3b82f6',
  },
  categoryButtonUnselected: {
    backgroundColor: '#f3f4f6',
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryButtonTextSelected: {
    color: '#ffffff',
  },
  categoryButtonTextUnselected: {
    color: '#6b7280',
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryContent: {
    padding: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  summaryDetails: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  bodyTypesGrid: {
    gap: 8,
  },
  bodyTypeCard: {
    marginBottom: 0,
  },
  bodyTypeContent: {
    padding: 12,
  },
  bodyTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkIcon: {
    marginLeft: 4,
  },
  bodyTypeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  bodyTypeDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
    marginBottom: 8,
  },
  calculationPreview: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    gap: 4,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calculationLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  calculationValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2937',
  },
  prePopulatedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  prePopulatedText: {
    fontSize: 14,
    color: '#1e40af',
    marginLeft: 6,
    fontWeight: '500',
  },
  summaryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  editButtonText: {
    fontSize: 12,
    color: '#3b82f6',
    marginLeft: 4,
    fontWeight: '600',
  },
  // Inline Editable Styles
  editableTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
    minWidth: 120,
  },
  nameInputContainer: {
    flex: 1,
  },
  nameInputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  nameInputWarning: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    fontStyle: 'italic',
  },
  titleAndBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  templateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  systemBadge: {
    backgroundColor: '#dbeafe',
  },
  userBadge: {
    backgroundColor: '#dcfce7',
  },
  templateBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  editableValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 60,
    textAlign: 'right',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  saveButtonText: {
    fontSize: 11,
    color: '#ffffff',
    marginLeft: 4,
    fontWeight: '600',
  },
});
