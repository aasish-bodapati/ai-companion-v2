import React, { useState, useEffect } from 'react';
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
import ComprehensiveAnalyticsDashboard from '../../components/analytics/ComprehensiveAnalyticsDashboard';

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const [bodyTypeGoal, setBodyTypeGoal] = useState<BodyTypeGoal | null>(null);
  const [userAttributes, setUserAttributes] = useState<UserAttributes | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load user's body type goal
      const { getBodyTypeGoalById } = await import('../../services/bodyTypeGoals');
      const { profileService } = await import('../../services/profileService');
      
      const profile = await profileService.getUserProfile();
      if (profile?.body_type_goal) {
        const goal = await getBodyTypeGoalById(profile.body_type_goal);
        setBodyTypeGoal(goal);
      }

      // Set user attributes
      if (profile?.health_data) {
        setUserAttributes({
          age: parseInt(profile.health_data.age) || 25,
          weight: parseInt(profile.health_data.weight) || 70,
          height: parseInt(profile.health_data.height) || 175,
          gender: profile.health_data.gender || 'male',
          activityLevel: profile.health_data.activity_level || 'moderate',
        });
      }
      
    } catch (error) {
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range as any);
  };

  const handleRefresh = () => {
    loadUserData();
  };

  if (loading || !bodyTypeGoal || !userAttributes) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <ComprehensiveAnalyticsDashboard
        bodyTypeGoal={bodyTypeGoal}
        userAttributes={userAttributes}
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
        onRefresh={handleRefresh}
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
