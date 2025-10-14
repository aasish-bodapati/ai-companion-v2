import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBodyTypeScoring } from '../../hooks/useBodyTypeScoring';
import { BodyTypeGoal, UserAttributes } from '../../services/ConsolidatedGoalsService';
import { DailyLog, WeeklyLog } from '../../services/ConsolidatedGoalsService';

import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../../theme/constants';
import { STYLE_PRESETS } from '../../theme/duplicateStyles';

interface BodyTypeProgressDashboardProps {
  bodyTypeGoal: BodyTypeGoal;
  userAttributes: UserAttributes;
  dailyLog?: DailyLog;
  weeklyLog?: WeeklyLog;
  onRefresh?: () => void;
  onLogActivity?: () => void;
}

export default function BodyTypeProgressDashboard({
  bodyTypeGoal,
  userAttributes,
  dailyLog,
  weeklyLog,
  onRefresh,
  onLogActivity,
}: BodyTypeProgressDashboardProps) {
  const {
    dailyResult,
    weeklyResult,
    isReady,
  } = useBodyTypeScoring({
    bodyTypeGoal,
    userAttributes,
    dailyLog,
    weeklyLog,
  });

  const [streakDays] = useState(7); // Mock streak data
  const [achievements] = useState(['3 weeks aligned', 'Perfect week']); // Mock achievements

  const getGoalIcon = (goalName: string) => {
    if (goalName.includes('Sleek') && goalName.includes('Graceful')) {
      return 'leaf-outline';
    } else if (goalName.includes('Strong') && goalName.includes('Steady')) {
      return 'fitness-outline';
    } else if (goalName.includes('Big') && goalName.includes('Bold')) {
      return 'muscle-outline';
    }
    return 'body-outline';
  };

  const getAlignmentIcon = (alignment: string) => {
    switch (alignment) {
      case 'closer':
        return { name: 'trending-up', color: '#10b981' };
      case 'neutral':
        return { name: 'remove', color: '#f59e0b' };
      case 'farther':
        return { name: 'trending-down', color: '#ef4444' };
      default:
        return { name: 'help', color: COLORS.text.secondary };
    }
  };

  const getAlignmentColor = (alignment: string) => {
    switch (alignment) {
      case 'closer':
        return '#10b981';
      case 'neutral':
        return '#f59e0b';
      case 'farther':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const renderGoalOverview = () => {
    const alignmentIcon = dailyResult ? getAlignmentIcon(dailyResult.alignment) : { name: 'help', color: COLORS.text.secondary };
    const alignmentColor = dailyResult ? getAlignmentColor(dailyResult.alignment) : '#6b7280';

    return (
      <View style={styles.goalOverview}>
        <View style={styles.goalHeader}>
          <View style={styles.goalIconContainer}>
            <Ionicons
              name={getGoalIcon(bodyTypeGoal.name) as keyof typeof Ionicons.glyphMap}
              size={32}
              color="#3b82f6"
            />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>Your Goal: {bodyTypeGoal.name}</Text>
            <View style={styles.weeklyAlignment}>
              <Text style={styles.weeklyAlignmentText}>
                This Week: {weeklyResult?.percentage || 0}% Aligned
              </Text>
              <Ionicons
                name={alignmentIcon.name as keyof typeof Ionicons.glyphMap}
                size={20}
                color={alignmentColor}
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderProgressMeter = () => {
    if (!dailyResult) return null;

    const alignmentColor = getAlignmentColor(dailyResult.alignment);
    const progressWidth = Math.max(10, dailyResult.percentage); // Minimum 10% width

    return (
      <View style={styles.progressMeterContainer}>
        <View style={styles.progressMeterHeader}>
          <Text style={styles.progressMeterTitle}>Today's Progress</Text>
          <Text style={styles.progressMeterScore}>Score: +{dailyResult.score}</Text>
        </View>

        <View style={styles.progressMeter}>
          <View style={styles.progressMeterLabels}>
            <Text style={styles.progressMeterLabel}>Closer ↗</Text>
            <Text style={styles.progressMeterLabel}>Farther ↘</Text>
          </View>
          <View style={styles.progressMeterBar}>
            <View
              style={[
                styles.progressMeterFill,
                {
                  width: `${progressWidth}%`,
                  backgroundColor: alignmentColor,
                }
              ]}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderDailyBreakdown = () => {
    if (!dailyLog) return null;

    // Calculate breakdown scores (simplified for demo)
    const workoutScore = dailyLog.workouts.reduce((sum, workout) => {
      // This would use the actual scoring service
      return sum + (workout.type === 'moderate_strength' || workout.type === 'heavy_strength' ? 12 : workout.type === 'cardio' ? 5 : 0);
    }, 0);

    const nutritionScore = dailyLog.nutrition.reduce((sum, nutrition) => {
      let score = 0;
      if (nutrition.proteinPerKg >= 1.6 && nutrition.proteinPerKg <= 2.0) score += 10;
      if (nutrition.calories >= nutrition.tdee * 0.9 && nutrition.calories <= nutrition.tdee * 1.1) score += 8;
      if (nutrition.isJunkProcessed) score -= 5;
      return sum + score;
    }, 0);

    const consistencyScore = dailyLog.workouts.length >= 2 ? 5 : -3;

    return (
      <View style={styles.breakdownContainer}>
        <Text style={styles.breakdownTitle}>Daily Breakdown</Text>

        <View style={styles.breakdownCard}>
          <View style={styles.breakdownItem}>
            <Ionicons name="fitness-outline" size={20} color="#10b981" />
            <View style={styles.breakdownItemContent}>
              <Text style={styles.breakdownItemTitle}>Workouts</Text>
              <Text style={styles.breakdownItemScore}>
                {workoutScore > 0 ? '+' : ''}{workoutScore} points
              </Text>
              <Text style={styles.breakdownItemDetail}>
                ({dailyLog.workouts.length} sessions)
              </Text>
            </View>
          </View>

          <View style={styles.breakdownItem}>
            <Ionicons name="restaurant-outline" size={20} color="#3b82f6" />
            <View style={styles.breakdownItemContent}>
              <Text style={styles.breakdownItemTitle}>Nutrition</Text>
              <Text style={styles.breakdownItemScore}>
                {nutritionScore > 0 ? '+' : ''}{nutritionScore} points
              </Text>
              <Text style={styles.breakdownItemDetail}>
                (protein on target, {dailyLog.nutrition.filter(n => n.isJunkProcessed).length} junk meals)
              </Text>
            </View>
          </View>

          <View style={styles.breakdownItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color={consistencyScore > 0 ? "#10b981" : "#ef4444"} />
            <View style={styles.breakdownItemContent}>
              <Text style={styles.breakdownItemTitle}>Consistency</Text>
              <Text style={[styles.breakdownItemScore, { color: consistencyScore > 0 ? "#10b981" : "#ef4444" }]}>
                {consistencyScore > 0 ? '+' : ''}{consistencyScore} points
              </Text>
              <Text style={styles.breakdownItemDetail}>
                ({dailyLog.workouts.length >= 2 ? 'on track' : '1 missed workout'})
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderTrendGraph = () => {
    // Mock trend data for the last 7 days
    const trendData = [65, 72, 68, 76, 82, 78, dailyResult?.percentage || 0];
    const maxValue = Math.max(...trendData);
    const minValue = Math.min(...trendData);

    return (
      <View style={styles.trendContainer}>
        <Text style={styles.trendTitle}>7-Day Alignment Trend</Text>
        <View style={styles.trendGraph}>
          {trendData.map((value, index) => {
            const height = ((value - minValue) / (maxValue - minValue)) * 100;
            const isToday = index === trendData.length - 1;

            return (
              <View key={index} style={styles.trendBar}>
                <View
                  style={[
                    styles.trendBarFill,
                    {
                      height: `${height}%`,
                      backgroundColor: isToday ? '#3b82f6' : '#e5e7eb',
                    }
                  ]}
                />
                <Text style={styles.trendBarLabel}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderSmartFeedback = () => {
    if (!dailyResult) return null;

    const getFeedbackMessage = () => {
      if (dailyResult.alignment === 'closer') {
        return "Excellent progress! You're perfectly aligned with your body type goal.";
      } else if (dailyResult.alignment === 'neutral') {
        return "Good progress! Add one more strength session to hit elite alignment.";
      } else {
        return "Let's refocus on your body type requirements. Try logging a workout today.";
      }
    };

    return (
      <View style={styles.feedbackContainer}>
        <View style={styles.feedbackHeader}>
          <Ionicons name="bulb-outline" size={24} color="#f59e0b" />
          <Text style={styles.feedbackTitle}>Smart Feedback</Text>
        </View>
        <Text style={styles.feedbackMessage}>{getFeedbackMessage()}</Text>

        {dailyResult.suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {dailyResult.suggestions.slice(0, 2).map((suggestion, index) => (
              <View key={index} style={styles.suggestionItem}>
                <Ionicons name="arrow-forward" size={16} color="#3b82f6" />
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderGamification = () => {
    return (
      <View style={styles.gamificationContainer}>
        <View style={styles.gamificationItem}>
          <View style={styles.streakContainer}>
            <Ionicons name="flame" size={24} color="#f59e0b" />
            <Text style={styles.streakText}>{streakDays} day streak</Text>
          </View>
        </View>

        <View style={styles.gamificationItem}>
          <View style={styles.achievementsContainer}>
            <Ionicons name="trophy-outline" size={24} color="#8b5cf6" />
            <View style={styles.achievementsList}>
              {achievements.map((achievement, index) => (
                <Text key={index} style={styles.achievementText}>
                  🏅 {achievement}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderGoalOverview()}
      {renderProgressMeter()}
      {renderDailyBreakdown()}
      {renderTrendGraph()}
      {renderSmartFeedback()}
      {renderGamification()}

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.logButton} onPress={onLogActivity}>
          <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
          <Text style={styles.logButtonText}>Log Activity</Text>
        </TouchableOpacity>

        {onRefresh && (
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#3b82f6" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.text.secondary,
  },
  goalOverview: {
    backgroundColor: COLORS.background.primary,
    margin: 16,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  weeklyAlignment: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weeklyAlignmentText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.text.secondary,
    marginRight: 8,
  },
  progressMeterContainer: {
    backgroundColor: COLORS.background.primary,
    margin: 16,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  progressMeterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressMeterTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  progressMeterScore: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: '#3b82f6',
  },
  progressMeter: {
    marginTop: 8,
  },
  progressMeterLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressMeterLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  progressMeterBar: {
    height: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressMeterFill: {
    height: '100%',
    borderRadius: 6,
  },
  breakdownContainer: {
    margin: 16,
  },
  breakdownTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  breakdownCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  breakdownItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  breakdownItemTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  breakdownItemScore: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 2,
  },
  breakdownItemDetail: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
  },
  trendContainer: {
    backgroundColor: COLORS.background.primary,
    margin: 16,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  trendTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  trendGraph: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    justifyContent: 'space-between',
  },
  trendBar: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  trendBarFill: {
    width: '100%',
    borderRadius: BORDER_RADIUS.xs,
    marginBottom: 8,
    minHeight: 4,
  },
  trendBarLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  feedbackContainer: {
    backgroundColor: COLORS.background.primary,
    margin: 16,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedbackTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: 8,
  },
  feedbackMessage: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.text.primary,
    lineHeight: 24,
    marginBottom: 16,
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
    marginLeft: 8,
    flex: 1,
  },
  gamificationContainer: {
    flexDirection: 'row',
    margin: 16,
    gap: 12,
  },
  gamificationItem: {
    flex: 1,
  },
  streakContainer: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  streakText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: 8,
  },
  achievementsContainer: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  achievementsList: {
    marginTop: 8,
  },
  achievementText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    margin: 16,
    gap: 12,
  },
  logButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary.main,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  logButtonText: {
    color: COLORS.text.inverse,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginLeft: 8,
  },
  refreshButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  refreshButtonText: {
    color: '#3b82f6',
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginLeft: 8,
  },
});
