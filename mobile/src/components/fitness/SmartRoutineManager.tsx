import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RoutinePlanModal from '../routines/RoutinePlanModal';
import activeRoutineService from '../../services/activeRoutineService';
import { useToast } from '../../contexts/ToastContext';
import { exerciseService, Exercise as DbExercise } from '../../services/exerciseService';

interface Exercise {
  id: string;
  name: string;
  category: string;
  sets: number;
  reps: number;
  weight?: number;
  duration?: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  day?: string;
}

interface Routine {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'strength' | 'cardio' | 'flexibility' | 'mixed';
  bodyTypeGoal: 'sleek' | 'steady' | 'bold' | 'all';
  aiRecommended: boolean;
  lastUsed?: string;
  usageCount: number;
}

interface SmartRoutineManagerProps {
  userBodyTypeGoal?: string;
  onRoutineSelect?: (routine: Routine) => void;
  onCreateRoutine?: () => void;
  onEditRoutine?: (routine: Routine) => void;
  onSetActive?: (routine: Routine) => void;
  onSetInactive?: (routine: Routine) => void;
}

export default function SmartRoutineManager({
  userBodyTypeGoal,
  onRoutineSelect,
  onCreateRoutine,
  onEditRoutine,
  onSetActive,
  onSetInactive,
}: SmartRoutineManagerProps) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [exerciseNames, setExerciseNames] = useState<{ [key: string]: string }>({});
  const [exerciseCategories, setExerciseCategories] = useState<{ [key: string]: string }>({});
  const [isLoadingExercises, setIsLoadingExercises] = useState(true);
  const [showGuidanceModal, setShowGuidanceModal] = useState(false);
  const { showToast } = useToast();

  // Function to fetch exercise names from database
  const fetchExerciseNames = async (routines: Routine[]) => {
    try {
      setIsLoadingExercises(true);
      console.log('🔄 [ROUTINES] Fetching exercise names from database...');
      
      // Collect all unique exercise IDs from all routines
      const allExerciseIds = new Set<string>();
      routines.forEach(routine => {
        routine.exercises.forEach(exercise => {
          allExerciseIds.add(exercise.id);
        });
      });

      console.log(`📋 [ROUTINES] Found ${allExerciseIds.size} unique exercise IDs:`, Array.from(allExerciseIds));

      // Fetch exercise names from backend
      const exerciseIds = Array.from(allExerciseIds);
      const dbExercises = await exerciseService.getExercisesByIds(exerciseIds);
      
      console.log(`✅ [ROUTINES] Fetched ${dbExercises.length} exercises from database`);
      
      // Create mappings of ID to name and category
      const nameMap: { [key: string]: string } = {};
      const categoryMap: { [key: string]: string } = {};
      dbExercises.forEach(exercise => {
        nameMap[exercise.id.toString()] = exercise.name;
        categoryMap[exercise.id.toString()] = exercise.logging_category;
        console.log(`  - ID ${exercise.id}: ${exercise.name} (${exercise.logging_category})`);
      });

      // Check for missing exercises
      const missingIds = exerciseIds.filter(id => !nameMap[id]);
      if (missingIds.length > 0) {
        console.warn(`⚠️ [ROUTINES] Missing exercises in database:`, missingIds);
      }

      setExerciseNames(nameMap);
      setExerciseCategories(categoryMap);
      setIsLoadingExercises(false);
    } catch (error) {
      console.error('❌ [ROUTINES] Error fetching exercise names:', error);
      setIsLoadingExercises(false);
    }
  };

  // Function to update routine exercise names and categories with database data
  const updateRoutineNames = (routines: Routine[]): Routine[] => {
    return routines.map(routine => ({
      ...routine,
      exercises: routine.exercises.map(exercise => ({
        ...exercise,
        name: exerciseNames[exercise.id] || `Exercise ${exercise.id}`, // Use DB name or show ID if not found
        category: exerciseCategories[exercise.id] || exercise.category, // Use DB category or fallback to hardcoded
      })),
    }));
  };


  // One comprehensive routine per body type goal
  const bodyTypeRoutines: Routine[] = [
    // Sleek & Graceful (Lean / Mobility Focus)
    {
      id: 'sleek-comprehensive',
      name: 'Sleek & Graceful Weekly Plan',
      description: 'Cardio endurance, flexibility, and light strength for lean, graceful physique',
      exercises: [
        { id: '524', name: 'Squats', category: 'bodyweight', sets: 3, reps: 15, difficulty: 'beginner' },
        { id: '100', name: 'Push-Up', category: 'bodyweight', sets: 3, reps: 12, difficulty: 'beginner' },
        { id: '348', name: 'Plank', category: 'cardio_duration', sets: 3, reps: 1, duration: 45, difficulty: 'beginner' },
        { id: '115', name: 'Bird Dog', category: 'cardio_duration', sets: 3, reps: 10, difficulty: 'beginner' },
        { id: '608', name: 'Glute Bridge', category: 'cardio_duration', sets: 3, reps: 15, difficulty: 'beginner' },
        { id: '598', name: 'Yoga exercise: Cow-cat', category: 'cardio_duration', sets: 1, reps: 1, duration: 30, difficulty: 'beginner' },
        { id: '622', name: 'Cobra Stretch', category: 'cardio_duration', sets: 1, reps: 1, duration: 15, difficulty: 'beginner' },
        { id: '460', name: 'Stationary Bike Cardio', category: 'cardio_duration', sets: 1, reps: 1, duration: 25, difficulty: 'beginner' },
      ],
      estimatedDuration: 45,
      difficulty: 'beginner',
      category: 'mixed',
      bodyTypeGoal: 'sleek',
      aiRecommended: true,
      usageCount: 0,
    },

    // Strong & Steady (Moderate Muscle / Functional Strength)
    {
      id: 'steady-comprehensive',
      name: 'Strong & Steady Weekly Plan',
      description: 'Functional strength and muscular endurance for balanced, steady physique',
      exercises: [
        { id: '524', name: 'Squats', category: 'bodyweight', sets: 4, reps: 12, weight: 50, difficulty: 'intermediate' },
        { id: '371', name: 'Bench Press', category: 'weighted', sets: 4, reps: 10, difficulty: 'intermediate' },
        { id: '575', name: 'Bent Over Rowing', category: 'distance_based', sets: 4, reps: 12, weight: 40, difficulty: 'intermediate' },
        { id: '470', name: 'Arnold Shoulder Press', category: 'weighted', sets: 3, reps: 10, weight: 25, difficulty: 'intermediate' },
        { id: '2', name: 'Deadlifts', category: 'weighted', sets: 4, reps: 8, weight: 60, difficulty: 'intermediate' },
        { id: '34', name: 'Pull-ups', category: 'bodyweight', sets: 3, reps: 8, difficulty: 'intermediate' },
        { id: '657', name: 'Bulgarian Split Squats', category: 'bodyweight', sets: 3, reps: 12, difficulty: 'intermediate' },
        { id: '615', name: 'Jump rope: basic jumps', category: 'cardio_duration', sets: 1, reps: 1, duration: 15, difficulty: 'intermediate' },
        { id: '403', name: 'Kettlebell Swings', category: 'weighted', sets: 3, reps: 15, difficulty: 'intermediate' },
        { id: '555', name: 'Dumbbell farmer\'s carrie', category: 'weighted', sets: 3, reps: 1, duration: 30, difficulty: 'intermediate' },
      ],
      estimatedDuration: 60,
      difficulty: 'intermediate',
      category: 'mixed',
      bodyTypeGoal: 'steady',
      aiRecommended: true,
      usageCount: 0,
    },

    // Big & Bold (Hypertrophy / Heavy Strength)
    {
      id: 'bold-comprehensive',
      name: 'Big & Bold Weekly Plan',
      description: 'Heavy strength training and hypertrophy for maximum muscle growth',
      exercises: [
        { id: '371', name: 'Bench Press', category: 'weighted', sets: 5, reps: 8, weight: 80, difficulty: 'advanced' },
        { id: '334', name: 'Incline Dumbbell Press', category: 'weighted', sets: 4, reps: 10, weight: 60, difficulty: 'advanced' },
        { id: '34', name: 'Pull-ups', category: 'bodyweight', sets: 4, reps: 8, difficulty: 'advanced' },
        { id: '157', name: 'Seated Cable Row', category: 'distance_based', sets: 4, reps: 10, weight: 70, difficulty: 'advanced' },
        { id: '231', name: 'Overhead Press', category: 'weighted', sets: 4, reps: 8, weight: 50, difficulty: 'advanced' },
        { id: '524', name: 'Squats', category: 'bodyweight', sets: 5, reps: 8, weight: 100, difficulty: 'advanced' },
        { id: '2', name: 'Deadlifts', category: 'weighted', sets: 4, reps: 6, weight: 120, difficulty: 'advanced' },
        { id: '251', name: 'Lunges', category: 'bodyweight', sets: 4, reps: 12, weight: 40, difficulty: 'advanced' },
        { id: '341', name: 'Leg Curl', category: 'weighted', sets: 4, reps: 12, difficulty: 'advanced' },
        { id: '236', name: 'Standing Calf Raises', category: 'weighted', sets: 4, reps: 15, weight: 50, difficulty: 'advanced' },
        { id: '403', name: 'Kettlebell Swings', category: 'weighted', sets: 3, reps: 20, difficulty: 'advanced' },
        { id: '22', name: 'Ab wheel', category: 'bodyweight', sets: 3, reps: 12, difficulty: 'advanced' },
      ],
      estimatedDuration: 75,
      difficulty: 'advanced',
      category: 'strength',
      bodyTypeGoal: 'bold',
      aiRecommended: true,
      usageCount: 0,
    },

    // 7-Day Comprehensive Workout Plan
    {
      id: '7day-comprehensive',
      name: '7-Day Complete Workout Plan',
      description: 'Full week workout routine with exercises distributed across all 7 days',
      exercises: [
        // Monday - Upper Body Strength
        { id: '371', name: 'Bench Press', category: 'weighted', sets: 4, reps: 8, weight: 80, difficulty: 'intermediate', day: 'Monday' },
        { id: '34', name: 'Pull-ups', category: 'bodyweight', sets: 4, reps: 8, difficulty: 'intermediate', day: 'Monday' },
        { id: '470', name: 'Arnold Shoulder Press', category: 'weighted', sets: 3, reps: 10, weight: 25, difficulty: 'intermediate', day: 'Monday' },
        { id: '157', name: 'Seated Cable Row', category: 'distance_based', sets: 4, reps: 10, weight: 70, difficulty: 'intermediate', day: 'Monday' },
        { id: '22', name: 'Ab wheel', category: 'bodyweight', sets: 3, reps: 12, difficulty: 'intermediate', day: 'Monday' },

        // Tuesday - Lower Body Power
        { id: '524', name: 'Squats', category: 'bodyweight', sets: 5, reps: 8, weight: 100, difficulty: 'intermediate', day: 'Tuesday' },
        { id: '2', name: 'Deadlifts', category: 'weighted', sets: 4, reps: 6, weight: 120, difficulty: 'intermediate', day: 'Tuesday' },
        { id: '657', name: 'Bulgarian Split Squats', category: 'bodyweight', sets: 3, reps: 12, difficulty: 'intermediate', day: 'Tuesday' },
        { id: '251', name: 'Lunges', category: 'bodyweight', sets: 4, reps: 12, weight: 40, difficulty: 'intermediate', day: 'Tuesday' },
        { id: '236', name: 'Standing Calf Raises', category: 'weighted', sets: 4, reps: 15, weight: 50, difficulty: 'intermediate', day: 'Tuesday' },

        // Wednesday - Cardio & Core
        { id: '615', name: 'Jump rope: basic jumps', category: 'cardio_duration', sets: 1, reps: 1, duration: 20, difficulty: 'intermediate', day: 'Wednesday' },
        { id: '348', name: 'Plank', category: 'cardio_duration', sets: 3, reps: 1, duration: 60, difficulty: 'intermediate', day: 'Wednesday' },
        { id: '115', name: 'Bird Dog', category: 'cardio_duration', sets: 3, reps: 10, difficulty: 'intermediate', day: 'Wednesday' },
        { id: '608', name: 'Glute Bridge', category: 'cardio_duration', sets: 3, reps: 15, difficulty: 'intermediate', day: 'Wednesday' },
        { id: '403', name: 'Kettlebell Swings', category: 'weighted', sets: 3, reps: 20, difficulty: 'intermediate', day: 'Wednesday' },

        // Thursday - Push Focus
        { id: '371', name: 'Bench Press', category: 'weighted', sets: 4, reps: 10, weight: 70, difficulty: 'intermediate', day: 'Thursday' },
        { id: '334', name: 'Incline Dumbbell Press', category: 'weighted', sets: 4, reps: 10, weight: 60, difficulty: 'intermediate', day: 'Thursday' },
        { id: '231', name: 'Overhead Press', category: 'weighted', sets: 4, reps: 8, weight: 50, difficulty: 'intermediate', day: 'Thursday' },
        { id: '100', name: 'Push-Up', category: 'bodyweight', sets: 3, reps: 15, difficulty: 'intermediate', day: 'Thursday' },
        { id: '22', name: 'Ab wheel', category: 'bodyweight', sets: 3, reps: 15, difficulty: 'intermediate', day: 'Thursday' },

        // Friday - Pull Focus
        { id: '34', name: 'Pull-ups', category: 'bodyweight', sets: 4, reps: 10, difficulty: 'intermediate', day: 'Friday' },
        { id: '157', name: 'Seated Cable Row', category: 'distance_based', sets: 4, reps: 12, weight: 60, difficulty: 'intermediate', day: 'Friday' },
        { id: '575', name: 'Bent Over Rowing', category: 'distance_based', sets: 4, reps: 12, weight: 40, difficulty: 'intermediate', day: 'Friday' },
        { id: '470', name: 'Arnold Shoulder Press', category: 'weighted', sets: 3, reps: 12, weight: 20, difficulty: 'intermediate', day: 'Friday' },
        { id: '555', name: 'Dumbbell farmer\'s carrie', category: 'weighted', sets: 3, reps: 1, duration: 30, difficulty: 'intermediate', day: 'Friday' },

        // Saturday - Full Body HIIT
        { id: '524', name: 'Squats', category: 'bodyweight', sets: 3, reps: 15, weight: 60, difficulty: 'intermediate', day: 'Saturday' },
        { id: '100', name: 'Push-Up', category: 'bodyweight', sets: 3, reps: 12, difficulty: 'intermediate', day: 'Saturday' },
        { id: '615', name: 'Jump rope: basic jumps', category: 'cardio_duration', sets: 1, reps: 1, duration: 15, difficulty: 'intermediate', day: 'Saturday' },
        { id: '657', name: 'Bulgarian Split Squats', category: 'bodyweight', sets: 3, reps: 10, difficulty: 'intermediate', day: 'Saturday' },
        { id: '403', name: 'Kettlebell Swings', category: 'weighted', sets: 3, reps: 15, difficulty: 'intermediate', day: 'Saturday' },
        { id: '348', name: 'Plank', category: 'cardio_duration', sets: 3, reps: 1, duration: 45, difficulty: 'intermediate', day: 'Saturday' },

        // Sunday - Active Recovery & Flexibility
        { id: '598', name: 'Yoga exercise: Cow-cat', category: 'cardio_duration', sets: 1, reps: 1, duration: 30, difficulty: 'beginner', day: 'Sunday' },
        { id: '622', name: 'Cobra Stretch', category: 'cardio_duration', sets: 1, reps: 1, duration: 20, difficulty: 'beginner', day: 'Sunday' },
        { id: '460', name: 'Stationary Bike Cardio', category: 'cardio_duration', sets: 1, reps: 1, duration: 30, difficulty: 'beginner', day: 'Sunday' },
        { id: '608', name: 'Glute Bridge', category: 'cardio_duration', sets: 3, reps: 15, difficulty: 'beginner', day: 'Sunday' },
        { id: '115', name: 'Bird Dog', category: 'cardio_duration', sets: 2, reps: 8, difficulty: 'beginner', day: 'Sunday' },
      ],
      estimatedDuration: 60,
      difficulty: 'intermediate',
      category: 'mixed',
      bodyTypeGoal: 'all',
      aiRecommended: true,
      usageCount: 0,
    },
  ];

  useEffect(() => {
    loadRoutines();
    loadActiveRoutine();
  }, [userBodyTypeGoal]);

  // Fetch exercise names and categories when they change
  useEffect(() => {
    if (Object.keys(exerciseNames).length > 0 && Object.keys(exerciseCategories).length > 0) {
      const updatedRoutines = updateRoutineNames(bodyTypeRoutines);
      setRoutines(updatedRoutines);
    }
  }, [exerciseNames, exerciseCategories]);

  const loadActiveRoutine = async () => {
    try {
      const response = await activeRoutineService.getActiveRoutine();
      if (response.active_routine_id) {
        setActiveRoutineId(response.active_routine_id);
      }
    } catch (error) {
      console.error('Error loading active routine:', error);
    }
  };

  const loadRoutines = async () => {
    // Fetch exercise names from database first, then set routines
    await fetchExerciseNames(bodyTypeRoutines);
  };


  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strength': return 'barbell-outline';
      case 'cardio': return 'heart-outline';
      case 'flexibility': return 'leaf-outline';
      case 'mixed': return 'fitness-outline';
      default: return 'fitness-outline';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strength': return '#3b82f6';
      case 'cardio': return '#ef4444';
      case 'flexibility': return '#10b981';
      case 'mixed': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Show all routines since we removed category filtering
  const filteredRoutines = routines;

  const handleRoutineSelect = (routine: Routine) => {
    setSelectedRoutine(routine);
    setShowPlanModal(true);
  };

  const handleCloseModal = () => {
    setShowPlanModal(false);
    setSelectedRoutine(null);
  };


  const handleSetActive = async (routine: Routine) => {
    try {
      await activeRoutineService.setActiveRoutine(routine.id);
      setActiveRoutineId(routine.id);
      onSetActive?.(routine);
      showToast(`Routine "${routine.name}" set as active`, 'success', 3000);
    } catch (error) {
      console.error('Error setting active routine:', error);
      showToast('Failed to set routine as active. Please try again.', 'error', 4000);
    }
  };

  const handleSetInactive = async (routine: Routine) => {
    try {
      await activeRoutineService.clearActiveRoutine();
      setActiveRoutineId(null);
      onSetInactive?.(routine);
      showToast(`Routine "${routine.name}" set as inactive`, 'info', 3000);
    } catch (error) {
      console.error('Error setting inactive routine:', error);
      showToast('Failed to set routine as inactive. Please try again.', 'error', 4000);
    }
  };

  const handleModalSetActive = (routine: Routine) => {
    handleSetActive(routine);
    handleCloseModal();
  };

  const handleModalSetInactive = (routine: Routine) => {
    handleSetInactive(routine);
    handleCloseModal();
  };

  return (
    <View style={styles.container}>
      {/* Loading State */}
      {isLoadingExercises && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading exercise names from database...</Text>
        </View>
      )}

      {/* Routine List */}
      <View style={styles.section}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredRoutines.map((routine) => (
            <TouchableOpacity
              key={routine.id}
              style={styles.routineCard}
              onPress={() => handleRoutineSelect(routine)}
            >
              <View style={styles.routineHeader}>
                <View style={styles.routineInfo}>
                  <Ionicons 
                    name={getCategoryIcon(routine.category)} 
                    size={20} 
                    color={getCategoryColor(routine.category)} 
                  />
                  <Text style={styles.routineName}>{routine.name}</Text>
                  {routine.aiRecommended && (
                    <View style={styles.aiBadge}>
                      <Text style={styles.aiBadgeText}>Created by System</Text>
                    </View>
                  )}
                  {activeRoutineId === routine.id && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  )}
                </View>
                <View style={styles.routineActions}>
                  {activeRoutineId === routine.id ? (
                    <TouchableOpacity
                      onPress={() => handleSetInactive(routine)}
                      style={[styles.actionButton, styles.inactiveButton]}
                    >
                      <Ionicons name="pause-outline" size={14} color="#ef4444" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleSetActive(routine)}
                      style={[styles.actionButton, styles.activeButton]}
                    >
                      <Ionicons name="play-outline" size={14} color="#10b981" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => setShowGuidanceModal(true)}
                    style={styles.infoButton}
                  >
                    <Ionicons name="information-circle-outline" size={14} color="#6b7280" />
                  </TouchableOpacity>
                  {/* Only show edit button for custom routines */}
                  {routine.id.startsWith('custom-') && (
                    <TouchableOpacity
                      onPress={() => onEditRoutine?.(routine)}
                      style={styles.actionButton}
                    >
                      <Ionicons name="create-outline" size={14} color="#6b7280" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              
              <Text style={styles.routineDescription}>{routine.description}</Text>
              
              <View style={styles.routineStats}>
                <View style={styles.routineStat}>
                  <Ionicons name="time-outline" size={14} color="#6b7280" />
                  <Text style={styles.routineStatText}>{routine.estimatedDuration} min</Text>
                </View>
                <View style={styles.routineStat}>
                  <Ionicons name="fitness-outline" size={14} color="#6b7280" />
                  <Text style={styles.routineStatText}>{routine.exercises.length} exercises</Text>
                </View>
                {routine.usageCount > 0 && (
                  <View style={styles.routineStat}>
                    <Ionicons name="repeat-outline" size={14} color="#6b7280" />
                    <Text style={styles.routineStatText}>{routine.usageCount} times</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}

          {/* Create Routine Button - Moved inside ScrollView */}
      <TouchableOpacity 
        style={styles.createButton}
        onPress={onCreateRoutine}
      >
        <Ionicons name="add" size={20} color="#ffffff" />
        <Text style={styles.createButtonText}>Create Custom Routine</Text>
      </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Routine Plan Modal */}
      <RoutinePlanModal
        visible={showPlanModal}
        routine={selectedRoutine}
        onClose={handleCloseModal}
        onSetActive={handleModalSetActive}
        onSetInactive={handleModalSetInactive}
        isActive={selectedRoutine ? activeRoutineId === selectedRoutine.id : false}
        exerciseCategories={exerciseCategories}
      />

      {/* Exercise Guidance Modal */}
      <Modal
        visible={showGuidanceModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGuidanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.guidanceModalContainer}>
            <View style={styles.guidanceModalHeader}>
              <Text style={styles.guidanceModalTitle}>💡 Exercise Guidance</Text>
              <TouchableOpacity
                onPress={() => setShowGuidanceModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.guidanceModalContent}>
              <View style={styles.guidanceGrid}>
                <View style={styles.guidanceItem}>
                  <Text style={styles.guidanceLabel}>Sets & Reps</Text>
                  <Text style={styles.guidanceText}>3-4 sets, 8-15 reps</Text>
                </View>
                <View style={styles.guidanceItem}>
                  <Text style={styles.guidanceLabel}>Rest Time</Text>
                  <Text style={styles.guidanceText}>60-90 seconds</Text>
                </View>
                <View style={styles.guidanceItem}>
                  <Text style={styles.guidanceLabel}>Progression</Text>
                  <Text style={styles.guidanceText}>Increase gradually</Text>
                </View>
                <View style={styles.guidanceItem}>
                  <Text style={styles.guidanceLabel}>Frequency</Text>
                  <Text style={styles.guidanceText}>Listen to your body</Text>
                </View>
              </View>
              <Text style={styles.guidanceNote}>
                These are general guidelines. Adjust based on your fitness level and how you feel.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 8,
  },
  routineCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  aiBadge: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  activeBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#10b981',
  },
  routineActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
  },
  inactiveButton: {
    backgroundColor: '#fef2f2',
    borderRadius: 6,
  },
  routineDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  routineStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  routineStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routineStatText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  guidanceContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  guidanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  guidanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  guidanceItem: {
    width: '48%',
    marginBottom: 8,
  },
  guidanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 2,
  },
  guidanceText: {
    fontSize: 11,
    color: '#374151',
  },
  infoButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guidanceModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 20,
    maxWidth: 400,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  guidanceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  guidanceModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  guidanceModalContent: {
    padding: 20,
  },
  guidanceNote: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
});
