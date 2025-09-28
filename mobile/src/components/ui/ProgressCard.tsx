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

interface ProgressItem {
  label: string;
  current: number;
  target: number;
  unit?: string;
  color?: string;
  icon?: string;
}

interface Milestone {
  label: string;
  target: number;
  achieved: boolean;
  icon?: string;
  color?: string;
}

interface ProgressCardProps {
  title: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  
  // Progress data
  progressItems: ProgressItem[];
  
  // Milestones
  milestones?: Milestone[];
  
  // Overall progress
  overallProgress?: {
    current: number;
    target: number;
    label: string;
    color?: string;
  };
  
  // Time period
  timePeriod?: {
    label: string;
    startDate: Date;
    endDate: Date;
  };
  
  // Actions
  onPress?: () => void;
  actionLabel?: string;
  actionIcon?: string;
  
  // Styling
  variant?: 'default' | 'compact' | 'detailed';
  backgroundColor?: string;
  style?: any;
  
  // Display options
  showPercentages?: boolean;
  showMilestones?: boolean;
  showTimeRemaining?: boolean;
}

export default function ProgressCard({
  title,
  subtitle,
  icon,
  iconColor = COLORS.primary,
  progressItems,
  milestones = [],
  overallProgress,
  timePeriod,
  onPress,
  actionLabel,
  actionIcon,
  variant = 'default',
  backgroundColor = COLORS.background.primary,
  style,
  showPercentages = true,
  showMilestones = true,
  showTimeRemaining = true,
}: ProgressCardProps) {

  const handlePress = () => {
    if (onPress) {
      hapticFeedback.light();
      onPress();
    }
  };

  const calculateProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (progress: number, color?: string) => {
    if (color) return color;
    if (progress >= 100) return COLORS.success;
    if (progress >= 75) return COLORS.primary;
    if (progress >= 50) return COLORS.warning;
    return COLORS.danger;
  };

  const getTimeRemaining = () => {
    if (!timePeriod) return null;
    
    const now = new Date();
    const totalDays = Math.ceil((timePeriod.endDate.getTime() - timePeriod.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((now.getTime() - timePeriod.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, totalDays - daysPassed);
    
    return {
      daysRemaining,
      totalDays,
      percentage: Math.min((daysPassed / totalDays) * 100, 100),
    };
  };

  const renderProgressItem = (item: ProgressItem, index: number) => {
    const progress = calculateProgress(item.current, item.target);
    const color = getProgressColor(progress, item.color);
    
    return (
      <View key={index} style={styles.progressItem}>
        <View style={styles.progressHeader}>
          <View style={styles.progressLabelContainer}>
            {item.icon && (
              <Ionicons 
                name={item.icon as any} 
                size={16} 
                color={color}
                style={styles.progressIcon}
              />
            )}
            <Text style={styles.progressLabel}>{item.label}</Text>
          </View>
          {showPercentages && (
            <Text style={[styles.progressPercentage, { color }]}>
              {progress.toFixed(0)}%
            </Text>
          )}
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: color,
                },
              ]}
            />
          </View>
        </View>
        
        <View style={styles.progressValues}>
          <Text style={[styles.progressCurrent, { color }]}>
            {item.current}{item.unit}
          </Text>
          <Text style={styles.progressTarget}>
            / {item.target}{item.unit}
          </Text>
        </View>
      </View>
    );
  };

  const renderMilestone = (milestone: Milestone, index: number) => {
    const color = milestone.color || (milestone.achieved ? COLORS.success : COLORS.text.tertiary);
    
    return (
      <View key={index} style={styles.milestone}>
        <Ionicons 
          name={milestone.icon as any || (milestone.achieved ? 'checkmark-circle' : 'ellipse-outline')} 
          size={16} 
          color={color}
        />
        <Text style={[styles.milestoneText, { color }]}>
          {milestone.label}
        </Text>
        <Text style={[styles.milestoneTarget, { color }]}>
          {milestone.target}
        </Text>
      </View>
    );
  };

  const renderOverallProgress = () => {
    if (!overallProgress) return null;
    
    const progress = calculateProgress(overallProgress.current, overallProgress.target);
    const color = getProgressColor(progress, overallProgress.color);
    
    return (
      <View style={styles.overallProgress}>
        <View style={styles.overallProgressHeader}>
          <Text style={styles.overallProgressLabel}>{overallProgress.label}</Text>
          <Text style={[styles.overallProgressPercentage, { color }]}>
            {progress.toFixed(0)}%
          </Text>
        </View>
        
        <View style={styles.overallProgressBar}>
          <View
            style={[
              styles.overallProgressFill,
              {
                width: `${progress}%`,
                backgroundColor: color,
              },
            ]}
          />
        </View>
        
        <Text style={styles.overallProgressText}>
          {overallProgress.current} / {overallProgress.target}
        </Text>
      </View>
    );
  };

  const renderTimeRemaining = () => {
    const timeData = getTimeRemaining();
    if (!timeData || !showTimeRemaining) return null;
    
    return (
      <View style={styles.timeRemaining}>
        <Ionicons name="time-outline" size={16} color={COLORS.text.secondary} />
        <Text style={styles.timeRemainingText}>
          {timeData.daysRemaining} days remaining
        </Text>
        <Text style={styles.timeRemainingSubtext}>
          ({timeData.percentage.toFixed(0)}% complete)
        </Text>
      </View>
    );
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
        <View style={styles.titleTextContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      
      {(onPress || actionLabel) && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handlePress}
        >
          {actionIcon && (
            <Ionicons 
              name={actionIcon as any} 
              size={16} 
              color={COLORS.primary}
              style={styles.actionIcon}
            />
          )}
          {actionLabel && (
            <Text style={styles.actionText}>{actionLabel}</Text>
          )}
          {!actionLabel && (
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={COLORS.text.tertiary}
            />
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  const getCardStyle = () => {
    return [
      styles.card,
      variant === 'compact' && styles.compactCard,
      variant === 'detailed' && styles.detailedCard,
      { backgroundColor },
      style,
    ];
  };

  const CardContent = () => (
    <View style={getCardStyle()}>
      {renderHeader()}
      
      {renderOverallProgress()}
      
      <View style={styles.progressItems}>
        {progressItems.map(renderProgressItem)}
      </View>
      
      {showMilestones && milestones.length > 0 && (
        <View style={styles.milestones}>
          <Text style={styles.milestonesTitle}>Milestones</Text>
          {milestones.map(renderMilestone)}
        </View>
      )}
      
      {renderTimeRemaining()}
    </View>
  );

  if (onPress && !actionLabel) {
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
  
  detailedCard: {
    padding: SPACING.xl,
  },
  
  header: {
    ...MIXINS.rowSpaceBetween,
    marginBottom: SPACING.lg,
  },
  
  titleContainer: {
    ...MIXINS.row,
    flex: 1,
  },
  
  titleIcon: {
    marginRight: SPACING.sm,
  },
  
  titleTextContainer: {
    flex: 1,
  },
  
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
  },
  
  actionButton: {
    ...MIXINS.row,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  
  actionIcon: {
    marginRight: SPACING.xs,
  },
  
  actionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  // Overall progress styles
  overallProgress: {
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
  },
  
  overallProgressHeader: {
    ...MIXINS.rowSpaceBetween,
    marginBottom: SPACING.sm,
  },
  
  overallProgressLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  
  overallProgressPercentage: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  
  overallProgressBar: {
    height: 8,
    backgroundColor: COLORS.gray[200],
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  
  overallProgressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },
  
  overallProgressText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  
  // Progress items styles
  progressItems: {
    gap: SPACING.lg,
  },
  
  progressItem: {
    marginBottom: SPACING.md,
  },
  
  progressHeader: {
    ...MIXINS.rowSpaceBetween,
    marginBottom: SPACING.sm,
  },
  
  progressLabelContainer: {
    ...MIXINS.row,
    flex: 1,
  },
  
  progressIcon: {
    marginRight: SPACING.xs,
  },
  
  progressLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  
  progressPercentage: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  
  progressBarContainer: {
    marginBottom: SPACING.xs,
  },
  
  progressBar: {
    height: 6,
    backgroundColor: COLORS.gray[200],
    borderRadius: BORDER_RADIUS.sm,
  },
  
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },
  
  progressValues: {
    ...MIXINS.row,
    gap: SPACING.xs,
  },
  
  progressCurrent: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  
  progressTarget: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
  },
  
  // Milestones styles
  milestones: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  
  milestonesTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  
  milestone: {
    ...MIXINS.row,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  
  milestoneText: {
    fontSize: FONT_SIZE.sm,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  
  milestoneTarget: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  
  // Time remaining styles
  timeRemaining: {
    ...MIXINS.row,
    alignItems: 'center',
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  
  timeRemainingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
  
  timeRemainingSubtext: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text.tertiary,
    marginLeft: SPACING.xs,
  },
});
