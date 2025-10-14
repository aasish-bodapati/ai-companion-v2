/**
 * SwipeableCard - Mobile-optimized card with swipe gestures
 * Perfect for one-handed operation and quick actions
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanGestureHandler,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticFeedback } from '../../utils/haptics';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../theme/constants';

interface SwipeAction {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  backgroundColor: string;
  onPress: () => void;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  swipeActions?: SwipeAction[];
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  style?: any;
}

export default function SwipeableCard({
  children,
  swipeActions = [],
  onSwipeLeft,
  onSwipeRight,
  style,
}: SwipeableCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const lastGestureX = useRef(0);

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const handleGestureStateChange = (event: any) => {
    const { state, translationX } = event.nativeEvent;
    
    if (state === 5) { // END state
      lastGestureX.current = translationX;
      
      // Determine swipe direction and threshold
      const threshold = 100;
      
      if (translationX > threshold) {
        // Swipe right
        hapticFeedback.medium();
        onSwipeRight?.();
        animateToPosition(0);
      } else if (translationX < -threshold) {
        // Swipe left
        hapticFeedback.medium();
        onSwipeLeft?.();
        animateToPosition(0);
      } else {
        // Snap back to center
        animateToPosition(0);
      }
    }
  };

  const animateToPosition = (toValue: number) => {
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleActionPress = (action: SwipeAction) => {
    hapticFeedback.light();
    action.onPress();
    animateToPosition(0);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Swipe Actions Background */}
      {swipeActions.length > 0 && (
        <View style={styles.actionsContainer}>
          {swipeActions.map((action, index) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionButton,
                { backgroundColor: action.backgroundColor },
                { right: index * 60 } // Stack actions
              ]}
              onPress={() => handleActionPress(action)}
            >
              <Ionicons name={action.icon} size={20} color={action.color} />
              <Text style={[styles.actionText, { color: action.color }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Main Card Content */}
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleGestureStateChange}
      >
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginVertical: SPACING.small,
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 60,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.small,
    gap: SPACING.xs,
  },
  actionText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
