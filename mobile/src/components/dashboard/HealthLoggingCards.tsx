import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LastActivity {
  type: 'workout' | 'meal';
  name: string;
  time: string;
  calories?: number;
}

interface WellnessData {
  water: { current: number; target: number };
  sleep: { current: number; target: number };
  mood: string;
  notes?: string;
}

interface HealthLoggingCardsProps {
  lastActivities: LastActivity[];
  wellness: WellnessData;
  onLogWorkout?: () => void;
  onLogMeal?: () => void;
  onLogWater?: () => void;
  onLogMood?: () => void;
  onLogSleep?: () => void;
  onAddNote?: () => void;
}

export default function HealthLoggingCards({
  lastActivities,
  wellness,
  onLogWorkout,
  onLogMeal,
  onLogWater,
  onLogMood,
  onLogSleep,
  onAddNote,
}: HealthLoggingCardsProps) {
  const getActivityIcon = (type: string) => {
    return type === 'workout' ? 'fitness-outline' : 'restaurant-outline';
  };

  const getActivityColor = (type: string) => {
    return type === 'workout' ? '#10b981' : '#3b82f6';
  };

  const getMoodIcon = (mood: string) => {
    switch (mood.toLowerCase()) {
      case 'excellent': return 'happy';
      case 'good': return 'happy-outline';
      case 'okay': return 'remove-circle-outline';
      case 'bad': return 'sad-outline';
      case 'terrible': return 'sad';
      default: return 'help-outline';
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood.toLowerCase()) {
      case 'excellent': return '#10b981';
      case 'good': return '#22c55e';
      case 'okay': return '#f59e0b';
      case 'bad': return '#f97316';
      case 'terrible': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      {/* Activity & Nutrition Log Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="list-outline" size={20} color="#3b82f6" />
          <Text style={styles.cardTitle}>Activity & Nutrition</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        <View style={styles.activitiesList}>
          {lastActivities.length > 0 ? (
            lastActivities.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <Ionicons 
                  name={getActivityIcon(activity.type) as keyof typeof Ionicons.glyphMap} 
                  size={16} 
                  color={getActivityColor(activity.type)} 
                />
                <View style={styles.activityInfo}>
                  <Text style={styles.activityName}>{activity.name}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
                {activity.calories && (
                  <Text style={styles.activityCalories}>{activity.calories} cal</Text>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="add-circle-outline" size={32} color="#d1d5db" />
              <Text style={styles.emptyText}>No activities logged today</Text>
            </View>
          )}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onLogWorkout}
          >
            <Ionicons name="fitness-outline" size={16} color="#10b981" />
            <Text style={styles.actionButtonText}>Log Workout</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onLogMeal}
          >
            <Ionicons name="restaurant-outline" size={16} color="#3b82f6" />
            <Text style={styles.actionButtonText}>Log Meal</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Wellness Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="heart-outline" size={20} color="#ef4444" />
          <Text style={styles.cardTitle}>Wellness</Text>
        </View>

        <View style={styles.wellnessGrid}>
          <TouchableOpacity 
            style={styles.wellnessItem}
            onPress={onLogWater}
          >
            <View style={styles.wellnessIconContainer}>
              <Ionicons name="water" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.wellnessValue}>{wellness.water.current}L</Text>
            <Text style={styles.wellnessTarget}>/{wellness.water.target}L</Text>
            <View style={styles.circularProgress}>
              <View 
                style={[
                  styles.circularProgressFill,
                  { 
                    transform: [{ rotate: `${(wellness.water.current / wellness.water.target) * 360}deg` }]
                  }
                ]}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.wellnessItem}
            onPress={onLogMood}
          >
            <View style={styles.wellnessIconContainer}>
              <Ionicons 
                name={getMoodIcon(wellness.mood) as keyof typeof Ionicons.glyphMap} 
                size={20} 
                color={getMoodColor(wellness.mood)} 
              />
            </View>
            <Text style={[styles.wellnessValue, { color: getMoodColor(wellness.mood) }]}>
              {wellness.mood}
            </Text>
            <Text style={styles.wellnessLabel}>Mood</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.wellnessItem}
            onPress={onLogSleep}
          >
            <View style={styles.wellnessIconContainer}>
              <Ionicons name="moon-outline" size={20} color="#8b5cf6" />
            </View>
            <Text style={styles.wellnessValue}>{wellness.sleep.current}h</Text>
            <Text style={styles.wellnessTarget}>/{wellness.sleep.target}h</Text>
            <View style={styles.circularProgress}>
              <View 
                style={[
                  styles.circularProgressFill,
                  { 
                    transform: [{ rotate: `${(wellness.sleep.current / wellness.sleep.target) * 360}deg` }]
                  }
                ]}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.wellnessItem}
            onPress={onAddNote}
          >
            <View style={styles.wellnessIconContainer}>
              <Ionicons name="document-text-outline" size={20} color="#6b7280" />
            </View>
            <Text style={styles.wellnessValue}>+</Text>
            <Text style={styles.wellnessLabel}>Note</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  addButton: {
    padding: 4,
  },
  activitiesList: {
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  activityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  activityTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  activityCalories: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginLeft: 6,
  },
  wellnessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  wellnessItem: {
    width: '47%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    position: 'relative',
  },
  wellnessIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  wellnessValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  wellnessTarget: {
    fontSize: 12,
    color: '#6b7280',
  },
  wellnessLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  circularProgress: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  circularProgressFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
});
