import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
      primary: { bg: '#6366f1', text: '#ffffff' }, // Indigo
      secondary: { bg: '#6b7280', text: '#ffffff' }, // Gray
      success: { bg: '#059669', text: '#ffffff' }, // Emerald
      warning: { bg: '#d97706', text: '#ffffff' }, // Amber
      error: { bg: '#dc2626', text: '#ffffff' }, // Red
      info: { bg: '#0284c7', text: '#ffffff' }, // Sky
    };
    return colors[variant];
  };

  // Get size configurations
  const getSizeConfig = (size: BadgeSize) => {
    const configs = {
      small: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        fontSize: 10,
        iconSize: 8,
        borderRadius: 6,
      },
      medium: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        fontSize: 11,
        iconSize: 10,
        borderRadius: 8,
      },
      large: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        fontSize: 12,
        iconSize: 12,
        borderRadius: 10,
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
    fontWeight: '500',
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
      <Text style={textStyleFinal}>{children}</Text>
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
    marginRight: 3,
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
    
    return categoryMap[category] || { variant: 'secondary', icon: 'help-outline' };
  };

  const config = category ? getCategoryConfig(category) : { variant: 'secondary' as BadgeVariant, icon: 'help-outline' as keyof typeof Ionicons.glyphMap };
  
  return (
    <Badge
      variant={config.variant}
      icon={config.icon}
      {...props}
    >
      {children || (category ? category : 'Not Found')}
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
