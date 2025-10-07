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

interface QuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  onLogWorkout: () => void;
  onLogMeal: () => void;
  onLogTodaysWorkout: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function QuickAddModal({
  visible,
  onClose,
  onLogWorkout,
  onLogMeal,
  onLogTodaysWorkout,
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
    {
      id: 'today-workout',
      title: 'Log Today\'s Workout',
      icon: 'flash',
      color: '#3b82f6',
      onPress: onLogTodaysWorkout,
      position: 'bottom',
    },
  ];

  const handleActionPress = async (action: typeof quickActions[0]) => {
    console.log('🍽️ QuickAddModal: Action pressed:', action.title);
    onClose();
    
    // Let the modal handle the check for "Log Today's Workout"
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
                {/* Half Circle Modal */}
                <View style={styles.halfCircleModal}>
                  {/* Top Quarters */}
                  <View style={styles.topQuarters}>
                    {/* Top Left Quarter - Log Workout */}
                    <TouchableOpacity
                      style={[styles.quarterButton, styles.topLeftQuarter, { backgroundColor: '#10b981' }]}
                      onPress={() => handleActionPress(quickActions[0])}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="fitness" size={20} color="#ffffff" />
                      <Text style={styles.quarterText}>Log Workout</Text>
                    </TouchableOpacity>

                    {/* Top Right Quarter - Log Meal */}
                    <TouchableOpacity
                      style={[styles.quarterButton, styles.topRightQuarter, { backgroundColor: '#f59e0b' }]}
                      onPress={() => handleActionPress(quickActions[1])}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="restaurant" size={20} color="#ffffff" />
                      <Text style={styles.quarterText}>Log Meal</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Bottom Half Circle - Quick Workout */}
                  <TouchableOpacity
                    style={[styles.halfCircleButton, { backgroundColor: '#3b82f6' }]}
                    onPress={() => handleActionPress(quickActions[2])}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="flash" size={24} color="#ffffff" />
                    <Text style={styles.halfCircleText}>Log Today's Workout</Text>
                  </TouchableOpacity>
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
    height: screenHeight * 0.3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  halfCircleModal: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topQuarters: {
    flexDirection: 'row',
    width: '100%',
    height: '50%',
    justifyContent: 'space-between',
  },
  quarterButton: {
    width: '48%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 6,
    textAlign: 'center',
  },
  halfCircleButton: {
    width: '100%',
    height: '45%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  halfCircleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 6,
    textAlign: 'center',
  },
});
