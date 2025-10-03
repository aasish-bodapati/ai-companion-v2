import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingData, HealthData } from '../../services/onboardingService';
import { hapticFeedback } from '../../utils/haptics';
import { showToast } from '../../utils/toast';

interface EditPreferencesModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: OnboardingData) => void;
  initialData: OnboardingData | null;
}

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
  { value: 'light', label: 'Light', description: 'Light exercise 1-3 days/week' },
  { value: 'moderate', label: 'Moderate', description: 'Moderate exercise 3-5 days/week' },
  { value: 'active', label: 'Active', description: 'Heavy exercise 6-7 days/week' },
  { value: 'very_active', label: 'Very Active', description: 'Very heavy exercise, physical job' },
];

const GOAL_OPTIONS = [
  'Weight Loss',
  'Muscle Gain',
  'Better Health',
  'Increased Energy',
  'Better Sleep',
  'Stress Reduction',
  'Improved Fitness',
  'Better Nutrition',
  'Habit Building',
  'General Wellness',
];

export default function EditPreferencesModal({
  visible,
  onClose,
  onSave,
  initialData,
}: EditPreferencesModalProps) {
  const [healthData, setHealthData] = useState<HealthData>({
    age: '',
    height: '',
    weight: '',
    gender: 'male',
    activityLevel: 'moderate',
  });
  
  const [goals, setGoals] = useState<string[]>([]);
  const [preferences, setPreferences] = useState({
    notifications: true,
    reminders: true,
    dataSharing: false,
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && initialData) {
      console.log('📝 EditPreferencesModal: Populating with data:', initialData);
      setHealthData(initialData.healthData || {
        age: '',
        height: '',
        weight: '',
        gender: 'male',
        activityLevel: 'moderate',
      });
      setGoals(initialData.goals || []);
      setPreferences(initialData.preferences || {
        notifications: true,
        reminders: true,
        dataSharing: false,
      });
    } else if (visible && !initialData) {
      console.log('📝 EditPreferencesModal: No initial data available, using defaults');
    }
  }, [visible, initialData]);

  const handleSave = async () => {
    try {
      setLoading(true);
      hapticFeedback.medium();

      // Validate required fields
      if (!healthData.age || !healthData.height || !healthData.weight) {
        showToast.error('Error', 'Please fill in all health data fields');
        return;
      }

      if (goals.length === 0) {
        showToast.error('Error', 'Please select at least one goal');
        return;
      }

      const updatedData: OnboardingData = {
        healthData,
        goals,
        preferences,
      };

      await onSave(updatedData);
      showToast.success('Success', 'Preferences updated successfully');
      onClose();
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      showToast.error('Error', 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const toggleGoal = (goal: string) => {
    setGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleClose = () => {
    hapticFeedback.light();
    onClose();
  };

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
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Preferences</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Health Data Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={healthData.age}
                onChangeText={(text) => setHealthData(prev => ({ ...prev, age: text }))}
                placeholder="Enter your age"
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={healthData.height}
                onChangeText={(text) => setHealthData(prev => ({ ...prev, height: text }))}
                placeholder="Enter your height"
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={healthData.weight}
                onChangeText={(text) => setHealthData(prev => ({ ...prev, weight: text }))}
                placeholder="Enter your weight"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.optionGroup}>
                {GENDER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      healthData.gender === option.value && styles.optionButtonSelected,
                    ]}
                    onPress={() => setHealthData(prev => ({ ...prev, gender: option.value as any }))}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        healthData.gender === option.value && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Activity Level</Text>
              <View style={styles.activityGroup}>
                {ACTIVITY_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.activityButton,
                      healthData.activityLevel === level.value && styles.activityButtonSelected,
                    ]}
                    onPress={() => setHealthData(prev => ({ ...prev, activityLevel: level.value as any }))}
                  >
                    <Text
                      style={[
                        styles.activityTitle,
                        healthData.activityLevel === level.value && styles.activityTitleSelected,
                      ]}
                    >
                      {level.label}
                    </Text>
                    <Text
                      style={[
                        styles.activityDescription,
                        healthData.activityLevel === level.value && styles.activityDescriptionSelected,
                      ]}
                    >
                      {level.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Goals Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health Goals</Text>
            <Text style={styles.sectionSubtitle}>Select all that apply</Text>
            
            <View style={styles.goalsGrid}>
              {GOAL_OPTIONS.map((goal) => (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.goalButton,
                    goals.includes(goal) && styles.goalButtonSelected,
                  ]}
                  onPress={() => toggleGoal(goal)}
                >
                  <Text
                    style={[
                      styles.goalText,
                      goals.includes(goal) && styles.goalTextSelected,
                    ]}
                  >
                    {goal}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Preferences</Text>
            
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Push Notifications</Text>
                <Text style={styles.preferenceDescription}>
                  Receive reminders and updates
                </Text>
              </View>
              <Switch
                value={preferences.notifications}
                onValueChange={(value) => setPreferences(prev => ({ ...prev, notifications: value }))}
                trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                thumbColor={preferences.notifications ? '#ffffff' : '#f3f4f6'}
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Reminders</Text>
                <Text style={styles.preferenceDescription}>
                  Get reminded to log activities
                </Text>
              </View>
              <Switch
                value={preferences.reminders}
                onValueChange={(value) => setPreferences(prev => ({ ...prev, reminders: value }))}
                trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                thumbColor={preferences.reminders ? '#ffffff' : '#f3f4f6'}
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Data Sharing</Text>
                <Text style={styles.preferenceDescription}>
                  Help improve the app with anonymous data
                </Text>
              </View>
              <Switch
                value={preferences.dataSharing}
                onValueChange={(value) => setPreferences(prev => ({ ...prev, dataSharing: value }))}
                trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                thumbColor={preferences.dataSharing ? '#ffffff' : '#f3f4f6'}
              />
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
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  optionGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  optionTextSelected: {
    color: '#ffffff',
  },
  activityGroup: {
    gap: 8,
  },
  activityButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
  },
  activityButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  activityTitleSelected: {
    color: '#ffffff',
  },
  activityDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  activityDescriptionSelected: {
    color: '#e5e7eb',
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  goalButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  goalText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  goalTextSelected: {
    color: '#ffffff',
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 16,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
});
