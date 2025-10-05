import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '../../theme/constants';
import useResponsive from '../../hooks/useResponsive';

const DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

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

interface RoutinePlanModalProps {
  visible: boolean;
  routine: Routine | null;
  onClose: () => void;
  onSetActive?: (routine: Routine) => void;
  onSetInactive?: (routine: Routine) => void;
  isActive?: boolean;
  exerciseCategories?: { [key: string]: string };
}

export default function RoutinePlanModal({
  visible,
  routine,
  onClose,
  onSetActive,
  onSetInactive,
  isActive = false,
  exerciseCategories = {},
}: RoutinePlanModalProps) {
  const responsive = useResponsive();
  const [currentDay, setCurrentDay] = useState(0);
  const [showGuidanceModal, setShowGuidanceModal] = useState(false);

  // Reset to current day when modal opens
  useEffect(() => {
    if (visible && routine) {
      // Get current day of week (0 = Sunday, 1 = Monday, etc.)
      const today = new Date().getDay();
      // Convert to our array index (Monday = 0, Sunday = 6)
      const dayIndex = today === 0 ? 6 : today - 1;
      setCurrentDay(dayIndex);
    }
  }, [visible, routine]);

  // Distribute exercises across days
  const dayExercises = useMemo(() => {
    if (!routine) return [];
    
    // Check if exercises have day property (7-day routine)
    const hasDayProperty = routine.exercises.some(ex => ex.day);
    
    if (hasDayProperty) {
      // Group exercises by their day property
      const exercisesByDay: { [key: string]: any[] } = {};
      routine.exercises.forEach(exercise => {
        if (exercise.day) {
          if (!exercisesByDay[exercise.day]) {
            exercisesByDay[exercise.day] = [];
          }
          exercisesByDay[exercise.day].push(exercise);
        }
      });
      
      // Map to DAYS array
      return DAYS.map(dayName => ({
        dayName,
        exercises: exercisesByDay[dayName] || []
      }));
    } else {
      // Original logic for routines without day property
      const exercisesPerDay = Math.ceil(routine.exercises.length / DAYS.length);
      const days = DAYS.map((dayName, dayIndex) => {
        const startIndex = dayIndex * exercisesPerDay;
        const endIndex = Math.min(startIndex + exercisesPerDay, routine.exercises.length);
        return {
          dayName,
          exercises: routine.exercises.slice(startIndex, endIndex)
        };
      });
      return days;
    }
  }, [routine?.exercises]);

  if (!routine) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return COLORS.success;
      case 'intermediate':
        return COLORS.warning;
      case 'advanced':
        return COLORS.danger;
      default:
        return COLORS.text.secondary;
    }
  };

  // Function to get primary category from routine exercises
  const getRoutinePrimaryCategory = (routine: Routine): string => {
    const categoryCount: { [key: string]: number } = {};
    
    routine.exercises.forEach(exercise => {
      // Use database category if available, otherwise fallback to hardcoded
      const category = exerciseCategories[exercise.id] || exercise.category;
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    // Return the most common category
    const sortedCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a);
    
    return sortedCategories.length > 0 ? sortedCategories[0][0] : 'mixed';
  };

  // Function to get category display info
  const getCategoryInfo = (category: string) => {
    const categoryMap: { [key: string]: { name: string; color: string; icon: string } } = {
      'bodyweight': { name: 'Bodyweight', color: '#3b82f6', icon: 'person-outline' },
      'weighted': { name: 'Weighted', color: '#f59e0b', icon: 'barbell-outline' },
      'cardio_duration': { name: 'Cardio', color: '#ef4444', icon: 'heart-outline' },
      'distance_based': { name: 'Distance', color: '#10b981', icon: 'walk-outline' },
      'mixed': { name: 'Mixed', color: '#8b5cf6', icon: 'fitness-outline' }
    };
    
    return categoryMap[category] || { name: category, color: '#6b7280', icon: 'fitness-outline' };
  };

  // Function to get general exercise guidance (same for all exercises)
  const getExerciseGuidance = () => {
    return {
      sets: '3-4 sets',
      reps: '8-15 reps', 
      rest: '60-90 sec',
      progression: 'Increase gradually'
    };
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strength':
        return 'barbell-outline';
      case 'cardio':
        return 'heart-outline';
      case 'flexibility':
        return 'leaf-outline';
      case 'mixed':
        return 'fitness-outline';
      default:
        return 'help-outline';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strength':
        return '#ef4444';
      case 'cardio':
        return '#f97316';
      case 'flexibility':
        return '#10b981';
      case 'mixed':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  const dynamicStyles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: responsive.getResponsivePadding(SPACING.md),
    },
    modalContent: {
      backgroundColor: COLORS.background.primary,
      borderRadius: responsive.getResponsiveSpacing(BORDER_RADIUS.xl),
      maxHeight: responsive.dimensions.height * 0.8,
      width: '100%',
      maxWidth: responsive.breakpoints.isTablet ? 500 : '100%',
      paddingBottom: responsive.getResponsivePadding(SPACING.md),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: responsive.getResponsivePadding(SPACING.md),
      paddingVertical: responsive.getResponsivePadding(SPACING.sm),
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border.light,
    },
    headerLeft: {
      flex: 1,
    },
    title: {
      fontSize: responsive.getResponsiveFontSize(FONT_SIZE.lg),
      fontWeight: 'bold',
      color: COLORS.text.primary,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: responsive.getResponsiveFontSize(FONT_SIZE.xs),
      color: COLORS.text.secondary,
    },
    closeButton: {
      padding: responsive.getResponsiveSpacing(SPACING.sm),
    },
    content: {
      paddingHorizontal: responsive.getResponsivePadding(SPACING.md),
    },
    routineInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: responsive.getResponsiveMargin(SPACING.md),
    },
    routineIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: getCategoryColor(routine.category) + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: responsive.getResponsiveSpacing(SPACING.sm),
    },
    routineDetails: {
      flex: 1,
    },
    routineName: {
      fontSize: responsive.getResponsiveFontSize(FONT_SIZE.md),
      fontWeight: 'bold',
      color: COLORS.text.primary,
      marginBottom: 2,
    },
    routineDescription: {
      fontSize: responsive.getResponsiveFontSize(FONT_SIZE.xs),
      color: COLORS.text.secondary,
      marginBottom: responsive.getResponsiveSpacing(SPACING.xs),
    },
    badges: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: responsive.getResponsiveSpacing(SPACING.xs),
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: responsive.getResponsivePadding(SPACING.sm),
      paddingVertical: responsive.getResponsiveSpacing(SPACING.xs),
      borderRadius: responsive.getResponsiveSpacing(BORDER_RADIUS.sm),
      borderWidth: 1,
    },
    badgeText: {
      fontSize: responsive.getResponsiveFontSize(FONT_SIZE.xs),
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: COLORS.gray[50],
      borderRadius: responsive.getResponsiveSpacing(BORDER_RADIUS.sm),
      paddingVertical: responsive.getResponsivePadding(SPACING.sm),
      marginBottom: responsive.getResponsiveMargin(SPACING.md),
    },
    stat: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: responsive.getResponsiveFontSize(FONT_SIZE.md),
      fontWeight: 'bold',
      color: COLORS.text.primary,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: responsive.getResponsiveFontSize(FONT_SIZE.xs),
      color: COLORS.text.secondary,
    },
    sectionTitle: {
      fontSize: responsive.getResponsiveFontSize(FONT_SIZE.md),
      fontWeight: 'bold',
      color: COLORS.text.primary,
      marginBottom: responsive.getResponsiveMargin(SPACING.sm),
    },
    exerciseList: {
      marginBottom: responsive.getResponsiveMargin(SPACING.md),
    },
    exerciseItem: {
      backgroundColor: COLORS.background.primary,
      borderRadius: responsive.getResponsiveSpacing(BORDER_RADIUS.sm),
      padding: responsive.getResponsivePadding(SPACING.sm),
      marginBottom: responsive.getResponsiveMargin(SPACING.xs),
      borderWidth: 1,
      borderColor: COLORS.border.light,
    },
    exerciseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    exerciseIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: COLORS.gray[100],
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: responsive.getResponsiveSpacing(SPACING.xs),
    },
    exerciseName: {
      flex: 1,
      fontSize: responsive.getResponsiveFontSize(FONT_SIZE.sm),
      fontWeight: '600',
      color: COLORS.text.primary,
    },
    exerciseCategory: {
      fontSize: responsive.getResponsiveFontSize(FONT_SIZE.xs),
      color: COLORS.text.secondary,
      textTransform: 'capitalize',
    },
    exerciseDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    exerciseStats: {
      flexDirection: 'row',
      gap: responsive.getResponsiveSpacing(SPACING.md),
    },
    exerciseStat: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    exerciseStatText: {
      fontSize: responsive.getResponsiveFontSize(FONT_SIZE.sm),
      color: COLORS.text.secondary,
      marginLeft: responsive.getResponsiveSpacing(SPACING.xs),
    },
    difficultyBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: responsive.getResponsivePadding(SPACING.sm),
      paddingVertical: responsive.getResponsiveSpacing(SPACING.xs),
      borderRadius: responsive.getResponsiveSpacing(BORDER_RADIUS.sm),
      borderWidth: 1,
    },
  difficultyText: {
    fontSize: responsive.getResponsiveFontSize(FONT_SIZE.xs),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  guidanceContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  guidanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  guidanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  guidanceText: {
    fontSize: responsive.getResponsiveFontSize(FONT_SIZE.xs),
    color: COLORS.text.secondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  progressionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  progressionText: {
    fontSize: responsive.getResponsiveFontSize(FONT_SIZE.xs),
    color: COLORS.primary.main,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  guidanceInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.primary.main + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary.main + '30',
  },
  guidanceInfoText: {
    fontSize: responsive.getResponsiveFontSize(FONT_SIZE.sm),
    color: COLORS.primary.main,
    marginLeft: 6,
    fontWeight: '500',
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
  guidanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  guidanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
    actionButtons: {
      paddingHorizontal: responsive.getResponsivePadding(SPACING.md),
    },
    singleButton: {
      backgroundColor: isActive ? COLORS.danger : COLORS.success,
      borderRadius: responsive.getResponsiveSpacing(BORDER_RADIUS.sm),
      paddingVertical: responsive.getResponsivePadding(SPACING.sm),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      color: COLORS.text.inverse,
      fontSize: responsive.getResponsiveFontSize(FONT_SIZE.sm),
      fontWeight: '600',
      marginLeft: responsive.getResponsiveSpacing(SPACING.xs),
    },
    dayNavigation: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: responsive.getResponsiveMargin(SPACING.md),
      backgroundColor: COLORS.gray[50],
      borderRadius: responsive.getResponsiveSpacing(BORDER_RADIUS.sm),
      paddingVertical: responsive.getResponsivePadding(SPACING.sm),
      paddingHorizontal: responsive.getResponsivePadding(SPACING.md),
    },
    dayNavButton: {
      padding: responsive.getResponsivePadding(SPACING.sm),
    },
    currentDay: {
      fontSize: responsive.getResponsiveFontSize(FONT_SIZE.md),
      fontWeight: 'bold',
      color: COLORS.text.primary,
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={dynamicStyles.modalOverlay}>
        <View style={dynamicStyles.modalContent}>
          {/* Header */}
          <View style={dynamicStyles.header}>
            <View style={dynamicStyles.headerLeft}>
              <Text style={dynamicStyles.title}>Routine Plan</Text>
              <Text style={dynamicStyles.subtitle}>Detailed workout breakdown</Text>
            </View>
            <TouchableOpacity
              style={dynamicStyles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={dynamicStyles.content} showsVerticalScrollIndicator={false}>
            {/* Routine Info */}
            <View style={dynamicStyles.routineInfo}>
              <View style={[dynamicStyles.routineIcon, { backgroundColor: getCategoryColor(routine.category) + '20' }]}>
                <Ionicons 
                  name={getCategoryIcon(routine.category) as any} 
                  size={20} 
                  color={getCategoryColor(routine.category)} 
                />
              </View>
              <View style={dynamicStyles.routineDetails}>
                <Text style={dynamicStyles.routineName}>{routine.name}</Text>
                <Text style={dynamicStyles.routineDescription}>{routine.description}</Text>
                <View style={dynamicStyles.badges}>
                  {(() => {
                    const primaryCategory = getRoutinePrimaryCategory(routine);
                    const categoryInfo = getCategoryInfo(primaryCategory);
                    return (
                      <View style={[dynamicStyles.badge, { backgroundColor: categoryInfo.color + '20', borderColor: categoryInfo.color }]}>
                        <Ionicons name={categoryInfo.icon as any} size={12} color={categoryInfo.color} />
                        <Text style={[dynamicStyles.badgeText, { color: categoryInfo.color, marginLeft: 4 }]}>
                          {categoryInfo.name}
                        </Text>
                      </View>
                    );
                  })()}
                  {routine.aiRecommended && (
                    <View style={[dynamicStyles.badge, { backgroundColor: COLORS.primary.main + '20' }]}>
                      <Text style={[dynamicStyles.badgeText, { color: COLORS.primary.main }]}>
                        Created by System
                      </Text>
                    </View>
                  )}
                  {isActive && (
                    <View style={[dynamicStyles.badge, { backgroundColor: COLORS.success + '20' }]}>
                      <Text style={[dynamicStyles.badgeText, { color: COLORS.success }]}>
                        Active
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Stats */}
            <View style={dynamicStyles.statsRow}>
              <View style={dynamicStyles.stat}>
                <Text style={dynamicStyles.statValue}>{routine.estimatedDuration}</Text>
                <Text style={dynamicStyles.statLabel}>Minutes</Text>
              </View>
              <View style={dynamicStyles.stat}>
                <Text style={dynamicStyles.statValue}>{routine.exercises.length}</Text>
                <Text style={dynamicStyles.statLabel}>Exercises</Text>
              </View>
              <View style={dynamicStyles.stat}>
                <Text style={dynamicStyles.statValue}>{routine.usageCount}</Text>
                <Text style={dynamicStyles.statLabel}>Times Used</Text>
              </View>
            </View>

            {/* Day Navigation */}
            <View style={dynamicStyles.dayNavigation}>
              <TouchableOpacity
                style={dynamicStyles.dayNavButton}
                onPress={() => {
                  const prevDay = currentDay === 0 ? DAYS.length - 1 : currentDay - 1;
                  setCurrentDay(prevDay);
                }}
              >
                <Ionicons name="chevron-back" size={20} color={COLORS.text.secondary} />
              </TouchableOpacity>
              
              <Text style={dynamicStyles.currentDay}>{dayExercises[currentDay].dayName}</Text>
              
              <TouchableOpacity
                style={dynamicStyles.dayNavButton}
                onPress={() => {
                  const nextDay = currentDay === DAYS.length - 1 ? 0 : currentDay + 1;
                  setCurrentDay(nextDay);
                }}
              >
                <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Exercise List */}
            <Text style={dynamicStyles.sectionTitle}>
              {dayExercises[currentDay].exercises.length > 0 
                ? `${dayExercises[currentDay].dayName}'s Exercises` 
                : 'Exercise Plan'
              }
            </Text>
            <View style={dynamicStyles.exerciseList}>
              {dayExercises[currentDay].exercises.length === 0 ? (
                <View style={[dynamicStyles.exerciseItem, { alignItems: 'center', paddingVertical: responsive.getResponsivePadding(SPACING.lg) }]}>
                  <Ionicons name="fitness-outline" size={32} color={COLORS.text.secondary} />
                  <Text style={[dynamicStyles.exerciseName, { textAlign: 'center', marginTop: responsive.getResponsiveMargin(SPACING.sm) }]}>
                    Rest Day
                  </Text>
                  <Text style={[dynamicStyles.exerciseCategory, { textAlign: 'center' }]}>
                    No exercises planned for {dayExercises[currentDay].dayName}
                  </Text>
                </View>
              ) : (
                dayExercises[currentDay].exercises.map((exercise, index) => (
                  <View key={exercise.id} style={dynamicStyles.exerciseItem}>
                    <View style={dynamicStyles.exerciseHeader}>
                      <View style={dynamicStyles.exerciseIcon}>
                        <Text style={{ fontSize: responsive.getResponsiveFontSize(FONT_SIZE.xs), fontWeight: 'bold', color: COLORS.text.primary }}>
                          {index + 1}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={dynamicStyles.exerciseName}>{exercise.name}</Text>
                        <Text style={dynamicStyles.exerciseCategory}>{exercise.category}</Text>
                      </View>
                      {(() => {
                        const dbCategory = exerciseCategories[exercise.id] || exercise.category;
                        const categoryInfo = getCategoryInfo(dbCategory);
                        return (
                          <View style={[dynamicStyles.difficultyBadge, { backgroundColor: categoryInfo.color + '20', borderColor: categoryInfo.color }]}>
                            <Ionicons name={categoryInfo.icon as any} size={10} color={categoryInfo.color} />
                            <Text style={[dynamicStyles.difficultyText, { color: categoryInfo.color, marginLeft: 4 }]}>
                              {categoryInfo.name}
                            </Text>
                          </View>
                        );
                      })()}
                    </View>
                    <View style={dynamicStyles.exerciseDetails}>
                      {/* Info Button for Guidance */}
                      <TouchableOpacity
                        style={dynamicStyles.guidanceInfoButton}
                        onPress={() => setShowGuidanceModal(true)}
                      >
                        <Ionicons name="information-circle-outline" size={16} color={COLORS.primary.main} />
                        <Text style={dynamicStyles.guidanceInfoText}>Exercise Guidance</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          {/* Action Button */}
          <View style={dynamicStyles.actionButtons}>
            <TouchableOpacity
              style={dynamicStyles.singleButton}
              onPress={() => isActive ? onSetInactive?.(routine) : onSetActive?.(routine)}
            >
              <Ionicons 
                name={isActive ? "pause" : "play"} 
                size={16} 
                color={COLORS.text.inverse} 
              />
              <Text style={dynamicStyles.buttonText}>
                {isActive ? 'Set Inactive' : 'Set Active'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Exercise Guidance Modal */}
      <Modal
        visible={showGuidanceModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGuidanceModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.guidanceModalContainer}>
            <View style={dynamicStyles.guidanceModalHeader}>
              <Text style={dynamicStyles.guidanceModalTitle}>💡 Exercise Guidance</Text>
              <TouchableOpacity
                onPress={() => setShowGuidanceModal(false)}
                style={dynamicStyles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={dynamicStyles.guidanceModalContent}>
              <View style={dynamicStyles.guidanceGrid}>
                <View style={dynamicStyles.guidanceItem}>
                  <Text style={dynamicStyles.guidanceLabel}>Sets & Reps</Text>
                  <Text style={dynamicStyles.guidanceText}>3-4 sets, 8-15 reps</Text>
                </View>
                <View style={dynamicStyles.guidanceItem}>
                  <Text style={dynamicStyles.guidanceLabel}>Rest Time</Text>
                  <Text style={dynamicStyles.guidanceText}>60-90 seconds</Text>
                </View>
                <View style={dynamicStyles.guidanceItem}>
                  <Text style={dynamicStyles.guidanceLabel}>Progression</Text>
                  <Text style={dynamicStyles.guidanceText}>Increase gradually</Text>
                </View>
                <View style={dynamicStyles.guidanceItem}>
                  <Text style={dynamicStyles.guidanceLabel}>Frequency</Text>
                  <Text style={dynamicStyles.guidanceText}>Listen to your body</Text>
                </View>
              </View>
              <Text style={dynamicStyles.guidanceNote}>
                These are general guidelines. Adjust based on your fitness level and how you feel.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
