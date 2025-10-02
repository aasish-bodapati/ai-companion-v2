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
import { COMMON_STYLES } from '../../theme/constants';
import { 
  getAvailableBodyTypes, 
  getBodyTypeCategories,
  calculateBodyTypeGoal,
  calculateWaterGoal,
  calculateCalorieTarget,
  calculateProteinTarget,
  calculateFFMI,
  UserAttributes,
  BodyTypeGoal
} from '../../services/bodyTypeGoals';

interface BodyTypeGoalsStepProps {
  onBodyTypeChange: (bodyTypeId: string, editedGoal?: any) => void;
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
  const [availableBodyTypes, setAvailableBodyTypes] = useState<BodyTypeGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedGoal, setEditedGoal] = useState<any>(null);
  const [editingError, setEditingError] = useState<string | null>(null);

  useEffect(() => {
    // Get available body types based on user's current state
    const loadBodyTypes = async () => {
      try {
        setLoading(true);
        setError(null);
        const available = await getAvailableBodyTypes(userData);
        setAvailableBodyTypes(available);
      } catch (err) {
        console.error('Failed to load body types:', err);
        setError('Failed to load body type goals');
      } finally {
        setLoading(false);
      }
    };

    loadBodyTypes();
  }, [userData]);

  useEffect(() => {
    // Only call onBodyTypeChange when a body type is actually selected
    if (selectedBodyType) {
      onBodyTypeChange(selectedBodyType, editedGoal);
    }
  }, [selectedBodyType, editedGoal, onBodyTypeChange]);

  const handleBodyTypeSelect = (bodyTypeId: string) => {
    hapticFeedback.selection();
    setSelectedBodyType(bodyTypeId);
    // Reset editing state when selecting a new body type
    setIsEditing(false);
    setEditedGoal(null);
    setEditingError(null);
  };

  const handleEditGoal = () => {
    const bodyType = availableBodyTypes.find(bt => bt.id === selectedBodyType);
    if (!bodyType) return;

    // Calculate personalized values based on user data
    const waterGoal = calculateWaterGoal(userData.gender, userData.activityLevel);
    const targetWeight = Math.round((userData.height / 100) ** 2 * bodyType.targetBMI);
    const calorieTarget = calculateCalorieTarget(userData, targetWeight, bodyType.category === 'weight_loss');
    const proteinTarget = calculateProteinTarget(
      userData.weight, 
      userData.ffm, 
      userData.smm, 
      userData.bodyFat
    );

    setEditedGoal({
      ...bodyType,
      targetAttributes: {
        ...bodyType.targetAttributes,
        waterGoal,
        targetWeight,
        calorieTarget,
        proteinTarget,
      }
    });
    setIsEditing(true);
    setEditingError(null);
  };

  const handleSaveEditedGoal = () => {
    if (!editedGoal) return;

    // Validate that system templates have been renamed
    if (editedGoal.createdBy === 'system' && editedGoal.name === availableBodyTypes.find(bt => bt.id === selectedBodyType)?.name) {
      setEditingError('Please change the name to create a custom goal');
      return;
    }

    // Pass the edited goal to parent
    onBodyTypeChange(selectedBodyType, editedGoal);
    setIsEditing(false);
    setEditingError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedGoal(null);
    setEditingError(null);
  };

  const updateEditedGoal = (field: string, value: any) => {
    if (!editedGoal) return;

    setEditedGoal(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateEditedGoalAttribute = (field: string, value: any) => {
    if (!editedGoal) return;

    setEditedGoal(prev => ({
      ...prev,
      targetAttributes: {
        ...prev.targetAttributes,
        [field]: value
      }
    }));
  };

  const validateEditedGoal = (goal: any) => {
    if (!goal) return false;
    
    // Check if it's a system template with unchanged name
    const originalGoal = availableBodyTypes.find(bt => bt.id === selectedBodyType);
    if (goal.createdBy === 'system' && goal.name === originalGoal?.name) {
      return false;
    }
    
    return true;
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

  const getWaistToHeightRatio = (bodyType: any) => {
    if (!bodyType.waistToHeightRatio) return 'N/A';
    
    const ratio = Math.round(bodyType.waistToHeightRatio * 100) / 100;
    return `WHR ${ratio}`;
  };

  const getFatFreeMassIndex = (bodyType: any) => {
    if (!bodyType.fatFreeMassIndex) return 'N/A';
    
    return `FFMI ${bodyType.fatFreeMassIndex}`;
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
          
          <View style={styles.calculationPreview}>
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>Target BMI:</Text>
              <Text style={styles.calculationValue}>
                {getTargetBMIForGender(bodyType, userData.gender)}
              </Text>
            </View>
            {bodyType.targetBodyFat && (
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Body Fat:</Text>
                <Text style={styles.calculationValue}>
                  {getTargetBodyFatForGender(bodyType, userData.gender)}
                </Text>
              </View>
            )}
            {bodyType.waistToHeightRatio && (
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Waist/Height:</Text>
                <Text style={styles.calculationValue}>
                  {getWaistToHeightRatio(bodyType)}
                </Text>
              </View>
            )}
            {bodyType.fatFreeMassIndex && (
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>FFMI:</Text>
                <Text style={styles.calculationValue}>
                  {getFatFreeMassIndex(bodyType)}
                </Text>
              </View>
            )}
            {bodyType.targetAttributes.sleepDuration && (
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Sleep:</Text>
                <Text style={styles.calculationValue}>
                  {bodyType.targetAttributes.sleepDuration} hours/night
                </Text>
              </View>
            )}
            {bodyType.targetAttributes.dailySteps && (
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Steps:</Text>
                <Text style={styles.calculationValue}>
                  {bodyType.targetAttributes.dailySteps.toLocaleString()}/day
                </Text>
              </View>
            )}
            {bodyType.targetAttributes.recoveryDays && (
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Recovery:</Text>
                <Text style={styles.calculationValue}>
                  {bodyType.targetAttributes.recoveryDays} days/week
                </Text>
              </View>
            )}
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>Calories:</Text>
              <Text style={styles.calculationValue}>
                {(() => {
                  // Calculate calorie target based on user data
                  const weight = userData.weight;
                  const height = userData.height;
                  const age = userData.age;
                  const gender = userData.gender;
                  const activityLevel = userData.activityLevel;
                  
                  // Basic BMR calculation (Mifflin-St Jeor Equation)
                  let bmr;
                  if (gender === 'male') {
                    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
                  } else {
                    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
                  }
                  
                  // Activity multipliers
                  const activityMultipliers = {
                    'sedentary': 1.2,
                    'light': 1.375,
                    'moderate': 1.55,
                    'active': 1.725,
                    'very_active': 1.9
                  };
                  
                  const tdee = bmr * (activityMultipliers[activityLevel] || 1.55);
                  return `${Math.round(tdee)} cal/day`;
                })()}
              </Text>
            </View>
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>Protein:</Text>
              <Text style={styles.calculationValue}>
                {(() => {
                  // Calculate protein using comprehensive formula
                  const weight = userData.weight;
                  const ffm = userData.ffm;
                  const smm = userData.smm;
                  const bodyFat = userData.bodyFat;
                  
                  // Case 1: All optional metrics are provided (FFM, SMM, BF%)
                  if (ffm && smm && bodyFat) {
                    const ffmi = calculateFFMI(userData.height, ffm);
                    const proteinTarget = ffm * 1.6 * (1 + 0.3 * smm / 30 + 0.1 * (ffmi - 20));
                    return `${Math.round(proteinTarget * 10) / 10}g/day`;
                  }
                  
                  // Case 2: FFM provided, SMM and FFMI not provided
                  if (ffm && !smm && !bodyFat) {
                    const proteinTarget = ffm * 1.8;
                    return `${Math.round(proteinTarget * 10) / 10}g/day`;
                  }
                  
                  // Case 3: SMM and BF% provided, FFM not provided
                  if (smm && bodyFat && !ffm) {
                    const estimatedFFM = weight * (1 - bodyFat / 100);
                    const proteinTarget = estimatedFFM * 1.6 * (1 + 0.3 * smm / 30);
                    return `${Math.round(proteinTarget * 10) / 10}g/day`;
                  }
                  
                  // Case 4: Only BF% provided, SMM and FFM not provided
                  if (bodyFat && !smm && !ffm) {
                    const estimatedFFM = weight * (1 - bodyFat / 100);
                    const proteinTarget = estimatedFFM * 1.8;
                    return `${Math.round(proteinTarget * 10) / 10}g/day`;
                  }
                  
                  // Case 5: Only SMM provided, FFM & BF% not provided
                  if (smm && !ffm && !bodyFat) {
                    const estimatedFFM = smm * 2; // Skeletal muscle is ~50% of FFM
                    const proteinTarget = estimatedFFM * 1.6 * (1 + 0.3 * smm / 30);
                    return `${Math.round(proteinTarget * 10) / 10}g/day`;
                  }
                  
                  // Case 6: None of the optional metrics provided (only height & weight)
                  const proteinTarget = weight * 1.6;
                  return `${Math.round(proteinTarget * 10) / 10}g/day`;
                })()}
              </Text>
            </View>
          </View>
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
    
    const bodyType = availableBodyTypes.find(bt => bt.id === selectedBodyType);
    if (!bodyType) {
      return null;
    }
    
    if (!bodyType.targetAttributes) {
      console.error('❌ Body type missing targetAttributes:', bodyType);
      return null;
    }

    // Use edited goal if available, otherwise use the original body type
    const displayGoal = editedGoal || bodyType;
    
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
                        editingError ? styles.nameInputError : {}
                      ]}
                      value={editedGoal?.name || ''}
                      onChangeText={(text) => updateEditedGoal('name', text)}
                      placeholder="Goal name"
                    />
                    {editingError && (
                      <Text style={styles.nameInputWarning}>{editingError}</Text>
                    )}
                  </View>
                ) : (
                  <Text style={styles.summaryTitle}>
                    {displayGoal.name} Selected
                  </Text>
                )}
                <View style={[
                  styles.templateBadge,
                  displayGoal.createdBy === 'system' ? styles.systemBadge : styles.userBadge
                ]}>
                  <Text style={styles.templateBadgeText}>
                    {displayGoal.createdBy === 'system' ? 'Template' : 'Custom'}
                  </Text>
                </View>
              </View>
            </View>
            {!isEditing && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditGoal}
              >
                <Ionicons name="create-outline" size={14} color="#3b82f6" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.summaryDetails}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Goal BMI:</Text>
              <Text style={styles.summaryValue}>
                {getTargetBMIForGender(displayGoal, userData.gender)}
              </Text>
            </View>
            {displayGoal.targetBodyFat && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Target Body Fat:</Text>
                <Text style={styles.summaryValue}>
                  {getTargetBodyFatForGender(displayGoal, userData.gender)}
                </Text>
              </View>
            )}
            {displayGoal.waistToHeightRatio && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Waist/Height Ratio:</Text>
                <Text style={styles.summaryValue}>
                  {getWaistToHeightRatio(displayGoal)}
                </Text>
              </View>
            )}
            {displayGoal.fatFreeMassIndex && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fat-Free Mass Index:</Text>
                <Text style={styles.summaryValue}>
                  {getFatFreeMassIndex(displayGoal)}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Weight Change:</Text>
              <Text style={[
                styles.summaryValue,
                { color: displayGoal.targetAttributes.weightChange > 0 ? '#10b981' : '#ef4444' }
              ]}>
                {displayGoal.targetAttributes.weightChange > 0 ? '+' : ''}
                {displayGoal.targetAttributes.weightChange}kg
              </Text>
            </View>
            
            {/* Editable Fields */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Calorie Target:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.editableValue}
                  value={editedGoal?.targetAttributes?.calorieTarget?.toString() || ''}
                  onChangeText={(text) => updateEditedGoalAttribute('calorieTarget', parseInt(text) || 0)}
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.summaryValue}>
                  {displayGoal.targetAttributes.calorieTarget} cal/day
                </Text>
              )}
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Workouts/Week:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.editableValue}
                  value={editedGoal?.targetAttributes?.workoutFrequency?.toString() || ''}
                  onChangeText={(text) => updateEditedGoalAttribute('workoutFrequency', parseInt(text) || 0)}
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.summaryValue}>
                  {displayGoal.targetAttributes.workoutFrequency} days
                </Text>
              )}
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Protein Target:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.editableValue}
                  value={editedGoal?.targetAttributes?.proteinTarget?.toString() || ''}
                  onChangeText={(text) => updateEditedGoalAttribute('proteinTarget', parseFloat(text) || 0)}
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.summaryValue}>
                  {displayGoal.targetAttributes.proteinTarget}g/day
                </Text>
              )}
            </View>

            {isEditing && (
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelEdit}
                >
                  <Ionicons name="close" size={12} color="#6b7280" />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveEditedGoal}
                >
                  <Ionicons name="checkmark" size={12} color="#ffffff" />
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </MobileOptimizedCard>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="fitness-outline" size={48} color="#3b82f6" />
          <Text style={styles.loadingText}>Loading body type goals...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              // Retry loading
              getAvailableBodyTypes(userData).then(setAvailableBodyTypes).catch(() => setError('Failed to load body type goals')).finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
    backgroundColor: COMMON_STYLES.secondaryBackground,
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
    backgroundColor: COMMON_STYLES.secondaryBackground,
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
    borderRadius: COMMON_STYLES.standardRadius,
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
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginTop: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
