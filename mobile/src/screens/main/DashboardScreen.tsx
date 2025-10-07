import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore, useProgressMetrics, useAchievements, useStreaks, useAIInsights } from '../../stores';
import DashboardModule from '../../modules/DashboardModule';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { refreshData } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  // Initialize store data when component mounts
  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user]); // Remove refreshData from dependencies to prevent infinite loop

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, []); // Remove refreshData from dependencies to prevent infinite loop

  const handleNavigate = useCallback((screen: string, params?: any) => {
    // Handle navigation to other screens
    console.log('Navigate to:', screen, params);
  }, []);

  return (
    <DashboardModule
      onRefresh={onRefresh}
      refreshing={refreshing}
      onNavigate={handleNavigate}
    />
  );
}
