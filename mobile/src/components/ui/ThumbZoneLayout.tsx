/**
 * ThumbZoneLayout - Mobile-first layout optimized for one-handed use
 * Ensures all interactive elements are within thumb reach
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../theme/constants';

interface ThumbZoneLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
  safeArea?: boolean;
  bottomPadding?: boolean;
}

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Thumb zone calculations based on screen size
const THUMB_ZONE_HEIGHT = SCREEN_HEIGHT * 0.6; // Bottom 60% of screen
const THUMB_ZONE_WIDTH = SCREEN_WIDTH * 0.8; // Center 80% of screen width
const THUMB_ZONE_MARGIN = (SCREEN_WIDTH - THUMB_ZONE_WIDTH) / 2;

export default function ThumbZoneLayout({ 
  children, 
  style, 
  safeArea = true,
  bottomPadding = true 
}: ThumbZoneLayoutProps) {
  const Container = safeArea ? SafeAreaView : View;

  return (
    <Container style={[styles.container, style]}>
      <View style={styles.thumbZone}>
        {children}
      </View>
    </Container>
  );
}

// Utility function to check if a position is in thumb zone
export const isInThumbZone = (x: number, y: number): boolean => {
  const relativeY = SCREEN_HEIGHT - y; // Convert to bottom-relative coordinates
  return (
    relativeY <= THUMB_ZONE_HEIGHT &&
    x >= THUMB_ZONE_MARGIN &&
    x <= SCREEN_WIDTH - THUMB_ZONE_MARGIN
  );
};

// Utility function to get thumb zone bounds
export const getThumbZoneBounds = () => ({
  top: SCREEN_HEIGHT - THUMB_ZONE_HEIGHT,
  bottom: SCREEN_HEIGHT,
  left: THUMB_ZONE_MARGIN,
  right: SCREEN_WIDTH - THUMB_ZONE_MARGIN,
  width: THUMB_ZONE_WIDTH,
  height: THUMB_ZONE_HEIGHT,
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  thumbZone: {
    flex: 1,
    paddingTop: SPACING.large,
    paddingHorizontal: SPACING.medium,
    paddingBottom: SPACING.xl,
    // Ensure content stays within thumb reach
    maxHeight: THUMB_ZONE_HEIGHT,
  },
});
