import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../../theme/constants';

export type FilterBarSize = 'small' | 'medium' | 'large';
export type FilterBarVariant = 'default' | 'minimal' | 'pills' | 'chips';
export type FilterBarLayout = 'horizontal' | 'vertical' | 'wrap';

export interface FilterOption {
  id: string;
  label: string;
  value: any;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  disabled?: boolean;
  count?: number;
}

interface FilterBarProps {
  // Core props
  options: FilterOption[];
  selectedValues: string[];
  onSelectionChange: (selectedValues: string[]) => void;
  
  // Configuration
  size?: FilterBarSize;
  variant?: FilterBarVariant;
  layout?: FilterBarLayout;
  multiple?: boolean;
  clearable?: boolean;
  searchable?: boolean;
  
  // Styling
  containerStyle?: ViewStyle;
  optionStyle?: ViewStyle;
  selectedOptionStyle?: ViewStyle;
  labelStyle?: TextStyle;
  selectedLabelStyle?: TextStyle;
  
  // Customization
  customOption?: (option: FilterOption, isSelected: boolean, onPress: () => void) => React.ReactNode;
  customClearButton?: React.ReactNode;
  
  // Behavior
  maxSelections?: number;
  allowDeselect?: boolean;
  
  // Accessibility
  accessibilityLabel?: string;
  testID?: string;
}

export default function FilterBar({
  options,
  selectedValues,
  onSelectionChange,
  size = 'medium',
  variant = 'default',
  layout = 'horizontal',
  multiple = true,
  clearable = true,
  searchable = false,
  containerStyle,
  optionStyle,
  selectedOptionStyle,
  labelStyle,
  selectedLabelStyle,
  customOption,
  customClearButton,
  maxSelections,
  allowDeselect = true,
  accessibilityLabel,
  testID,
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleOptionPress = useCallback((optionId: string) => {
    const isSelected = selectedValues.includes(optionId);
    
    if (isSelected) {
      if (allowDeselect) {
        onSelectionChange(selectedValues.filter(id => id !== optionId));
      }
    } else {
      if (multiple) {
        if (maxSelections && selectedValues.length >= maxSelections) {
          return; // Don't allow more selections
        }
        onSelectionChange([...selectedValues, optionId]);
      } else {
        onSelectionChange([optionId]);
      }
    }
  }, [selectedValues, onSelectionChange, multiple, allowDeselect, maxSelections]);

  const handleClearAll = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  const getContainerStyles = (): ViewStyle[] => {
    const baseStyles = [styles.container];
    
    // Size-based styles
    switch (size) {
      case 'small':
        baseStyles.push(styles.containerSmall);
        break;
      case 'medium':
        baseStyles.push(styles.containerMedium);
        break;
      case 'large':
        baseStyles.push(styles.containerLarge);
        break;
    }
    
    // Variant-based styles
    switch (variant) {
      case 'minimal':
        baseStyles.push(styles.containerMinimal);
        break;
      case 'pills':
        baseStyles.push(styles.containerPills);
        break;
      case 'chips':
        baseStyles.push(styles.containerChips);
        break;
      default:
        baseStyles.push(styles.containerDefault);
        break;
    }
    
    // Layout-based styles
    switch (layout) {
      case 'vertical':
        baseStyles.push(styles.containerVertical);
        break;
      case 'wrap':
        baseStyles.push(styles.containerWrap);
        break;
      default:
        baseStyles.push(styles.containerHorizontal);
        break;
    }
    
    if (containerStyle) baseStyles.push(containerStyle);
    
    return baseStyles;
  };

  const getOptionStyles = (option: FilterOption, isSelected: boolean): ViewStyle[] => {
    const baseStyles = [styles.option];
    
    // Size-based option styles
    switch (size) {
      case 'small':
        baseStyles.push(styles.optionSmall);
        break;
      case 'medium':
        baseStyles.push(styles.optionMedium);
        break;
      case 'large':
        baseStyles.push(styles.optionLarge);
        break;
    }
    
    // Variant-based option styles
    switch (variant) {
      case 'minimal':
        baseStyles.push(styles.optionMinimal);
        break;
      case 'pills':
        baseStyles.push(styles.optionPills);
        break;
      case 'chips':
        baseStyles.push(styles.optionChips);
        break;
      default:
        baseStyles.push(styles.optionDefault);
        break;
    }
    
    // Selection state
    if (isSelected) {
      baseStyles.push(styles.optionSelected);
      if (selectedOptionStyle) baseStyles.push(selectedOptionStyle);
    }
    
    // Disabled state
    if (option.disabled) {
      baseStyles.push(styles.optionDisabled);
    }
    
    if (optionStyle) baseStyles.push(optionStyle);
    
    return baseStyles;
  };

  const getLabelStyles = (option: FilterOption, isSelected: boolean): TextStyle[] => {
    const baseStyles = [styles.label];
    
    // Size-based label styles
    switch (size) {
      case 'small':
        baseStyles.push(styles.labelSmall);
        break;
      case 'medium':
        baseStyles.push(styles.labelMedium);
        break;
      case 'large':
        baseStyles.push(styles.labelLarge);
        break;
    }
    
    // Selection state
    if (isSelected) {
      baseStyles.push(styles.labelSelected);
      if (selectedLabelStyle) baseStyles.push(selectedLabelStyle);
    }
    
    // Disabled state
    if (option.disabled) {
      baseStyles.push(styles.labelDisabled);
    }
    
    if (labelStyle) baseStyles.push(labelStyle);
    
    return baseStyles;
  };

  const renderOption = (option: FilterOption) => {
    const isSelected = selectedValues.includes(option.id);
    const onPress = () => handleOptionPress(option.id);

    if (customOption) {
      return customOption(option, isSelected, onPress);
    }

    return (
      <TouchableOpacity
        key={option.id}
        style={getOptionStyles(option, isSelected)}
        onPress={onPress}
        disabled={option.disabled}
        accessibilityLabel={`${option.label} filter option`}
        accessibilityHint={isSelected ? 'Tap to remove filter' : 'Tap to add filter'}
        accessibilityState={{ selected: isSelected, disabled: option.disabled }}
        testID={`${testID}-option-${option.id}`}
      >
        {option.icon && (
          <Ionicons
            name={option.icon}
            size={getIconSize()}
            color={getIconColor(option, isSelected)}
            style={styles.optionIcon}
          />
        )}
        <Text style={getLabelStyles(option, isSelected)}>
          {option.label}
        </Text>
        {option.count !== undefined && (
          <View style={styles.countContainer}>
            <Text style={styles.countText}>
              {option.count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderClearButton = () => {
    if (!clearable || selectedValues.length === 0) return null;

    if (customClearButton) {
      return customClearButton;
    }

    return (
      <TouchableOpacity
        style={styles.clearButton}
        onPress={handleClearAll}
        accessibilityLabel="Clear all filters"
        accessibilityHint="Tap to remove all selected filters"
        testID={`${testID}-clear`}
      >
        <Ionicons
          name="close-circle"
          size={getIconSize()}
          color={COLORS.text.secondary}
        />
        <Text style={styles.clearButtonText}>Clear</Text>
      </TouchableOpacity>
    );
  };

  const getIconSize = (): number => {
    switch (size) {
      case 'small': return 14;
      case 'medium': return 16;
      case 'large': return 18;
      default: return 16;
    }
  };

  const getIconColor = (option: FilterOption, isSelected: boolean): string => {
    if (option.disabled) return COLORS.text.disabled;
    if (option.color) return option.color;
    if (isSelected) return COLORS.primary.main;
    return COLORS.text.secondary;
  };

  const ContentComponent = layout === 'wrap' ? View : ScrollView;
  const contentProps = layout === 'wrap' ? {} : {
    horizontal: layout === 'horizontal',
    showsHorizontalScrollIndicator: false,
    showsVerticalScrollIndicator: false,
  };

  return (
    <View style={getContainerStyles()} testID={testID}>
      <ContentComponent
        {...contentProps}
        style={styles.content}
        accessibilityLabel={accessibilityLabel}
      >
        {options.map(renderOption)}
        {renderClearButton()}
      </ContentComponent>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  containerDefault: {
    backgroundColor: COLORS.background.primary,
    borderColor: COLORS.border.light,
  },
  containerMinimal: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  containerPills: {
    backgroundColor: COLORS.background.secondary,
    borderColor: COLORS.border.primary,
  },
  containerChips: {
    backgroundColor: COLORS.background.primary,
    borderColor: COLORS.border.primary,
  },
  containerSmall: {
    padding: SPACING.xs,
  },
  containerMedium: {
    padding: SPACING.sm,
  },
  containerLarge: {
    padding: SPACING.md,
  },
  containerHorizontal: {
    flexDirection: 'row',
  },
  containerVertical: {
    flexDirection: 'column',
  },
  containerWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  content: {
    flex: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    backgroundColor: COLORS.background.primary,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  optionDefault: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  optionMinimal: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  optionPills: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  optionChips: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  optionSmall: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  optionMedium: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  optionLarge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  optionSelected: {
    backgroundColor: COLORS.primary.light,
    borderColor: COLORS.primary.main,
  },
  optionDisabled: {
    backgroundColor: COLORS.background.disabled,
    borderColor: COLORS.border.disabled,
    opacity: 0.5,
  },
  optionIcon: {
    marginRight: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.text.primary,
  },
  labelSmall: {
    fontSize: FONT_SIZE.xs,
  },
  labelMedium: {
    fontSize: FONT_SIZE.sm,
  },
  labelLarge: {
    fontSize: FONT_SIZE.md,
  },
  labelSelected: {
    color: COLORS.primary.main,
    fontWeight: FONT_WEIGHT.semibold,
  },
  labelDisabled: {
    color: COLORS.text.disabled,
  },
  countContainer: {
    marginLeft: SPACING.xs,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  countText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text.secondary,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    marginLeft: SPACING.sm,
  },
  clearButtonText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    marginLeft: SPACING.xs,
  },
});
