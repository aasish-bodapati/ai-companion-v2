import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFitnessStore, useFitnessWeekStats, useFitnessLoading } from '../../stores';
import { useAuth } from '../../contexts/AuthContext';

export default function FitnessScreenMinimal() {
  console.log('🔄 [FITNESS SCREEN MINIMAL] Rendering...');
  
  const { user } = useAuth();
  const refreshFitnessData = useFitnessStore((state) => state.refreshFitnessData);
  
  console.log('🔄 [FITNESS SCREEN MINIMAL] Getting weekStats...');
  const weekStats = useFitnessWeekStats();
  console.log('🔄 [FITNESS SCREEN MINIMAL] weekStats:', weekStats);
  
  console.log('🔄 [FITNESS SCREEN MINIMAL] Getting loading...');
  const loading = useFitnessLoading();
  console.log('🔄 [FITNESS SCREEN MINIMAL] loading:', loading);

  const handleRefresh = async () => {
    console.log('🔄 [FITNESS SCREEN MINIMAL] Refresh button pressed');
    await refreshFitnessData();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fitness (Minimal Debug)</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.text}>User: {user?.email || 'Not logged in'}</Text>
        <Text style={styles.text}>Loading: {loading ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>Week Stats: {JSON.stringify(weekStats)}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 10,
  },
  content: {
    padding: 20,
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
});
