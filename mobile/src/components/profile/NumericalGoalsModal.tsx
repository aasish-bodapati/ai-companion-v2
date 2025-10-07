import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NumericalGoal, getNumericalGoalsForHealthGoals, customizeGoalForUser } from '../../services/goalTemplates';
import { hapticFeedback } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import { COMMON_STYLES } from '../../theme/constants';

interface NumericalGoalsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (goals: NumericalGoal[]) => void;
  healthGoals: string[];
  userData?: {
    age?: number;
    weight?: number;
    height?: number;
    gender?: string;
    activityLevel?: string;
  };
}

export default function NumericalGoalsModal({
  visible,
  onClose,
  onSave,
  healthGoals,
  userData,
}: NumericalGoalsModalProps) {
  const [numericalGoals, setNumericalGoals] = useState<NumericalGoal[]>([]);
  const [editingGoal, setEditingGoal] = useState<NumericalGoal | null>(null);

  useEffect(() => {
    if (visible && healthGoals.length > 0) {
      console.log('🎯 NumericalGoalsModal: Health goals received:', healthGoals);
      
      // Generate numerical goals based on selected health goals
      const baseGoals = getNumericalGoalsForHealthGoals(healthGoals);
      console.log('🎯 NumericalGoalsModal: Base goals generated:', baseGoals.length);
      
      // Customize goals based on user data
      const customizedGoals = baseGoals.map(goal => 
        customizeGoalForUser(goal, userData || {})
      );
      
      console.log('🎯 NumericalGoalsModal: Customized goals:', customizedGoals.length);
      setNumericalGoals(customizedGoals);
    } else if (visible) {
      console.log('🎯 NumericalGoalsModal: No health goals provided or modal not visible');
    }
  }, [visible, healthGoals, userData]);

  const handleSave = () => {
    if (numericalGoals.length === 0) {
      showToast.error('Error', 'No numerical goals configured');
      return;
    }

    hapticFeedback.success();
    onSave(numericalGoals);
    onClose();
  };

  const handleGoalValueChange = (goalId: string, value: string) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return;

    setNumericalGoals(prev =>
      prev.map(goal =>
        goal.id === goalId
          ? { ...goal, targetValue: numericValue }
          : goal
      )
    );
  };

  const toggleGoalEnabled = (goalId: string) => {
    setNumericalGoals(prev =>
      prev.map(goal =>
        goal.id === goalId
          ? { ...goal, enabled: !goal.enabled }
          : goal
      )
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'fitness': return 'fitness-outline';
      case 'nutrition': return 'nutrition-outline';
      case 'wellness': return 'flower-outline';
      case 'lifestyle': return 'person-outline';
      default: return 'flag-outline';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.title}>Set Your Goals</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.introSection}>
            <Text style={styles.introTitle}>Make Your Goals Measurable</Text>
            <Text style={styles.introText}>
              We've created specific, trackable targets based on your health goals. 
              Customize them to match your preferences and capabilities.
            </Text>
          </View>

          {numericalGoals.map((goal) => (
            <View key={goal.id} style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <View style={styles.goalInfo}>
                  <View style={styles.goalTitleRow}>
                    <Ionicons 
                      name={getCategoryIcon(goal.category)} 
                      size={20} 
                      color={goal.color} 
                    />
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(goal.priority) }]}>
                      <Text style={styles.priorityText}>{goal.priority}</Text>
                    </View>
                  </View>
                  <Text style={styles.goalDescription}>{goal.description}</Text>
                </View>
              </View>

              <View style={styles.goalInputSection}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.valueInput}
                    value={goal.targetValue.toString()}
                    onChangeText={(value) => handleGoalValueChange(goal.id, value)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#9ca3af"
                  />
                  <Text style={styles.unitText}>{goal.unit}</Text>
                </View>
                
                {goal.isCustomizable && (
                  <TouchableOpacity 
                    style={styles.customizeButton}
                    onPress={() => setEditingGoal(goal)}
                  >
                    <Ionicons name="settings-outline" size={16} color="#6b7280" />
                    <Text style={styles.customizeText}>Customize</Text>
                  </TouchableOpacity>
                )}
              </View>

              {goal.currentValue !== undefined && (
                <View style={styles.progressSection}>
                  <Text style={styles.progressText}>
                    Current: {goal.currentValue} {goal.unit}
                  </Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${Math.min((goal.currentValue / goal.targetValue) * 100, 100)}%`,
                          backgroundColor: goal.color 
                        }
                      ]} 
                    />
                  </View>
                </View>
              )}
            </View>
          ))}

          {numericalGoals.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="flag-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No Goals Available</Text>
              <Text style={styles.emptyText}>
                Select health goals first to generate numerical targets
              </Text>
            </View>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COMMON_STYLES.secondaryBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COMMON_STYLES.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  introSection: {
    backgroundColor: COMMON_STYLES.cardBackground,
    padding: 20,
    borderRadius: COMMON_STYLES.standardRadius,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  introTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  goalCard: {
    backgroundColor: COMMON_STYLES.cardBackground,
    borderRadius: COMMON_STYLES.standardRadius,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  goalHeader: {
    marginBottom: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: COMMON_STYLES.standardRadius,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  goalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  goalInputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COMMON_STYLES.secondaryBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flex: 1,
    marginRight: 12,
  },
  valueInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    minWidth: 60,
  },
  unitText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  customizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COMMON_STYLES.secondaryBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  customizeText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  progressSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 40,
  },
});
