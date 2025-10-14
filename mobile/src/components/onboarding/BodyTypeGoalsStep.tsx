import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MobileOptimizedCard from '../ui/MobileOptimizedCard';
import { hapticFeedback } from '../../utils/haptics';
import { COMMON_STYLES } from '../../theme/constants';
import {
  getAvailableBodyTypes,
  UserAttributes,
  BodyTypeGoal
} from '../../services/BodyTypeGoalsService';
import CustomBodyTypeGoalCreator from './CustomBodyTypeGoalCreator';

interface BodyTypeGoalsStepProps {
  onBodyTypeChange: (bodyTypeId: string) => void;
  initialBodyType?: string;
  userData: UserAttributes;
  onValidationChange?: (isValid: boolean) => void;
}

interface BodyTypeWithTargets {
  id: string;
  name: string;
  targetAttributes?: {
    bodyFat?: { male: { min: number; max: number }; female: { min: number; max: number } };
    bmi?: { male: { min: number; max: number }; female: { min: number; max: number } };
    ffmi?: { male: { min: number; max: number }; female: { min: number; max: number } };
    smm?: { male: { min: number; max: number }; female: { min: number; max: number } };
  };
  targetBodyFat?: { male: { min: number; max: number }; female: { min: number; max: number } };
  waistToHeightRatio?: { male: { min: number; max: number }; female: { min: number; max: number } };
}

export default function BodyTypeGoalsStep({
  onBodyTypeChange,
  initialBodyType = '',
  userData,
  onValidationChange,
}: BodyTypeGoalsStepProps) {
  const [selectedBodyType, setSelectedBodyType] = useState<string>(initialBodyType);
  const [availableBodyTypes, setAvailableBodyTypes] = useState<BodyTypeGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCustomCreator, setShowCustomCreator] = useState(false);

  useEffect(() => {
    loadBodyTypes();
  }, [userData]);

  useEffect(() => {
    // Only call onBodyTypeChange when a body type is actually selected
    if (selectedBodyType) {
      onBodyTypeChange(selectedBodyType);
    }
  }, [selectedBodyType]); // Remove onBodyTypeChange from dependencies to prevent infinite loop

  useEffect(() => {
    // Notify parent of validation state
    if (onValidationChange) {
      onValidationChange(selectedBodyType.length > 0);
    }
  }, [selectedBodyType]); // Remove onValidationChange from dependencies to prevent infinite loop

  const handleBodyTypeSelect = (bodyTypeId: string) => {
    hapticFeedback.selection();
    setSelectedBodyType(bodyTypeId);
  };

  const handleCustomGoalCreated = (goalId: string) => {
    // Reload body types to include the new custom goal
    loadBodyTypes();
    // Select the newly created goal
    setSelectedBodyType(goalId);
    setShowCustomCreator(false);
  };

  const loadBodyTypes = async () => {
    try {
      setError(null);
      const available = await getAvailableBodyTypes(userData);
      setAvailableBodyTypes(available);
    } catch {
      setError('Failed to load body type goals');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBodyTypes = () => {
    return availableBodyTypes.slice(0, 6);
  };

  const getTargetBodyFatForGender = (bodyType: BodyTypeWithTargets, gender: string) => {
    if (!bodyType.targetAttributes) return 'N/A';

    if (gender === 'male' && bodyType.targetAttributes.bodyFatRangeMen) {
      const range = bodyType.targetAttributes.bodyFatRangeMen;
      return `${range.min}-${range.max}%`;
    } else if (gender === 'female' && bodyType.targetAttributes.bodyFatRangeWomen) {
      const range = bodyType.targetAttributes.bodyFatRangeWomen;
      return `${range.min}-${range.max}%`;
    } else if (bodyType.targetAttributes.bodyFatRangeMen && bodyType.targetAttributes.bodyFatRangeWomen) {
      // For 'other' gender, show both targets
      const menRange = bodyType.targetAttributes.bodyFatRangeMen;
      const womenRange = bodyType.targetAttributes.bodyFatRangeWomen;
      return `${menRange.min}-${womenRange.max}%`;
    }

    // Fallback to old structure
    if (!bodyType.targetBodyFat) return 'N/A';

    if (gender === 'male') {
      return `${bodyType.targetBodyFat}%`;
    } else if (gender === 'female') {
      const femaleTarget = bodyType.targetBodyFat + 6;
      return `${femaleTarget}%`;
    } else {
      const femaleTarget = bodyType.targetBodyFat + 6;
      return `${bodyType.targetBodyFat}% (M) / ${femaleTarget}% (F)`;
    }
  };

  const getTargetBMIForGender = (bodyType: BodyTypeWithTargets, gender: string) => {
    if (!bodyType.targetAttributes) return 'N/A';

    if (bodyType.targetAttributes.targetBMIRange) {
      const range = bodyType.targetAttributes.targetBMIRange;
      return `BMI ${range.min}-${range.max}`;
    }

    // Fallback to old structure
    if (!bodyType.targetBMI) return 'N/A';

    const target = Math.round(bodyType.targetBMI * 10) / 10;
    return `BMI ${target}`;
  };

  const getWaistToHeightRatio = (bodyType: BodyTypeWithTargets) => {
    if (!bodyType.waistToHeightRatio) return 'N/A';

    const ratio = Math.round(bodyType.waistToHeightRatio * 100) / 100;
    return `WHR ${ratio}`;
  };

  const getFatFreeMassIndex = (bodyType: BodyTypeWithTargets, gender: string) => {
    if (!bodyType.targetAttributes) return 'N/A';

    if (gender === 'male' && bodyType.targetAttributes.ffmiRangeMen) {
      const range = bodyType.targetAttributes.ffmiRangeMen;
      return `FFMI ${range.min}-${range.max}`;
    } else if (gender === 'female' && bodyType.targetAttributes.ffmiRangeWomen) {
      const range = bodyType.targetAttributes.ffmiRangeWomen;
      return `FFMI ${range.min}-${range.max}`;
    } else if (bodyType.targetAttributes.ffmiRangeMen && bodyType.targetAttributes.ffmiRangeWomen) {
      // For 'other' gender, show both targets
      const menRange = bodyType.targetAttributes.ffmiRangeMen;
      const womenRange = bodyType.targetAttributes.ffmiRangeWomen;
      return `FFMI ${menRange.min}-${womenRange.max}`;
    }

    // Fallback to old structure
    if (!bodyType.fatFreeMassIndex) return 'N/A';

    return `FFMI ${bodyType.fatFreeMassIndex}`;
  };

  const getSMMRange = (bodyType: BodyTypeWithTargets, gender: string) => {
    if (!bodyType.targetAttributes) return 'N/A';

    if (gender === 'male' && bodyType.targetAttributes.smmRangeMen) {
      const range = bodyType.targetAttributes.smmRangeMen;
      return `SMM ${range.min}-${range.max}kg`;
    } else if (gender === 'female' && bodyType.targetAttributes.smmRangeWomen) {
      const range = bodyType.targetAttributes.smmRangeWomen;
      return `SMM ${range.min}-${range.max}kg`;
    } else if (bodyType.targetAttributes.smmRangeMen && bodyType.targetAttributes.smmRangeWomen) {
      // For 'other' gender, show both targets
      const menRange = bodyType.targetAttributes.smmRangeMen;
      const womenRange = bodyType.targetAttributes.smmRangeWomen;
      return `SMM ${menRange.min}-${womenRange.max}kg`;
    }

    return 'N/A';
  };

  const renderBodyTypeCard = (bodyType: BodyTypeWithTargets) => {
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
                name={bodyType.icon as keyof typeof Ionicons.glyphMap}
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
            {(bodyType.targetAttributes?.bodyFatRangeMen || bodyType.targetAttributes?.bodyFatRangeWomen || bodyType.targetBodyFat) && (
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
            {bodyType.targetAttributes?.ffmiRangeMen || bodyType.targetAttributes?.ffmiRangeWomen || bodyType.fatFreeMassIndex ? (
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>FFMI:</Text>
                <Text style={styles.calculationValue}>
                  {getFatFreeMassIndex(bodyType, userData.gender)}
                </Text>
              </View>
            ) : null}
            {bodyType.targetAttributes?.smmRangeMen || bodyType.targetAttributes?.smmRangeWomen ? (
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>SMM:</Text>
                <Text style={styles.calculationValue}>
                  {getSMMRange(bodyType, userData.gender)}
                </Text>
              </View>
            ) : null}
            {bodyType.targetAttributes.sleepDuration && (
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Sleep:</Text>
                <Text style={styles.calculationValue}>
                  {typeof bodyType.targetAttributes.sleepDuration === 'object'
                    ? `${bodyType.targetAttributes.sleepDuration.recommended} hours/night`
                    : `${bodyType.targetAttributes.sleepDuration} hours/night`
                  }
                </Text>
              </View>
            )}
            {bodyType.targetAttributes.dailySteps && (
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Steps:</Text>
                <Text style={styles.calculationValue}>
                  {typeof bodyType.targetAttributes.dailySteps === 'object'
                    ? `${bodyType.targetAttributes.dailySteps.recommended.toLocaleString()}/day`
                    : `${bodyType.targetAttributes.dailySteps.toLocaleString()}/day`
                  }
                </Text>
              </View>
            )}
            {bodyType.targetAttributes.recoveryDays && (
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Recovery:</Text>
                <Text style={styles.calculationValue}>
                  {typeof bodyType.targetAttributes.recoveryDays === 'object'
                    ? `${bodyType.targetAttributes.recoveryDays.recommended} days/week`
                    : `${bodyType.targetAttributes.recoveryDays} days/week`
                  }
                </Text>
              </View>
            )}
            {bodyType.targetAttributes.smmLevel && (
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>SMM Level:</Text>
                <Text style={styles.calculationValue}>
                  {bodyType.targetAttributes.smmLevel}
                </Text>
              </View>
            )}
            {bodyType.targetAttributes.proteinPerKgMen && (
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Protein:</Text>
                <Text style={styles.calculationValue}>
                  {userData.gender === 'male'
                    ? `${bodyType.targetAttributes.proteinPerKgMen.min}-${bodyType.targetAttributes.proteinPerKgMen.max}g/kg`
                    : `${bodyType.targetAttributes.proteinPerKgWomen.min}-${bodyType.targetAttributes.proteinPerKgWomen.max}g/kg`
                  }
                </Text>
              </View>
            )}
            {bodyType.targetAttributes.calorieTarget && (
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Calories:</Text>
                <Text style={styles.calculationValue}>
                  {bodyType.targetAttributes.calorieTarget}
                </Text>
              </View>
            )}
            {bodyType.targetAttributes.workoutFocus && (
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Focus:</Text>
                <Text style={styles.calculationValue}>
                  {bodyType.targetAttributes.workoutFocus}
                </Text>
              </View>
            )}
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

  // Loading state - only show if we don't have any data yet
  if (loading && availableBodyTypes.length === 0) {
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

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>What's your body type goal?</Text>
          <Text style={styles.subtitle}>
            Choose the body type you want to achieve. We'll calculate personalized targets for you.
          </Text>
        </View>

        {/* Body Types Grid */}
        {renderBodyTypesGrid()}

        {/* Create Custom Goal Button */}
        <TouchableOpacity
          style={styles.createCustomButton}
          onPress={() => setShowCustomCreator(true)}
        >
          <Ionicons name="add-circle-outline" size={20} color="#3b82f6" />
          <Text style={styles.createCustomButtonText}>Create Custom Goal</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Custom Goal Creator Modal */}
      <CustomBodyTypeGoalCreator
        visible={showCustomCreator}
        onClose={() => setShowCustomCreator(false)}
        onGoalCreated={handleCustomGoalCreated}
        userGender={userData.gender}
      />
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
  createCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  createCustomButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 8,
  },
});
