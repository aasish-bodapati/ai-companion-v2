import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
// Removed Zustand store imports
import DashboardModule from '../../modules/DashboardModule';
import { useActiveRoutine } from '../../hooks/ConsolidatedDataHook';

import { DebugUtils } from '../../utils/debugUtils';

export default function DashboardScreen() {
  const { user } = useAuth();
  // Removed Zustand store usage
  const { data: activeRoutine, loading: activeRoutineLoading } = useActiveRoutine();
  const activeRoutineId = activeRoutine?.id || null;
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
      // Removed Zustand store usage - data loading handled by individual components
    }
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Removed Zustand store usage - data loading handled by individual components
    setRefreshing(false);
  }, []);

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
