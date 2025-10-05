import React, { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalState } from '../../contexts/GlobalStateContext';
import DashboardModule from '../../modules/DashboardModule';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { refreshData } = useGlobalState();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

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