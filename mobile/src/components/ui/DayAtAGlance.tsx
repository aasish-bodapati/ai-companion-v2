import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DayAtAGlanceProps {
  todayStats: {
    workouts?: number;
    meals?: number;
    water_ml?: number;
    calories_burned?: number;
    calories_consumed?: number;
    streak?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
  };
  onWorkoutPress?: () => void;
  onMealPress?: () => void;
  onWaterPress?: () => void;
}

export default function DayAtAGlance({
  todayStats,
  onWorkoutPress,
  onMealPress,
  onWaterPress,
}: DayAtAGlanceProps) {
  const waterGlasses = Math.round((todayStats.water_ml || 0) / 250);
  const netCalories = (todayStats.calories_consumed || 0) - (todayStats.calories_burned || 0);
  
  const getStreakMessage = () => {
    const streak = todayStats.streak || 0;
    if (streak === 0) return "Start your journey! 💫";
    if (streak < 3) return `${streak} day streak! Keep going! 🚀`;
    if (streak < 7) return `${streak} days strong! 💪`;
    if (streak < 30) return `${streak} days! Amazing! 🌟`;
    return `${streak} days! You're unstoppable! 🔥`;
  };

  const getCalorieStatus = () => {
    if (netCalories > 200) return { text: `+${netCalories} kcal`, color: '#ef4444', icon: 'trending-up' };
    if (netCalories < -200) return { text: `${netCalories} kcal`, color: '#10b981', icon: 'trending-down' };
    return { text: `${netCalories} kcal`, color: '#6b7280', icon: 'remove' };
  };

  const calorieStatus = getCalorieStatus();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Day at a Glance</Text>
        <Text style={styles.subtitle}>{new Date().toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })}</Text>
      </View>

      {/* Main Stats Row */}
      <View style={styles.statsRow}>
        {/* Workouts */}
        <TouchableOpacity 
          style={[styles.statItem, styles.workoutItem]} 
          onPress={onWorkoutPress}
          activeOpacity={0.8}
        >
          <Ionicons name="fitness" size={18} color="#f59e0b" />
          <Text style={styles.statValue}>{todayStats.workouts || 0}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </TouchableOpacity>

        {/* Meals */}
        <TouchableOpacity 
          style={[styles.statItem, styles.mealItem]} 
          onPress={onMealPress}
          activeOpacity={0.8}
        >
          <Ionicons name="restaurant" size={18} color="#10b981" />
          <Text style={styles.statValue}>{todayStats.meals || 0}</Text>
          <Text style={styles.statLabel}>Meals</Text>
        </TouchableOpacity>

        {/* Water */}
        <TouchableOpacity 
          style={[styles.statItem, styles.waterItem]} 
          onPress={onWaterPress}
          activeOpacity={0.8}
        >
          <Ionicons name="water" size={18} color="#3b82f6" />
          <Text style={styles.statValue}>{waterGlasses}</Text>
          <Text style={styles.statLabel}>Water</Text>
        </TouchableOpacity>

        {/* Calories Consumed */}
        <View style={[styles.statItem, styles.calorieItem]}>
          <Ionicons name="restaurant" size={18} color="#ef4444" />
          <Text style={styles.statValue}>{todayStats.calories_consumed || 0}</Text>
          <Text style={styles.statLabel}>Calories</Text>
        </View>
      </View>

      {/* Daily Macros & Calories */}
      <View style={styles.macrosSection}>
        <Text style={styles.macrosTitle}>Daily Macros & Calories</Text>
        <View style={styles.macrosRow}>
          <View style={styles.macroItem}>
            <Ionicons name="fitness" size={14} color="#ef4444" />
            <Text style={styles.macroValue}>{Math.round(todayStats.protein_g || 0)}g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroItem}>
            <Ionicons name="leaf" size={14} color="#10b981" />
            <Text style={styles.macroValue}>{Math.round(todayStats.carbs_g || 0)}g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroItem}>
            <Ionicons name="water" size={14} color="#f59e0b" />
            <Text style={styles.macroValue}>{Math.round(todayStats.fat_g || 0)}g</Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
        </View>
        <View style={styles.caloriesRow}>
          <View style={styles.calorieItem}>
            <Ionicons name="restaurant" size={14} color="#10b981" />
            <Text style={styles.calorieValue}>{todayStats.calories_consumed || 0}</Text>
            <Text style={styles.calorieLabel}>Consumed</Text>
          </View>
          <View style={styles.calorieItem}>
            <Ionicons name="flame" size={14} color="#ef4444" />
            <Text style={styles.calorieValue}>{todayStats.calories_burned || 0}</Text>
            <Text style={styles.calorieLabel}>Burned</Text>
          </View>
        </View>
      </View>

      {/* Streak & Net Calories */}
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Ionicons name="flame" size={16} color="#8b5cf6" />
          <Text style={styles.footerText}>{getStreakMessage()}</Text>
        </View>
        
        <View style={styles.footerItem}>
          <Ionicons name={calorieStatus.icon as any} size={16} color={calorieStatus.color} />
          <Text style={[styles.footerText, { color: calorieStatus.color }]}>
            Net: {calorieStatus.text}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginHorizontal: 2,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  workoutItem: {
    borderTopWidth: 3,
    borderTopColor: '#f59e0b',
  },
  mealItem: {
    borderTopWidth: 3,
    borderTopColor: '#10b981',
  },
  waterItem: {
    borderTopWidth: 3,
    borderTopColor: '#3b82f6',
  },
  calorieItem: {
    borderTopWidth: 3,
    borderTopColor: '#ef4444',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  macrosSection: {
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  macrosTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  caloriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  calorieItem: {
    alignItems: 'center',
    flex: 1,
  },
  calorieValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
    marginBottom: 2,
  },
  calorieLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 6,
  },
});
