import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

/**
 * Example component showing how to integrate the Analytics Dashboard
 * into your main app navigation and dashboard screens.
 */
export default function AnalyticsIntegrationExample() {
  const navigation = useNavigation();

  const navigateToAnalytics = () => {
    // Navigate to the analytics screen
    navigation.navigate('Analytics' as never);
  };

  const navigateToBodyTypeProgress = () => {
    // Navigate to the body type progress dashboard
    navigation.navigate('BodyTypeProgress' as never);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analytics Integration</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={navigateToAnalytics}
        >
          <Ionicons name="analytics-outline" size={24} color="#3b82f6" />
          <Text style={styles.buttonText}>View Analytics</Text>
          <Text style={styles.buttonSubtext}>Deep insights & trends</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={navigateToBodyTypeProgress}
        >
          <Ionicons name="trending-up-outline" size={24} color="#10b981" />
          <Text style={styles.buttonText}>Body Type Progress</Text>
          <Text style={styles.buttonSubtext}>Daily coaching & scoring</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Two Analytics Approaches:</Text>
        
        <View style={styles.infoItem}>
          <Ionicons name="analytics" size={20} color="#3b82f6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Comprehensive Analytics</Text>
            <Text style={styles.infoDescription}>
              Deep insights, trends, and patterns over time. Perfect for stepping back and seeing the big picture.
            </Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="trending-up" size={20} color="#10b981" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Body Type Progress</Text>
            <Text style={styles.infoDescription}>
              Daily coaching with point-based scoring. Real-time feedback and motivation for day-to-day progress.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 12,
    flex: 1,
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 12,
  },
  infoContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
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
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});
