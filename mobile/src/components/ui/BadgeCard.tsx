
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, MIXINS } from '../../theme/constants';
import { hapticFeedback } from '../../utils/haptics';

interface Badge {
  text: string;
  variant?: 'success' | 'warning' | 'info' | 'danger' | 'neutral' | 'primary';
  icon?: string;
  color?: string;
  backgroundColor?: string;
}

interface BadgeCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  iconColor?: string;

  // Badges
  badges: Badge[];

  // Status
  status?: {
    text: string;
    variant: 'active' | 'inactive' | 'pending' | 'completed' | 'error' | 'warning';
    icon?: string;
  };

  // Value display
  value?: string | number;
  valueLabel?: string;
  valueColor?: string;

  // Actions
  onPress?: () => void;
  actionLabel?: string;
  actionIcon?: string;

  // Styling
  variant?: 'default' | 'compact' | 'minimal';
  backgroundColor?: string;
  style?: Record<string, unknown>;

  // Layout
  layout?: 'horizontal' | 'vertical';
  showDivider?: boolean;
}

export default function BadgeCard({
  title,
  subtitle,
  description,
  icon,
  iconColor = COLORS.primary.main,
  badges = [],
  status,
  value,
  valueLabel,
  valueColor,
  onPress,
  actionLabel,
  actionIcon,
  variant = 'default',
  backgroundColor = COLORS.background.primary,
  style,
  layout = 'horizontal',
  showDivider = false,
}: BadgeCardProps) {

  const handlePress = () => {
    if (onPress) {
      hapticFeedback.light();
      onPress();
    }
  };

  const getBadgeStyle = (badge: Badge) => {
    const baseStyle = styles.badge;

    if (badge.backgroundColor) {
      return [baseStyle, { backgroundColor: badge.backgroundColor }];
    }

    switch (badge.variant) {
      case 'success':
        return [baseStyle, styles.successBadge];
      case 'warning':
        return [baseStyle, styles.warningBadge];
      case 'info':
        return [baseStyle, styles.infoBadge];
      case 'danger':
        return [baseStyle, styles.dangerBadge];
      case 'primary':
        return [baseStyle, styles.primaryBadge];
      default:
        return [baseStyle, styles.neutralBadge];
    }
  };

  const getBadgeTextStyle = (badge: Badge) => {
    const baseStyle = styles.badgeText;

    if (badge.color) {
      return [baseStyle, { color: badge.color }];
    }

    switch (badge.variant) {
      case 'success':
        return [baseStyle, styles.successBadgeText];
      case 'warning':
        return [baseStyle, styles.warningBadgeText];
      case 'info':
        return [baseStyle, styles.infoBadgeText];
      case 'danger':
        return [baseStyle, styles.dangerBadgeText];
      case 'primary':
        return [baseStyle, styles.primaryBadgeText];
      default:
        return [baseStyle, styles.neutralBadgeText];
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
      case 'warning':
        return [baseStyle, styles.warningStatus];
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

      {(onPress || actionLabel) && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handlePress}
        >
          {actionIcon && (
            <Ionicons
              name={actionIcon as keyof typeof Ionicons.glyphMap}
              size={16}
              color={COLORS.primary.main}
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

  const renderBadges = () => {
    if (badges.length === 0) return null;

    return (
      <View style={[
        styles.badgesContainer,
        layout === 'vertical' && styles.verticalBadges
      ]}>
        {badges.map((badge, index) => (
          <View key={index} style={getBadgeStyle(badge)}>
            {badge.icon && (
              <Ionicons
                name={badge.icon as keyof typeof Ionicons.glyphMap}
                size={12}
                color={badge.color || COLORS.text.inverse}
                style={styles.badgeIcon}
              />
            )}
            <Text style={getBadgeTextStyle(badge)}>
              {badge.text}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderStatus = () => {
    if (!status) return null;

    return (
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
    );
  };

  const renderValue = () => {
    if (!value) return null;

    return (
      <View style={styles.valueContainer}>
        <Text style={[
          styles.value,
          valueColor && { color: valueColor }
        ]}>
          {value}
        </Text>
        {valueLabel && (
          <Text style={styles.valueLabel}>{valueLabel}</Text>
        )}
      </View>
    );
  };

  const renderContent = () => {
    const isVertical = layout === 'vertical';

    return (
      <View style={[
        styles.content,
        isVertical && styles.verticalContent
      ]}>
        {renderHeader()}

        {description && (
          <Text style={styles.description}>{description}</Text>
        )}

        <View style={[
          styles.badgesAndStatus,
          isVertical && styles.verticalBadgesAndStatus
        ]}>
          {renderBadges()}
          {renderStatus()}
        </View>

        {renderValue()}

        {showDivider && (
          <View style={styles.divider} />
        )}
      </View>
    );
  };

  const getCardStyle = () => {
    return [
      styles.card,
      variant === 'compact' && styles.compactCard,
      variant === 'minimal' && styles.minimalCard,
      { backgroundColor },
      style,
    ];
  };

  const CardContent = () => (
    <View style={getCardStyle()}>
      {renderContent()}
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

  minimalCard: {
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },

  content: {
    gap: SPACING.md,
  },

  verticalContent: {
    alignItems: 'center',
  },

  header: {
    ...MIXINS.rowSpaceBetween,
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
    color: COLORS.primary.main,
    fontWeight: '600',
  },

  description: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },

  badgesAndStatus: {
    ...MIXINS.row,
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },

  verticalBadgesAndStatus: {
    justifyContent: 'center',
  },

  badgesContainer: {
    ...MIXINS.row,
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },

  verticalBadges: {
    justifyContent: 'center',
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
  primaryBadge: {
    backgroundColor: COLORS.primary.main,
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
  primaryBadgeText: { color: COLORS.text.inverse },
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
  warningStatus: {
    backgroundColor: COLORS.warning,
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

  // Value styles
  valueContainer: {
    alignItems: 'center',
  },

  value: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.text.primary,
  },

  valueLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.border.light,
    marginTop: SPACING.md,
  },
});
