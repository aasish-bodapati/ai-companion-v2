import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COMMON_STYLES } from '../../theme/constants';

const { width } = Dimensions.get('window');

interface ProgressLineChartProps {
  title: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
  icon: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  data?: number[]; // Optional data points for the line
}

export default function ProgressLineChart({
  title,
  current,
  goal,
  unit,
  color,
  icon,
  trend,
  trendValue,
  onPress,
  size = 'medium',
  data = [],
}: ProgressLineChartProps) {
  const progress = Math.min(current / goal, 1);
  const percentage = Math.round(progress * 100);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: 12,
          height: 120,
          titleSize: 12,
          valueSize: 16,
          iconSize: 16,
        };
      case 'large':
        return {
          padding: 28,
          height: 350,
          titleSize: 20,
          valueSize: 32,
          iconSize: 32,
        };
      default: // medium
        return {
          padding: 16,
          height: 140,
          titleSize: 14,
          valueSize: 20,
          iconSize: 20,
        };
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'remove';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return '#10b981';
      case 'down': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getMotivationalText = () => {
    if (progress >= 1) return 'Goal achieved! 🎉';
    if (progress >= 0.8) return 'Almost there! 💪';
    if (progress >= 0.5) return 'Great progress! 🌟';
    if (progress > 0) return 'Keep going! 🚀';
    return 'Let\'s start! 💫';
  };

  // Generate sample data if none provided
  const chartData = data.length > 0 ? data : Array.from({ length: 7 }, (_, i) => {
    const baseValue = current * 0.3;
    const variation = Math.sin(i * 0.5) * baseValue * 0.3;
    return Math.max(0, baseValue + variation);
  });

  const maxValue = Math.max(...chartData, goal);
  const chartHeight = 160;
  const chartWidth = 280;

  const sizeStyles = getSizeStyles();

  const CardContent = () => (
    <View style={[styles.container, { padding: sizeStyles.padding, height: sizeStyles.height }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons 
            name={icon as any} 
            size={sizeStyles.iconSize} 
            color={color} 
            style={styles.icon}
          />
          <Text style={[styles.title, { fontSize: sizeStyles.titleSize }]}>
            {title}
          </Text>
        </View>
        
        {trend && trendValue && (
          <View style={styles.trendContainer}>
            <Ionicons 
              name={getTrendIcon() as any} 
              size={14} 
              color={getTrendColor()} 
            />
            <Text style={[styles.trendText, { color: getTrendColor() }]}>
              {trendValue}%
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Chart */}
        <View style={styles.chartContainer}>
          <View style={[styles.chart, { width: chartWidth, height: chartHeight }]}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((percent, index) => (
              <View
                key={index}
                style={[
                  styles.gridLine,
                  {
                    top: percent * chartHeight,
                    opacity: 0.2,
                  },
                ]}
              />
            ))}
            
            {/* Data line */}
            <View style={styles.lineContainer}>
              {chartData.map((value, index) => {
                if (index === 0) return null;
                
                const x1 = ((index - 1) / (chartData.length - 1)) * chartWidth;
                const y1 = chartHeight - (chartData[index - 1] / maxValue) * chartHeight;
                const x2 = (index / (chartData.length - 1)) * chartWidth;
                const y2 = chartHeight - (value / maxValue) * chartHeight;
                
                const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
                const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
                
                return (
                  <View
                    key={index}
                    style={[
                      styles.line,
                      {
                        left: x1,
                        top: y1,
                        width: length,
                        height: 3,
                        backgroundColor: color,
                        transform: [{ rotate: `${angle}deg` }],
                      },
                    ]}
                  />
                );
              })}
              
              {/* Data points */}
              {chartData.map((value, index) => {
                const x = (index / (chartData.length - 1)) * chartWidth;
                const y = chartHeight - (value / maxValue) * chartHeight;
                
                return (
                  <View
                    key={index}
                    style={[
                      styles.dataPoint,
                      {
                        left: x - 4,
                        top: y - 4,
                        backgroundColor: color,
                      },
                    ]}
                  />
                );
              })}
            </View>
            
            {/* Goal line */}
            <View
              style={[
                styles.goalLine,
                {
                  top: chartHeight - (goal / maxValue) * chartHeight,
                  backgroundColor: color + '40',
                },
              ]}
            />
          </View>
        </View>
        
        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { fontSize: sizeStyles.valueSize }]}>
              {current}
            </Text>
            <Text style={styles.statLabel}>Current</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { fontSize: sizeStyles.valueSize }]}>
              {goal}
            </Text>
            <Text style={styles.statLabel}>Goal</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { fontSize: sizeStyles.valueSize }]}>
              {percentage}%
            </Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.motivation}>{getMotivationalText()}</Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
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
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartContainer: {
    marginRight: 16,
  },
  chart: {
    position: 'relative',
    backgroundColor: COMMON_STYLES.secondaryBackground,
    borderRadius: COMMON_STYLES.smallRadius,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  lineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  line: {
    position: 'absolute',
    borderRadius: 1.5,
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
  stats: {
    flex: 1,
  },
  statItem: {
    alignItems: 'center',
    marginBottom: 8,
    minWidth: 50,
  },
  statValue: {
    fontWeight: 'bold',
    color: '#1f2937',
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
  },
  motivation: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    textAlign: 'center',
  },
});
