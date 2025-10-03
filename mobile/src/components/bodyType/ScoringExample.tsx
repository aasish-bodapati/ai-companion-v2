import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBodyTypeScoring } from '../../hooks/useBodyTypeScoring';
import { BodyTypeGoal, UserAttributes } from '../../services/bodyTypeGoals';
import { DailyLog, WorkoutLog, NutritionLog } from '../../services/bodyTypeScoringService';
import ScoringCard from './ScoringCard';
import BodyTypeScoringDashboard from './BodyTypeScoringDashboard';

interface ScoringExampleProps {
  bodyTypeGoal: BodyTypeGoal;
  userAttributes: UserAttributes;
}

export default function ScoringExample({ bodyTypeGoal, userAttributes }: ScoringExampleProps) {
  const [showDashboard, setShowDashboard] = useState(false);

  // Example daily log data
  const exampleDailyLog: DailyLog = {
    workouts: [
      { type: 'strength', duration: 60, intensity: 'moderate' },
      { type: 'cardio', duration: 30, intensity: 'moderate' },
    ],
    nutrition: [
      { proteinPerKg: 1.8, calories: 2200, tdee: 2000, isJunkProcessed: false },
      { proteinPerKg: 1.6, calories: 1800, tdee: 2000, isJunkProcessed: false },
      { proteinPerKg: 1.4, calories: 1900, tdee: 2000, isJunkProcessed: true },
    ],
    waterIntake: 3.2,
    steps: 8500,
    sleepHours: 8,
    progressiveOverload: true,
  };

  const {
    dailyResult,
    weeklyResult,
    loading,
    error,
    refreshScores,
    isReady,
  } = useBodyTypeScoring({
    bodyTypeGoal,
    userAttributes,
    dailyLog: exampleDailyLog,
  });

  if (!isReady) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading scoring system...</Text>
      </View>
    );
  }

  if (showDashboard) {
    return (
      <BodyTypeScoringDashboard
        bodyTypeGoal={bodyTypeGoal}
        userAttributes={userAttributes}
        dailyLog={exampleDailyLog}
        onRefresh={refreshScores}
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Body Type Scoring</Text>
        <Text style={styles.subtitle}>Track your alignment with {bodyTypeGoal.name}</Text>
        <TouchableOpacity 
          style={styles.dashboardButton}
          onPress={() => setShowDashboard(true)}
        >
          <Ionicons name="analytics-outline" size={20} color="#ffffff" />
          <Text style={styles.dashboardButtonText}>View Dashboard</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Calculating scores...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={24} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {dailyResult && (
        <View style={styles.cardsContainer}>
          <ScoringCard
            title="Today's Progress"
            result={dailyResult}
            onPress={() => setShowDashboard(true)}
          />
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>How Scoring Works</Text>
        <Text style={styles.infoText}>
          • Each action gets points based on alignment with your body type goal
        </Text>
        <Text style={styles.infoText}>
          • + Points = closer to goal, - Points = farther from goal
        </Text>
        <Text style={styles.infoText}>
          • Daily alignment % = (positive points ÷ total possible points) × 100
        </Text>
        <Text style={styles.infoText}>
          • {'>'}70% = Closer ↗, 40-70% = Neutral →, {'<'}40% = Farther ↘
        </Text>
      </View>

      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Example for {bodyTypeGoal.name}</Text>
        <View style={styles.exampleItem}>
          <Ionicons name="fitness-outline" size={20} color="#10b981" />
          <Text style={styles.exampleText}>Strength workout: +12 points</Text>
        </View>
        <View style={styles.exampleItem}>
          <Ionicons name="restaurant-outline" size={20} color="#10b981" />
          <Text style={styles.exampleText}>Protein 1.8g/kg: +10 points</Text>
        </View>
        <View style={styles.exampleItem}>
          <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
          <Text style={styles.exampleText}>Junk meal: -5 points</Text>
        </View>
        <View style={styles.exampleItem}>
          <Ionicons name="trophy-outline" size={20} color="#f59e0b" />
          <Text style={styles.exampleText}>4-5 sessions/week: +15 bonus</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 16,
  },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  dashboardButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  cardsContainer: {
    padding: 16,
  },
  infoContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  exampleContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  exampleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exampleText: {
    fontSize: 14,
    color: '#1f2937',
    marginLeft: 12,
  },
});