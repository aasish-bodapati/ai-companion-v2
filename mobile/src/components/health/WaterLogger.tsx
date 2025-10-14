import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticFeedback } from '../../utils/haptics';
import { COLORS, SPACING } from '../../theme/constants';
import { simpleWaterService, SimpleWaterStats } from '../../services/SimpleWaterService';
import LoadingState from '../ui/LoadingState';
import ConfirmationDialog from '../ui/ConfirmationDialog';
import { loadingStateConfigs } from '../ui/LoadingState.utils';
import { confirmationDialogConfigs } from '../ui/ConfirmationDialog.utils';
import { useToast } from '../../contexts/ToastContext';

import { DebugUtils } from '../../utils/debugUtils';

interface WaterLoggerProps {
  onWaterLogged?: () => void;
}

export default function WaterLogger({ onWaterLogged }: WaterLoggerProps) {
  const { showToast } = useToast();
  // Water goal constants - could be moved to theme constants if needed
  const WATER_GOAL_ML = 3200;
  const WATER_GOAL_OZ = 108.2;
  
  const [stats, setStats] = useState<SimpleWaterStats>({
    total_ml_today: 0,
    total_oz_today: 0,
    goal_ml: WATER_GOAL_ML,
    goal_oz: WATER_GOAL_OZ,
    progress_percentage: 0,
    logs_today: 0,
  });
  const [loading, setLoading] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load initial stats
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const newStats = await simpleWaterService.getTodayStats();
      setStats(newStats);
    } catch (error) {
      DebugUtils.error('🚰 [WATER LOGGER] Failed to load stats:', error);
      showToast.error('Failed to load water stats', 'Please try again later');
    }
  };

  const logWater = async (amount_ml: number) => {
    if (loading) return;

    try {
      setLoading(true);
      hapticFeedback.light();

      DebugUtils.log('🚰 [WATER LOGGER] Logging water:', amount_ml, 'ml');
      const newStats = await simpleWaterService.logWater(amount_ml);

      setStats(newStats);
      hapticFeedback.success();
      onWaterLogged?.();

      DebugUtils.log('🚰 [WATER LOGGER] Water logged successfully');
      showToast.success(`${amount_ml}ml water logged!`);

      // Add a small delay to prevent rapid state changes
      // Using existing theme animation duration
      const { ANIMATION } = require('../../theme/constants');
      await new Promise(resolve => setTimeout(resolve, ANIMATION.normal));
    } catch (error) {
      DebugUtils.error('🚰 [WATER LOGGER] Failed to log water:', error);
      hapticFeedback.error();
      showToast.error('Failed to log water', 'Please try again');
      setErrorMessage('Failed to log water. Please try again.');
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const removeLastLog = async () => {
    if (loading || stats.logs_today === 0) return;

    try {
      setLoading(true);
      hapticFeedback.light();

      DebugUtils.log('🚰 [WATER LOGGER] Removing last water log');
      const newStats = await simpleWaterService.removeLastLog();

      setStats(newStats);
      hapticFeedback.success();
      onWaterLogged?.();

      DebugUtils.log('🚰 [WATER LOGGER] Last water log removed');
      showToast.success('Water log removed');

      // Add a small delay to prevent rapid state changes
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      DebugUtils.error('🚰 [WATER LOGGER] Failed to remove water log:', error);
      hapticFeedback.error();
      showToast.error('Failed to remove water log', 'Please try again');
      setErrorMessage('Failed to remove water log. Please try again.');
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const progressWidth = Math.min(stats.progress_percentage, 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="water" size={24} color={COLORS.primary.main} />
        <Text style={styles.title}>Water Intake</Text>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.amountText}>
          {stats.total_ml_today}ml / {stats.goal_ml}ml
        </Text>
        <Text style={styles.percentageText}>
          {Math.round(stats.progress_percentage)}%
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressWidth}%` }
            ]}
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.minusButton,
            (stats.logs_today === 0 || loading) && styles.disabledButton
          ]}
          onPress={removeLastLog}
          disabled={stats.logs_today === 0 || loading}
        >
          <Ionicons name="remove" size={20} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.plusButton,
            loading && styles.disabledButton
          ]}
          onPress={() => logWater(250)}
          disabled={loading}
        >
          <Ionicons name="add" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {loading
            ? 'Logging water...'
            : `Tap + to add 250ml, - to remove last log`
          }
        </Text>
        <LoadingState
          loading={loading}
          message=""
          size="small"
          variant="inline"
          showMessage={false}
          {...loadingStateConfigs.dataFetching}
        />
      </View>

      <ConfirmationDialog
        visible={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        onConfirm={() => setShowErrorDialog(false)}
        title="Error"
        message={errorMessage}
        confirmText="OK"
        variant="danger"
        showCancel={false}
        {...confirmationDialogConfigs.networkError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: SPACING.md,
    marginHorizontal: 16,
    marginVertical: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: SPACING.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary.main,
  },
  progressContainer: {
    marginBottom: SPACING.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.background.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary.main,
    borderRadius: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  plusButton: {
    backgroundColor: COLORS.primary.main,
  },
  minusButton: {
    backgroundColor: COLORS.error.main,
  },
  disabledButton: {
    opacity: 0.5,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});
