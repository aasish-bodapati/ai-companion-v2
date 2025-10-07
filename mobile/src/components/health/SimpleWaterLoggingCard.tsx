import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticFeedback } from '../../utils/haptics';
import { COLORS, SPACING } from '../../theme/constants';
import { waterService } from '../../services/waterService';

interface SimpleWaterLoggingCardProps {
  onWaterLogged?: () => void;
}

export default function SimpleWaterLoggingCard({ onWaterLogged }: SimpleWaterLoggingCardProps) {
  const [waterStats, setWaterStats] = useState({
    total_ml_today: 0,
    goal_ml: 3000,
    progress_percentage: 0,
    logs_today: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load water data on mount
  useEffect(() => {
    loadWaterData();
  }, []);

  const loadWaterData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const stats = await waterService.getWaterStats();
      setWaterStats({
        total_ml_today: stats.total_ml_today || 0,
        goal_ml: stats.goal_ml || 3000,
        progress_percentage: stats.progress_percentage || 0,
        logs_today: stats.logs_today || 0,
      });
    } catch (err) {
      console.error('Error loading water data:', err);
      setError('Failed to load water data');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLog = async (amount_ml: number) => {
    console.log('🚰 [WATER LOGGING] handleQuickLog called with amount_ml:', amount_ml);
    console.log('🚰 [WATER LOGGING] Current waterStats:', waterStats);
    
    try {
      hapticFeedback.light();
      setLoading(true);
      setError(null);
      
      console.log('🚰 [WATER LOGGING] Starting optimistic update');
      
      // Optimistically update the UI first
      const newTotal = waterStats.total_ml_today + amount_ml;
      const newProgress = Math.min((newTotal / waterStats.goal_ml) * 100, 100);
      const newLogs = waterStats.logs_today + 1;
      
      console.log('🚰 [WATER LOGGING] Calculated new values:', {
        newTotal,
        newProgress,
        newLogs,
        goal_ml: waterStats.goal_ml
      });
      
      setWaterStats(prev => ({
        ...prev,
        total_ml_today: newTotal,
        progress_percentage: newProgress,
        logs_today: newLogs,
      }));
      
      console.log('🚰 [WATER LOGGING] UI updated optimistically');
      
      // Try the API call with detailed timing logs
      const startTime = Date.now();
      console.log('🚰 [WATER API] Starting water log API call at:', new Date().toISOString());
      console.log('🚰 [WATER API] API URL being used: http://192.168.1.5:8000/api/v1/health/water-logs');
      console.log('🚰 [WATER API] Request payload:', {
        amount_ml,
        timestamp: new Date().toISOString(),
      });
      
                try {
                  console.log('🚰 [WATER API] Creating timeout promise (3 seconds)');
                  let timeoutId: NodeJS.Timeout;
                  const timeoutPromise = new Promise((_, reject) => {
                    timeoutId = setTimeout(() => {
                      console.log('🚰 [WATER API] Timeout reached - rejecting promise');
                      reject(new Error('Request timeout'));
                    }, 3000);
                  });
                  
                  console.log('🚰 [WATER API] Creating API call promise');
                  const apiCall = waterService.createWaterLog({
                    amount_ml,
                    timestamp: new Date().toISOString(),
                  });
                  
                  console.log('🚰 [WATER API] Racing API call against timeout');
                  const result = await Promise.race([apiCall, timeoutPromise]);
                  
                  // Clear the timeout since API call succeeded
                  clearTimeout(timeoutId);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log('🚰 [WATER API] Water log API call completed successfully in:', duration, 'ms');
        
        hapticFeedback.success();
        onWaterLogged?.();
      } catch (apiError) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.warn('🚰 [WATER API] API call failed after:', duration, 'ms');
        console.warn('🚰 [WATER API] Error details:', {
          message: apiError.message,
          name: apiError.name,
          stack: apiError.stack,
          code: apiError.code
        });
        
        // If API fails, just show a warning but keep the UI change
        setError(`Water logged locally (API took ${duration}ms)`);
        
        // Clear the error after 3 seconds
        setTimeout(() => setError(null), 3000);
        
        hapticFeedback.success();
        onWaterLogged?.();
      }
    } catch (error) {
      console.error('🚰 [WATER LOGGING] Unexpected error in handleQuickLog:', error);
      hapticFeedback.error();
      setError('Failed to log water');
      
      // Revert optimistic update on error
      await loadWaterData();
    } finally {
      console.log('🚰 [WATER LOGGING] handleQuickLog completed, setting loading to false');
      setLoading(false);
    }
  };

  const handleQuickLogTap = () => {
    handleQuickLog(250); // Standard 250ml
  };

  const handleQuickLogMinus = async () => {
    try {
      hapticFeedback.light();
      setLoading(true);
      setError(null);
      
      if (waterStats.logs_today === 0) {
        hapticFeedback.error();
        setError('No water logs to remove');
        return;
      }
      
      // Optimistically update the UI first
      const newTotal = Math.max(waterStats.total_ml_today - 250, 0);
      const newProgress = Math.min((newTotal / waterStats.goal_ml) * 100, 100);
      const newLogs = Math.max(waterStats.logs_today - 1, 0);
      
      setWaterStats(prev => ({
        ...prev,
        total_ml_today: newTotal,
        progress_percentage: newProgress,
        logs_today: newLogs,
      }));
      
      // Try the API call with a shorter timeout
      try {
        let timeoutId: NodeJS.Timeout;
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Request timeout')), 3000);
        });
        
        // Get today's logs and delete the most recent one
        const todaysLogs = await Promise.race([
          waterService.getWaterLogs(1),
          timeoutPromise
        ]);
        
        // Clear the timeout since API call succeeded
        clearTimeout(timeoutId);
        
        if (todaysLogs.length === 0) {
          // Revert optimistic update if no logs found
          await loadWaterData();
          return;
        }
        
        const mostRecentLog = todaysLogs[todaysLogs.length - 1];
        
        // Create a new timeout for the delete operation
        let deleteTimeoutId: NodeJS.Timeout;
        const deleteTimeoutPromise = new Promise((_, reject) => {
          deleteTimeoutId = setTimeout(() => reject(new Error('Request timeout')), 3000);
        });
        
        await Promise.race([
          waterService.deleteWaterLog(mostRecentLog.id),
          deleteTimeoutPromise
        ]);
        
        // Clear the delete timeout since API call succeeded
        clearTimeout(deleteTimeoutId);
        
        hapticFeedback.success();
      } catch (apiError) {
        // If API fails, just show a warning but keep the UI change
        console.warn('API call failed, but UI updated:', apiError);
        setError('Water log removed locally (sync pending)');
        
        // Clear the error after 3 seconds
        setTimeout(() => setError(null), 3000);
        
        hapticFeedback.success();
      }
    } catch (error) {
      hapticFeedback.error();
      setError('Failed to remove water log');
      console.error('Error removing water log:', error);
      
      // Revert optimistic update on error
      await loadWaterData();
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = Math.min((waterStats.total_ml_today / waterStats.goal_ml) * 100, 100);
  const remainingMl = Math.max(waterStats.goal_ml - waterStats.total_ml_today, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="water" size={20} color="#3b82f6" />
          <Text style={styles.title}>Water Intake</Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={loadWaterData}
          disabled={loading}
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color={loading ? "#9ca3af" : "#3b82f6"} 
          />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.content}>
        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Today's Progress</Text>
            <Text style={styles.progressValue}>
              {Math.round(waterStats.total_ml_today)}ml / {waterStats.goal_ml}ml
            </Text>
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
          
          <View style={styles.progressStats}>
            <Text style={styles.progressPercentage}>
              {Math.round(progressPercentage)}%
            </Text>
            <Text style={styles.remainingText}>
              {remainingMl > 0 ? `${remainingMl}ml remaining` : 'Goal reached! 🎉'}
            </Text>
          </View>

        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.minusButton,
              waterStats.logs_today === 0 && styles.disabledButton
            ]}
            onPress={handleQuickLogMinus}
            disabled={loading || waterStats.logs_today === 0}
          >
            <Ionicons name="remove" size={16} color="#ffffff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.plusButton]}
            onPress={handleQuickLogTap}
            disabled={loading}
          >
            <Ionicons name="add" size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.quickLogInfo}>
          <Text style={styles.quickLogText}>Tap + to add 250ml, - to remove last log</Text>
          <Text style={styles.quickLogSubtext}>
            {waterStats.logs_today > 0 ? `${waterStats.logs_today} logs today` : 'Tap multiple times for more'}
          </Text>
        </View>

        {/* Loading Indicator - Only show if there's an error or long delay */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3b82f6" />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 6,
  },
  refreshButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginLeft: 8,
  },
  content: {
    gap: 12,
  },
  progressSection: {
    gap: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3b82f6',
  },
  remainingText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 8,
  },
  actionButton: {
    width: 40,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  minusButton: {
    backgroundColor: '#ef4444',
  },
  plusButton: {
    backgroundColor: '#3b82f6',
  },
  disabledButton: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
    elevation: 0,
  },
  quickLogInfo: {
    alignItems: 'center',
    paddingTop: 4,
  },
  quickLogText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 2,
  },
  quickLogSubtext: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
});
