import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore } from '../../stores';
import DashboardModule from '../../modules/DashboardModule';
import { useActiveRoutine } from '../../hooks/useActiveRoutine';

import { DebugUtils } from '../../utils/debugUtils';

export default function DashboardScreen() {
  const { user } = useAuth();
  // Re-enable Zustand store with fixes
  const { refreshData } = useAppStore();
  const { activeRoutineId } = useActiveRoutine();
  const [refreshing, setRefreshing] = useState(false);
  const hasRefreshedRef = useRef(false);

  // DebugUtils.log('🔄 [DASHBOARD SCREEN] Rendering with activeRoutineId:', activeRoutineId);

  // Initialize store data when component mounts
  useEffect(() => {
    if (user && !hasRefreshedRef.current) {
      hasRefreshedRef.current = true;
      refreshData(); // Re-enabled with loading guard in store
    }
  }, [user]); // Remove refreshData from dependencies to prevent infinite re-renders

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData(); // Re-enabled with loading guard in store
    setRefreshing(false);
  }, []); // Remove refreshData from dependencies to prevent infinite re-renders

  const handleNavigate = useCallback((screen: string, params?: unknown) => {
    // Handle navigation to other screens
  }, []);

  return (
    <DashboardModule
      onRefresh={onRefresh}
      refreshing={refreshing}
      onNavigate={handleNavigate}
      activeRoutineId={activeRoutineId}
    />
  );
}
