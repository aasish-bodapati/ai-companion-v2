import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import stepTrackingService from '../../services/stepTrackingService';

export default function StepTrackingTest() {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [currentSteps, setCurrentSteps] = useState<number>(0);
  const [todaySteps, setTodaySteps] = useState<number>(0);

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    try {
      const available = await stepTrackingService.isAvailable();
      setIsAvailable(available);
      console.log('🚶 Step tracking available:', available);
    } catch (error) {
      console.error('🚶 Error checking availability:', error);
      Alert.alert('Error', 'Failed to check step tracking availability');
    }
  };

  const startTracking = async () => {
    try {
      const started = await stepTrackingService.startTracking();
      if (started) {
        setIsTracking(true);
        Alert.alert('Success', 'Step tracking started!');
      } else {
        Alert.alert('Error', 'Failed to start step tracking');
      }
    } catch (error) {
      console.error('🚶 Error starting tracking:', error);
      Alert.alert('Error', 'Failed to start step tracking');
    }
  };

  const stopTracking = async () => {
    try {
      await stepTrackingService.stopTracking();
      setIsTracking(false);
      Alert.alert('Success', 'Step tracking stopped!');
    } catch (error) {
      console.error('🚶 Error stopping tracking:', error);
      Alert.alert('Error', 'Failed to stop step tracking');
    }
  };

  const getTodaySteps = async () => {
    try {
      const steps = await stepTrackingService.getTodaySteps();
      setTodaySteps(steps);
      console.log('🚶 Today steps:', steps);
    } catch (error) {
      console.error('🚶 Error getting today steps:', error);
      Alert.alert('Error', 'Failed to get today steps');
    }
  };

  const getCurrentSteps = () => {
    const steps = stepTrackingService.getCurrentSteps();
    setCurrentSteps(steps);
    console.log('🚶 Current steps:', steps);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Step Tracking Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Available: {isAvailable ? '✅ Yes' : '❌ No'}
        </Text>
        <Text style={styles.statusText}>
          Tracking: {isTracking ? '✅ Active' : '❌ Inactive'}
        </Text>
        <Text style={styles.statusText}>
          Current Steps: {currentSteps.toLocaleString()}
        </Text>
        <Text style={styles.statusText}>
          Today Steps: {todaySteps.toLocaleString()}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={checkAvailability}
        >
          <Text style={styles.buttonText}>Check Availability</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.successButton]} 
          onPress={startTracking}
          disabled={!isAvailable || isTracking}
        >
          <Text style={styles.buttonText}>Start Tracking</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.warningButton]} 
          onPress={stopTracking}
          disabled={!isTracking}
        >
          <Text style={styles.buttonText}>Stop Tracking</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.infoButton]} 
          onPress={getTodaySteps}
        >
          <Text style={styles.buttonText}>Get Today Steps</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.infoButton]} 
          onPress={getCurrentSteps}
        >
          <Text style={styles.buttonText}>Get Current Steps</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  statusContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  successButton: {
    backgroundColor: '#34C759',
  },
  warningButton: {
    backgroundColor: '#FF9500',
  },
  infoButton: {
    backgroundColor: '#5856D6',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
