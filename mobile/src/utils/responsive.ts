
import { Dimensions, PixelRatio } from 'react-native';
import { BREAKPOINTS } from '../theme/constants';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Screen size detection
export const getScreenSize = (): 'small' | 'medium' | 'large' => {
  if (screenWidth < BREAKPOINTS.medium) return 'small';
  if (screenWidth < BREAKPOINTS.large) return 'medium';
  return 'large';
};

export const isSmallScreen = (): boolean => screenWidth < BREAKPOINTS.medium;
export const isMediumScreen = (): boolean => screenWidth >= BREAKPOINTS.medium && screenWidth < BREAKPOINTS.large;
export const isLargeScreen = (): boolean => screenWidth >= BREAKPOINTS.large;

// Responsive value function
export const responsiveValue = <T extends any>(
  small: T,
  medium?: T,
  large?: T
): T => {
  const screenSize = getScreenSize();

  switch (screenSize) {
    case 'small':
      return small;
    case 'medium':
      return medium !== undefined ? medium : small;
    case 'large':
      return large !== undefined ? large : (medium !== undefined ? medium : small);
    default:
      return small;
  }
};

// Responsive spacing
export const responsiveSpacing = (
  small: number,
  medium?: number,
  large?: number
): number => {
  return responsiveValue(small, medium, large);
};

// Responsive font size
export const responsiveFontSize = (
  small: number,
  medium?: number,
  large?: number
): number => {
  return responsiveValue(small, medium, large);
};

// Responsive padding/margin
export const responsivePadding = (
  small: number | { top?: number; right?: number; bottom?: number; left?: number },
  medium?: number | { top?: number; right?: number; bottom?: number; left?: number },
  large?: number | { top?: number; right?: number; bottom?: number; left?: number }
) => {
  return responsiveValue(small, medium, large);
};

// Responsive width/height
export const responsiveWidth = (percentage: number): number => {
  return (screenWidth * percentage) / 100;
};

export const responsiveHeight = (percentage: number): number => {
  return (screenHeight * percentage) / 100;
};

// Responsive font scale
export const getFontScale = (): number => {
  return PixelRatio.getFontScale();
};

// Responsive pixel ratio
export const getPixelRatio = (): number => {
  return PixelRatio.get();
};

// Responsive pixel density
export const getPixelDensity = (): number => {
  return PixelRatio.getPixelSizeForLayoutSize(1);
};

// Responsive dimensions
export const getResponsiveDimensions = () => ({
  width: screenWidth,
  height: screenHeight,
  screenSize: getScreenSize(),
  isSmall: isSmallScreen(),
  isMedium: isMediumScreen(),
  isLarge: isLargeScreen(),
  fontScale: getFontScale(),
  pixelRatio: getPixelRatio(),
  pixelDensity: getPixelDensity(),
});

// Responsive style presets
export const responsiveStyles = {
  // Container styles
  container: {
    small: { padding: 16, margin: 8 },
    medium: { padding: 20, margin: 12 },
    large: { padding: 24, margin: 16 },
  },

  // Card styles
  card: {
    small: { padding: 12, borderRadius: 8, margin: 8 },
    medium: { padding: 16, borderRadius: 12, margin: 12 },
    large: { padding: 20, borderRadius: 16, margin: 16 },
  },

  // Text styles
  text: {
    small: { fontSize: 14, lineHeight: 20 },
    medium: { fontSize: 16, lineHeight: 24 },
    large: { fontSize: 18, lineHeight: 28 },
  },

  // Button styles
  button: {
    small: { padding: 8, fontSize: 14, minHeight: 36 },
    medium: { padding: 12, fontSize: 16, minHeight: 44 },
    large: { padding: 16, fontSize: 18, minHeight: 52 },
  },

  // Modal styles
  modal: {
    small: { width: '90%', maxHeight: '70%' },
    medium: { width: '85%', maxHeight: '80%' },
    large: { width: '80%', maxHeight: '85%' },
  },
};

// Hook for responsive values
export const useResponsive = () => {
  const screenSize = getScreenSize();
  const isSmall = isSmallScreen();
  const isMedium = isMediumScreen();
  const isLarge = isLargeScreen();

  return {
    screenSize,
    isSmall,
    isMedium,
    isLarge,
    responsiveValue,
    responsiveSpacing,
    responsiveFontSize,
    responsivePadding,
    responsiveWidth,
    responsiveHeight,
    getFontScale,
    getPixelRatio,
    getPixelDensity,
    getResponsiveDimensions,
  };
};

// Responsive component wrapper - moved to separate file to avoid JSX in .ts file

// Responsive style creator
export const createResponsiveStyle = <T extends Record<string, any>>(
  styles: {
    small: T;
    medium?: T;
    large?: T;
  }
) => {
  return responsiveValue(styles.small, styles.medium, styles.large);
};

// Responsive breakpoint utilities
export const breakpoint = {
  small: (styles: any) => isSmallScreen() ? styles : {},
  medium: (styles: any) => isMediumScreen() ? styles : {},
  large: (styles: any) => isLargeScreen() ? styles : {},
  up: (breakpoint: keyof typeof BREAKPOINTS) => {
    switch (breakpoint) {
      case 'small':
        return true;
      case 'medium':
        return screenWidth >= BREAKPOINTS.medium;
      case 'large':
        return screenWidth >= BREAKPOINTS.large;
      default:
        return true;
    }
  },
  down: (breakpoint: keyof typeof BREAKPOINTS) => {
    switch (breakpoint) {
      case 'small':
        return screenWidth < BREAKPOINTS.medium;
      case 'medium':
        return screenWidth < BREAKPOINTS.large;
      case 'large':
        return false;
      default:
        return true;
    }
  },
  between: (min: keyof typeof BREAKPOINTS, max: keyof typeof BREAKPOINTS) => {
    return screenWidth >= BREAKPOINTS[min] && screenWidth < BREAKPOINTS[max];
  },
};

// Responsive grid utilities
export const responsiveGrid = {
  columns: (small: number, medium?: number, large?: number) => {
    return responsiveValue(small, medium, large);
  },

  gap: (small: number, medium?: number, large?: number) => {
    return responsiveValue(small, medium, large);
  },

  itemWidth: (columns: number, gap: number) => {
    return (screenWidth - (gap * (columns - 1))) / columns;
  },
};

// Responsive image utilities
export const responsiveImage = {
  width: (percentage: number) => responsiveWidth(percentage),
  height: (percentage: number) => responsiveHeight(percentage),
  aspectRatio: (ratio: number) => {
    return {
      width: screenWidth,
      height: screenWidth / ratio,
    };
  },
};

// Responsive animation utilities
export const responsiveAnimation = {
  duration: (small: number, medium?: number, large?: number) => {
    return responsiveValue(small, medium, large);
  },

  scale: (small: number, medium?: number, large?: number) => {
    return responsiveValue(small, medium, large);
  },

  translateY: (small: number, medium?: number, large?: number) => {
    return responsiveValue(small, medium, large);
  },
};

export default {
  getScreenSize,
  isSmallScreen,
  isMediumScreen,
  isLargeScreen,
  responsiveValue,
  responsiveSpacing,
  responsiveFontSize,
  responsivePadding,
  responsiveWidth,
  responsiveHeight,
  getFontScale,
  getPixelRatio,
  getPixelDensity,
  getResponsiveDimensions,
  responsiveStyles,
  useResponsive,
  withResponsive,
  createResponsiveStyle,
  breakpoint,
  responsiveGrid,
  responsiveImage,
  responsiveAnimation,
};