import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ComparisonData {
  metric: string;
  currentValue: number;
  previousValue: number;
  change: number; // percentage change
  trend: 'up' | 'down' | 'stable';
  icon: string;
  color: string;
  unit: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  progress?: number; // 0-100 for progress-based achievements
}

interface ComparisonInsightsProps {
  comparisons: ComparisonData[];
  achievements: Achievement[];
  onMetricPress?: (metric: string) => void;
  onAchievementPress?: (achievement: Achievement) => void;
}

export default function ComparisonInsights({
  comparisons,
  achievements,
  onMetricPress,
  onAchievementPress,
}: ComparisonInsightsProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'remove';
    }
  };

  const getTrendColor = (trend: string, change: number) => {
    if (trend === 'up' && change > 0) return '#10b981';
    if (trend === 'down' && change < 0) return '#ef4444';
    return '#6b7280';
  };

  const getChangeLabel = (change: number) => {
    if (change > 0) return `+${change.toFixed(1)}%`;
    if (change < 0) return `${change.toFixed(1)}%`;
    return 'No change';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Comparison & Insights</Text>
      
      {/* Comparison Cards */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.comparisonsContainer}
      >
        {comparisons.map((comparison, index) => {
          const trendColor = getTrendColor(comparison.trend, comparison.change);
          
          return (
            <TouchableOpacity
              key={index}
              style={styles.comparisonCard}
              onPress={() => onMetricPress?.(comparison.metric)}
              activeOpacity={0.7}
            >
              <View style={styles.comparisonHeader}>
                <Ionicons 
                  name={comparison.icon as any} 
                  size={20} 
                  color={comparison.color} 
                />
                <Text style={styles.comparisonTitle}>{comparison.metric}</Text>
              </View>
              
              <View style={styles.comparisonValues}>
                <Text style={styles.currentValue}>
                  {comparison.currentValue.toFixed(0)}{comparison.unit}
                </Text>
                <Text style={styles.previousValue}>
                  vs {comparison.previousValue.toFixed(0)}{comparison.unit}
                </Text>
              </View>
              
              <View style={styles.comparisonTrend}>
                <Ionicons 
                  name={getTrendIcon(comparison.trend) as any} 
                  size={16} 
                  color={trendColor} 
                />
                <Text style={[styles.changeText, { color: trendColor }]}>
                  {getChangeLabel(comparison.change)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Top Performing Metrics */}
      <View style={styles.topMetricsSection}>
        <Text style={styles.subsectionTitle}>Top Performing Metrics</Text>
        <View style={styles.topMetricsList}>
          {comparisons
            .filter(c => c.change > 0)
            .sort((a, b) => b.change - a.change)
            .slice(0, 3)
            .map((metric, index) => (
              <View key={index} style={styles.topMetricItem}>
                <View style={styles.topMetricRank}>
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>
                <View style={styles.topMetricInfo}>
                  <Text style={styles.topMetricName}>{metric.metric}</Text>
                  <Text style={styles.topMetricChange}>
                    Improved by {metric.change.toFixed(1)}%
                  </Text>
                </View>
                <Ionicons 
                  name="trophy-outline" 
                  size={20} 
                  color="#f59e0b" 
                />
              </View>
            ))}
        </View>
      </View>

      {/* Lagging Metrics */}
      <View style={styles.laggingMetricsSection}>
        <Text style={styles.subsectionTitle}>Areas for Improvement</Text>
        <View style={styles.laggingMetricsList}>
          {comparisons
            .filter(c => c.change < 0)
            .sort((a, b) => a.change - b.change)
            .slice(0, 3)
            .map((metric, index) => (
              <View key={index} style={styles.laggingMetricItem}>
                <View style={styles.laggingMetricIcon}>
                  <Ionicons 
                    name={metric.icon as any} 
                    size={16} 
                    color={metric.color} 
                  />
                </View>
                <View style={styles.laggingMetricInfo}>
                  <Text style={styles.laggingMetricName}>{metric.metric}</Text>
                  <Text style={styles.laggingMetricChange}>
                    Down by {Math.abs(metric.change).toFixed(1)}%
                  </Text>
                </View>
                <TouchableOpacity style={styles.improveButton}>
                  <Text style={styles.improveButtonText}>Improve</Text>
                  <Ionicons name="chevron-forward" size={14} color="#3b82f6" />
                </TouchableOpacity>
              </View>
            ))}
        </View>
      </View>

      {/* Achievements */}
      {achievements.length > 0 && (
        <View style={styles.achievementsSection}>
          <Text style={styles.subsectionTitle}>Recent Achievements</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.achievementsContainer}
          >
            {achievements.map((achievement) => (
              <TouchableOpacity
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  { 
                    backgroundColor: achievement.unlocked ? '#f0f9ff' : '#f8fafc',
                    borderColor: achievement.unlocked ? '#3b82f6' : '#e5e7eb'
                  }
                ]}
                onPress={() => onAchievementPress?.(achievement)}
                activeOpacity={0.7}
              >
                <View style={styles.achievementIcon}>
                  <Ionicons 
                    name={achievement.icon as any} 
                    size={24} 
                    color={achievement.color} 
                  />
                </View>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
                {achievement.progress !== undefined && (
                  <View style={styles.achievementProgress}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill,
                          { width: `${achievement.progress}%` }
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>{achievement.progress}%</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  comparisonsContainer: {
    paddingRight: 16,
  },
  comparisonCard: {
    width: 160,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  comparisonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  comparisonValues: {
    marginBottom: 8,
  },
  currentValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  previousValue: {
    fontSize: 12,
    color: '#6b7280',
  },
  comparisonTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  topMetricsSection: {
    marginTop: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  topMetricsList: {
    gap: 8,
  },
  topMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
  },
  topMetricRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  topMetricInfo: {
    flex: 1,
  },
  topMetricName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  topMetricChange: {
    fontSize: 12,
    color: '#10b981',
  },
  laggingMetricsSection: {
    marginTop: 20,
  },
  laggingMetricsList: {
    gap: 8,
  },
  laggingMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
  },
  laggingMetricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  laggingMetricInfo: {
    flex: 1,
  },
  laggingMetricName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  laggingMetricChange: {
    fontSize: 12,
    color: '#ef4444',
  },
  improveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ffffff',
    borderRadius: 6,
  },
  improveButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
    marginRight: 4,
  },
  achievementsSection: {
    marginTop: 20,
  },
  achievementsContainer: {
    paddingRight: 16,
  },
  achievementCard: {
    width: 200,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  achievementProgress: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#6b7280',
  },
});
