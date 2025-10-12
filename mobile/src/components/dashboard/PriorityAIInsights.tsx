
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';

import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../../theme/constants';

interface AIInsight {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'nutrition' | 'workout' | 'wellness' | 'goal';
  title: string;
  description: string;
  actionText: string;
  onAction?: () => void;
  progress?: number; // 0-100 for progress-based insights
}

interface PriorityAIInsightsProps {
  insights: AIInsight[];
  onInsightPress?: (insight: AIInsight) => void;
}

export default function PriorityAIInsights({ insights, onInsightPress }: PriorityAIInsightsProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return 'alert-circle';
      case 'medium': return 'information-circle';
      case 'low': return 'checkmark-circle';
      default: return 'help-circle';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'nutrition': return 'restaurant-outline';
      case 'workout': return 'fitness-outline';
      case 'wellness': return 'heart-outline';
      case 'goal': return 'trophy-outline';
      default: return 'bulb-outline';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'nutrition': return '#3b82f6';
      case 'workout': return '#10b981';
      case 'wellness': return '#ef4444';
      case 'goal': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const sortedInsights = insights.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="bulb-outline" size={20} color="#f59e0b" />
        <Text style={styles.title}>Smart Insights</Text>
        <Text style={styles.subtitle}>Personalized recommendations</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.insightsList}
      >
        {sortedInsights.map((insight, index) => (
          <TouchableOpacity
            key={insight.id}
            style={[
              styles.insightCard,
              { borderLeftColor: getPriorityColor(insight.priority) }
            ]}
            onPress={() => onInsightPress?.(insight)}
            activeOpacity={0.7}
          >
            <View style={styles.insightHeader}>
              <View style={styles.insightIconContainer}>
                <Ionicons
                  name={getCategoryIcon(insight.category) as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color={getCategoryColor(insight.category)}
                />
              </View>
              <View style={styles.priorityIndicator}>
                <Ionicons
                  name={getPriorityIcon(insight.priority) as keyof typeof Ionicons.glyphMap}
                  size={14}
                  color={getPriorityColor(insight.priority)}
                />
              </View>
            </View>

            <Text style={styles.insightTitle}>{insight.title}</Text>
            <Text style={styles.insightDescription}>{insight.description}</Text>

            {insight.progress !== undefined && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${insight.progress}%`,
                        backgroundColor: getPriorityColor(insight.priority)
                      }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{insight.progress}%</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: getPriorityColor(insight.priority) + '20' }
              ]}
              onPress={insight.onAction}
            >
              <Text style={[
                styles.actionButtonText,
                { color: getPriorityColor(insight.priority) }
              ]}>
                {insight.actionText}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={getPriorityColor(insight.priority)}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    margin: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginLeft: 8,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
    marginLeft: 8,
    marginTop: 2,
  },
  insightsList: {
    paddingRight: 16,
  },
  insightCard: {
    width: 280,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginRight: 12,
    borderLeftWidth: 4,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIconContainer: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  priorityIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 6,
  },
  insightDescription: {
    fontSize: FONT_SIZE.md,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.gray[200],
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  actionButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginRight: 4,
  },
});
