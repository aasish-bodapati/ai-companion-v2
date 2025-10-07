import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { fitnessService, ExerciseData } from '../../services/fitnessService';
import { exerciseCategoryService } from '../../services/exerciseCategoryService';
import DynamicExerciseForm from './DynamicExerciseForm';
import { hapticFeedback } from '../../utils/haptics';
import { COMMON_STYLES } from '../../theme/constants';
import { useExerciseCategoriesWithAutoLoad } from '../../stores';

const { width } = Dimensions.get('window');

interface WorkoutData {
  activity_type: string;
  activity_name?: string;
  duration_minutes: number;
  calories_burned?: number;
  exercises: string; // JSON string as expected by backend
  unit?: string;
  notes?: string;
  photos?: string[];
  activity_date?: string;
}

interface EnhancedWorkoutLoggerProps {
  visible: boolean;
  onClose: () => void;
  onWorkoutLogged: () => void;
  initialActivityType?: string;
  todaysWorkout?: any;
}

export default function EnhancedWorkoutLogger({
  visible,
  onClose,
  onWorkoutLogged,
  initialActivityType = 'weightlifting',
  todaysWorkout,
}: EnhancedWorkoutLoggerProps) {
  const [activityType, setActivityType] = useState(initialActivityType);
  const [activityName, setActivityName] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [unit, setUnit] = useState('kg');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Use exercise categories store
  const { categories } = useExerciseCategoriesWithAutoLoad();

  const getCategoryForActivityType = (activityType: string): string => {
    // Map activity types to database categories
    if (activityType === 'weightlifting') return 'weighted';
    if (['cardio', 'running', 'cycling', 'swimming'].includes(activityType)) return 'distance_based';
    if (activityType === 'yoga') return 'cardio_duration';
    return 'bodyweight'; // Default fallback
  };
  const [currentStep, setCurrentStep] = useState(1);
  const [showExerciseForm, setShowExerciseForm] = useState(false);

  const activityTypes = [
    { key: 'weightlifting', label: 'Weightlifting', icon: 'barbell-outline', color: '#3b82f6' },
    { key: 'cardio', label: 'Cardio', icon: 'heart-outline', color: '#ef4444' },
    { key: 'yoga', label: 'Yoga', icon: 'leaf-outline', color: '#10b981' },
    { key: 'running', label: 'Running', icon: 'walk-outline', color: '#f59e0b' },
    { key: 'cycling', label: 'Cycling', icon: 'bicycle-outline', color: '#8b5cf6' },
    { key: 'swimming', label: 'Swimming', icon: 'water-outline', color: '#06b6d4' },
    { key: 'other', label: 'Other', icon: 'fitness-outline', color: '#6b7280' },
  ] as const;

  const steps = [
    { id: 1, title: 'Activity Type', icon: 'fitness-outline' },
    { id: 2, title: 'Details', icon: 'list-outline' },
    { id: 3, title: 'Exercises', icon: 'barbell-outline' },
    { id: 4, title: 'Photos', icon: 'camera-outline' },
    { id: 5, title: 'Review', icon: 'checkmark-outline' },
  ];

  useEffect(() => {
    if (visible) {
      if (todaysWorkout) {
        setActivityType('weightlifting');
        setActivityName(todaysWorkout.workout_name);
        setDuration(todaysWorkout.estimated_duration.toString());
        setExercises(todaysWorkout.exercises || []);
        setCurrentStep(2); // Skip activity type selection
      } else {
        resetForm();
      }
    }
  }, [visible, todaysWorkout, initialActivityType]);

  const resetForm = () => {
    setActivityType(initialActivityType);
    setActivityName('');
    setDuration('');
    setCalories('');
    setNotes('');
    setExercises([]);
    setPhotos([]);
    setCurrentStep(1);
  };

  const addExercise = () => {
    const newExercise: ExerciseData = {
      exercise_name: '',
      sets: 1,
      reps: '10',
      weight_used: 0,
      weight_unit: 'kg', // Default to kg (hidden in UI)
      distance_unit: 'km', // Default to km (hidden in UI)
      category: getCategoryForActivityType(activityType)
    };
    setExercises(prev => [...prev, newExercise]);
    setShowExerciseForm(true);
  };

  const handleExerciseNameChange = async (index: number, exerciseName: string) => {
    // Update the exercise name
    updateExercise(index, { exercise_name: exerciseName });
    
    // If exercise name is not empty, try to get previous data
    if (exerciseName.trim()) {
      try {
        const latestData = await fitnessService.getLatestExerciseData(exerciseName.trim());
        if (latestData) {
          console.log(`🔄 [ENHANCED WORKOUT LOGGER] Auto-populating data for ${exerciseName}:`, latestData);
          
          // Auto-populate the exercise with previous data
          updateExercise(index, {
            sets: latestData.sets || 1,
            reps: latestData.reps || '10',
            weight_used: latestData.weight_kg || 0,
            notes: latestData.notes || ''
          });
          
          // Show a subtle indication that data was auto-populated
          hapticFeedback.light();
        }
      } catch (error) {
        console.log(`🔍 [ENHANCED WORKOUT LOGGER] No previous data found for ${exerciseName}`);
      }
    }
  };

  const updateExercise = (index: number, updates: Partial<ExerciseData>) => {
    setExercises(prev => prev.map((exercise, i) => 
      i === index ? { ...exercise, ...updates } : exercise
    ));
  };

  const updateExerciseField = (index: number, field: keyof ExerciseData, value: any) => {
    setExercises(prev => prev.map((exercise, i) => 
      i === index ? { ...exercise, [field]: value } : exercise
    ));
  };

  const removeExercise = (index: number) => {
    hapticFeedback.light();
    setExercises(prev => prev.filter((_, i) => i !== index));
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        hapticFeedback.success();
        setPhotos(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const selectFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Photo library permission is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        hapticFeedback.success();
        setPhotos(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const removePhoto = (index: number) => {
    hapticFeedback.light();
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const isFormValid = () => {
    return activityType && duration && !isNaN(Number(duration)) && Number(duration) > 0;
  };

  const handleSaveWorkout = async () => {
    if (!isFormValid()) {
      Alert.alert('Incomplete Workout', 'Please fill in all required fields.');
      return;
    }

    if (saving) {
      console.log('🚫 [ENHANCED WORKOUT LOGGER] Save already in progress, ignoring duplicate request');
      return;
    }

    try {
      setSaving(true);
      hapticFeedback.success();

      const workoutData: WorkoutData = {
        activity_type: activityType,
        activity_name: activityName.trim() || undefined,
        duration_minutes: Number(duration),
        calories_burned: calories ? Number(calories) : undefined,
        exercises: JSON.stringify(exercises.filter(ex => ex.exercise_name.trim())),
        unit: unit,
        notes: notes.trim() || undefined,
        photos: photos.length > 0 ? photos : undefined,
        activity_date: new Date().toISOString(),
      };

      await fitnessService.logWorkout(workoutData);

      Alert.alert(
        'Workout Logged! 🎉',
        `Great job completing your ${activityType} workout!`,
        [
          {
            text: 'OK',
            onPress: () => {
              onWorkoutLogged();
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      hapticFeedback.error();
      Alert.alert('Error', 'Failed to log workout. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    hapticFeedback.light();
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    hapticFeedback.light();
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateTotalSets = () => {
    return exercises.reduce((total, exercise) => total + (Number(exercise.sets) || 0), 0);
  };

  const calculateEstimatedCalories = () => {
    if (calories) return Number(calories);
    
    const durationHours = Number(duration) / 60;
    const baseCaloriesPerHour = {
      weightlifting: 300,
      cardio: 500,
      yoga: 200,
      running: 600,
      cycling: 500,
      swimming: 600,
      other: 400,
    };
    
    return Math.round((baseCaloriesPerHour[activityType as keyof typeof baseCaloriesPerHour] || 400) * durationHours);
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {steps.map((step, index) => (
        <View key={step.id} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            currentStep >= step.id && styles.stepCircleActive
          ]}>
            <Ionicons 
              name={step.icon as any} 
              size={16} 
              color={currentStep >= step.id ? '#ffffff' : '#6b7280'} 
            />
          </View>
          <Text style={[
            styles.stepText,
            currentStep >= step.id && styles.stepTextActive
          ]}>
            {step.title}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderActivityTypeStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Choose Activity Type</Text>
      <Text style={styles.stepDescription}>Select the type of workout you're logging</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.activityTypeScroll}
      >
        {activityTypes.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.activityTypeButton,
              { backgroundColor: type.color + '20', borderColor: type.color },
              activityType === type.key && { backgroundColor: type.color }
            ]}
            onPress={() => {
              setActivityType(type.key);
              hapticFeedback.light();
            }}
          >
            <Ionicons 
              name={type.icon as any} 
              size={24} 
              color={activityType === type.key ? '#ffffff' : type.color} 
            />
            <Text style={[
              styles.activityTypeText,
              { color: activityType === type.key ? '#ffffff' : type.color }
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderDetailsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Workout Details</Text>
      <Text style={styles.stepDescription}>Enter the basic information about your workout</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Workout Name (Optional)</Text>
        <TextInput
          style={styles.input}
          value={activityName}
          onChangeText={setActivityName}
          placeholder="e.g., Upper Body Strength"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Duration (minutes) *</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            placeholder="60"
            keyboardType="numeric"
            placeholderTextColor="#9ca3af"
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
          <Text style={styles.inputLabel}>Calories (optional)</Text>
          <TextInput
            style={styles.input}
            value={calories}
            onChangeText={setCalories}
            placeholder={calculateEstimatedCalories().toString()}
            keyboardType="numeric"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {activityType === 'weightlifting' && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Weight Unit</Text>
          <View style={styles.unitSelector}>
            <TouchableOpacity
              style={[styles.unitButton, unit === 'kg' && styles.unitButtonActive]}
              onPress={() => setUnit('kg')}
            >
              <Text style={[styles.unitButtonText, unit === 'kg' && styles.unitButtonTextActive]}>
                kg
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitButton, unit === 'lbs' && styles.unitButtonActive]}
              onPress={() => setUnit('lbs')}
            >
              <Text style={[styles.unitButtonText, unit === 'lbs' && styles.unitButtonTextActive]}>
                lbs
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const renderExercisesStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Exercises</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={addExercise}
        >
          <Ionicons name="add" size={20} color="#3b82f6" />
          <Text style={styles.addButtonText}>Add Exercise</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.stepDescription}>
        {activityType === 'weightlifting' ? 'Add the exercises you performed' : 'Optional: Add specific exercises or activities'}
      </Text>

      {exercises.length === 0 ? (
        <View style={styles.emptyExercises}>
          <Ionicons name="barbell-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyText}>No exercises added</Text>
          <Text style={styles.emptySubtext}>Tap "Add Exercise" to get started</Text>
        </View>
      ) : (
        <ScrollView style={styles.exercisesList} showsVerticalScrollIndicator={false}>
          {exercises.map((exercise, index) => (
            <DynamicExerciseForm
              key={index}
              exercise={exercise}
              index={index}
              onUpdate={updateExerciseField}
              onRemove={removeExercise}
              activityType={activityType}
              showRemove={true}
            />
          ))}
        </ScrollView>
      )}

      {exercises.length > 0 && (
        <View style={styles.exerciseSummary}>
          <Text style={styles.exerciseSummaryText}>
            Total: {exercises.length} exercises, {calculateTotalSets()} sets
          </Text>
        </View>
      )}
    </View>
  );

  const renderPhotosStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Workout Photos</Text>
      <Text style={styles.stepDescription}>Add photos to document your workout (optional)</Text>
      
      <View style={styles.photoActions}>
        <TouchableOpacity style={styles.photoActionButton} onPress={takePhoto}>
          <Ionicons name="camera" size={24} color="#3b82f6" />
          <Text style={styles.photoActionText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.photoActionButton} onPress={selectFromGallery}>
          <Ionicons name="images" size={24} color="#10b981" />
          <Text style={styles.photoActionText}>From Gallery</Text>
        </TouchableOpacity>
      </View>

      {photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoItem}>
              <Image source={{ uri: photo }} style={styles.photo} />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => removePhoto(index)}
              >
                <Ionicons name="close" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Save</Text>
      <Text style={styles.stepDescription}>Review your workout details before saving</Text>
      
      <View style={styles.reviewCard}>
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Activity Type</Text>
          <Text style={styles.reviewValue}>
            {activityTypes.find(t => t.key === activityType)?.label}
          </Text>
        </View>
        
        {activityName && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>Workout Name</Text>
            <Text style={styles.reviewValue}>{activityName}</Text>
          </View>
        )}
        
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Duration</Text>
          <Text style={styles.reviewValue}>{duration} minutes</Text>
        </View>
        
        {calories && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>Calories</Text>
            <Text style={styles.reviewValue}>{calories} cal</Text>
          </View>
        )}
        
        {exercises.length > 0 && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>Exercises</Text>
            <Text style={styles.reviewValue}>{exercises.length} exercises, {calculateTotalSets()} sets</Text>
          </View>
        )}
        
        {photos.length > 0 && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>Photos</Text>
            <Text style={styles.reviewValue}>{photos.length} photos</Text>
          </View>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any notes about your workout..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderActivityTypeStep();
      case 2: return renderDetailsStep();
      case 3: return renderExercisesStep();
      case 4: return renderPhotosStep();
      case 5: return renderReviewStep();
      default: return renderActivityTypeStep();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>
                {todaysWorkout ? 'Log Today\'s Workout' : 'Log Workout'}
              </Text>
              <Text style={styles.subtitle}>Step {currentStep} of {steps.length}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {renderCurrentStep()}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.actionButtons}>
              {currentStep > 1 && (
                <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                  <Ionicons name="chevron-back" size={20} color="#6b7280" />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}
              
              {currentStep < steps.length ? (
                <TouchableOpacity
                  style={[styles.nextButton, !isFormValid() && styles.nextButtonDisabled]}
                  onPress={nextStep}
                  disabled={!isFormValid()}
                >
                  <Text style={[styles.nextButtonText, !isFormValid() && styles.nextButtonTextDisabled]}>
                    Next
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={isFormValid() ? '#ffffff' : '#9ca3af'} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.saveButton, (saving || !isFormValid()) && styles.saveButtonDisabled]}
                  onPress={handleSaveWorkout}
                  disabled={saving || !isFormValid()}
                >
                  <Text style={[styles.saveButtonText, (saving || !isFormValid()) && styles.saveButtonTextDisabled]}>
                    {saving ? 'Logging...' : 'Log Workout'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '95%',
    height: '90%',
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  closeButton: {
    padding: 4,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COMMON_STYLES.secondaryBackground,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: '#3b82f6',
  },
  stepText: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
  stepTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  activityTypeScroll: {
    paddingVertical: 4,
  },
  activityTypeButton: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginRight: 12,
    minWidth: 120,
  },
  activityTypeText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: COMMON_STYLES.standardRadius,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: COMMON_STYLES.standardRadius,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  unitButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  unitButtonActive: {
    backgroundColor: '#3b82f6',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  unitButtonTextActive: {
    color: '#ffffff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyExercises: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#f9fafb',
    borderRadius: COMMON_STYLES.standardRadius,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  exercisesList: {
    maxHeight: 300,
  },
  exerciseItem: {
    backgroundColor: '#f9fafb',
    borderRadius: COMMON_STYLES.standardRadius,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseNameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  removeExerciseButton: {
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
  },
  exerciseDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  exerciseDetailItem: {
    flex: 1,
  },
  exerciseDetailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  exerciseDetailInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exerciseSummary: {
    backgroundColor: '#f0f9ff',
    borderRadius: COMMON_STYLES.standardRadius,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  exerciseSummaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    textAlign: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  photoActionButton: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#f9fafb',
    borderRadius: COMMON_STYLES.standardRadius,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 120,
  },
  photoActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginTop: 8,
  },
  photosContainer: {
    marginTop: 16,
  },
  photoItem: {
    marginRight: 12,
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: COMMON_STYLES.standardRadius,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: COMMON_STYLES.standardRadius,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewCard: {
    backgroundColor: '#f9fafb',
    borderRadius: COMMON_STYLES.standardRadius,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reviewSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  reviewLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  reviewValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: COMMON_STYLES.secondaryBackground,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: COMMON_STYLES.standardRadius,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  backButtonText: {
    color: '#6b7280',
    fontWeight: '500',
    marginLeft: 6,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: COMMON_STYLES.standardRadius,
    backgroundColor: '#3b82f6',
  },
  nextButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  nextButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginRight: 6,
  },
  nextButtonTextDisabled: {
    color: '#9ca3af',
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: COMMON_STYLES.standardRadius,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButtonTextDisabled: {
    color: '#9ca3af',
  },
});
