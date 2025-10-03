import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { routineService, CreateRoutineData } from '../../services/routineService';

interface CreateRoutineModalProps {
  isVisible: boolean;
  onClose: () => void;
  onRoutineCreated: () => void;
}

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner', color: '#22c55e' },
  { value: 'intermediate', label: 'Intermediate', color: '#f59e0b' },
  { value: 'advanced', label: 'Advanced', color: '#ef4444' },
];

const DURATION_OPTIONS = [
  { value: 2, label: '2 weeks' },
  { value: 4, label: '4 weeks' },
  { value: 6, label: '6 weeks' },
  { value: 8, label: '8 weeks' },
  { value: 12, label: '12 weeks' },
];

export default function CreateRoutineModal({
  isVisible,
  onClose,
  onRoutineCreated,
}: CreateRoutineModalProps) {
  const [routineName, setRoutineName] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setRoutineName('');
    setRoutineDescription('');
    setDifficulty('beginner');
    setDurationWeeks(4);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    if (!routineName.trim()) {
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }

    try {
      setLoading(true);

      const routineData: CreateRoutineData = {
        name: routineName.trim(),
        description: routineDescription.trim() || `Custom ${difficulty} routine`,
        difficulty,
        duration_weeks: durationWeeks,
      };

      await routineService.createRoutine(routineData);
      
      Alert.alert('Success', 'Routine created successfully!');
      resetForm();
      onClose();
      onRoutineCreated();
    } catch (err: any) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      Alert.alert('Error', err.response?.data?.detail || err.message || 'Failed to create routine');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyIcon = (diff: string) => {
    switch (diff) {
      case 'beginner':
        return 'leaf-outline';
      case 'intermediate':
        return 'flame-outline';
      case 'advanced':
        return 'flash-outline';
      default:
        return 'help-outline';
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} disabled={loading}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Routine</Text>
          <TouchableOpacity
            onPress={handleCreate}
            disabled={loading || !routineName.trim()}
            style={[
              styles.createButton,
              (!routineName.trim() || loading) && styles.createButtonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Create</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Routine Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Routine Name *</Text>
            <TextInput
              style={styles.input}
              value={routineName}
              onChangeText={setRoutineName}
              placeholder="Enter routine name"
              placeholderTextColor="#9ca3af"
              maxLength={100}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={routineDescription}
              onChangeText={setRoutineDescription}
              placeholder="Enter routine description (optional)"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              maxLength={500}
            />
            <Text style={styles.characterCount}>
              {routineDescription.length}/500
            </Text>
          </View>

          {/* Difficulty */}
          <View style={styles.section}>
            <Text style={styles.label}>Difficulty Level</Text>
            <View style={styles.optionsContainer}>
              {DIFFICULTY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    difficulty === option.value && styles.optionButtonSelected,
                    { borderColor: option.color },
                  ]}
                  onPress={() => setDifficulty(option.value as any)}
                >
                  <Ionicons
                    name={getDifficultyIcon(option.value)}
                    size={20}
                    color={difficulty === option.value ? '#fff' : option.color}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      difficulty === option.value && styles.optionTextSelected,
                      { color: difficulty === option.value ? '#fff' : option.color },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Duration */}
          <View style={styles.section}>
            <Text style={styles.label}>Duration</Text>
            <View style={styles.optionsContainer}>
              {DURATION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    styles.durationOption,
                    durationWeeks === option.value && styles.optionButtonSelected,
                  ]}
                  onPress={() => setDurationWeeks(option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      durationWeeks === option.value && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Preview */}
          <View style={styles.section}>
            <Text style={styles.label}>Preview</Text>
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>
                {routineName || 'Routine Name'}
              </Text>
              <Text style={styles.previewDescription}>
                {routineDescription || `Custom ${difficulty} routine`}
              </Text>
              <View style={styles.previewDetails}>
                <View style={styles.previewDetail}>
                  <Ionicons
                    name={getDifficultyIcon(difficulty)}
                    size={16}
                    color={DIFFICULTY_OPTIONS.find(o => o.value === difficulty)?.color || '#6b7280'}
                  />
                  <Text style={styles.previewDetailText}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </Text>
                </View>
                <View style={styles.previewDetail}>
                  <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                  <Text style={styles.previewDetailText}>
                    {durationWeeks} weeks
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  createButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  optionButtonSelected: {
    backgroundColor: '#f97316',
  },
  durationOption: {
    borderColor: '#d1d5db',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  optionTextSelected: {
    color: '#fff',
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  previewDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  previewDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewDetailText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    fontWeight: '500',
  },
});
