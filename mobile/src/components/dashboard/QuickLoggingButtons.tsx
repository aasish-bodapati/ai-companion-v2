
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';


import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../../theme/constants';

interface QuickLogButton {
  id: string;
  title: string;
  icon: string;
  color: string;
  backgroundColor: string;
  onPress: () => void;
}

interface QuickLoggingButtonsProps {
  onLogWorkout: () => void;
  onLogMeal: () => void;
  onLogWater: () => void;
  onLogMood: () => void;
}

export default function QuickLoggingButtons({
  onLogWorkout,
  onLogMeal,
  onLogWater,
  onLogMood,
}: QuickLoggingButtonsProps) {
  const quickButtons: QuickLogButton[] = [
    {
      id: 'workout',
      title: 'Log Workout',
      icon: 'fitness',
      color: COLORS.text.inverse,
      backgroundColor: COLORS.primary.main,
      onPress: onLogWorkout,
    },
    {
      id: 'meal',
      title: 'Log Meal',
      icon: 'restaurant',
      color: COLORS.text.inverse,
      backgroundColor: COLORS.success,
      onPress: onLogMeal,
    },
    {
      id: 'water',
      title: 'Log Water',
      icon: 'water',
      color: COLORS.text.inverse,
      backgroundColor: '#06b6d4',
      onPress: onLogWater,
    },
    {
      id: 'mood',
      title: 'Log Mood',
      icon: 'happy',
      color: COLORS.text.inverse,
      backgroundColor: COLORS.warning,
      onPress: onLogMood,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Log</Text>
      <View style={styles.buttonsGrid}>
        {quickButtons.map((button) => (
          <TouchableOpacity
            key={button.id}
            style={[styles.button, { backgroundColor: button.backgroundColor }]}
            onPress={button.onPress}
            activeOpacity={0.8}
          >
            <Ionicons name={button.icon as keyof typeof Ionicons.glyphMap} size={24} color={button.color} />
            <Text style={[styles.buttonText, { color: button.color }]}>
              {button.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  buttonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  button: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: 8,
  },
  buttonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
});
