import React, { useState, useEffect, useMemo } from 'react';
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
import { GoalRecommendationService } from '../../services/GoalRecommendationService';
import { HealthData, GoalRecommendation } from '../../services/ConsolidatedGoalsService';

interface BodyTypeGoalsStepProps {
  onBodyTypeChange: (bodyTypeId: string) => void;
  initialBodyType?: string;
  userData: HealthData;
  onValidationChange?: (isValid: boolean) => void;
}

export default function BodyTypeGoalsStep({
  onBodyTypeChange,
  initialBodyType = '',
  userData,
  onValidationChange,
}: BodyTypeGoalsStepProps) {
  const [recommendation, setRecommendation] = useState<GoalRecommendation | null>(null);
  const [loading, setLoading] = useState(true);

  // Generate recommendation when userData changes
  const goalRecommendation = useMemo(() => {
    if (!userData.age || !userData.height || !userData.weight || !userData.gender || !userData.activityLevel) {
      return null;
    }
    return GoalRecommendationService.generateRecommendation(userData);
  }, [userData.age, userData.height, userData.weight, userData.gender, userData.activityLevel]);

  useEffect(() => {
    if (goalRecommendation) {
      setRecommendation(goalRecommendation);
      setLoading(false);
      // Auto-select the recommended goal
      onBodyTypeChange('recommended');
      if (onValidationChange) {
        onValidationChange(true);
      }
    }
  }, [goalRecommendation]);

  const getBMIColor = (bmi: number) => {
    if (bmi < 18.5) return '#3b82f6'; // Blue
    if (bmi < 22) return '#10b981'; // Green
    if (bmi < 25) return '#10b981'; // Green
    if (bmi < 30) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const getGoalColor = (goal: string) => {
    if (goal.includes('Muscle')) return '#3b82f6';
    if (goal.includes('Recomposition')) return '#10b981';
    if (goal.includes('Fat Balance') || goal.includes('Metabolic')) return '#f59e0b';
    return '#6b7280';
  };

  const renderRecommendationCard = () => {
    if (!recommendation) return null;

    const bmiColor = getBMIColor(recommendation.bmi);
    const goalColor = getGoalColor(recommendation.bodyGoal);

    return (
      <MobileOptimizedCard
        variant="elevated"
        style={[styles.recommendationCard, { borderLeftColor: goalColor }]}
      >
        <View style={styles.recommendationHeader}>
          <View style={styles.recommendationTitleContainer}>
            <Ionicons name="star" size={20} color={goalColor} />
            <Text style={[styles.recommendationTitle, { color: goalColor }]}>
              Your Recommended Focus
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: `${goalColor}20` }]}>
            <Text style={[styles.badgeText, { color: goalColor }]}>
              Calculated
            </Text>
          </View>
        </View>

        <View style={styles.goalSection}>
          <Text style={[styles.goalTitle, { color: goalColor }]}>
            {recommendation.bodyGoal}
          </Text>
          <Text style={styles.goalDescription}>
            {recommendation.bodyGoalDescription}
          </Text>
          <Text style={styles.phaseDescription}>
            {recommendation.phaseDescription}
          </Text>
        </View>

        <View style={styles.metricsSection}>
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>BMI</Text>
              <Text style={[styles.metricValue, { color: bmiColor }]}>
                {recommendation.bmi}
              </Text>
              <Text style={styles.metricCategory}>
                {recommendation.bmiCategory}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>BMR</Text>
              <Text style={styles.metricValue}>
                {recommendation.bmr} kcal
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>TDEE</Text>
              <Text style={styles.metricValue}>
                {recommendation.tdee} kcal
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.nutritionSection}>
          <Text style={styles.nutritionTitle}>Nutrition Targets</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Ionicons name="flame" size={16} color="#f59e0b" />
              <Text style={styles.nutritionLabel}>Calories</Text>
              <Text style={styles.nutritionValue}>
                {recommendation.calorieGoal} kcal
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Ionicons name="fitness" size={16} color="#3b82f6" />
              <Text style={styles.nutritionLabel}>Protein</Text>
              <Text style={styles.nutritionValue}>
                {recommendation.proteinGoal}g
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Ionicons name="leaf" size={16} color="#10b981" />
              <Text style={styles.nutritionLabel}>Carbs</Text>
              <Text style={styles.nutritionValue}>
                {recommendation.carbsGoal}g
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Ionicons name="water" size={16} color="#8b5cf6" />
              <Text style={styles.nutritionLabel}>Fats</Text>
              <Text style={styles.nutritionValue}>
                {recommendation.fatsGoal}g
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.guidanceSection}>
          <Text style={styles.guidanceTitle}>Activity Guidance</Text>
          <Text style={styles.guidanceText}>
            {recommendation.activityGuidance}
          </Text>
        </View>
      </MobileOptimizedCard>
    );
  };

  const renderSummaryCard = () => {
    if (!recommendation) return null;

    return (
      <MobileOptimizedCard variant="outlined" style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <Text style={styles.summaryTitle}>How This Works</Text>
        </View>
        <Text style={styles.summaryText}>
          Based on your health data, we've calculated your BMI, metabolic rate, and activity level using established formulas to determine the most effective approach for your goals. This recommendation will guide your nutrition targets and workout focus.
        </Text>
      </MobileOptimizedCard>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="analytics" size={48} color="#3b82f6" />
          <Text style={styles.loadingText}>Analyzing your data...</Text>
          <Text style={styles.loadingSubtext}>
            Calculating your personalized recommendations
          </Text>
        </View>
      </View>
    );
  }

  if (!recommendation) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Unable to generate recommendation</Text>
          <Text style={styles.errorSubtext}>
            Please ensure all health data is complete
          </Text>
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
          <Text style={styles.title}>Your Recommended Goal</Text>
          <Text style={styles.subtitle}>
            Based on your health data, here's your personalized recommendation
          </Text>
        </View>

        {/* Recommendation Card */}
        {renderRecommendationCard()}

        {/* Summary Card */}
        {renderSummaryCard()}
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
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 22,
  },
  recommendationCard: {
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recommendationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  goalSection: {
    marginBottom: 20,
  },
  goalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  goalDescription: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  phaseDescription: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  metricsSection: {
    marginBottom: 20,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  metricCategory: {
    fontSize: 10,
    color: '#9ca3af',
  },
  nutritionSection: {
    marginBottom: 20,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nutritionItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 2,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  guidanceSection: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  guidanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  guidanceText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  summaryCard: {
    marginBottom: 16,
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
  summaryText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 18,
    color: '#1f2937',
    marginTop: 16,
    fontWeight: '600',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
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
    fontSize: 18,
    color: '#ef4444',
    marginTop: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
});