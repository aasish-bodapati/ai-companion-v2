import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore, useProgressMetrics, useAchievements, useStreaks, useAIInsights } from '../../stores';
import DashboardModule from '../../modules/DashboardModule';

export default function DashboardScreen() {
  const { user } = useAuth();
  // Re-enable Zustand store with fixes
  const { refreshData } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const hasRefreshedRef = useRef(false);

  // Initialize store data when component mounts
  useEffect(() => {
    if (user && !hasRefreshedRef.current) {
      hasRefreshedRef.current = true;
      refreshData(); // Re-enabled with loading guard in store
    }
  }, [user, refreshData]); // Include refreshData in dependencies

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData(); // Re-enabled with loading guard in store
    setRefreshing(false);
  }, [refreshData]); // Include refreshData in dependencies

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
