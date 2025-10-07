/**
 * Analytics store using Zustand
 * Manages analytics and chart data
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { AnalyticsStore, AnalyticsData } from './types';
import { dashboardService } from '../services/dashboardService';

// Initial state
const initialState = {
  analyticsData: null,
  weeklyActivityData: {
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
  },
  loading: false,
  error: null,
  lastUpdated: null,
};

// Create the analytics store
export const useAnalyticsStore = create<AnalyticsStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Basic setters
      setAnalyticsData: (analyticsData) => set({ analyticsData }, false, 'setAnalyticsData'),
      setWeeklyActivityData: (weeklyActivityData) => 
        set({ weeklyActivityData }, false, 'setWeeklyActivityData'),
      setLoading: (loading) => set({ loading }, false, 'setLoading'),
      setError: (error) => set({ error, loading: false }, false, 'setError'),

      // Data refresh
      refreshAnalyticsData: async () => {
        const { setLoading, setError, setAnalyticsData, setWeeklyActivityData } = get();
        
        try {
          setLoading(true);
          setError(null);
          
          // Load analytics data
          const analyticsData = await dashboardService.getAnalyticsData();
          setAnalyticsData(analyticsData);
          
          // Calculate weekly activity data
          if (analyticsData) {
            const weeklyActivityData = {
              monday: analyticsData.weekly_activity?.monday || 0,
              tuesday: analyticsData.weekly_activity?.tuesday || 0,
              wednesday: analyticsData.weekly_activity?.wednesday || 0,
              thursday: analyticsData.weekly_activity?.thursday || 0,
              friday: analyticsData.weekly_activity?.friday || 0,
              saturday: analyticsData.weekly_activity?.saturday || 0,
              sunday: analyticsData.weekly_activity?.sunday || 0,
            };
            setWeeklyActivityData(weeklyActivityData);
          }
          
          set({ lastUpdated: new Date().toISOString() }, false, 'refreshAnalyticsData');
        } catch (error) {
          console.error('Error refreshing analytics data:', error);
          setError('Failed to refresh analytics data');
        } finally {
          setLoading(false);
        }
      },

      // Reset state
      resetAnalyticsState: () => set(initialState, false, 'resetAnalyticsState'),
    }),
    {
      name: 'analytics-store',
    }
  )
);

// Selector hooks for better performance with shallow comparison
export const useAnalyticsData = () => useAnalyticsStore((state) => state.analyticsData, shallow);
export const useWeeklyActivityData = () => useAnalyticsStore((state) => state.weeklyActivityData, shallow);
export const useAnalyticsLoading = () => useAnalyticsStore((state) => state.loading, shallow);
export const useAnalyticsError = () => useAnalyticsStore((state) => state.error, shallow);
export const useAnalyticsLastUpdated = () => useAnalyticsStore((state) => state.lastUpdated, shallow);

// Action hooks
export const useAnalyticsActions = () => useAnalyticsStore((state) => ({
  setAnalyticsData: state.setAnalyticsData,
  setWeeklyActivityData: state.setWeeklyActivityData,
  setLoading: state.setLoading,
  setError: state.setError,
  refreshAnalyticsData: state.refreshAnalyticsData,
  resetAnalyticsState: state.resetAnalyticsState,
}));
