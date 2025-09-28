import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, MIXINS, SHADOWS } from '../../theme/constants';
import { hapticFeedback } from '../../utils/haptics';

interface StatItem {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
}

interface StatsCardProps {
  title: string;
  icon?: string;
  iconColor?: string;
  stats: StatItem[];
  onPress?: () => void;
  
  // Progress indicator
  progress?: {
    current: number;
    target: number;
    label?: string;
    color?: string;
  };
  
  // Achievement indicator
  achievement?: {
    reached: boolean;
    message: string;
    icon?: string;
  };
  
  // Styling
  variant?: 'default' | 'compact' | 'detailed';
  backgroundColor?: string;
  style?: any;
}

export default function StatsCard({
  title,
  icon,
  iconColor = COLORS.primary,
  stats,
  onPress,
  progress,
  achievement,
  variant = 'default',
  backgroundColor = COLORS.background.primary,
  style,
}: StatsCardProps) {

  const handlePress = () => {
    if (onPress) {
      hapticFeedback.light();
      onPress();
    }
  };

  const getTrendIcon = (trend: StatItem['trend']) => {
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

  const getTrendColor = (trend: StatItem['trend']) => {
    if (!trend) return COLORS.text.secondary;
    switch (trend.direction) {
      case 'up':
        return COLORS.success;
      case 'down':
        return COLORS.danger;
      case 'stable':
        return COLORS.text.secondary;
      default:
        return COLORS.text.secondary;
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        {icon && (
          <Ionicons 
            name={icon as any} 
            size={20} 
            color={iconColor}
            style={styles.titleIcon}
          />
        )}
        <Text style={styles.title}>{title}</Text>
      </View>
      {onPress && (
        <Ionicons 
          name="chevron-forward" 
          size={16} 
          color={COLORS.text.secondary}
        />
      )}
    </View>
  );

  const renderStat = (stat: StatItem, index: number) => {
    const isCompact = variant === 'compact';
    
    return (
      <View 
        key={index} 
        style={[
          styles.statItem,
          isCompact && styles.compactStatItem,
          stats.length > 2 && styles.gridStatItem
        ]}
      >
        <Text 
          style={[
            styles.statValue,
            isCompact && styles.compactStatValue,
            stat.color && { color: stat.color }
          ]}
        >
          {stat.value}
          {stat.unit && (
            <Text style={styles.statUnit}>{stat.unit}</Text>
          )}
        </Text>
        
        <View style={styles.statLabelContainer}>
          <Text style={[styles.statLabel, isCompact && styles.compactStatLabel]}>
            {stat.label}
          </Text>
          
          {stat.trend && (
            <View style={styles.trendContainer}>
              <Ionicons
                name={getTrendIcon(stat.trend) as any}
                size={12}
                color={getTrendColor(stat.trend)}
              />
              <Text style={[styles.trendText, { color: getTrendColor(stat.trend) }]}>
                {stat.trend.value > 0 ? '+' : ''}{stat.trend.value}%
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderStats = () => {
    const isGrid = stats.length > 2;
    
    return (
      <View style={[styles.statsContainer, isGrid && styles.statsGrid]}>
        {stats.map(renderStat)}
      </View>
    );
  };

  const renderProgress = () => {
    if (!progress) return null;
    
    const percentage = Math.min((progress.current / progress.target) * 100, 100);
    const isComplete = percentage >= 100;
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            {progress.label || 'Progress'}
          </Text>
          <Text style={styles.progressText}>
            {progress.current} / {progress.target}
          </Text>
        </View>
        
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${percentage}%`,
                backgroundColor: progress.color || (isComplete ? COLORS.success : COLORS.primary),
              },
            ]}
          />
        </View>
        
        <Text style={styles.progressPercentage}>
          {percentage.toFixed(0)}% Complete
        </Text>
      </View>
    );
  };

  const renderAchievement = () => {
    if (!achievement) return null;
    
    return (
      <View style={styles.achievementContainer}>
        <Ionicons 
          name={achievement.icon as any || 'trophy'} 
          size={16} 
          color={COLORS.success}
        />
        <Text style={styles.achievementText}>
          {achievement.message}
        </Text>
      </View>
    );
  };

  const getCardStyle = () => {
    return [
      styles.card,
      variant === 'compact' && styles.compactCard,
      { backgroundColor },
      style,
    ];
  };

  const CardContent = () => (
    <View style={getCardStyle()}>
      {renderHeader()}
      {renderStats()}
      {renderProgress()}
      {achievement?.reached && renderAchievement()}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
}

const styles = StyleSheet.create({
  card: {
    ...MIXINS.card,
    marginBottom: SPACING.lg,
  },
  
  compactCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  
  header: {
    ...MIXINS.rowSpaceBetween,
    marginBottom: SPACING.md,
  },
  
  titleContainer: {
    ...MIXINS.row,
    flex: 1,
  },
  
  titleIcon: {
    marginRight: SPACING.sm,
  },
  
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
  },
  
  // Stats styles
  statsContainer: {
    gap: SPACING.lg,
  },
  
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: SPACING.md,
  },
  
  statItem: {
    alignItems: 'center',
  },
  
  compactStatItem: {
    alignItems: 'flex-start',
  },
  
  gridStatItem: {
    minWidth: '30%',
    alignItems: 'center',
  },
  
  statValue: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  compactStatValue: {
    fontSize: FONT_SIZE.xl,
    marginBottom: SPACING.xs,
  },
  
  statUnit: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '400',
    color: COLORS.text.secondary,
  },
  
  statLabelContainer: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  
  statLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  
  compactStatLabel: {
    fontSize: FONT_SIZE.xs,
    textAlign: 'left',
  },
  
  trendContainer: {
    ...MIXINS.row,
    gap: SPACING.xs,
  },
  
  trendText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  
  // Progress styles
  progressContainer: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  
  progressHeader: {
    ...MIXINS.rowSpaceBetween,
  },
  
  progressLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  
  progressText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
  },
  
  progressBar: {
    height: 8,
    backgroundColor: COLORS.gray[200],
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },
  
  progressPercentage: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  
  // Achievement styles
  achievementContainer: {
    ...MIXINS.row,
    justifyContent: 'center',
    backgroundColor: COLORS.success + '15',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  
  achievementText: {
    color: COLORS.success,
    fontWeight: '600',
    fontSize: FONT_SIZE.sm,
  },
});
