import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { BodyTypeGoal, UserAttributes } from '../../services/bodyTypeGoals';
import { DailyLog, WorkoutLog, BodyTypeNutritionLog } from '../../services/bodyTypeScoringService';
import BodyTypeProgressDashboard from '../../components/bodyType/BodyTypeProgressDashboard';

export default function BodyTypeDashboardScreen() {
  const { user } = useAuth();
  const [bodyTypeGoal, setBodyTypeGoal] = useState<BodyTypeGoal | null>(null);
  const [userAttributes, setUserAttributes] = useState<UserAttributes | null>(null);
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load user's body type goal
      const { getBodyTypeGoalById } = await import('../../services/bodyTypeGoals');
      const { profileService } = await import('../../services/profileService');
      
      const profile = await profileService.getUserProfile();
      if (profile?.bodyTypeGoal) {
        const goal = await getBodyTypeGoalById(profile.bodyTypeGoal);
        setBodyTypeGoal(goal);
      }

      // Set user attributes
      if (profile?.health_data) {
        setUserAttributes({
          age: parseInt(profile.health_data.age || '25') || 25,
          weight: parseInt(profile.health_data.weight || '70') || 70,
          height: parseInt(profile.health_data.height || '175') || 175,
          gender: (profile.health_data.gender as 'male' | 'female' | 'other') || 'male',
          activityLevel: (profile.health_data.activity_level as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active') || 'moderate',
        });
      }

      // Load today's logs (mock data for demo)
      setDailyLog(generateMockDailyLog());
      
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  const generateMockDailyLog = (): DailyLog => {
    return {
      workouts: [
        { type: 'moderate_strength', duration: 60, intensity: 'moderate' },
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
  };

  const handleLogActivity = () => {
    Alert.alert(
      'Log Activity',
      'This would open the activity logging screen',
      [{ text: 'OK' }]
    );
  };

  const handleRefresh = () => {
    loadUserData();
  };

  if (loading || !bodyTypeGoal || !userAttributes) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <BodyTypeProgressDashboard
        bodyTypeGoal={bodyTypeGoal}
        userAttributes={userAttributes}
        dailyLog={dailyLog || undefined}
        onRefresh={handleRefresh}
        onLogActivity={handleLogActivity}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
