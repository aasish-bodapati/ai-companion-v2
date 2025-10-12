import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../../theme/constants';

export type PaginationSize = 'small' | 'medium' | 'large';
export type PaginationVariant = 'default' | 'minimal' | 'bordered' | 'dots';
export type PaginationAlignment = 'left' | 'center' | 'right' | 'space-between';

export interface PaginationProps {
  // Core props
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  
  // Configuration
  size?: PaginationSize;
  variant?: PaginationVariant;
  alignment?: PaginationAlignment;
  showInfo?: boolean;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
  
  // Styling
  containerStyle?: ViewStyle;
  buttonStyle?: ViewStyle;
  activeButtonStyle?: ViewStyle;
  disabledButtonStyle?: ViewStyle;
  textStyle?: TextStyle;
  activeTextStyle?: TextStyle;
  disabledTextStyle?: TextStyle;
  infoStyle?: TextStyle;
  
  // Customization
  firstButtonText?: string;
  lastButtonText?: string;
  prevButtonText?: string;
  nextButtonText?: string;
  infoText?: (current: number, total: number, totalItems?: number) => string;
  
  // Behavior
  disabled?: boolean;
  hideWhenSinglePage?: boolean;
  
  // Accessibility
  accessibilityLabel?: string;
  testID?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  size = 'medium',
  variant = 'default',
  alignment = 'center',
  showInfo = true,
  showFirstLast = true,
  showPrevNext = true,
  maxVisiblePages = 5,
  containerStyle,
  buttonStyle,
  activeButtonStyle,
  disabledButtonStyle,
  textStyle,
  activeTextStyle,
  disabledTextStyle,
  infoStyle,
  firstButtonText = 'First',
  lastButtonText = 'Last',
  prevButtonText = 'Previous',
  nextButtonText = 'Next',
  infoText,
  disabled = false,
  hideWhenSinglePage = true,
  accessibilityLabel,
  testID,
}: PaginationProps) {
  
  // Hide pagination if only one page and hideWhenSinglePage is true
  if (hideWhenSinglePage && totalPages <= 1) {
    return null;
  }

  // Calculate visible page numbers
  const visiblePages = useMemo(() => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }, [currentPage, totalPages, maxVisiblePages]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    if (disabled || page < 1 || page > totalPages || page === currentPage) {
      return;
    }
    onPageChange(page);
  }, [disabled, totalPages, currentPage, onPageChange]);

  // Get button styles
  const getButtonStyles = (isActive: boolean, isDisabled: boolean): ViewStyle[] => {
    const baseStyles = [styles.button];
    
    // Size-based styles
    switch (size) {
      case 'small':
        baseStyles.push(styles.buttonSmall);
        break;
      case 'medium':
        baseStyles.push(styles.buttonMedium);
        break;
      case 'large':
        baseStyles.push(styles.buttonLarge);
        break;
    }
    
    // Variant-based styles
    switch (variant) {
      case 'minimal':
        baseStyles.push(styles.buttonMinimal);
        break;
      case 'bordered':
        baseStyles.push(styles.buttonBordered);
        break;
      case 'dots':
        baseStyles.push(styles.buttonDots);
        break;
      default:
        baseStyles.push(styles.buttonDefault);
        break;
    }
    
    // State-based styles
    if (isActive) {
      baseStyles.push(styles.buttonActive);
      if (activeButtonStyle) baseStyles.push(activeButtonStyle);
    }
    
    if (isDisabled) {
      baseStyles.push(styles.buttonDisabled);
      if (disabledButtonStyle) baseStyles.push(disabledButtonStyle);
    }
    
    if (buttonStyle) baseStyles.push(buttonStyle);
    
    return baseStyles;
  };

  const getTextStyles = (isActive: boolean, isDisabled: boolean): TextStyle[] => {
    const baseStyles = [styles.text];
    
    // Size-based text styles
    switch (size) {
      case 'small':
        baseStyles.push(styles.textSmall);
        break;
      case 'medium':
        baseStyles.push(styles.textMedium);
        break;
      case 'large':
        baseStyles.push(styles.textLarge);
        break;
    }
    
    // State-based text styles
    if (isActive) {
      baseStyles.push(styles.textActive);
      if (activeTextStyle) baseStyles.push(activeTextStyle);
    }
    
    if (isDisabled) {
      baseStyles.push(styles.textDisabled);
      if (disabledTextStyle) baseStyles.push(disabledTextStyle);
    }
    
    if (textStyle) baseStyles.push(textStyle);
    
    return baseStyles;
  };

  const getContainerStyles = (): ViewStyle[] => {
    const baseStyles = [styles.container];
    
    // Alignment-based styles
    switch (alignment) {
      case 'left':
        baseStyles.push(styles.containerLeft);
        break;
      case 'center':
        baseStyles.push(styles.containerCenter);
        break;
      case 'right':
        baseStyles.push(styles.containerRight);
        break;
      case 'space-between':
        baseStyles.push(styles.containerSpaceBetween);
        break;
    }
    
    if (containerStyle) baseStyles.push(containerStyle);
    
    return baseStyles;
  };

  const renderPageButton = (page: number) => {
    const isActive = page === currentPage;
    const isDisabled = disabled;
    
    return (
      <TouchableOpacity
        key={page}
        style={getButtonStyles(isActive, isDisabled)}
        onPress={() => handlePageChange(page)}
        disabled={isDisabled}
        accessibilityLabel={`Go to page ${page}`}
        accessibilityState={{ selected: isActive }}
        testID={`${testID}-page-${page}`}
      >
        <Text style={getTextStyles(isActive, isDisabled)}>
          {page}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEllipsis = (key: string) => (
    <View key={key} style={styles.ellipsis}>
      <Text style={[styles.text, getTextStyles(false, false)]}>
        ...
      </Text>
    </View>
  );

  const renderNavigationButton = (
    page: number,
    text: string,
    icon: keyof typeof Ionicons.glyphMap,
    testID: string
  ) => {
    const isDisabled = disabled || page < 1 || page > totalPages;
    
    return (
      <TouchableOpacity
        style={getButtonStyles(false, isDisabled)}
        onPress={() => handlePageChange(page)}
        disabled={isDisabled}
        accessibilityLabel={text}
        testID={testID}
      >
        <Ionicons
          name={icon}
          size={getIconSize()}
          color={isDisabled ? COLORS.text.disabled : COLORS.text.primary}
        />
        {size !== 'small' && (
          <Text style={[styles.text, getTextStyles(false, isDisabled)]}>
            {text}
          </Text>
        )}
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

  const renderInfo = () => {
    if (!showInfo) return null;

    const infoTextContent = infoText 
      ? infoText(currentPage, totalPages)
      : `Page ${currentPage} of ${totalPages}`;

    return (
      <Text style={[styles.info, infoStyle]} testID={`${testID}-info`}>
        {infoTextContent}
      </Text>
    );
  };

  const renderPageNumbers = () => {
    const pages = [];
    const hasStartEllipsis = visiblePages[0] > 1;
    const hasEndEllipsis = visiblePages[visiblePages.length - 1] < totalPages;

    // First page
    if (hasStartEllipsis) {
      pages.push(renderPageButton(1));
      if (visiblePages[0] > 2) {
        pages.push(renderEllipsis('start-ellipsis'));
      }
    }

    // Visible pages
    visiblePages.forEach(page => {
      pages.push(renderPageButton(page));
    });

    // Last page
    if (hasEndEllipsis) {
      if (visiblePages[visiblePages.length - 1] < totalPages - 1) {
        pages.push(renderEllipsis('end-ellipsis'));
      }
      pages.push(renderPageButton(totalPages));
    }

    return pages;
  };

  return (
    <View style={getContainerStyles()} testID={testID}>
      {renderInfo()}
      
      <View style={styles.navigation}>
        {/* First button */}
        {showFirstLast && renderNavigationButton(
          1,
          firstButtonText,
          'chevron-back-outline',
          `${testID}-first`
        )}
        
        {/* Previous button */}
        {showPrevNext && renderNavigationButton(
          currentPage - 1,
          prevButtonText,
          'chevron-back',
          `${testID}-prev`
        )}
        
        {/* Page numbers */}
        <View style={styles.pageNumbers}>
          {renderPageNumbers()}
        </View>
        
        {/* Next button */}
        {showPrevNext && renderNavigationButton(
          currentPage + 1,
          nextButtonText,
          'chevron-forward',
          `${testID}-next`
        )}
        
        {/* Last button */}
        {showFirstLast && renderNavigationButton(
          totalPages,
          lastButtonText,
          'chevron-forward-outline',
          `${testID}-last`
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  containerLeft: {
    justifyContent: 'flex-start',
  },
  containerCenter: {
    justifyContent: 'center',
  },
  containerRight: {
    justifyContent: 'flex-end',
  },
  containerSpaceBetween: {
    justifyContent: 'space-between',
  },
  info: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    marginRight: SPACING.md,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  pageNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    backgroundColor: COLORS.background.primary,
  },
  buttonDefault: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  buttonMinimal: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  buttonBordered: {
    borderWidth: 2,
    borderColor: COLORS.border.primary,
  },
  buttonDots: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  buttonSmall: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 4,
    minWidth: 28,
    minHeight: 28,
  },
  buttonMedium: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    minWidth: 32,
    minHeight: 32,
  },
  buttonLarge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minWidth: 40,
    minHeight: 40,
  },
  buttonActive: {
    backgroundColor: COLORS.primary.main,
    borderColor: COLORS.primary.main,
  },
  buttonDisabled: {
    backgroundColor: COLORS.background.disabled,
    borderColor: COLORS.border.disabled,
    opacity: 0.5,
  },
  text: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.text.primary,
  },
  textSmall: {
    fontSize: FONT_SIZE.xs,
  },
  textMedium: {
    fontSize: FONT_SIZE.sm,
  },
  textLarge: {
    fontSize: FONT_SIZE.md,
  },
  textActive: {
    color: COLORS.background.primary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  textDisabled: {
    color: COLORS.text.disabled,
  },
  ellipsis: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
