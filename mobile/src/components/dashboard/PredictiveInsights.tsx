import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PredictiveInsight {
  id: string;
  title: string;
  description: string;
  type: 'workout' | 'nutrition' | 'wellness' | 'goal';
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  action?: string;
  icon: string;
  color: string;
}

interface PredictiveInsightsProps {
  insights?: PredictiveInsight[];
  onInsightPress?: (insight: PredictiveInsight) => void;
  onViewAll?: () => void;
  style?: any;
}

const defaultInsights: PredictiveInsight[] = [
  {
    id: 'workout_timing',
    title: 'Optimal Workout Time',
    description: 'Based on your patterns, 6-7 PM is your most effective workout window',
    type: 'workout',
    confidence: 85,
    priority: 'high',
    action: 'Schedule workout',
    icon: 'time',
    color: '#3b82f6',
  },
  {
    id: 'protein_intake',
    title: 'Protein Boost Needed',
    description: 'Your protein intake is 20% below target. Consider adding a protein snack',
    type: 'nutrition',
    confidence: 92,
    priority: 'medium',
    action: 'Log protein snack',
    icon: 'nutrition',
    color: '#10b981',
  },
  {
    id: 'recovery_day',
    title: 'Recovery Day Recommended',
    description: 'Your body shows signs of fatigue. A rest day will improve performance',
    type: 'wellness',
    confidence: 78,
    priority: 'high',
    action: 'Plan rest day',
    icon: 'bed',
    color: '#8b5cf6',
  },
  {
    id: 'goal_progress',
    title: 'Goal Achievement Likely',
    description: 'At current pace, you\'ll reach your monthly goal 3 days early',
    type: 'goal',
    confidence: 88,
    priority: 'low',
    action: 'View progress',
    icon: 'trophy',
    color: '#f59e0b',
  },
];

export default function PredictiveInsights({
  insights = defaultInsights,
  onInsightPress,
  onViewAll,
  style,
}: PredictiveInsightsProps) {
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


  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="bulb" size={20} color="#3b82f6" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>AI Insights</Text>
            <Text style={styles.subtitle}>Personalized recommendations</Text>
          </View>
        </View>
        {onViewAll && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onViewAll}
            activeOpacity={0.7}
          >
            <Text style={styles.actionText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.insightsContainer}
      >
        {insights.map((insight) => {
          const priorityColor = getPriorityColor(insight.priority);
          const priorityIcon = getPriorityIcon(insight.priority);

          return (
            <TouchableOpacity
              key={insight.id}
              style={[styles.insightCard, { borderLeftColor: insight.color }]}
              onPress={() => onInsightPress?.(insight)}
              activeOpacity={0.7}
            >
              <View style={styles.insightHeader}>
                <View style={[styles.insightIcon, { backgroundColor: insight.color + '20' }]}>
                  <Ionicons name={insight.icon as any} size={20} color={insight.color} />
                </View>
                
                <View style={styles.insightInfo}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightDescription}>{insight.description}</Text>
                </View>
                
                <View style={styles.insightMeta}>
                  <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
                    <Ionicons name={priorityIcon as any} size={12} color={priorityColor} />
                  </View>
                  <Text style={styles.confidenceText}>{insight.confidence}%</Text>
                </View>
              </View>
              
              {insight.action && (
                <View style={styles.actionContainer}>
                  <TouchableOpacity
                    style={[styles.primaryActionButton, { backgroundColor: insight.color }]}
                    onPress={() => onInsightPress?.(insight)}
                  >
                    <Text style={styles.actionText}>{insight.action}</Text>
                    <Ionicons name="arrow-forward" size={14} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  insightsContainer: {
    gap: 16,
  },
  insightCard: {
    width: 280,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  insightInfo: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  insightMeta: {
    alignItems: 'center',
    gap: 4,
  },
  priorityBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confidenceText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  actionContainer: {
    marginTop: 8,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
});
