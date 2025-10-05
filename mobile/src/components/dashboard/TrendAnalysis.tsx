import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TrendMetric {
  id: string;
  type: 'workout' | 'nutrition' | 'weight' | 'mood';
  title: string;
  currentValue: number;
  previousValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  changePercent: number;
  icon: string;
  color: string;
  period: 'week' | 'month' | 'quarter';
}

interface TrendAnalysisProps {
  metrics?: TrendMetric[];
  onMetricPress?: (metric: TrendMetric) => void;
  onViewDetails?: (metric: TrendMetric) => void;
  onViewAll?: () => void;
  style?: any;
}

const defaultMetrics: TrendMetric[] = [
  {
    id: 'workout_frequency',
    type: 'workout',
    title: 'Workout Frequency',
    currentValue: 5,
    previousValue: 3,
    unit: 'times/week',
    trend: 'up',
    change: 2,
    changePercent: 67,
    icon: 'fitness',
    color: '#3b82f6',
    period: 'week',
  },
  {
    id: 'calorie_intake',
    type: 'nutrition',
    title: 'Calorie Intake',
    currentValue: 2100,
    previousValue: 1950,
    unit: 'cal/day',
    trend: 'up',
    change: 150,
    changePercent: 8,
    icon: 'flame',
    color: '#ef4444',
    period: 'week',
  },
  {
    id: 'weight_change',
    type: 'weight',
    title: 'Weight Change',
    currentValue: 70.5,
    previousValue: 71.2,
    unit: 'kg',
    trend: 'down',
    change: -0.7,
    changePercent: -1,
    icon: 'scale',
    color: '#10b981',
    period: 'month',
  },
  {
    id: 'mood_score',
    type: 'mood',
    title: 'Mood Score',
    currentValue: 8.2,
    previousValue: 7.8,
    unit: '/10',
    trend: 'up',
    change: 0.4,
    changePercent: 5,
    icon: 'happy',
    color: '#f59e0b',
    period: 'week',
  },
];

export default function TrendAnalysis({
  metrics = defaultMetrics,
  onMetricPress,
  onViewDetails,
  onViewAll,
  style,
}: TrendAnalysisProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      case 'stable': return 'remove';
      default: return 'help';
    }
  };

  const getTrendColor = (trend: string, type: string) => {
    if (trend === 'stable') return '#6b7280';
    
    // For weight, down is good (green), up is bad (red)
    if (type === 'weight') {
      return trend === 'down' ? '#10b981' : '#ef4444';
    }
    
    // For other metrics, up is generally good (green), down is bad (red)
    return trend === 'up' ? '#10b981' : '#ef4444';
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'cal/day') {
      return Math.round(value).toLocaleString();
    }
    if (unit === 'kg') {
      return value.toFixed(1);
    }
    if (unit === '/10') {
      return value.toFixed(1);
    }
    return value.toString();
  };

  const formatChange = (change: number, changePercent: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)} (${sign}${changePercent}%)`;
  };


  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="trending-up" size={20} color="#3b82f6" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Trend Analysis</Text>
            <Text style={styles.subtitle}>Track your progress over time</Text>
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
        contentContainerStyle={styles.metricsContainer}
      >
        {metrics.map((metric) => {
          const trendIcon = getTrendIcon(metric.trend);
          const trendColor = getTrendColor(metric.trend, metric.type);

          return (
            <TouchableOpacity
              key={metric.id}
              style={[styles.metricCard, { borderLeftColor: metric.color }]}
              onPress={() => onMetricPress?.(metric)}
              activeOpacity={0.7}
            >
              <View style={styles.metricHeader}>
                <View style={[styles.metricIcon, { backgroundColor: metric.color + '20' }]}>
                  <Ionicons name={metric.icon as any} size={20} color={metric.color} />
                </View>
                
                <View style={styles.metricInfo}>
                  <Text style={styles.metricTitle}>{metric.title}</Text>
                  <Text style={styles.metricPeriod}>
                    {metric.period === 'week' ? 'This week' : 
                     metric.period === 'month' ? 'This month' : 'This quarter'}
                  </Text>
                </View>
              </View>

              <View style={styles.metricValues}>
                <View style={styles.currentValue}>
                  <Text style={[styles.valueNumber, { color: metric.color }]}>
                    {metric.currentValue}
                  </Text>
                  <Text style={styles.valueUnit}>{metric.unit}</Text>
                </View>

                <View style={styles.trendInfo}>
                  <View style={styles.trendIndicator}>
                    <Ionicons 
                      name={trendIcon as any} 
                      size={16} 
                      color={trendColor} 
                    />
                    <Text style={[styles.trendText, { color: trendColor }]}>
                      {metric.changePercent}%
                    </Text>
                  </View>
                  <Text style={styles.trendLabel}>
                    {metric.change > 0 ? '+' : ''}{metric.change} vs last {metric.period}
                  </Text>
                </View>
              </View>
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
  metricsContainer: {
    gap: 16,
  },
  metricCard: {
    width: 200,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  metricInfo: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  metricPeriod: {
    fontSize: 12,
    color: '#6b7280',
  },
  detailsButton: {
    padding: 4,
  },
  metricValues: {
    gap: 8,
  },
  currentValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  valueText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  unitText: {
    fontSize: 14,
    color: '#6b7280',
  },
  trendContainer: {
    gap: 4,
  },
  trendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  previousValue: {
    fontSize: 12,
    color: '#9ca3af',
  },
  valueNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  valueUnit: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  trendLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});
