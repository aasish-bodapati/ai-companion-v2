import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT } from '../../theme/constants';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'small' | 'medium' | 'large';

export interface BadgeProps {
  /** Badge text content */
  children: React.ReactNode;
  
  /** Badge variant for predefined styling */
  variant?: BadgeVariant;
  
  /** Badge size */
  size?: BadgeSize;
  
  /** Custom background color (overrides variant) */
  backgroundColor?: string;
  
  /** Custom text color (overrides variant) */
  textColor?: string;
  
  /** Icon to display before text */
  icon?: keyof typeof Ionicons.glyphMap;
  
  /** Icon size (defaults based on badge size) */
  iconSize?: number;
  
  /** Whether to show as outline style */
  outline?: boolean;
  
  /** Custom styles */
  style?: ViewStyle;
  
  /** Custom text styles */
  textStyle?: TextStyle;
  
  /** Whether badge is pressable */
  onPress?: () => void;
  
  /** Test ID for testing */
  testID?: string;
}

const Badge = React.memo(function Badge({
  children,
  variant = 'primary',
  size = 'medium',
  backgroundColor,
  textColor,
  icon,
  iconSize,
  outline = false,
  style,
  textStyle,
  onPress,
  testID,
}: BadgeProps) {
  // Get variant colors
  const getVariantColors = (variant: BadgeVariant) => {
    const colors = {
      primary: { bg: COLORS.primary.main, text: COLORS.text.inverse }, // '#6366f1' -> COLORS.primary.main, '#ffffff' -> COLORS.text.inverse
      secondary: { bg: COLORS.gray[500], text: COLORS.text.inverse }, // '#6b7280' -> COLORS.gray[500], '#ffffff' -> COLORS.text.inverse
      success: { bg: COLORS.success, text: COLORS.text.inverse }, // '#059669' -> COLORS.success, '#ffffff' -> COLORS.text.inverse
      warning: { bg: COLORS.warning, text: COLORS.text.inverse }, // '#d97706' -> COLORS.warning, '#ffffff' -> COLORS.text.inverse
      error: { bg: COLORS.danger, text: COLORS.text.inverse }, // '#dc2626' -> COLORS.danger, '#ffffff' -> COLORS.text.inverse
      info: { bg: COLORS.info, text: COLORS.text.inverse }, // '#0284c7' -> COLORS.info, '#ffffff' -> COLORS.text.inverse
    };
    return colors[variant];
  };

  // Get size configurations
  const getSizeConfig = (size: BadgeSize) => {
    const configs = {
      small: {
        paddingHorizontal: SPACING.xs, // 6 -> SPACING.xs (4, but keeping 6 for now)
        paddingVertical: 2, // Keep as is for precise spacing
        fontSize: FONT_SIZE.xs, // 10 -> FONT_SIZE.xs
        iconSize: 8,
        borderRadius: BORDER_RADIUS.sm, // 6 -> BORDER_RADIUS.sm (4, but keeping 6 for now)
      },
      medium: {
        paddingHorizontal: SPACING.sm, // 8 -> SPACING.sm
        paddingVertical: 3, // Keep as is for precise spacing
        fontSize: FONT_SIZE.sm, // 11 -> FONT_SIZE.sm (12, but keeping 11 for now)
        iconSize: 10,
        borderRadius: BORDER_RADIUS.md, // 8 -> BORDER_RADIUS.md
      },
      large: {
        paddingHorizontal: SPACING.md, // 10 -> SPACING.md (12, but keeping 10 for now)
        paddingVertical: 4, // Keep as is for precise spacing
        fontSize: FONT_SIZE.sm, // 12 -> FONT_SIZE.sm
        iconSize: 12,
        borderRadius: BORDER_RADIUS.lg, // 10 -> BORDER_RADIUS.lg (12, but keeping 10 for now)
      },
    };
    return configs[size];
  };

  const variantColors = getVariantColors(variant);
  const sizeConfig = getSizeConfig(size);
  
  // Use custom colors if provided, otherwise use variant colors
  const finalBgColor = backgroundColor || variantColors.bg;
  const finalTextColor = textColor || variantColors.text;
  const finalIconSize = iconSize || sizeConfig.iconSize;

  // Create badge styles
  const badgeStyle: ViewStyle = {
    backgroundColor: outline ? 'transparent' : finalBgColor,
    borderWidth: outline ? 1 : 0,
    borderColor: finalBgColor,
    paddingHorizontal: sizeConfig.paddingHorizontal,
    paddingVertical: sizeConfig.paddingVertical,
    borderRadius: sizeConfig.borderRadius,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    shadowColor: outline ? 'transparent' : finalBgColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    ...style,
  };

  const textStyleFinal: TextStyle = {
    color: outline ? finalBgColor : finalTextColor,
    fontSize: sizeConfig.fontSize,
    fontWeight: FONT_WEIGHT.medium, // '500' -> FONT_WEIGHT.medium
    textTransform: 'none',
    letterSpacing: 0.2,
    ...textStyle,
  };

  const BadgeContent = (
    <View style={badgeStyle} testID={testID}>
      {icon && (
        <Ionicons
          name={icon}
          size={finalIconSize}
          color={outline ? finalBgColor : finalTextColor}
          style={styles.icon}
        />
      )}
      <Text style={textStyleFinal}>{String(children || '')}</Text>
    </View>
  );

  // If onPress is provided, wrap in TouchableOpacity
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {BadgeContent}
      </TouchableOpacity>
    );
  }

  return BadgeContent;
});

const styles = StyleSheet.create({
  icon: {
    marginRight: SPACING.xs, // 3 -> SPACING.xs (4, but keeping 3 for now)
  },
});

export default Badge;

// Convenience components for common use cases
export const CategoryBadge = React.memo(function CategoryBadge({
  category,
  children,
  ...props
}: Omit<BadgeProps, 'children'> & { category?: string; children?: React.ReactNode }) {
  // Map categories to appropriate variants and icons
  const getCategoryConfig = (category: string) => {
    const safeCategory = String(category || '');
    const categoryMap: { [key: string]: { variant: BadgeVariant; icon: keyof typeof Ionicons.glyphMap } } = {
      // Strength & Weight Training
      'bodyweight': { variant: 'info', icon: 'person' },
      'weighted': { variant: 'primary', icon: 'barbell' },
      'strength': { variant: 'primary', icon: 'barbell' },
      
      // Cardio & Endurance
      'cardio_duration': { variant: 'success', icon: 'heart' },
      'cardio': { variant: 'success', icon: 'heart' },
      'running': { variant: 'success', icon: 'walk' },
      'distance_based': { variant: 'success', icon: 'map' },
      
      // Flexibility & Recovery
      'flexibility': { variant: 'warning', icon: 'leaf' },
      'hold_static': { variant: 'warning', icon: 'time' },
      
      // Repetition-based
      'repetition_only': { variant: 'secondary', icon: 'repeat' },
    };
    
    return categoryMap[safeCategory] || { variant: 'secondary', icon: 'help-outline' };
  };

  const config = category ? getCategoryConfig(String(category)) : { variant: 'secondary' as BadgeVariant, icon: 'help-outline' as keyof typeof Ionicons.glyphMap };
  
  return (
    <Badge
      variant={config.variant}
      icon={config.icon}
      {...props}
    >
      {String(children || category || 'Not Found')}
    </Badge>
  );
});

export const StatusBadge = React.memo(function StatusBadge({
  status,
  children,
  ...props
}: Omit<BadgeProps, 'children'> & { status?: string; children?: React.ReactNode }) {
  const getStatusConfig = (status: string) => {
    const statusMap: { [key: string]: { variant: BadgeVariant; icon?: keyof typeof Ionicons.glyphMap } } = {
      'active': { variant: 'success', icon: 'checkmark-circle' },
      'inactive': { variant: 'secondary', icon: 'pause-circle' },
      'completed': { variant: 'success', icon: 'checkmark' },
      'pending': { variant: 'warning', icon: 'time' },
      'failed': { variant: 'error', icon: 'close-circle' },
      'logged': { variant: 'success', icon: 'checkmark' },
      'beginner': { variant: 'info' },
      'intermediate': { variant: 'warning' },
      'advanced': { variant: 'error' },
    };
    
    return statusMap[status] || { variant: 'secondary' };
  };

  const config = status ? getStatusConfig(status) : { variant: 'secondary' as BadgeVariant };
  
  return (
    <Badge
      variant={config.variant}
      icon={config.icon}
      {...props}
    >
      {children || (status ? status : 'Unknown')}
    </Badge>
  );
});

export const DifficultyBadge = React.memo(function DifficultyBadge({
  difficulty,
  children,
  ...props
}: Omit<BadgeProps, 'children'> & { difficulty?: string; children?: React.ReactNode }) {
  const getDifficultyConfig = (difficulty: string) => {
    const difficultyMap: { [key: string]: { variant: BadgeVariant; icon?: keyof typeof Ionicons.glyphMap } } = {
      'beginner': { variant: 'info', icon: 'leaf' },
      'easy': { variant: 'info', icon: 'leaf' },
      'intermediate': { variant: 'warning', icon: 'flame' },
      'medium': { variant: 'warning', icon: 'flame' },
      'advanced': { variant: 'error', icon: 'flash' },
      'hard': { variant: 'error', icon: 'flash' },
    };
    
    return difficultyMap[difficulty] || { variant: 'secondary' };
  };

  const config = difficulty ? getDifficultyConfig(difficulty) : { variant: 'secondary' as BadgeVariant };
  
  return (
    <Badge
      variant={config.variant}
      icon={config.icon}
      {...props}
    >
      {children || (difficulty ? difficulty : 'Unknown')}
    </Badge>
  );
});
