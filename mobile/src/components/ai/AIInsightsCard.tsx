import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { aiInsightsService, AIInsight, HealthPattern, HealthRecommendation } from '../../services/aiInsightsService';
import { hapticFeedback } from '../../utils/haptics';
import { COMMON_STYLES } from '../../theme/constants';

interface AIInsightsCardProps {
  onInsightPress?: (insight: AIInsight) => void;
  onRecommendationPress?: (recommendation: HealthRecommendation) => void;
  refreshTrigger?: number;
}

export default function AIInsightsCard({
  onInsightPress,
  onRecommendationPress,
  refreshTrigger = 0,
}: AIInsightsCardProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [patterns, setPatterns] = useState<HealthPattern[]>([]);
  const [recommendations, setRecommendations] = useState<HealthRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'insights' | 'patterns' | 'recommendations'>('insights');

  const loadData = async () => {
    try {
      setLoading(true);
      const [insightsData, patternsData, recommendationsData] = await Promise.all([
        aiInsightsService.getHealthInsights(5),
        aiInsightsService.getHealthPatterns(),
        aiInsightsService.getRecommendations(),
      ]);
      
      setInsights(insightsData || []);
      setPatterns(patternsData || []);
      setRecommendations(Array.isArray(recommendationsData) ? recommendationsData.slice(0, 3) : []);
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
      // Set empty arrays as fallback
      setInsights([]);
      setPatterns([]);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

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
      case 'nutrition': return 'restaurant-outline';
      case 'mood': return 'happy-outline';
      default: return 'bulb-outline';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      case 'neutral': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const handleInsightPress = (insight: AIInsight) => {
    hapticFeedback.light();
    if (onInsightPress) {
      onInsightPress(insight);
    }
  };

  const handleRecommendationPress = (recommendation: HealthRecommendation) => {
    hapticFeedback.light();
    if (onRecommendationPress) {
      onRecommendationPress(recommendation);
    }
  };

  const renderInsight = (insight: AIInsight, index: number) => (
    <TouchableOpacity
      key={insight.id || index}
      style={styles.insightCard}
      onPress={() => handleInsightPress(insight)}
      activeOpacity={0.7}
    >
      <View style={styles.insightHeader}>
        <View style={styles.insightTitleContainer}>
          <Ionicons
            name={getCategoryIcon(insight.category) as keyof typeof Ionicons.glyphMap}
            size={20}
            color={getPriorityColor(insight.priority)}
          />
          <Text style={styles.insightTitle}>{insight.title}</Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(insight.priority) + '20' }]}>
          <Text style={[styles.priorityText, { color: getPriorityColor(insight.priority) }]}>
            {insight.priority}
          </Text>
        </View>
      </View>
      <Text style={styles.insightMessage} numberOfLines={3}>
        {insight.message}
      </Text>
      <View style={styles.insightFooter}>
        <Text style={styles.confidenceText}>
          {insight.confidence}% confidence
        </Text>
        {insight.actionable && (
          <Ionicons name="arrow-forward" size={16} color="#6b7280" />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderPattern = (pattern: HealthPattern, index: number) => (
    <View key={pattern.title || index} style={styles.patternCard}>
      <View style={styles.patternHeader}>
        <View style={styles.patternTitleContainer}>
          <Ionicons
            name="trending-up-outline"
            size={20}
            color={getImpactColor(pattern.impact)}
          />
          <Text style={styles.patternTitle}>{pattern.title}</Text>
        </View>
        <View style={[styles.impactBadge, { backgroundColor: getImpactColor(pattern.impact) + '20' }]}>
          <Text style={[styles.impactText, { color: getImpactColor(pattern.impact) }]}>
            {pattern.impact}
          </Text>
        </View>
      </View>
      <Text style={styles.patternDescription}>{pattern.description}</Text>
      <View style={styles.patternStats}>
        <Text style={styles.statText}>
          {pattern.confidence}% confidence • {pattern.data_points} data points
        </Text>
        <Text style={styles.timeframeText}>{pattern.timeframe}</Text>
      </View>
      {pattern.recommendations && pattern.recommendations.length > 0 && (
        <View style={styles.recommendationsContainer}>
          <Text style={styles.recommendationsTitle}>Recommendations:</Text>
          {pattern.recommendations.slice(0, 2).map((rec, index) => (
            <Text key={index} style={styles.recommendationText}>
              • {rec}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  const renderRecommendation = (recommendation: HealthRecommendation, index: number) => (
    <TouchableOpacity
      key={recommendation.id || index}
      style={styles.recommendationCard}
      onPress={() => handleRecommendationPress(recommendation)}
      activeOpacity={0.7}
    >
      <View style={styles.recommendationHeader}>
        <View style={styles.recommendationTitleContainer}>
          <Ionicons
            name={recommendation.type === 'workout' ? 'fitness-outline' : 'restaurant-outline'}
            size={20}
            color="#3b82f6"
          />
          <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
        </View>
        <View style={[styles.difficultyBadge, { 
          backgroundColor: recommendation.difficulty === 'easy' ? '#10b981' : 
                          recommendation.difficulty === 'medium' ? '#f59e0b' : '#ef4444'
        }]}>
          <Text style={styles.difficultyText}>{recommendation.difficulty}</Text>
        </View>
      </View>
      <Text style={styles.recommendationDescription} numberOfLines={2}>
        {recommendation.description}
      </Text>
      <View style={styles.recommendationFooter}>
        <Text style={styles.timeCommitmentText}>{recommendation.time_commitment}</Text>
        <Text style={styles.impactText}>{recommendation.estimated_impact} impact</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Analyzing your health data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="bulb-outline" size={24} color="#3b82f6" />
          <Text style={styles.headerTitle}>AI Health Insights</Text>
        </View>
        <TouchableOpacity onPress={loadData} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'insights' && styles.activeTab]}
          onPress={() => {
            setActiveTab('insights');
            hapticFeedback.light();
          }}
        >
          <Text style={[styles.tabText, activeTab === 'insights' && styles.activeTabText]}>
            Insights
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'patterns' && styles.activeTab]}
          onPress={() => {
            setActiveTab('patterns');
            hapticFeedback.light();
          }}
        >
          <Text style={[styles.tabText, activeTab === 'patterns' && styles.activeTabText]}>
            Patterns
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recommendations' && styles.activeTab]}
          onPress={() => {
            setActiveTab('recommendations');
            hapticFeedback.light();
          }}
        >
          <Text style={[styles.tabText, activeTab === 'recommendations' && styles.activeTabText]}>
            Tips
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'insights' && (
          <>
            {insights.length > 0 ? (
              insights.map((insight, index) => renderInsight(insight, index))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="bulb-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>No insights yet</Text>
                <Text style={styles.emptySubtext}>Keep logging your activities to get personalized insights</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'patterns' && (
          <>
            {patterns.length > 0 ? (
              patterns.map((pattern, index) => renderPattern(pattern, index))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="trending-up-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>No patterns detected</Text>
                <Text style={styles.emptySubtext}>More data needed to identify patterns</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'recommendations' && (
          <>
            {recommendations.length > 0 ? (
              recommendations.map((recommendation, index) => renderRecommendation(recommendation, index))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="star-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>No recommendations</Text>
                <Text style={styles.emptySubtext}>Keep tracking to get personalized tips</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 8,
  },
  refreshButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COMMON_STYLES.secondaryBackground,
    margin: 16,
    borderRadius: COMMON_STYLES.standardRadius,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
  },
  content: {
    maxHeight: 400,
    paddingHorizontal: 16,
  },
  insightCard: {
    backgroundColor: '#f9fafb',
    borderRadius: COMMON_STYLES.standardRadius,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: COMMON_STYLES.standardRadius,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  insightMessage: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  insightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  patternCard: {
    backgroundColor: '#f9fafb',
    borderRadius: COMMON_STYLES.standardRadius,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patternTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  patternTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: COMMON_STYLES.standardRadius,
  },
  impactText: {
    fontSize: 12,
    fontWeight: '600',
  },
  patternDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  patternStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  timeframeText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  recommendationsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  recommendationsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  recommendationCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: COMMON_STYLES.standardRadius,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: COMMON_STYLES.standardRadius,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  recommendationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeCommitmentText: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
