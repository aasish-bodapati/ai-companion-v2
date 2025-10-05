import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UnifiedProgressRing } from './UnifiedProgressRing';
import { COMMON_STYLES } from '../../theme/constants';

interface ProgressCardProps {
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
}

export default function ProgressCard({
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
}: ProgressCardProps) {
  const progress = Math.min(current / goal, 1);
  const percentage = Math.round(progress * 100);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: 12,
          ringSize: 60,
          titleSize: 12,
          valueSize: 16,
          iconSize: 16,
        };
      case 'large':
        return {
          padding: 20,
          ringSize: 80,
          titleSize: 16,
          valueSize: 20,
          iconSize: 24,
        };
      default: // medium
        return {
          padding: 16,
          ringSize: 70,
          titleSize: 14,
          valueSize: 18,
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

  const sizeStyles = getSizeStyles();

  const CardContent = () => (
    <View style={[styles.container, { padding: sizeStyles.padding }]}>
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

      <View style={styles.content}>
        <UnifiedProgressRing
          progress={progress}
          goal={goal}
          current={current}
          label={unit}
          color={color}
          size={sizeStyles.ringSize}
          showIcon={false}
          variant="ui"
        />
        
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
    backgroundColor: COMMON_STYLES.cardBackground,
    borderRadius: COMMON_STYLES.largeRadius,
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stats: {
    flex: 1,
    marginLeft: 16,
  },
  statItem: {
    alignItems: 'center',
    marginBottom: 8,
    minWidth: 50,
  },
  statValue: {
    fontWeight: 'bold',
    color: '#1f2937',
    lineHeight: 1,
    fontSize: 12,
  },
  statLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  motivation: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    textAlign: 'center',
  },
});
