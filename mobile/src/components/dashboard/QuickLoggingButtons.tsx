import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
      color: '#ffffff',
      backgroundColor: '#3b82f6',
      onPress: onLogWorkout,
    },
    {
      id: 'meal',
      title: 'Log Meal',
      icon: 'restaurant',
      color: '#ffffff',
      backgroundColor: '#10b981',
      onPress: onLogMeal,
    },
    {
      id: 'water',
      title: 'Log Water',
      icon: 'water',
      color: '#ffffff',
      backgroundColor: '#06b6d4',
      onPress: onLogWater,
    },
    {
      id: 'mood',
      title: 'Log Mood',
      icon: 'happy',
      color: '#ffffff',
      backgroundColor: '#f59e0b',
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
            <Ionicons name={button.icon as any} size={24} color={button.color} />
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
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
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
