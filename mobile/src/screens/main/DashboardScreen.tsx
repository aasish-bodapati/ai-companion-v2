import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useHealthActions, type HealthActions } from '../../stores';
import DashboardModule from '../../modules/DashboardModule';
import { useActiveRoutine } from '../../hooks/useActiveRoutine';

import { DebugUtils } from '../../utils/debugUtils';

export default function DashboardScreen() {
  const { user } = useAuth();
  // Re-enable Zustand store with fixes
  const healthActions: HealthActions = useHealthActions();
  const { activeRoutineId } = useActiveRoutine();
  const [refreshing, setRefreshing] = useState(false);
  const hasRefreshedRef = useRef(false);

  // Enhanced debugging
  if (__DEV__) {
    DebugUtils.log('🔄 [DASHBOARD SCREEN] Rendering with:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      activeRoutineId,
      timestamp: new Date().toISOString()
    });
  }

  // Initialize store data when component mounts
  useEffect(() => {
    if (user && !hasRefreshedRef.current) {
      hasRefreshedRef.current = true;
      healthActions.refreshData(); // Re-enabled with loading guard in store
    }
  }, [user]); // Remove refreshData from dependencies to prevent infinite re-renders

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await healthActions.refreshData(); // Re-enabled with loading guard in store
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
