import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { healthService, HealthData } from '../services/healthService';

export default function HomeScreen() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📱 HomeScreen: Starting fetchHealthData...');
      
      // Test basic connectivity first with fetch
      console.log('📱 HomeScreen: Testing basic connectivity with fetch...');
      const testUrl = 'http://192.168.1.5:8000/health';
      console.log('📱 HomeScreen: Test URL:', testUrl);
      
      try {
        const fetchResponse = await fetch(testUrl);
        console.log('📱 HomeScreen: Fetch response status:', fetchResponse.status);
        const fetchData = await fetchResponse.json();
        console.log('📱 HomeScreen: Fetch response data:', fetchData);
      } catch (fetchError) {
        // Silent error handling - no console logging to prevent Expo Go notifications
      }
      
      const data = await healthService.getHealthData();
      console.log('📱 HomeScreen: Successfully received data:', data);
      setHealthData(data);
    } catch (err) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      Alert.alert('Error', `Failed to fetch health data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchHealthData();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>AI Companion Mobile</Text>
        <Text style={styles.subtitle}>Health Data</Text>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Loading health data...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <Text style={styles.retryText} onPress={handleRefresh}>
              Tap to retry
            </Text>
          </View>
        )}

        {healthData && !loading && (
          <View style={styles.dataContainer}>
            <Text style={styles.dataTitle}>Health Status:</Text>
            <Text style={styles.dataText}>
              {(() => {
                try {
                  return JSON.stringify(healthData, null, 2);
                } catch (error) {
                  return 'Error displaying data';
                }
              })()}
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Text style={styles.refreshButton} onPress={handleRefresh}>
            Refresh Data
          </Text>
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
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginVertical: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 16,
    marginBottom: 8,
  },
  retryText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  dataContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginVertical: 16,
  },
  dataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  dataText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  refreshButton: {
    backgroundColor: '#6366f1',
    color: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: '600',
    overflow: 'hidden',
  },
});
