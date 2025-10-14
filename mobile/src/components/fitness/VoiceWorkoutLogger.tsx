/**
 * VoiceWorkoutLogger - Voice input for hands-free logging
 * Perfect for busy professionals on-the-go
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../../contexts/ToastContext';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../theme/constants';

interface VoiceWorkoutLoggerProps {
  visible: boolean;
  onClose: () => void;
  onSave: (workout: any) => void;
}

interface VoiceCommand {
  text: string;
  action: () => void;
  icon: keyof typeof Ionicons.glyphMap;
}

const VOICE_COMMANDS: VoiceCommand[] = [
  {
    text: "Log 30 minutes running",
    action: () => logWorkout('Running', 30, 300, 'cardio'),
    icon: 'walk'
  },
  {
    text: "Log 45 minutes weight training",
    action: () => logWorkout('Weight Training', 45, 250, 'strength'),
    icon: 'barbell'
  },
  {
    text: "Log 20 minutes yoga",
    action: () => logWorkout('Yoga', 20, 100, 'flexibility'),
    icon: 'leaf'
  },
  {
    text: "Log 60 minutes cycling",
    action: () => logWorkout('Cycling', 60, 400, 'cardio'),
    icon: 'bicycle'
  },
  {
    text: "Log 15 minutes push-ups",
    action: () => logWorkout('Push-ups', 15, 100, 'strength'),
    icon: 'fitness'
  },
  {
    text: "Log 30 minutes swimming",
    action: () => logWorkout('Swimming', 30, 350, 'cardio'),
    icon: 'water'
  },
];

export default function VoiceWorkoutLogger({ visible, onClose, onSave }: VoiceWorkoutLoggerProps) {
  const { showToast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (isListening) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [isListening]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const logWorkout = async (name: string, duration: number, calories: number, type: string) => {
    try {
      setLoading(true);
      
      const workoutData = {
        name,
        duration,
        calories_burned: calories,
        activity_type: type,
        activity_date: new Date().toISOString(),
        notes: `Voice logged: ${name}`,
      };

      await onSave(workoutData);
      showToast.success(`${name} logged!`);
      onClose();
    } catch (error) {
      showToast.error('Failed to log workout', 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceCommand = (command: VoiceCommand) => {
    if (loading) return;
    command.action();
  };

  const handleManualEntry = () => {
    Alert.alert(
      'Manual Entry',
      'For detailed logging, use the Simple Workout Logger instead.',
      [{ text: 'OK' }]
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Voice Log Workout</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Voice Commands */}
        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Tap a command to log instantly, or use voice input
          </Text>

          <View style={styles.commandsList}>
            {VOICE_COMMANDS.map((command, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.commandCard,
                  loading && styles.disabledCard
                ]}
                onPress={() => handleVoiceCommand(command)}
                disabled={loading}
              >
                <View style={styles.commandIcon}>
                  <Ionicons 
                    name={command.icon} 
                    size={24} 
                    color={loading ? COLORS.text.secondary : COLORS.primary} 
                  />
                </View>
                <Text style={[
                  styles.commandText,
                  loading && styles.disabledText
                ]}>
                  {command.text}
                </Text>
                <Ionicons 
                  name="chevron-forward" 
                  size={16} 
                  color={loading ? COLORS.text.secondary : COLORS.text.tertiary} 
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Voice Input Button */}
          <TouchableOpacity
            style={[
              styles.voiceButton,
              isListening && styles.listeningButton
            ]}
            onPress={() => setIsListening(!isListening)}
            disabled={loading}
          >
            <Animated.View style={[
              styles.voiceIconContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}>
              <Ionicons 
                name={isListening ? "stop" : "mic"} 
                size={32} 
                color={COLORS.white} 
              />
            </Animated.View>
            <Text style={styles.voiceButtonText}>
              {isListening ? 'Listening...' : 'Tap to speak'}
            </Text>
          </TouchableOpacity>

          {/* Manual Entry Option */}
          <TouchableOpacity
            style={styles.manualButton}
            onPress={handleManualEntry}
            disabled={loading}
          >
            <Ionicons name="create" size={20} color={COLORS.primary} />
            <Text style={styles.manualButtonText}>Manual Entry</Text>
          </TouchableOpacity>
        </View>

        {/* Status */}
        {loading && (
          <View style={styles.statusBar}>
            <Text style={styles.statusText}>Saving workout...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.large,
    margin: SPACING.medium,
    maxWidth: 400,
    width: '90%',
    maxHeight: '80%',
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
  content: {
    padding: SPACING.large,
  },
  subtitle: {
    fontSize: FONT_SIZE.medium,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.large,
  },
  commandsList: {
    marginBottom: SPACING.large,
  },
  commandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
    marginBottom: SPACING.small,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  disabledCard: {
    opacity: 0.5,
  },
  commandIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.medium,
  },
  commandText: {
    flex: 1,
    fontSize: FONT_SIZE.medium,
    color: COLORS.text.primary,
  },
  disabledText: {
    color: COLORS.text.secondary,
  },
  voiceButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.large,
    alignItems: 'center',
    marginBottom: SPACING.medium,
  },
  listeningButton: {
    backgroundColor: COLORS.error,
  },
  voiceIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.small,
  },
  voiceButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.medium,
    fontWeight: FONT_WEIGHT.semibold,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.medium,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.medium,
    gap: SPACING.xs,
  },
  manualButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.medium,
    fontWeight: FONT_WEIGHT.medium,
  },
  statusBar: {
    backgroundColor: COLORS.background,
    padding: SPACING.medium,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  statusText: {
    color: COLORS.text.secondary,
    fontSize: FONT_SIZE.small,
  },
});
