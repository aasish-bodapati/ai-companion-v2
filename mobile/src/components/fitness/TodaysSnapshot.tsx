import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TodaysWorkout {
  id: string;
  name: string;
  type: 'routine' | 'quick' | 'custom';
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exercises: string[];
  calories: number;
}

interface TodaysSnapshotProps {
  weeklyWorkouts: number;
  alignmentScore: number;
  caloriesBurned: number;
  streak: number;
  todaysWorkout?: TodaysWorkout;
  onQuickLog?: () => void;
  onViewWorkout?: (workout: TodaysWorkout) => void;
  onViewProgress?: () => void;
}

export default function TodaysSnapshot({
  weeklyWorkouts,
  alignmentScore,
  caloriesBurned,
  streak,
  todaysWorkout,
  onQuickLog,
  onViewWorkout,
  onViewProgress,
}: TodaysSnapshotProps) {
  const getAlignmentColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getAlignmentLabel = (score: number) => {
    if (score >= 80) return 'On Track';
    if (score >= 60) return 'Good Progress';
    return 'Needs Focus';
  };

  const getMotivationalQuote = () => {
    const quotes = [
      "Every workout counts towards your goal!",
      "Consistency is the key to success.",
      "You're stronger than you think!",
      "Progress over perfection.",
      "Today's effort is tomorrow's strength.",
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Today's Focus</Text>
          <Text style={styles.subtitle}>{getMotivationalQuote()}</Text>
        </View>
        <TouchableOpacity 
          style={styles.streakButton}
          onPress={onViewProgress}
        >
          <Ionicons name="flame" size={20} color="#f97316" />
          <Text style={styles.streakText}>{streak} day streak</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="fitness-outline" size={16} color="#3b82f6" />
          <Text style={styles.statValue}>{weeklyWorkouts}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="trending-up-outline" size={16} color={getAlignmentColor(alignmentScore)} />
          <Text style={[styles.statValue, { color: getAlignmentColor(alignmentScore) }]}>
            {alignmentScore}%
          </Text>
          <Text style={styles.statLabel}>{getAlignmentLabel(alignmentScore)}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="flame-outline" size={16} color="#f97316" />
          <Text style={styles.statValue}>{caloriesBurned}</Text>
          <Text style={styles.statLabel}>Calories</Text>
        </View>
      </View>

      {/* Today's Recommended Workout */}
      {todaysWorkout ? (
        <TouchableOpacity 
          style={styles.workoutCard}
          onPress={() => onViewWorkout?.(todaysWorkout)}
        >
          <View style={styles.workoutHeader}>
            <View style={styles.workoutInfo}>
              <Ionicons 
                name={todaysWorkout.type === 'routine' ? 'list-outline' : 'fitness-outline'} 
                size={20} 
                color="#3b82f6" 
              />
              <Text style={styles.workoutTitle}>Recommended: {todaysWorkout.name || 'Workout'}</Text>
            </View>
            <View style={styles.workoutBadge}>
              <Text style={styles.workoutBadgeText}>
                {todaysWorkout.difficulty ? 
                  todaysWorkout.difficulty.charAt(0).toUpperCase() + todaysWorkout.difficulty.slice(1) :
                  'Unknown'
                }
              </Text>
            </View>
          </View>
          
          <View style={styles.workoutDetails}>
            <View style={styles.workoutDetail}>
              <Ionicons name="time-outline" size={14} color="#6b7280" />
              <Text style={styles.workoutDetailText}>{todaysWorkout.estimatedDuration || 0} min</Text>
            </View>
            <View style={styles.workoutDetail}>
              <Ionicons name="barbell-outline" size={14} color="#6b7280" />
              <Text style={styles.workoutDetailText}>{todaysWorkout.exercises?.length || 0} exercises</Text>
            </View>
            <View style={styles.workoutDetail}>
              <Ionicons name="flame-outline" size={14} color="#6b7280" />
              <Text style={styles.workoutDetailText}>~{todaysWorkout.calories || 0} cal</Text>
            </View>
          </View>
          
          <View style={styles.workoutActions}>
            <TouchableOpacity 
              style={styles.quickLogButton}
              onPress={onQuickLog}
            >
              <Ionicons name="play-outline" size={16} color="#ffffff" />
              <Text style={styles.quickLogText}>Quick Log</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.viewButton}
              onPress={() => onViewWorkout?.(todaysWorkout)}
            >
              <Text style={styles.viewButtonText}>View Details</Text>
              <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.noWorkoutCard}>
          <Ionicons name="fitness-outline" size={32} color="#d1d5db" />
          <Text style={styles.noWorkoutTitle}>No workout planned today</Text>
          <Text style={styles.noWorkoutSubtitle}>Start with a quick exercise or create a routine</Text>
          <TouchableOpacity 
            style={styles.quickLogButton}
            onPress={onQuickLog}
          >
            <Ionicons name="add-outline" size={16} color="#ffffff" />
            <Text style={styles.quickLogText}>Quick Log</Text>
          </TouchableOpacity>
        </View>
      )}
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
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  streakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f97316',
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  workoutCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  workoutBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  workoutBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  workoutDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  workoutDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  workoutDetailText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  workoutActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickLogButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  quickLogText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 6,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginRight: 4,
  },
  noWorkoutCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noWorkoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  noWorkoutSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
  },
});
