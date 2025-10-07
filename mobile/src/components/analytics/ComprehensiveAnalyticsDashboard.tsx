import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BodyTypeGoal, UserAttributes } from '../../services/bodyTypeGoals';

interface AnalyticsData {
  // Overall Goal Alignment
  weeklyAlignment: number;
  monthlyAlignment: number;
  alignmentTrend: 'up' | 'down' | 'stable';
  weeklyBreakdown: {
    workouts: number;
    nutrition: number;
    consistency: number;
  };
  
  // Workout Analytics
  workoutFrequency: {
    activeDays: number;
    totalDays: number;
    heatmap: boolean[][]; // 7x4 weeks
  };
  workoutTypeDistribution: {
    strength: number;
    cardio: number;
    flexibility: number;
    other: number;
  };
  progressiveOverload: {
    totalWeight: number;
    averageReps: number;
    averageSets: number;
    trend: number[];
  };
  performanceTrends: {
    distance: number[];
    timeUnderTension: number[];
    personalRecords: number;
  };
  
  // Nutrition Analytics
  macroTrends: {
    protein: { current: number; target: number; trend: number[] };
    carbs: { current: number; target: number; trend: number[] };
    fat: { current: number; target: number; trend: number[] };
  };
  calorieBalance: {
    intake: number;
    burn: number;
    goal: number;
    trend: number[];
  };
  foodChoices: {
    onTarget: number;
    offTarget: number;
    percentage: number;
  };
  mealTiming: {
    breakfast: number;
    lunch: number;
    dinner: number;
    snacks: number;
  };
  
  // Body Metrics
  bodyMetrics: {
    weight: { current: number; trend: number[]; target: number };
    bodyFat: { current: number; trend: number[]; target: number };
    ffmi: { current: number; trend: number[]; target: number };
    smm: { current: number; trend: number[]; target: number };
  };
  
  // Consistency & Habits
  streaks: {
    current: number;
    longest: number;
    bestWeek: number;
  };
  adherence: {
    foodLogging: number;
    workoutLogging: number;
    overall: number;
  };
  bestWorstDays: {
    bestDay: string;
    worstDay: string;
    bestDayScore: number;
    worstDayScore: number;
  };
  
  // Comparative Insights
  weekComparison: {
    thisWeek: number;
    lastWeek: number;
    change: number;
  };
  personalRecords: {
    bestWeek: number;
    bestProteinDay: number;
    mostWorkouts: number;
    longestStreak: number;
  };
  achievements: string[];
}

interface ComprehensiveAnalyticsDashboardProps {
  bodyTypeGoal: BodyTypeGoal;
  userAttributes: UserAttributes;
  timeRange: 'week' | 'month' | 'quarter' | 'year';
  onTimeRangeChange?: (range: string) => void;
  onRefresh?: () => void;
}

export default function ComprehensiveAnalyticsDashboard({
  bodyTypeGoal,
  userAttributes,
  timeRange,
  onTimeRangeChange,
  onRefresh,
}: ComprehensiveAnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'workouts' | 'nutrition' | 'body' | 'habits'>('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange, loadAnalyticsData]);

  const loadAnalyticsData = useCallback(async () => {
    setLoading(true);
    try {
      // Mock data - in real app, this would fetch from backend
      const mockData = generateMockAnalyticsData();
      setAnalyticsData(mockData);
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  }, []);

  const generateMockAnalyticsData = (): AnalyticsData => {
    return {
      weeklyAlignment: 76,
      monthlyAlignment: 72,
      alignmentTrend: 'up',
      weeklyBreakdown: {
        workouts: 45,
        nutrition: 30,
        consistency: 25,
      },
      workoutFrequency: {
        activeDays: 5,
        totalDays: 7,
        heatmap: Array(4).fill(null).map(() => Array(7).fill(true).map(() => Math.random() > 0.3)),
      },
      workoutTypeDistribution: {
        strength: 60,
        cardio: 25,
        flexibility: 10,
        other: 5,
      },
      progressiveOverload: {
        totalWeight: 12500,
        averageReps: 8.5,
        averageSets: 3.2,
        trend: [100, 105, 110, 108, 115, 120, 118],
      },
      performanceTrends: {
        distance: [5, 6, 5.5, 7, 6.5, 8, 7.5],
        timeUnderTension: [45, 48, 50, 52, 55, 58, 60],
        personalRecords: 3,
      },
      macroTrends: {
        protein: { current: 180, target: 200, trend: [160, 170, 175, 180, 185, 190, 180] },
        carbs: { current: 250, target: 300, trend: [200, 220, 240, 250, 260, 270, 250] },
        fat: { current: 80, target: 90, trend: [70, 75, 80, 85, 90, 85, 80] },
      },
      calorieBalance: {
        intake: 2200,
        burn: 2000,
        goal: 2100,
        trend: [2000, 2100, 2200, 2300, 2200, 2400, 2200],
      },
      foodChoices: {
        onTarget: 18,
        offTarget: 7,
        percentage: 72,
      },
      mealTiming: {
        breakfast: 6,
        lunch: 7,
        dinner: 7,
        snacks: 4,
      },
      bodyMetrics: {
        weight: { current: 75, trend: [76, 75.5, 75.2, 75, 74.8, 75, 75], target: 78 },
        bodyFat: { current: 15, trend: [16, 15.8, 15.5, 15.2, 15, 15.1, 15], target: 12 },
        ffmi: { current: 22, trend: [21.5, 21.8, 22, 22.2, 22.5, 22.3, 22], target: 24 },
        smm: { current: 35, trend: [34, 34.5, 35, 35.2, 35.5, 35.3, 35], target: 38 },
      },
      streaks: {
        current: 7,
        longest: 21,
        bestWeek: 85,
      },
      adherence: {
        foodLogging: 85,
        workoutLogging: 90,
        overall: 87,
      },
      bestWorstDays: {
        bestDay: 'Tuesday',
        worstDay: 'Sunday',
        bestDayScore: 92,
        worstDayScore: 45,
      },
      weekComparison: {
        thisWeek: 76,
        lastWeek: 68,
        change: 8,
      },
      personalRecords: {
        bestWeek: 85,
        bestProteinDay: 220,
        mostWorkouts: 6,
        longestStreak: 21,
      },
      achievements: ['3 Weeks Aligned', 'Perfect Week', 'Protein Master', 'Consistency King'],
    };
  };

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeSelector}>
      {['week', 'month', 'quarter', 'year'].map((range) => (
        <TouchableOpacity
          key={range}
          style={[
            styles.timeRangeButton,
            timeRange === range && styles.timeRangeButtonActive,
          ]}
          onPress={() => onTimeRangeChange?.(range)}
        >
          <Text
            style={[
              styles.timeRangeButtonText,
              timeRange === range && styles.timeRangeButtonTextActive,
            ]}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTabSelector = () => (
    <View style={styles.tabSelector}>
      {[
        { key: 'overview', label: 'Overview', icon: 'analytics-outline' },
        { key: 'workouts', label: 'Workouts', icon: 'fitness-outline' },
        { key: 'nutrition', label: 'Nutrition', icon: 'restaurant-outline' },
        { key: 'body', label: 'Body', icon: 'body-outline' },
        { key: 'habits', label: 'Habits', icon: 'checkmark-circle-outline' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tabButton,
            selectedTab === tab.key && styles.tabButtonActive,
          ]}
          onPress={() => setSelectedTab(tab.key as 'overview' | 'workouts' | 'nutrition' | 'body' | 'habits')}
        >
          <Ionicons
            name={tab.icon as keyof typeof Ionicons.glyphMap}
            size={20}
            color={selectedTab === tab.key ? '#3b82f6' : '#6b7280'}
          />
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === tab.key && styles.tabButtonTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAlignmentOverview = () => {
    if (!analyticsData) return null;

    const trendIcon = analyticsData.alignmentTrend === 'up' ? 'trending-up' : 
                     analyticsData.alignmentTrend === 'down' ? 'trending-down' : 'remove';
    const trendColor = analyticsData.alignmentTrend === 'up' ? '#10b981' : 
                      analyticsData.alignmentTrend === 'down' ? '#ef4444' : '#6b7280';

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Goal Alignment</Text>
        
        <View style={styles.alignmentCard}>
          <View style={styles.alignmentHeader}>
            <Text style={styles.alignmentTitle}>
              {timeRange === 'week' ? 'This Week' : 'This Month'}
            </Text>
            <View style={styles.alignmentTrend}>
              <Ionicons name={trendIcon} size={20} color={trendColor} />
              <Text style={[styles.alignmentTrendText, { color: trendColor }]}>
                {analyticsData.alignmentTrend === 'up' ? 'Improving' : 
                 analyticsData.alignmentTrend === 'down' ? 'Declining' : 'Stable'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.alignmentPercentage}>
            {timeRange === 'week' ? analyticsData.weeklyAlignment : analyticsData.monthlyAlignment}%
          </Text>
          <Text style={styles.alignmentSubtext}>
            aligned with your {bodyTypeGoal.name} goal
          </Text>
          
          <View style={styles.alignmentBreakdown}>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownBar, { width: `${analyticsData.weeklyBreakdown.workouts}%` }]} />
              <Text style={styles.breakdownLabel}>Workouts</Text>
            </View>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownBar, { width: `${analyticsData.weeklyBreakdown.nutrition}%` }]} />
              <Text style={styles.breakdownLabel}>Nutrition</Text>
            </View>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownBar, { width: `${analyticsData.weeklyBreakdown.consistency}%` }]} />
              <Text style={styles.breakdownLabel}>Consistency</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderWorkoutAnalytics = () => {
    if (!analyticsData) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workout Analytics</Text>
        
        {/* Workout Frequency Heatmap */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Activity Heatmap</Text>
          <View style={styles.heatmap}>
            {analyticsData.workoutFrequency.heatmap.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.heatmapWeek}>
                {week.map((active, dayIndex) => (
                  <View
                    key={dayIndex}
                    style={[
                      styles.heatmapDay,
                      { backgroundColor: active ? '#10b981' : '#e5e7eb' }
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
          <Text style={styles.heatmapLabel}>
            {analyticsData.workoutFrequency.activeDays}/{analyticsData.workoutFrequency.totalDays} days active
          </Text>
        </View>

        {/* Workout Type Distribution */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Workout Types</Text>
          <View style={styles.distributionChart}>
            {Object.entries(analyticsData.workoutTypeDistribution).map(([type, percentage]) => (
              <View key={type} style={styles.distributionItem}>
                <View style={styles.distributionBar}>
                  <View 
                    style={[
                      styles.distributionBarFill,
                      { width: `${percentage}%` }
                    ]}
                  />
                </View>
                <Text style={styles.distributionLabel}>
                  {type.charAt(0).toUpperCase() + type.slice(1)} ({percentage}%)
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Progressive Overload */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Progressive Overload</Text>
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{analyticsData.progressiveOverload.totalWeight}kg</Text>
              <Text style={styles.metricLabel}>Total Weight</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{analyticsData.progressiveOverload.averageReps}</Text>
              <Text style={styles.metricLabel}>Avg Reps</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{analyticsData.progressiveOverload.averageSets}</Text>
              <Text style={styles.metricLabel}>Avg Sets</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderNutritionAnalytics = () => {
    if (!analyticsData) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nutrition Analytics</Text>
        
        {/* Macro Trends */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Macro Trends</Text>
          {Object.entries(analyticsData.macroTrends).map(([macro, data]) => (
            <View key={macro} style={styles.macroItem}>
              <View style={styles.macroHeader}>
                <Text style={styles.macroName}>
                  {macro.charAt(0).toUpperCase() + macro.slice(1)}
                </Text>
                <Text style={styles.macroValues}>
                  {data.current}g / {data.target}g
                </Text>
              </View>
              <View style={styles.macroBar}>
                <View 
                  style={[
                    styles.macroBarFill,
                    { width: `${(data.current / data.target) * 100}%` }
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Calorie Balance */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Calorie Balance</Text>
          <View style={styles.calorieBalance}>
            <View style={styles.calorieItem}>
              <Text style={styles.calorieLabel}>Intake</Text>
              <Text style={styles.calorieValue}>{analyticsData.calorieBalance.intake}</Text>
            </View>
            <View style={styles.calorieItem}>
              <Text style={styles.calorieLabel}>Burn</Text>
              <Text style={styles.calorieValue}>{analyticsData.calorieBalance.burn}</Text>
            </View>
            <View style={styles.calorieItem}>
              <Text style={styles.calorieLabel}>Goal</Text>
              <Text style={styles.calorieValue}>{analyticsData.calorieBalance.goal}</Text>
            </View>
          </View>
        </View>

        {/* Food Choices */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Food Choices</Text>
          <View style={styles.foodChoices}>
            <View style={styles.foodChoiceItem}>
              <View style={styles.foodChoiceBar}>
                <View 
                  style={[
                    styles.foodChoiceBarFill,
                    { width: `${analyticsData.foodChoices.percentage}%` }
                  ]}
                />
              </View>
              <Text style={styles.foodChoiceLabel}>
                {analyticsData.foodChoices.percentage}% On Target
              </Text>
            </View>
            <Text style={styles.foodChoiceDetail}>
              {analyticsData.foodChoices.onTarget} good meals, {analyticsData.foodChoices.offTarget} off target
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderBodyMetrics = () => {
    if (!analyticsData) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Body Metrics</Text>
        
        {Object.entries(analyticsData.bodyMetrics).map(([metric, data]) => (
          <View key={metric} style={styles.card}>
            <Text style={styles.cardTitle}>
              {metric.charAt(0).toUpperCase() + metric.slice(1)}
            </Text>
            <View style={styles.metricRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{data.current}</Text>
                <Text style={styles.metricLabel}>Current</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{data.target}</Text>
                <Text style={styles.metricLabel}>Target</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[
                  styles.metricValue,
                  { color: data.current >= data.target ? '#10b981' : '#ef4444' }
                ]}>
                  {data.current >= data.target ? '✓' : '→'}
                </Text>
                <Text style={styles.metricLabel}>Status</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderHabitsAnalytics = () => {
    if (!analyticsData) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Consistency & Habits</Text>
        
        {/* Streaks */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Streaks</Text>
          <View style={styles.streakRow}>
            <View style={styles.streakItem}>
              <Ionicons name="flame" size={24} color="#f59e0b" />
              <Text style={styles.streakValue}>{analyticsData.streaks.current}</Text>
              <Text style={styles.streakLabel}>Current</Text>
            </View>
            <View style={styles.streakItem}>
              <Ionicons name="trophy-outline" size={24} color="#8b5cf6" />
              <Text style={styles.streakValue}>{analyticsData.streaks.longest}</Text>
              <Text style={styles.streakLabel}>Longest</Text>
            </View>
            <View style={styles.streakItem}>
              <Ionicons name="star-outline" size={24} color="#10b981" />
              <Text style={styles.streakValue}>{analyticsData.streaks.bestWeek}%</Text>
              <Text style={styles.streakLabel}>Best Week</Text>
            </View>
          </View>
        </View>

        {/* Adherence */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Logging Adherence</Text>
          <View style={styles.adherenceRow}>
            <View style={styles.adherenceItem}>
              <Text style={styles.adherenceValue}>{analyticsData.adherence.foodLogging}%</Text>
              <Text style={styles.adherenceLabel}>Food Logging</Text>
            </View>
            <View style={styles.adherenceItem}>
              <Text style={styles.adherenceValue}>{analyticsData.adherence.workoutLogging}%</Text>
              <Text style={styles.adherenceLabel}>Workout Logging</Text>
            </View>
            <View style={styles.adherenceItem}>
              <Text style={styles.adherenceValue}>{analyticsData.adherence.overall}%</Text>
              <Text style={styles.adherenceLabel}>Overall</Text>
            </View>
          </View>
        </View>

        {/* Best/Worst Days */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Best & Worst Days</Text>
          <View style={styles.dayComparison}>
            <View style={styles.dayItem}>
              <Ionicons name="trending-up" size={20} color="#10b981" />
              <Text style={styles.dayName}>{analyticsData.bestWorstDays.bestDay}</Text>
              <Text style={styles.dayScore}>{analyticsData.bestWorstDays.bestDayScore}%</Text>
            </View>
            <View style={styles.dayItem}>
              <Ionicons name="trending-down" size={20} color="#ef4444" />
              <Text style={styles.dayName}>{analyticsData.bestWorstDays.worstDay}</Text>
              <Text style={styles.dayScore}>{analyticsData.bestWorstDays.worstDayScore}%</Text>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            {analyticsData.achievements.map((achievement, index) => (
              <View key={index} style={styles.achievementItem}>
                <Ionicons name="medal-outline" size={20} color="#f59e0b" />
                <Text style={styles.achievementText}>{achievement}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderSmartInsights = () => {
    if (!analyticsData) return null;

    const insights = [
      `You hit your protein target ${analyticsData.macroTrends.protein.current >= analyticsData.macroTrends.protein.target ? 'every day' : 'most days'} this week!`,
      `Your best workout day is ${analyticsData.bestWorstDays.bestDay} - try to replicate that energy on other days.`,
      `You're ${analyticsData.weekComparison.change > 0 ? 'improving' : 'declining'} by ${Math.abs(analyticsData.weekComparison.change)}% compared to last week.`,
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Smart Insights</Text>
        <View style={styles.insightsCard}>
          <Ionicons name="bulb-outline" size={24} color="#f59e0b" />
          <View style={styles.insightsContent}>
            {insights.map((insight, index) => (
              <Text key={index} style={styles.insightText}>
                • {insight}
              </Text>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderSelectedTab = () => {
    switch (selectedTab) {
      case 'overview':
        return (
          <>
            {renderAlignmentOverview()}
            {renderSmartInsights()}
          </>
        );
      case 'workouts':
        return renderWorkoutAnalytics();
      case 'nutrition':
        return renderNutritionAnalytics();
      case 'body':
        return renderBodyMetrics();
      case 'habits':
        return renderHabitsAnalytics();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Track your progress and patterns</Text>
        {onRefresh && (
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#3b82f6" />
          </TouchableOpacity>
        )}
      </View>

      {renderTimeRangeSelector()}
      {renderTabSelector()}
      {renderSelectedTab()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  timeRangeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  timeRangeButtonTextActive: {
    color: '#ffffff',
  },
  tabSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#f1f5f9',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 4,
  },
  tabButtonTextActive: {
    color: '#3b82f6',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  alignmentCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  alignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  alignmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  alignmentTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alignmentTrendText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  alignmentPercentage: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  alignmentSubtext: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  alignmentBreakdown: {
    gap: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownBar: {
    height: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 4,
    marginRight: 12,
    minWidth: 20,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  heatmap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heatmapWeek: {
    flexDirection: 'column',
    gap: 2,
  },
  heatmapDay: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  heatmapLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  distributionChart: {
    gap: 12,
  },
  distributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginRight: 12,
  },
  distributionBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  distributionLabel: {
    fontSize: 14,
    color: '#6b7280',
    minWidth: 80,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  macroItem: {
    marginBottom: 16,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  macroValues: {
    fontSize: 14,
    color: '#6b7280',
  },
  macroBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },
  macroBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  calorieBalance: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  calorieItem: {
    alignItems: 'center',
  },
  calorieLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  calorieValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  foodChoices: {
    alignItems: 'center',
  },
  foodChoiceItem: {
    width: '100%',
    marginBottom: 8,
  },
  foodChoiceBar: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    marginBottom: 8,
  },
  foodChoiceBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 6,
  },
  foodChoiceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  foodChoiceDetail: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  streakItem: {
    alignItems: 'center',
  },
  streakValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  adherenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  adherenceItem: {
    alignItems: 'center',
  },
  adherenceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  adherenceLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  dayComparison: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayItem: {
    alignItems: 'center',
  },
  dayName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
  },
  dayScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    minWidth: '45%',
  },
  achievementText: {
    fontSize: 12,
    color: '#1f2937',
    marginLeft: 6,
  },
  insightsCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  insightsContent: {
    flex: 1,
    marginLeft: 12,
  },
  insightText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
    marginBottom: 8,
  },
});
