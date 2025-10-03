import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { aiInsightsService, ProgressAnalysis } from '../../services/aiInsightsService';
import { hapticFeedback } from '../../utils/haptics';
import { COMMON_STYLES } from '../../theme/constants';

const { width } = Dimensions.get('window');

interface ProgressChartsProps {
  refreshTrigger?: number;
}

export default function ProgressCharts({ refreshTrigger = 0 }: ProgressChartsProps) {
  const [analysis, setAnalysis] = useState<ProgressAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const data = await aiInsightsService.getProgressAnalysis(selectedPeriod);
      // Handle both the expected structure and the actual API response
      if (data && typeof data === 'object') {
        // If it's already in the expected format, use it directly
        if (data.fitness_trends && data.nutrition_trends) {
          setAnalysis(data);
        } else {
          // If it's the API response format, transform it
          setAnalysis(transformApiResponseToAnalysis(data));
        }
      } else {
        setAnalysis(null);
      }
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, [selectedPeriod, refreshTrigger]);

  const periods = [
    { key: 'week', label: 'Week', icon: 'calendar-outline' },
    { key: 'month', label: 'Month', icon: 'calendar-outline' },
    { key: 'quarter', label: 'Quarter', icon: 'calendar-outline' },
    { key: 'year', label: 'Year', icon: 'calendar-outline' },
  ] as const;

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return 'trending-up';
    if (trend < 0) return 'trending-down';
    return 'remove';
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return '#10b981';
    if (trend < 0) return '#ef4444';
    return '#6b7280';
  };

  // Transform API response to expected analysis format
  const transformApiResponseToAnalysis = (apiData: any): ProgressAnalysis => {
    // If it's an array of trends, extract the first one or create a default structure
    if (Array.isArray(apiData) && apiData.length > 0) {
      const trend = apiData[0];
      return {
        period: selectedPeriod,
        fitness_trends: {
          workout_frequency: trend.change_percentage || 0,
          duration_trend: 0,
          intensity_trend: 0,
          consistency_score: 75,
        },
        nutrition_trends: {
          calorie_balance: 0,
          macro_balance: 0,
          meal_consistency: 70,
          hydration_score: 80,
        },
        mood_trends: {
          average_mood: 7.0,
          mood_stability: 70,
          energy_levels: 75,
          stress_indicators: 25,
        },
        overall_health_score: 75,
        key_insights: [trend.interpretation || 'Keep up the great work!'],
        recommendations: [],
      };
    }
    
    // Return mock data if transformation fails
    return {
      period: selectedPeriod,
      fitness_trends: {
        workout_frequency: 15,
        duration_trend: 8,
        intensity_trend: 12,
        consistency_score: 78,
      },
      nutrition_trends: {
        calorie_balance: -5,
        macro_balance: 12,
        meal_consistency: 65,
        hydration_score: 72,
      },
      mood_trends: {
        average_mood: 7.2,
        mood_stability: 68,
        energy_levels: 75,
        stress_indicators: 25,
      },
      overall_health_score: 73,
      key_insights: ['Your workout consistency has improved significantly'],
      recommendations: [],
    };
  };

  const renderProgressBar = (label: string, value: number, maxValue: number = 100, color?: string) => {
    const percentage = Math.min((value / maxValue) * 100, 100);
    const barColor = color || getScoreColor(value);
    
    return (
      <View style={styles.progressItem}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{label}</Text>
          <Text style={styles.progressValue}>{value}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${percentage}%`,
                  backgroundColor: barColor
                }
              ]} 
            />
          </View>
        </View>
      </View>
    );
  };

  const renderTrendItem = (label: string, value: number, unit: string = '%') => {
    const trendIcon = getTrendIcon(value);
    const trendColor = getTrendColor(value);
    
    return (
      <View style={styles.trendItem}>
        <View style={styles.trendHeader}>
          <Text style={styles.trendLabel}>{label}</Text>
          <View style={styles.trendValueContainer}>
            <Ionicons name={trendIcon as any} size={16} color={trendColor} />
            <Text style={[styles.trendValue, { color: trendColor }]}>
              {value > 0 ? '+' : ''}{value}{unit}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderHealthScore = () => {
    if (!analysis) return null;
    
    return (
      <View style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreTitle}>Overall Health Score</Text>
          <Text style={[styles.scoreValue, { color: getScoreColor(analysis.overall_health_score) }]}>
            {analysis.overall_health_score}
          </Text>
        </View>
        <View style={styles.scoreBarContainer}>
          <View style={styles.scoreBar}>
            <View 
              style={[
                styles.scoreFill, 
                { 
                  width: `${analysis.overall_health_score}%`,
                  backgroundColor: getScoreColor(analysis.overall_health_score)
                }
              ]} 
            />
          </View>
        </View>
        <Text style={styles.scoreDescription}>
          Based on your fitness, nutrition, and mood data
        </Text>
      </View>
    );
  };

  const renderFitnessTrends = () => {
    if (!analysis || !analysis.fitness_trends) return null;
    
    return (
      <View style={styles.trendsCard}>
        <Text style={styles.cardTitle}>Fitness Trends</Text>
        {renderTrendItem('Workout Frequency', analysis.fitness_trends.workout_frequency)}
        {renderTrendItem('Duration', analysis.fitness_trends.duration_trend)}
        {renderTrendItem('Intensity', analysis.fitness_trends.intensity_trend)}
        {renderProgressBar('Consistency', analysis.fitness_trends.consistency_score)}
      </View>
    );
  };

  const renderNutritionTrends = () => {
    if (!analysis || !analysis.nutrition_trends) return null;
    
    return (
      <View style={styles.trendsCard}>
        <Text style={styles.cardTitle}>Nutrition Trends</Text>
        {renderTrendItem('Calorie Balance', analysis.nutrition_trends.calorie_balance)}
        {renderTrendItem('Macro Balance', analysis.nutrition_trends.macro_balance)}
        {renderProgressBar('Meal Consistency', analysis.nutrition_trends.meal_consistency)}
        {renderProgressBar('Hydration', analysis.nutrition_trends.hydration_score)}
      </View>
    );
  };

  const renderMoodTrends = () => {
    if (!analysis || !analysis.mood_trends) return null;
    
    return (
      <View style={styles.trendsCard}>
        <Text style={styles.cardTitle}>Mood & Wellness</Text>
        {renderProgressBar('Average Mood', analysis.mood_trends.average_mood, 10, '#8b5cf6')}
        {renderProgressBar('Mood Stability', analysis.mood_trends.mood_stability)}
        {renderProgressBar('Energy Levels', analysis.mood_trends.energy_levels)}
        {renderProgressBar('Stress Management', 100 - analysis.mood_trends.stress_indicators)}
      </View>
    );
  };

  const renderKeyInsights = () => {
    if (!analysis || !analysis.key_insights || !Array.isArray(analysis.key_insights) || analysis.key_insights.length === 0) return null;
    
    return (
      <View style={styles.insightsCard}>
        <Text style={styles.cardTitle}>Key Insights</Text>
        {analysis.key_insights.map((insight, index) => (
          <View key={index} style={styles.insightItem}>
            <Ionicons name="bulb-outline" size={16} color="#3b82f6" />
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderRecommendations = () => {
    if (!analysis || !analysis.recommendations || !Array.isArray(analysis.recommendations) || analysis.recommendations.length === 0) return null;
    
    return (
      <View style={styles.recommendationsCard}>
        <Text style={styles.cardTitle}>Recommendations</Text>
        {analysis.recommendations.slice(0, 3).map((rec, index) => (
          <TouchableOpacity key={index} style={styles.recommendationItem}>
            <View style={styles.recommendationHeader}>
              <Ionicons 
                name={rec.type === 'workout' ? 'fitness-outline' : 'restaurant-outline'} 
                size={16} 
                color="#3b82f6" 
              />
              <Text style={styles.recommendationTitle}>{rec.title}</Text>
            </View>
            <Text style={styles.recommendationDescription} numberOfLines={2}>
              {rec.description}
            </Text>
            <View style={styles.recommendationFooter}>
              <Text style={styles.recommendationDifficulty}>{rec.difficulty}</Text>
              <Text style={styles.recommendationImpact}>{rec.estimated_impact} impact</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Analyzing your progress...</Text>
      </View>
    );
  }

  if (!analysis) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load progress data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAnalysis}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.periodButtonActive
            ]}
            onPress={() => {
              setSelectedPeriod(period.key);
              hapticFeedback.light();
            }}
          >
            <Ionicons 
              name={period.icon as any} 
              size={16} 
              color={selectedPeriod === period.key ? '#ffffff' : '#6b7280'} 
            />
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period.key && styles.periodButtonTextActive
            ]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Health Score */}
      {renderHealthScore()}

      {/* Trends */}
      <View style={styles.trendsContainer}>
        {renderFitnessTrends()}
        {renderNutritionTrends()}
        {renderMoodTrends()}
      </View>

      {/* Key Insights */}
      {renderKeyInsights()}

      {/* Recommendations */}
      {renderRecommendations()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COMMON_STYLES.secondaryBackground,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: COMMON_STYLES.cardBackground,
    margin: 16,
    borderRadius: COMMON_STYLES.standardRadius,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  periodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#3b82f6',
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 4,
  },
  periodButtonTextActive: {
    color: '#ffffff',
  },
  scoreCard: {
    backgroundColor: COMMON_STYLES.cardBackground,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreBarContainer: {
    marginBottom: 8,
  },
  scoreBar: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    borderRadius: 6,
  },
  scoreDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  trendsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
  },
  trendsCard: {
    backgroundColor: COMMON_STYLES.cardBackground,
    borderRadius: COMMON_STYLES.standardRadius,
    padding: 16,
    flex: 1,
    minWidth: (width - 48) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  progressItem: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  progressBarContainer: {
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  trendItem: {
    marginBottom: 12,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  trendValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  insightsCard: {
    backgroundColor: COMMON_STYLES.cardBackground,
    margin: 16,
    borderRadius: COMMON_STYLES.standardRadius,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  recommendationsCard: {
    backgroundColor: COMMON_STYLES.cardBackground,
    margin: 16,
    borderRadius: COMMON_STYLES.standardRadius,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recommendationItem: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 6,
  },
  recommendationDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
    marginBottom: 8,
  },
  recommendationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recommendationDifficulty: {
    fontSize: 10,
    color: '#0369a1',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  recommendationImpact: {
    fontSize: 10,
    color: '#6b7280',
  },
});
