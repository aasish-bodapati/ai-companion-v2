import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, MIXINS } from '../../theme/constants';
import { hapticFeedback } from '../../utils/haptics';

interface Action {
  label: string;
  icon?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
}

interface Badge {
  text: string;
  variant?: 'success' | 'warning' | 'info' | 'danger' | 'neutral';
  icon?: string;
}

interface ActionCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  iconColor?: string;
  
  // Badges
  badges?: Badge[];
  
  // Details (key-value pairs)
  details?: {
    label: string;
    value: string | number;
    icon?: string;
    color?: string;
  }[];
  
  // Actions
  primaryAction?: Action;
  secondaryActions?: Action[];
  
  // Status indicators
  status?: {
    text: string;
    variant: 'active' | 'inactive' | 'pending' | 'completed' | 'error';
    icon?: string;
  };
  
  // Styling
  variant?: 'default' | 'compact' | 'detailed';
  backgroundColor?: string;
  style?: Record<string, unknown>;
  onPress?: () => void;
}

export default function ActionCard({
  title,
  subtitle,
  description,
  icon,
  iconColor = COLORS.primary.main,
  badges = [],
  details = [],
  primaryAction,
  secondaryActions = [],
  status,
  variant = 'default',
  backgroundColor = COLORS.background.primary,
  style,
  onPress,
}: ActionCardProps) {

  const handleActionPress = (action: Action) => {
    if (action.disabled || action.loading) return;
    
    hapticFeedback.light();
    action.onPress();
  };

  const getBadgeStyle = (badge: Badge) => {
    const baseStyle = styles.badge;
    
    switch (badge.variant) {
      case 'success':
        return [baseStyle, styles.successBadge];
      case 'warning':
        return [baseStyle, styles.warningBadge];
      case 'info':
        return [baseStyle, styles.infoBadge];
      case 'danger':
        return [baseStyle, styles.dangerBadge];
      default:
        return [baseStyle, styles.neutralBadge];
    }
  };

  const getBadgeTextStyle = (badge: Badge) => {
    const baseStyle = styles.badgeText;
    
    switch (badge.variant) {
      case 'success':
        return [baseStyle, styles.successBadgeText];
      case 'warning':
        return [baseStyle, styles.warningBadgeText];
      case 'info':
        return [baseStyle, styles.infoBadgeText];
      case 'danger':
        return [baseStyle, styles.dangerBadgeText];
      default:
        return [baseStyle, styles.neutralBadgeText];
    }
  };

  const getActionStyle = (action: Action) => {
    const baseStyle = styles.actionButton;
    
    switch (action.variant) {
      case 'secondary':
        return [baseStyle, styles.secondaryAction];
      case 'success':
        return [baseStyle, styles.successAction];
      case 'warning':
        return [baseStyle, styles.warningAction];
      case 'danger':
        return [baseStyle, styles.dangerAction];
      case 'ghost':
        return [baseStyle, styles.ghostAction];
      default:
        return [baseStyle, styles.primaryAction];
    }
  };

  const getActionTextStyle = (action: Action) => {
    const baseStyle = styles.actionText;
    
    switch (action.variant) {
      case 'secondary':
        return [baseStyle, styles.secondaryActionText];
      case 'success':
        return [baseStyle, styles.successActionText];
      case 'warning':
        return [baseStyle, styles.warningActionText];
      case 'danger':
        return [baseStyle, styles.dangerActionText];
      case 'ghost':
        return [baseStyle, styles.ghostActionText];
      default:
        return [baseStyle, styles.primaryActionText];
    }
  };

  const getStatusStyle = () => {
    if (!status) return null;
    
    const baseStyle = styles.statusBadge;
    
    switch (status.variant) {
      case 'active':
        return [baseStyle, styles.activeStatus];
      case 'inactive':
        return [baseStyle, styles.inactiveStatus];
      case 'pending':
        return [baseStyle, styles.pendingStatus];
      case 'completed':
        return [baseStyle, styles.completedStatus];
      case 'error':
        return [baseStyle, styles.errorStatus];
      default:
        return [baseStyle, styles.neutralStatus];
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        {icon && (
          <Ionicons 
            name={icon as keyof typeof Ionicons.glyphMap} 
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
      
      <View style={styles.headerRight}>
        {badges.map((badge, index) => (
          <View key={index} style={getBadgeStyle(badge)}>
            {badge.icon && (
              <Ionicons 
                name={badge.icon as keyof typeof Ionicons.glyphMap} 
                size={12} 
                color={COLORS.text.inverse}
                style={styles.badgeIcon}
              />
            )}
            <Text style={getBadgeTextStyle(badge)}>
              {badge.text}
            </Text>
          </View>
        ))}
        
        {status && (
          <View style={getStatusStyle()}>
            {status.icon && (
              <Ionicons 
                name={status.icon as keyof typeof Ionicons.glyphMap} 
                size={12} 
                color={COLORS.text.inverse}
                style={styles.statusIcon}
              />
            )}
            <Text style={styles.statusText}>
              {status.text}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderDescription = () => {
    if (!description) return null;
    
    return (
      <Text style={styles.description}>{description}</Text>
    );
  };

  const renderDetails = () => {
    if (details.length === 0) return null;
    
    return (
      <View style={styles.detailsContainer}>
        {details.map((detail, index) => (
          <View key={index} style={styles.detailItem}>
            {detail.icon && (
              <Ionicons 
                name={detail.icon as keyof typeof Ionicons.glyphMap} 
                size={16} 
                color={detail.color || COLORS.text.secondary}
                style={styles.detailIcon}
              />
            )}
            <Text style={[styles.detailText, detail.color && { color: detail.color }]}>
              {detail.value}
            </Text>
            <Text style={styles.detailLabel}>{detail.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderActions = () => {
    if (!primaryAction && secondaryActions.length === 0) return null;
    
    return (
      <View style={styles.actionsContainer}>
        {primaryAction && (
          <TouchableOpacity
            style={[
              getActionStyle(primaryAction),
              primaryAction.disabled && styles.disabledAction
            ]}
            onPress={() => handleActionPress(primaryAction)}
            disabled={primaryAction.disabled || primaryAction.loading}
          >
            {primaryAction.loading ? (
              <ActivityIndicator 
                size="small" 
                color={COLORS.text.inverse}
                style={styles.actionLoader}
              />
            ) : (
              primaryAction.icon && (
                <Ionicons 
                  name={primaryAction.icon as keyof typeof Ionicons.glyphMap} 
                  size={16} 
                  color={COLORS.text.inverse}
                  style={styles.actionIcon}
                />
              )
            )}
            <Text style={getActionTextStyle(primaryAction)}>
              {primaryAction.loading ? 'Loading...' : primaryAction.label}
            </Text>
          </TouchableOpacity>
        )}
        
        {secondaryActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[
              getActionStyle(action),
              action.disabled && styles.disabledAction
            ]}
            onPress={() => handleActionPress(action)}
            disabled={action.disabled || action.loading}
          >
            {action.loading ? (
              <ActivityIndicator 
                size="small" 
                color={action.variant === 'ghost' ? COLORS.primary.main : COLORS.text.inverse}
                style={styles.actionLoader}
              />
            ) : (
              action.icon && (
                <Ionicons 
                  name={action.icon as keyof typeof Ionicons.glyphMap} 
                  size={16} 
                  color={action.variant === 'ghost' ? COLORS.primary.main : COLORS.text.inverse}
                  style={styles.actionIcon}
                />
              )
            )}
            <Text style={getActionTextStyle(action)}>
              {action.loading ? 'Loading...' : action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

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
      {renderDescription()}
      {renderDetails()}
      {renderActions()}
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
    marginBottom: SPACING.md,
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
  
  headerRight: {
    ...MIXINS.row,
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  
  // Badge styles
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  successBadge: {
    backgroundColor: COLORS.success,
  },
  warningBadge: {
    backgroundColor: COLORS.warning,
  },
  infoBadge: {
    backgroundColor: COLORS.primary.main,
  },
  dangerBadge: {
    backgroundColor: COLORS.danger,
  },
  neutralBadge: {
    backgroundColor: COLORS.gray[200],
  },
  
  badgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.text.inverse,
  },
  
  successBadgeText: { color: COLORS.text.inverse },
  warningBadgeText: { color: COLORS.text.inverse },
  infoBadgeText: { color: COLORS.text.inverse },
  dangerBadgeText: { color: COLORS.text.inverse },
  neutralBadgeText: { color: COLORS.text.primary },
  
  badgeIcon: {
    marginRight: SPACING.xs,
  },
  
  // Status styles
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  activeStatus: {
    backgroundColor: COLORS.success,
  },
  inactiveStatus: {
    backgroundColor: COLORS.gray[300],
  },
  pendingStatus: {
    backgroundColor: COLORS.warning,
  },
  completedStatus: {
    backgroundColor: COLORS.primary.main,
  },
  errorStatus: {
    backgroundColor: COLORS.danger,
  },
  neutralStatus: {
    backgroundColor: COLORS.gray[200],
  },
  
  statusText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.text.inverse,
  },
  
  statusIcon: {
    marginRight: SPACING.xs,
  },
  
  // Content styles
  description: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  
  detailItem: {
    ...MIXINS.row,
    alignItems: 'center',
    marginRight: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  
  detailIcon: {
    marginRight: SPACING.xs,
  },
  
  detailText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginRight: SPACING.xs,
  },
  
  detailLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
  },
  
  // Action styles
  actionsContainer: {
    ...MIXINS.row,
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  
  actionButton: {
    ...MIXINS.buttonBase,
    minHeight: 36,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  
  primaryAction: {
    backgroundColor: COLORS.primary.main,
    flex: 1,
  },
  secondaryAction: {
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.border.medium,
  },
  successAction: {
    backgroundColor: COLORS.success,
  },
  warningAction: {
    backgroundColor: COLORS.warning,
  },
  dangerAction: {
    backgroundColor: COLORS.danger,
  },
  ghostAction: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  
  actionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  
  primaryActionText: {
    color: COLORS.text.inverse,
  },
  secondaryActionText: {
    color: COLORS.text.primary,
  },
  successActionText: {
    color: COLORS.text.inverse,
  },
  warningActionText: {
    color: COLORS.text.inverse,
  },
  dangerActionText: {
    color: COLORS.text.inverse,
  },
  ghostActionText: {
    color: COLORS.primary.main,
  },
  
  actionIcon: {
    marginRight: SPACING.xs,
  },
  
  actionLoader: {
    marginRight: SPACING.xs,
  },
  
  disabledAction: {
    opacity: 0.5,
  },
});
