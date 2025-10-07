import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COMMON_STYLES } from '../../theme/constants';

const { width } = Dimensions.get('window');

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  backgroundColor?: string;
  onPress?: () => void;
  children?: React.ReactNode;
  style?: object;
}

export default function EnhancedAnalyticsCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  iconColor = '#3b82f6',
  backgroundColor = '#ffffff',
  onPress,
  children,
  style,
}: AnalyticsCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      case 'stable':
        return 'trending-flat';
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '#6b7280';
    switch (trend.direction) {
      case 'up':
        return '#10b981';
      case 'down':
        return '#ef4444';
      case 'stable':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const CardContent = () => (
    <View style={[styles.container, { backgroundColor }, style]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {icon && (
            <Ionicons name={icon} size={20} color={iconColor} style={styles.icon} />
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
        {trend && (
          <View style={styles.trendContainer}>
            <Ionicons
              name={getTrendIcon() as keyof typeof Ionicons.glyphMap}
              size={16}
              color={getTrendColor()}
            />
            <Text style={[styles.trendText, { color: getTrendColor() }]}>
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </Text>
          </View>
        )}
      </View>

      <View style={styles.valueContainer}>
        <Text style={styles.value}>{value}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {children && <View style={styles.childrenContainer}>{children}</View>}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: COMMON_STYLES.standardRadius,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 12,
    height: 100,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
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
  valueContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  childrenContainer: {
    marginTop: 8,
  },
});
