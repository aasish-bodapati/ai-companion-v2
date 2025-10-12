import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { COLORS, BORDER_RADIUS, FONT_SIZE } from '../../theme/constants';

interface QuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  onLogWorkout: () => void;
  onLogMeal: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function QuickAddModal({
  visible,
  onClose,
  onLogWorkout,
  onLogMeal,
}: QuickAddModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start animation when modal becomes visible
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animation when modal is hidden
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);
  const quickActions = [
    {
      id: 'workout',
      title: 'Log Workout',
      icon: 'fitness',
      color: '#10b981',
      onPress: onLogWorkout,
      position: 'top-left',
    },
    {
      id: 'meal',
      title: 'Log Meal',
      icon: 'restaurant',
      color: '#f59e0b',
      onPress: onLogMeal,
      position: 'top-right',
    },
  ];

  const handleActionPress = async (action: typeof quickActions[0]) => {
    onClose();
    action.onPress();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.modalContainer,
                  {
                    transform: [{ scale: scaleAnim }],
                    opacity: opacityAnim,
                  }
                ]}
              >
                {/* Two Quarter Modal */}
                <View style={styles.twoQuarterModal}>
                  {/* Top Quarters */}
                  <View style={styles.topQuarters}>
                    {/* Top Left Quarter - Log Workout */}
                    <TouchableOpacity
                      style={[styles.quarterButton, styles.topLeftQuarter, { backgroundColor: COLORS.success }]}
                      onPress={() => handleActionPress(quickActions[0])}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="fitness" size={20} color="#ffffff" />
                      <Text style={styles.quarterText}>Log Workout</Text>
                    </TouchableOpacity>

                    {/* Top Right Quarter - Log Meal */}
                    <TouchableOpacity
                      style={[styles.quarterButton, styles.topRightQuarter, { backgroundColor: COLORS.warning }]}
                      onPress={() => handleActionPress(quickActions[1])}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="restaurant" size={20} color="#ffffff" />
                      <Text style={styles.quarterText}>Log Meal</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </BlurView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth * 0.8,
    height: screenHeight * 0.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  twoQuarterModal: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topQuarters: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  quarterButton: {
    width: '48%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.xxl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  topLeftQuarter: {
    borderTopLeftRadius: 40,
    borderBottomLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  topRightQuarter: {
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    borderTopRightRadius: 40,
    borderBottomRightRadius: 20,
  },
  quarterText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text.inverse,
    marginTop: 6,
    textAlign: 'center',
  },
});
