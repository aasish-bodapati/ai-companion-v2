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
import { fitnessService } from '../../services/fitnessService';
import { routineService } from '../../services/routineService';

const { width, height } = Dimensions.get('window');

interface Exercise {
  id: number;
  name: string;
  category: string;
  muscle_groups: string[];
  equipment?: string;
  instructions?: string;
  difficulty?: string;
  logging_category?: string;
}

interface WorkoutSet {
  id: string;
  exercise_id: string;
  reps: number;
  weight: number;
  duration: number;
  rest_time: number;
  notes: string;
}

interface WorkoutLog {
  id?: string;
  name: string;
  date: string;
  duration: number;
  calories_burned: number;
  notes: string;
  sets: WorkoutSet[];
  routine_id?: string;
}

interface UnifiedWorkoutLoggerProps {
  visible: boolean;
  onClose: () => void;
  onSave: (workout: WorkoutLog) => void;
  initialWorkout?: WorkoutLog;
  routineId?: string;
}

export default function UnifiedWorkoutLogger({
  visible,
  onClose,
  onSave,
  initialWorkout,
  routineId,
}: UnifiedWorkoutLoggerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [workout, setWorkout] = useState<WorkoutLog>({
    name: '',
    date: new Date().toISOString().split('T')[0],
    duration: 0,
    calories_burned: 0,
    notes: '',
    sets: [],
    routine_id: routineId,
  });
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(false);

  const steps = [
    { title: 'Workout Details', icon: 'fitness' },
    { title: 'Add Exercises', icon: 'add-circle' },
    { title: 'Log Sets', icon: 'list' },
    { title: 'Review & Save', icon: 'checkmark' },
  ];

  useEffect(() => {
    if (visible) {
      loadExercises();
      if (initialWorkout) {
        setWorkout(initialWorkout);
      }
    }
  }, [visible, initialWorkout]);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const data = await fitnessService.getExercises();
      // Map ExerciseType to Exercise format
      const mappedExercises: Exercise[] = data.map(exercise => ({
        id: exercise.id,
        name: exercise.name,
        category: exercise.category,
        muscle_groups: [exercise.muscle_group],
        equipment: exercise.equipment,
        instructions: exercise.instructions,
        difficulty: exercise.difficulty,
        logging_category: exercise.logging_category
      }));
      setExercises(mappedExercises);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
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
      await onSave(workout);
      onClose();
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to save workout');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setWorkout({
      name: '',
      date: new Date().toISOString().split('T')[0],
      duration: 0,
      calories_burned: 0,
      notes: '',
      sets: [],
      routine_id: routineId,
    });
    setSelectedExercise(null);
    setSearchQuery('');
  };

  const addExercise = (exercise: Exercise) => {
    const newSet: WorkoutSet = {
      id: Date.now().toString(),
      exercise_id: exercise.id.toString(),
      reps: 0,
      weight: 0,
      duration: 0,
      rest_time: 60,
      notes: '',
    };
    
    setWorkout(prev => ({
      ...prev,
      sets: [...prev.sets, newSet],
    }));
    setSelectedExercise(null);
    setSearchQuery('');
  };

  const updateSet = (setId: string, updates: Partial<WorkoutSet>) => {
    setWorkout(prev => ({
      ...prev,
      sets: prev.sets.map(set => 
        set.id === setId ? { ...set, ...updates } : set
      ),
    }));
  };

  const removeSet = (setId: string) => {
    setWorkout(prev => ({
      ...prev,
      sets: prev.sets.filter(set => set.id !== setId),
    }));
  };

  const filteredExercises = exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.muscle_groups.some(muscle => 
      muscle.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Workout Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Workout Name</Text>
              <TextInput
                style={styles.input}
                value={workout.name}
                onChangeText={(text) => setWorkout(prev => ({ ...prev, name: text }))}
                placeholder="Enter workout name"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                value={workout.date}
                onChangeText={(text) => setWorkout(prev => ({ ...prev, date: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Duration (min)</Text>
                <TextInput
                  style={styles.input}
                  value={workout.duration.toString()}
                  onChangeText={(text) => setWorkout(prev => ({ 
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
                  value={workout.calories_burned.toString()}
                  onChangeText={(text) => setWorkout(prev => ({ 
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
                value={workout.notes}
                onChangeText={(text) => setWorkout(prev => ({ ...prev, notes: text }))}
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
            
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search exercises..."
                placeholderTextColor="#9ca3af"
              />
            </View>

            <ScrollView style={styles.exercisesList} showsVerticalScrollIndicator={false}>
              {filteredExercises.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  style={styles.exerciseItem}
                  onPress={() => addExercise(exercise)}
                >
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseCategory}>{exercise.category}</Text>
                    <Text style={styles.exerciseMuscles}>
                      {exercise.muscle_groups.join(', ')}
                    </Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color="#3b82f6" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Log Sets</Text>
            
            <ScrollView style={styles.setsList} showsVerticalScrollIndicator={false}>
              {workout.sets.map((set, index) => {
                const exercise = exercises.find(e => e.id.toString() === set.exercise_id);
                return (
                  <View key={set.id} style={styles.setCard}>
                    <View style={styles.setHeader}>
                      <Text style={styles.setTitle}>
                        {exercise?.name || 'Unknown Exercise'} #{index + 1}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeSet(set.id)}
                        style={styles.removeButton}
                      >
                        <Ionicons name="close-circle" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.setInputs}>
                      <View style={styles.setInputGroup}>
                        <Text style={styles.setLabel}>Reps</Text>
                        <TextInput
                          style={styles.setInput}
                          value={set.reps.toString()}
                          onChangeText={(text) => updateSet(set.id, { 
                            reps: parseInt(text) || 0 
                          })}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                      
                      <View style={styles.setInputGroup}>
                        <Text style={styles.setLabel}>Weight (kg)</Text>
                        <TextInput
                          style={styles.setInput}
                          value={set.weight.toString()}
                          onChangeText={(text) => updateSet(set.id, { 
                            weight: parseFloat(text) || 0 
                          })}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                      
                      <View style={styles.setInputGroup}>
                        <Text style={styles.setLabel}>Duration (s)</Text>
                        <TextInput
                          style={styles.setInput}
                          value={set.duration.toString()}
                          onChangeText={(text) => updateSet(set.id, { 
                            duration: parseInt(text) || 0 
                          })}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                      
                      <View style={styles.setInputGroup}>
                        <Text style={styles.setLabel}>Rest (s)</Text>
                        <TextInput
                          style={styles.setInput}
                          value={set.rest_time.toString()}
                          onChangeText={(text) => updateSet(set.id, { 
                            rest_time: parseInt(text) || 0 
                          })}
                          keyboardType="numeric"
                          placeholder="60"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                    </View>
                    
                    <TextInput
                      style={[styles.setInput, styles.setNotes]}
                      value={set.notes}
                      onChangeText={(text) => updateSet(set.id, { notes: text })}
                      placeholder="Set notes (optional)"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                );
              })}
            </ScrollView>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Review & Save</Text>
            
            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>{workout.name}</Text>
              <Text style={styles.reviewDate}>{workout.date}</Text>
              
              <View style={styles.reviewStats}>
                <View style={styles.reviewStat}>
                  <Text style={styles.reviewStatValue}>{workout.duration}</Text>
                  <Text style={styles.reviewStatLabel}>Minutes</Text>
                </View>
                <View style={styles.reviewStat}>
                  <Text style={styles.reviewStatValue}>{workout.calories_burned}</Text>
                  <Text style={styles.reviewStatLabel}>Calories</Text>
                </View>
                <View style={styles.reviewStat}>
                  <Text style={styles.reviewStatValue}>{workout.sets.length}</Text>
                  <Text style={styles.reviewStatLabel}>Sets</Text>
                </View>
              </View>
              
              {workout.notes && (
                <View style={styles.reviewNotes}>
                  <Text style={styles.reviewNotesLabel}>Notes:</Text>
                  <Text style={styles.reviewNotesText}>{workout.notes}</Text>
                </View>
              )}
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
          <Text style={styles.headerTitle}>Log Workout</Text>
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
              {currentStep === steps.length - 1 ? 'Save Workout' : 'Next'}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  exercisesList: {
    maxHeight: 300,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  exerciseCategory: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  exerciseMuscles: {
    fontSize: 12,
    color: '#9ca3af',
  },
  setsList: {
    maxHeight: 400,
  },
  setCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  setHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  setTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  setInputs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  setInputGroup: {
    flex: 1,
    minWidth: '45%',
  },
  setLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  setInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1f2937',
  },
  setNotes: {
    marginTop: 8,
    width: '100%',
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
    marginBottom: 16,
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
  reviewNotes: {
    marginTop: 8,
  },
  reviewNotesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  reviewNotesText: {
    fontSize: 14,
    color: '#6b7280',
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
