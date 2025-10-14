/**
 * SmartWorkoutLogger - Intelligent router that shows the right logging interface
 * Based on user context and preferences for busy professionals
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../theme/constants';
import QuickWorkoutLogger from './QuickWorkoutLogger';
import SimpleWorkoutLogger from './SimpleWorkoutLogger';
import VoiceWorkoutLogger from './VoiceWorkoutLogger';

interface SmartWorkoutLoggerProps {
  visible: boolean;
  onClose: () => void;
  onSave: (workout: any) => void;
}

type LoggerType = 'quick' | 'simple' | 'voice' | 'advanced';

export default function SmartWorkoutLogger({ visible, onClose, onSave }: SmartWorkoutLoggerProps) {
  const [selectedLogger, setSelectedLogger] = useState<LoggerType | null>(null);

  const handleClose = () => {
    setSelectedLogger(null);
    onClose();
  };

  const handleSave = (workout: any) => {
    onSave(workout);
    setSelectedLogger(null);
  };

  const loggerOptions = [
    {
      type: 'quick' as const,
      title: 'Quick Log',
      subtitle: 'One-tap logging for common workouts',
      icon: 'flash',
      color: COLORS.primary,
      description: 'Perfect for busy professionals - log in under 10 seconds',
    },
    {
      type: 'voice' as const,
      title: 'Voice Log',
      subtitle: 'Hands-free logging while active',
      icon: 'mic',
      color: COLORS.secondary,
      description: 'Great for when you\'re exercising or on-the-go',
    },
    {
      type: 'simple' as const,
      title: 'Simple Log',
      subtitle: 'Basic logging with minimal steps',
      icon: 'list',
      color: COLORS.success,
      description: 'Quick form with essential fields only',
    },
    {
      type: 'advanced' as const,
      title: 'Advanced Log',
      subtitle: 'Detailed logging with sets and reps',
      icon: 'settings',
      color: COLORS.warning,
      description: 'Full logging for serious tracking',
    },
  ];

  const renderLogger = () => {
    switch (selectedLogger) {
      case 'quick':
        return (
          <QuickWorkoutLogger
            visible={true}
            onClose={handleClose}
            onSave={handleSave}
          />
        );
      case 'voice':
        return (
          <VoiceWorkoutLogger
            visible={true}
            onClose={handleClose}
            onSave={handleSave}
          />
        );
      case 'simple':
        return (
          <SimpleWorkoutLogger
            visible={true}
            onClose={handleClose}
            onSave={handleSave}
          />
        );
      case 'advanced':
        // For now, redirect to simple logger
        // In the future, this could be the original UnifiedWorkoutLogger
        return (
          <SimpleWorkoutLogger
            visible={true}
            onClose={handleClose}
            onSave={handleSave}
          />
        );
      default:
        return null;
    }
  };

  if (selectedLogger) {
    return renderLogger();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Log Workout</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Subtitle */}
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>
            Choose how you'd like to log your workout
          </Text>
        </View>

        {/* Logger Options */}
        <View style={styles.optionsContainer}>
          {loggerOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionCard}
              onPress={() => setSelectedLogger(option.type)}
            >
              <View style={[styles.optionIcon, { backgroundColor: option.color + '20' }]}>
                <Ionicons 
                  name={option.icon as keyof typeof Ionicons.glyphMap} 
                  size={28} 
                  color={option.color} 
                />
              </View>
              
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>

              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={COLORS.text.tertiary} 
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Quick Tips</Text>
          <Text style={styles.tipText}>• Use Quick Log for common workouts</Text>
          <Text style={styles.tipText}>• Voice Log works great while exercising</Text>
          <Text style={styles.tipText}>• Any logging is better than no logging!</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.large,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text.primary,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  subtitleContainer: {
    padding: SPACING.large,
    paddingBottom: SPACING.medium,
  },
  subtitle: {
    fontSize: FONT_SIZE.medium,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  optionsContainer: {
    flex: 1,
    padding: SPACING.large,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.large,
    marginBottom: SPACING.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.medium,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: FONT_SIZE.large,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  optionSubtitle: {
    fontSize: FONT_SIZE.medium,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  optionDescription: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.tertiary,
  },
  tipsContainer: {
    backgroundColor: COLORS.background,
    margin: SPACING.large,
    padding: SPACING.medium,
    borderRadius: BORDER_RADIUS.medium,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  tipsTitle: {
    fontSize: FONT_SIZE.medium,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.small,
  },
  tipText: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
});
