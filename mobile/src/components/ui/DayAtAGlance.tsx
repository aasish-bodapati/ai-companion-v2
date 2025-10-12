
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';

import { Ionicons } from '@expo/vector-icons';
import { COMMON_STYLES } from '../../theme/constants';

interface DayAtAGlanceProps {
  todayStats: {
    meals?: number;
    calories_consumed?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
  };
  onMealPress?: () => void;
}

export default function DayAtAGlance({
  todayStats,
  onMealPress,
}: DayAtAGlanceProps) {
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
        {/* Meals */}
        <TouchableOpacity
          style={[styles.statItem, styles.mealItem]}
          onPress={onMealPress}
          activeOpacity={0.8}
        >
          <Ionicons name="restaurant" size={20} color="#10b981" />
          <Text style={styles.statValue}>{todayStats.meals || 0}</Text>
          <Text style={styles.statLabel}>Meals</Text>
        </TouchableOpacity>

        {/* Calories Consumed */}
        <View style={[styles.statItem, styles.calorieItem]}>
          <Ionicons name="flame" size={20} color="#ef4444" />
          <Text style={styles.statValue}>{todayStats.calories_consumed || 0}</Text>
          <Text style={styles.statLabel}>Calories</Text>
        </View>
      </View>

      {/* Daily Macros */}
      <View style={styles.macrosSection}>
        <Text style={styles.macrosTitle}>Daily Macros</Text>
        <View style={styles.macrosRow}>
          <View style={styles.macroItem}>
            <Ionicons name="fitness" size={16} color="#ef4444" />
            <Text style={styles.macroValue}>{Math.round(todayStats.protein_g || 0)}g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroItem}>
            <Ionicons name="leaf" size={16} color="#10b981" />
            <Text style={styles.macroValue}>{Math.round(todayStats.carbs_g || 0)}g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroItem}>
            <Ionicons name="water" size={16} color="#f59e0b" />
            <Text style={styles.macroValue}>{Math.round(todayStats.fat_g || 0)}g</Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COMMON_STYLES.cardBackground,
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
    marginBottom: 16,
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: COMMON_STYLES.secondaryBackground,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 80,
    justifyContent: 'center',
  },
  mealItem: {
    borderTopWidth: 3,
    borderTopColor: '#10b981',
  },
  calorieItem: {
    borderTopWidth: 3,
    borderTopColor: '#ef4444',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 6,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  macrosSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  macrosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 6,
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },
});
