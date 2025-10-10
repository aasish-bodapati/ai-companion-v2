import React from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useFitnessWeekStats, useFitnessLoading } from '../../stores';
import TodaysSnapshot from '../../components/fitness/TodaysSnapshot';

export default function FitnessScreenMinimal2() {
  console.log('🔄 [FITNESS SCREEN MINIMAL2] Rendering...');
  
  const { user } = useAuth();
  console.log('🔄 [FITNESS SCREEN MINIMAL2] User:', user?.email);
  
  // Test store calls
  console.log('🔄 [FITNESS SCREEN MINIMAL2] Getting weekStats...');
  const weekStats = useFitnessWeekStats();
  console.log('🔄 [FITNESS SCREEN MINIMAL2] weekStats:', weekStats);
  
  console.log('🔄 [FITNESS SCREEN MINIMAL2] Getting loading...');
  const loading = useFitnessLoading();
  console.log('🔄 [FITNESS SCREEN MINIMAL2] loading:', loading);

  // Test useFocusEffect
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 [FITNESS SCREEN MINIMAL2] useFocusEffect called');
    }, [])
  );

  // Mock data for TodaysSnapshot
  const todaysWorkout = {
    id: '1',
    name: 'Upper Body Strength',
    type: 'routine' as const,
    estimatedDuration: 45,
    difficulty: 'intermediate' as const,
    exercises: ['Push-ups', 'Pull-ups', 'Dips'],
    calories: 300,
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.text}>Fitness Screen - Testing TodaysSnapshot</Text>
      <Text style={styles.text}>User: {user?.email || 'Not logged in'}</Text>
      <Text style={styles.text}>Loading: {loading ? 'Yes' : 'No'}</Text>
      <Text style={styles.text}>Week Stats: {JSON.stringify(weekStats)}</Text>
      
      {/* Test TodaysSnapshot Component */}
      <TodaysSnapshot
        weeklyWorkouts={weekStats?.totalWorkouts || 0}
        alignmentScore={75}
        caloriesBurned={weekStats?.totalCalories || 0}
        streak={3}
        todaysWorkout={todaysWorkout}
        onQuickLog={() => console.log('Quick log pressed')}
        onViewWorkout={(workout) => console.log('View workout:', workout)}
        onViewProgress={() => console.log('View progress pressed')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
});
