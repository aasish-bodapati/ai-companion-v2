import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { healthService, HealthData } from '../services/HealthService';
import { DebugUtils } from '../utils/debugUtils';

import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../../theme/constants';
import { STYLE_PRESETS } from '../../theme/duplicateStyles';

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

      DebugUtils.log('📱 HomeScreen: Starting fetchHealthData...');

      // Test basic connectivity first with fetch
      DebugUtils.log('📱 HomeScreen: Testing basic connectivity with fetch...');
      const testUrl = 'http://192.168.1.11:8000/health';
      DebugUtils.log('📱 HomeScreen: Test URL:', testUrl);

      try {
        const fetchResponse = await fetch(testUrl);
        DebugUtils.log('📱 HomeScreen: Fetch response status:', fetchResponse.status);
        const fetchData = await fetchResponse.json();
        DebugUtils.log('📱 HomeScreen: Fetch response data:', fetchData);
      } catch {
        // Silent error handling - no console logging to prevent Expo Go notifications
      }

      const data = await healthService.getHealthData();
      DebugUtils.log('📱 HomeScreen: Successfully received data:', data);
      setHealthData(data);
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
      const errorMessage = 'Unknown error occurred';
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
                } catch {
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
    backgroundColor: COLORS.background.secondary,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxxxl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text.secondary,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginVertical: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: FONT_SIZE.lg,
    marginBottom: 8,
  },
  retryText: {
    color: '#6366f1',
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  dataContainer: {
    backgroundColor: COLORS.background.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginVertical: 16,
  },
  dataTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  dataText: {
    fontSize: FONT_SIZE.md,
    color: '#374151',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  refreshButton: {
    backgroundColor: '#6366f1',
    color: COLORS.text.inverse,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    overflow: 'hidden',
  },
});
