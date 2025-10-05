import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
import { BREAKPOINTS } from '../theme/constants';

export interface ScreenDimensions {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
}

export interface ResponsiveBreakpoints {
  isSmall: boolean;
  isMedium: boolean;
  isLarge: boolean;
  isTablet: boolean;
  isPhone: boolean;
}

export interface ResponsiveValues<T> {
  small: T;
  medium: T;
  large: T;
  tablet: T;
  phone: T;
}

export function useResponsive() {
  const [dimensions, setDimensions] = useState<ScreenDimensions>(() => {
    const { width, height, scale, fontScale } = Dimensions.get('window');
    return { width, height, scale, fontScale };
  });

  const [breakpoints, setBreakpoints] = useState<ResponsiveBreakpoints>(() => {
    const { width } = Dimensions.get('window');
    return {
      isSmall: width < BREAKPOINTS.medium,
      isMedium: width >= BREAKPOINTS.medium && width < BREAKPOINTS.large,
      isLarge: width >= BREAKPOINTS.large,
      isTablet: width >= BREAKPOINTS.medium,
      isPhone: width < BREAKPOINTS.medium,
    };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const { width, height, scale, fontScale } = window;
      setDimensions({ width, height, scale, fontScale });
      
      setBreakpoints({
        isSmall: width < BREAKPOINTS.medium,
        isMedium: width >= BREAKPOINTS.medium && width < BREAKPOINTS.large,
        isLarge: width >= BREAKPOINTS.large,
        isTablet: width >= BREAKPOINTS.medium,
        isPhone: width < BREAKPOINTS.medium,
      });
    });

    return () => subscription?.remove();
  }, []);

  const getResponsiveValue = <T>(values: ResponsiveValues<T>): T => {
    if (breakpoints.isLarge) return values.large;
    if (breakpoints.isTablet) return values.tablet;
    if (breakpoints.isMedium) return values.medium;
    return values.small;
  };

  const getResponsiveFontSize = (baseSize: number): number => {
    let scaleFactor = 1;
    
    if (breakpoints.isTablet) {
      scaleFactor = 1.2;
    } else if (dimensions.width > 400) {
      // Large phones like OnePlus 8 Pro, iPhone 14 Pro Max
      scaleFactor = 1.1;
    } else if (dimensions.width < 360) {
      // Smaller phones
      scaleFactor = 0.9;
    }
    
    return Math.round(baseSize * scaleFactor);
  };

  const getResponsiveSpacing = (baseSpacing: number): number => {
    let scaleFactor = 1;
    
    if (breakpoints.isTablet) {
      scaleFactor = 1.3;
    } else if (dimensions.width > 400) {
      // Large phones like OnePlus 8 Pro, iPhone 14 Pro Max
      scaleFactor = 1.15;
    } else if (dimensions.width < 360) {
      // Smaller phones
      scaleFactor = 0.9;
    }
    
    return Math.round(baseSpacing * scaleFactor);
  };

  const getResponsivePadding = (basePadding: number): number => {
    let scaleFactor = 1;
    
    if (breakpoints.isTablet) {
      scaleFactor = 1.5;
    } else if (dimensions.width > 400) {
      // Large phones like OnePlus 8 Pro, iPhone 14 Pro Max
      scaleFactor = 1.2;
    } else if (dimensions.width < 360) {
      // Smaller phones
      scaleFactor = 0.9;
    }
    
    return Math.round(basePadding * scaleFactor);
  };

  const getResponsiveMargin = (baseMargin: number): number => {
    let scaleFactor = 1;
    
    if (breakpoints.isTablet) {
      scaleFactor = 1.4;
    } else if (dimensions.width > 400) {
      // Large phones like OnePlus 8 Pro, iPhone 14 Pro Max
      scaleFactor = 1.15;
    } else if (dimensions.width < 360) {
      // Smaller phones
      scaleFactor = 0.9;
    }
    
    return Math.round(baseMargin * scaleFactor);
  };

  const getCardWidth = (columns: number = 1): number => {
    const padding = getResponsivePadding(32); // 16px on each side
    const gap = getResponsiveSpacing(12);
    const availableWidth = dimensions.width - padding;
    const totalGaps = (columns - 1) * gap;
    return Math.floor((availableWidth - totalGaps) / columns);
  };

  const getGridColumns = (): number => {
    if (breakpoints.isLarge) return 3;
    if (breakpoints.isTablet) return 2;
    return 1;
  };

  const getModalWidth = (): number => {
    if (breakpoints.isTablet) {
      return Math.min(dimensions.width * 0.8, 600);
    }
    return dimensions.width;
  };

  const getModalHeight = (): number => {
    if (breakpoints.isTablet) {
      return Math.min(dimensions.height * 0.8, 700);
    }
    return dimensions.height * 0.9;
  };

  return {
    dimensions,
    breakpoints,
    getResponsiveValue,
    getResponsiveFontSize,
    getResponsiveSpacing,
    getResponsivePadding,
    getResponsiveMargin,
    getCardWidth,
    getGridColumns,
    getModalWidth,
    getModalHeight,
  };
}

export default useResponsive;
