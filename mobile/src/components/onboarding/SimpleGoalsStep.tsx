/**
 * SimpleGoalsStep - Basic goal selection
 * Simplified from complex body type goals to simple, clear options
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../theme/constants';

interface SimpleGoalsData {
  primaryGoal: 'lose_weight' | 'gain_weight' | 'maintain_weight' | 'build_muscle' | 'get_fitter' | '';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | '';
}

interface SimpleGoalsStepProps {
  onDataChange: (data: SimpleGoalsData) => void;
  initialData?: Partial<SimpleGoalsData>;
}

const PRIMARY_GOALS = [
  {
    id: 'lose_weight',
    title: 'Lose Weight',
    description: 'Burn fat and get leaner',
    icon: 'trending-down-outline',
    color: '#10b981',
  },
  {
    id: 'gain_weight',
    title: 'Gain Weight',
    description: 'Build healthy weight',
    icon: 'trending-up-outline',
    color: '#f59e0b',
  },
  {
    id: 'maintain_weight',
    title: 'Maintain Weight',
    description: 'Keep current weight',
    icon: 'remove-outline',
    color: '#6b7280',
  },
  {
    id: 'build_muscle',
    title: 'Build Muscle',
    description: 'Get stronger and bigger',
    icon: 'barbell-outline',
    color: '#8b5cf6',
  },
  {
    id: 'get_fitter',
    title: 'Get Fitter',
    description: 'Improve overall fitness',
    icon: 'fitness-outline',
    color: '#3b82f6',
  },
];

const EXPERIENCE_LEVELS = [
  {
    id: 'beginner',
    title: 'Beginner',
    description: 'New to fitness or getting back into it',
    icon: 'leaf-outline',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    description: 'Some experience with regular exercise',
    icon: 'flame-outline',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Experienced with various workouts',
    icon: 'flash-outline',
  },
];

export default function SimpleGoalsStep({ 
  onDataChange, 
  initialData = {} 
}: SimpleGoalsStepProps) {
  const [data, setData] = useState<SimpleGoalsData>({
    primaryGoal: initialData.primaryGoal || '',
    experienceLevel: initialData.experienceLevel || 'beginner',
  });

  useEffect(() => {
    onDataChange(data);
  }, [data]); // Remove onDataChange from dependencies to prevent infinite loop

  const updateData = (field: keyof SimpleGoalsData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const isComplete = data.primaryGoal && data.experienceLevel;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Primary Goal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What's your main goal? *</Text>
        <Text style={styles.sectionSubtitle}>Choose what you want to focus on most</Text>
        
        <View style={styles.goalsGrid}>
          {PRIMARY_GOALS.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.goalCard,
                data.primaryGoal === goal.id && styles.selectedGoal
              ]}
              onPress={() => updateData('primaryGoal', goal.id)}
            >
              <View style={styles.goalIconContainer}>
                <View style={[
                  styles.goalIcon,
                  { backgroundColor: data.primaryGoal === goal.id ? goal.color : goal.color + '20' }
                ]}>
                  <Ionicons 
                    name={goal.icon as keyof typeof Ionicons.glyphMap} 
                    size={16} 
                    color={data.primaryGoal === goal.id ? COLORS.text.primary : COLORS.text.secondary} 
                  />
                </View>
              </View>
              <Text style={[
                styles.goalTitle,
                data.primaryGoal === goal.id && styles.selectedGoalTitle
              ]}>
                {goal.title}
              </Text>
              <Text style={[
                styles.goalDescription,
                data.primaryGoal === goal.id && styles.selectedGoalDescription
              ]}>
                {goal.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Experience Level */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Experience Level</Text>
        <Text style={styles.sectionSubtitle}>This helps us recommend the right workouts</Text>
        
        <View style={styles.experienceList}>
          {EXPERIENCE_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.experienceCard,
                data.experienceLevel === level.id && styles.selectedExperience
              ]}
              onPress={() => updateData('experienceLevel', level.id)}
            >
              <View style={styles.experienceHeader}>
                <View style={styles.experienceIconContainer}>
                  <Ionicons 
                    name={level.icon as keyof typeof Ionicons.glyphMap} 
                    size={20} 
                    color={data.experienceLevel === level.id ? COLORS.text.primary : COLORS.text.secondary} 
                  />
                </View>
                <Text style={[
                  styles.experienceTitle,
                  data.experienceLevel === level.id && styles.selectedExperienceText
                ]}>
                  {level.title}
                </Text>
              </View>
              <Text style={[
                styles.experienceDescription,
                data.experienceLevel === level.id && styles.selectedExperienceDescription
              ]}>
                {level.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quick Tips */}
      <View style={styles.tipsCard}>
        <Ionicons name="bulb-outline" size={16} color={COLORS.warning} />
        <View style={styles.tipsContent}>
          <Text style={styles.tipsTitle}>Quick Tips</Text>
          <Text style={styles.tipsText}>
            • You can change your goals anytime in settings{'\n'}
            • We'll suggest workouts based on your experience level{'\n'}
            • Start simple and build up gradually
          </Text>
        </View>
      </View>

      {/* Completion Status */}
      <View style={styles.statusCard}>
        <Ionicons 
          name={isComplete ? "checkmark-circle" : "information-circle"} 
          size={20} 
          color={isComplete ? COLORS.success : COLORS.text.secondary} 
        />
        <Text style={[
          styles.statusText,
          isComplete && styles.statusTextComplete
        ]}>
          {isComplete ? 'Goals set! Ready to get started' : 'Please select your primary goal'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: SPACING.large, // Reduced from xl
  },
  sectionTitle: {
    fontSize: FONT_SIZE.medium, // Reduced from large
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.small,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZE.small, // Reduced from medium
    color: COLORS.text.secondary,
    marginBottom: SPACING.medium, // Reduced from large
  },
  goalsGrid: {
    flexDirection: 'row',
    gap: 2, // Much smaller gap
  },
  goalCard: {
    width: 70, // Slightly wider for better proportions
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.small,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary.light,
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedGoal: {
    borderColor: COLORS.primary.main,
    backgroundColor: COLORS.primary.light,
    borderWidth: 2,
  },
  goalIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1, // Minimal margin
  },
  goalIcon: {
    width: 24, // Slightly larger for better visibility
    height: 24, // Slightly larger for better visibility
    borderRadius: 12, // Slightly larger
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTitle: {
    fontSize: FONT_SIZE.small,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  goalDescription: {
    fontSize: 8, // Much smaller for narrow cards (smaller than theme minimum)
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 10, // Tighter line height
  },
  selectedGoalTitle: {
    color: COLORS.text.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  selectedGoalDescription: {
    color: COLORS.text.secondary,
  },
  experienceList: {
    gap: SPACING.xs, // Reduced from small
  },
  experienceCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.small, // Reduced from medium
    borderWidth: 1,
    borderColor: COLORS.primary.light,
  },
  selectedExperience: {
    backgroundColor: COLORS.primary.light,
    borderColor: COLORS.primary.main,
    borderWidth: 2,
  },
  experienceIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  experienceCheckmark: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.md,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.background.primary,
  },
  experienceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2, // Reduced from SPACING.xs
    gap: SPACING.xs, // Reduced from small
  },
  experienceTitle: {
    fontSize: FONT_SIZE.small, // Reduced from medium
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.text.primary,
  },
  selectedExperienceText: {
    color: COLORS.text.primary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  experienceDescription: {
    fontSize: FONT_SIZE.xs, // Reduced from small
    color: COLORS.text.secondary,
    marginLeft: 28, // Reduced from 32
    lineHeight: 14, // Tighter line height
  },
  selectedExperienceDescription: {
    color: COLORS.text.secondary,
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.warning + '20',
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.small, // Reduced from medium
    marginBottom: SPACING.medium, // Reduced from large
    gap: SPACING.xs, // Reduced from small
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: FONT_SIZE.small, // Reduced from medium
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text.primary,
    marginBottom: 2, // Reduced from SPACING.xs
  },
  tipsText: {
    fontSize: FONT_SIZE.xs, // Reduced from small
    color: COLORS.text.secondary,
    lineHeight: 16, // Tighter line height
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.small, // Reduced from medium
    marginTop: SPACING.medium, // Reduced from large
    gap: SPACING.xs, // Reduced from small
  },
  statusText: {
    flex: 1,
    fontSize: FONT_SIZE.xs, // Reduced from small
    color: COLORS.text.secondary,
    lineHeight: 16, // Tighter line height
  },
  statusTextComplete: {
    color: COLORS.success,
  },
});
