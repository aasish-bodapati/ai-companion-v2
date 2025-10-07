import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Removed unused service imports

const { width } = Dimensions.get('window');

interface UniversalHealthLoggerProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void;
  type: 'workout' | 'meal' | 'water' | 'mood';
  initialData?: Record<string, unknown>;
}

export default function UniversalHealthLogger({
  visible,
  onClose,
  onSave,
  type,
  initialData,
}: UniversalHealthLoggerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const getSteps = () => {
    switch (type) {
      case 'workout':
        return [
          { title: 'Workout Details', icon: 'fitness' },
          { title: 'Add Exercises', icon: 'add-circle' },
          { title: 'Log Sets', icon: 'list' },
          { title: 'Review & Save', icon: 'checkmark' },
        ];
      case 'meal':
        return [
          { title: 'Meal Type', icon: 'restaurant' },
          { title: 'Add Foods', icon: 'add-circle' },
          { title: 'Quantities', icon: 'scale' },
          { title: 'Review & Save', icon: 'checkmark' },
        ];
      case 'water':
        return [
          { title: 'Water Intake', icon: 'water' },
          { title: 'Review & Save', icon: 'checkmark' },
        ];
      case 'mood':
        return [
          { title: 'Mood Check', icon: 'happy' },
          { title: 'Review & Save', icon: 'checkmark' },
        ];
      default:
        return [];
    }
  };

  const steps = getSteps();

  useEffect(() => {
    if (visible) {
      initializeData();
    }
  }, [visible, type]);

  const initializeData = () => {
    const baseData = {
      date: new Date().toISOString().split('T')[0],
      logged_at: new Date().toISOString(),
    };

    switch (type) {
      case 'workout':
        setData({
          ...baseData,
          name: '',
          duration: 0,
          calories_burned: 0,
          notes: '',
          sets: [],
          ...initialData,
        });
        break;
      case 'meal':
        setData({
          ...baseData,
          meal_type: 'breakfast',
          food_items: [],
          total_calories: 0,
          total_protein: 0,
          total_carbs: 0,
          total_fat: 0,
          notes: '',
          ...initialData,
        });
        break;
      case 'water':
        setData({
          ...baseData,
          amount: 0,
          unit: 'liters',
          ...initialData,
        });
        break;
      case 'mood':
        setData({
          ...baseData,
          mood_score: 5,
          energy_level: 5,
          stress_level: 5,
          notes: '',
          ...initialData,
        });
        break;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await onSave(data);
      onClose();
      resetForm();
    } catch (error) {
      Alert.alert('Error', `Failed to save ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setData({});
  };

  const renderStepContent = () => {
    switch (type) {
      case 'workout':
        return renderWorkoutSteps();
      case 'meal':
        return renderMealSteps();
      case 'water':
        return renderWaterSteps();
      case 'mood':
        return renderMoodSteps();
      default:
        return null;
    }
  };

  const renderWorkoutSteps = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Workout Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Workout Name</Text>
              <TextInput
                style={styles.input}
                value={data.name || ''}
                onChangeText={(text) => setData((prev: Record<string, unknown>) => ({ ...prev, name: text }))}
                placeholder="Enter workout name"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Duration (min)</Text>
                <TextInput
                  style={styles.input}
                  value={data.duration?.toString() || '0'}
                  onChangeText={(text) => setData((prev: Record<string, unknown>) => ({ 
                    ...prev, 
                    duration: parseInt(text) || 0 
                  }))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Calories Burned</Text>
                <TextInput
                  style={styles.input}
                  value={data.calories_burned?.toString() || '0'}
                  onChangeText={(text) => setData((prev: Record<string, unknown>) => ({ 
                    ...prev, 
                    calories_burned: parseInt(text) || 0 
                  }))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={data.notes || ''}
                onChangeText={(text) => setData((prev: Record<string, unknown>) => ({ ...prev, notes: text }))}
                placeholder="Add any notes about your workout"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Add Exercises</Text>
            <Text style={styles.placeholderText}>Exercise selection will be implemented here</Text>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Log Sets</Text>
            <Text style={styles.placeholderText}>Set logging will be implemented here</Text>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Review & Save</Text>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>{data.name || 'Workout'}</Text>
              <Text style={styles.reviewDate}>{data.date}</Text>
              
              <View style={styles.reviewStats}>
                <View style={styles.reviewStat}>
                  <Text style={styles.reviewStatValue}>{data.duration || 0}</Text>
                  <Text style={styles.reviewStatLabel}>Minutes</Text>
                </View>
                <View style={styles.reviewStat}>
                  <Text style={styles.reviewStatValue}>{data.calories_burned || 0}</Text>
                  <Text style={styles.reviewStatLabel}>Calories</Text>
                </View>
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  const renderMealSteps = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Select Meal Type</Text>
            
            <View style={styles.mealTypeGrid}>
              {[
                { type: 'breakfast', label: 'Breakfast', icon: 'sunny', color: '#f59e0b' },
                { type: 'lunch', label: 'Lunch', icon: 'sunny', color: '#10b981' },
                { type: 'dinner', label: 'Dinner', icon: 'moon', color: '#3b82f6' },
                { type: 'snack', label: 'Snack', icon: 'cafe', color: '#8b5cf6' },
              ].map((mealType) => (
                <TouchableOpacity
                  key={mealType.type}
                  style={[
                    styles.mealTypeCard,
                    { 
                      borderColor: data.meal_type === mealType.type ? mealType.color : '#e5e7eb',
                      backgroundColor: data.meal_type === mealType.type ? mealType.color + '10' : '#ffffff',
                    }
                  ]}
                  onPress={() => setData((prev: Record<string, unknown>) => ({ ...prev, meal_type: mealType.type }))}
                >
                  <Ionicons 
                    name={mealType.icon as any} 
                    size={32} 
                    color={mealType.color} 
                  />
                  <Text style={[
                    styles.mealTypeLabel,
                    { color: data.meal_type === mealType.type ? mealType.color : '#6b7280' }
                  ]}>
                    {mealType.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Add Foods</Text>
            <Text style={styles.placeholderText}>Food selection will be implemented here</Text>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Adjust Quantities</Text>
            <Text style={styles.placeholderText}>Quantity adjustment will be implemented here</Text>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Review & Save</Text>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>
                {data.meal_type ? data.meal_type.charAt(0).toUpperCase() + data.meal_type.slice(1) : 'Meal'}
              </Text>
              <Text style={styles.reviewDate}>{data.date}</Text>
              
              <View style={styles.reviewStats}>
                <View style={styles.reviewStat}>
                  <Text style={styles.reviewStatValue}>{data.total_calories || 0}</Text>
                  <Text style={styles.reviewStatLabel}>Calories</Text>
                </View>
                <View style={styles.reviewStat}>
                  <Text style={styles.reviewStatValue}>{data.total_protein || 0}g</Text>
                  <Text style={styles.reviewStatLabel}>Protein</Text>
                </View>
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  const renderWaterSteps = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Water Intake</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount</Text>
              <View style={styles.waterInputContainer}>
                <TextInput
                  style={styles.waterInput}
                  value={data.amount?.toString() || '0'}
                  onChangeText={(text) => setData((prev: Record<string, unknown>) => ({ 
                    ...prev, 
                    amount: parseFloat(text) || 0 
                  }))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                />
                <Text style={styles.waterUnit}>Liters</Text>
              </View>
            </View>

            <View style={styles.quickAmounts}>
              {[0.25, 0.5, 1.0, 1.5, 2.0].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.quickAmountButton,
                    { backgroundColor: data.amount === amount ? '#3b82f6' : '#f3f4f6' }
                  ]}
                  onPress={() => setData((prev: Record<string, unknown>) => ({ ...prev, amount }))}
                >
                  <Text style={[
                    styles.quickAmountText,
                    { color: data.amount === amount ? '#ffffff' : '#6b7280' }
                  ]}>
                    {amount}L
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Review & Save</Text>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>Water Intake</Text>
              <Text style={styles.reviewDate}>{data.date}</Text>
              
              <View style={styles.reviewStats}>
                <View style={styles.reviewStat}>
                  <Text style={styles.reviewStatValue}>{data.amount || 0}</Text>
                  <Text style={styles.reviewStatLabel}>Liters</Text>
                </View>
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  const renderMoodSteps = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Mood Check</Text>
            
            <View style={styles.moodContainer}>
              <Text style={styles.moodLabel}>How are you feeling?</Text>
              <View style={styles.moodSlider}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <TouchableOpacity
                    key={score}
                    style={[
                      styles.moodButton,
                      { backgroundColor: data.mood_score === score ? '#3b82f6' : '#f3f4f6' }
                    ]}
                    onPress={() => setData((prev: Record<string, unknown>) => ({ ...prev, mood_score: score }))}
                  >
                    <Text style={[
                      styles.moodButtonText,
                      { color: data.mood_score === score ? '#ffffff' : '#6b7280' }
                    ]}>
                      {score}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.moodDescription}>
                {data.mood_score <= 3 ? 'Not great' : 
                 data.mood_score <= 6 ? 'Okay' : 
                 data.mood_score <= 8 ? 'Good' : 'Excellent'}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={data.notes || ''}
                onChangeText={(text) => setData((prev: Record<string, unknown>) => ({ ...prev, notes: text }))}
                placeholder="How are you feeling today?"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Review & Save</Text>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>Mood Check</Text>
              <Text style={styles.reviewDate}>{data.date}</Text>
              
              <View style={styles.reviewStats}>
                <View style={styles.reviewStat}>
                  <Text style={styles.reviewStatValue}>{data.mood_score || 0}</Text>
                  <Text style={styles.reviewStatLabel}>Mood Score</Text>
                </View>
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Log {type.charAt(0).toUpperCase() + type.slice(1)}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Progress Steps */}
        <View style={styles.progressContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepContainer}>
              <View style={[
                styles.stepCircle,
                { backgroundColor: index <= currentStep ? '#3b82f6' : '#e5e7eb' }
              ]}>
                <Ionicons 
                  name={step.icon as any} 
                  size={16} 
                  color={index <= currentStep ? '#ffffff' : '#6b7280'} 
                />
              </View>
              <Text style={[
                styles.stepText,
                { color: index <= currentStep ? '#3b82f6' : '#6b7280' }
              ]}>
                {step.title}
              </Text>
            </View>
          ))}
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderStepContent()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handlePrevious}
            >
              <Text style={styles.secondaryButtonText}>Previous</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              { flex: currentStep === 0 ? 1 : 0.6 }
            ]}
            onPress={currentStep === steps.length - 1 ? handleSave : handleNext}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {currentStep === steps.length - 1 ? 'Save' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
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
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  placeholder: {
    width: 32,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  mealTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mealTypeCard: {
    width: (width - 64) / 2,
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'solid',
  },
  mealTypeLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  waterInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  waterInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  waterUnit: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 8,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  quickAmountButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '500',
  },
  moodContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 16,
  },
  moodSlider: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  moodButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  moodDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  reviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  reviewStat: {
    alignItems: 'center',
  },
  reviewStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  reviewStatLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  placeholderText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 40,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
});
