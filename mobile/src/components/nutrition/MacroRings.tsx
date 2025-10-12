
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';


import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../../theme/constants';

interface MacroData {
  type: 'calories' | 'protein' | 'carbs' | 'fat';
  current: number;
  target: number;
  color: string;
  icon: string;
  unit: string;
}

interface MacroRingsProps {
  macros: MacroData[];
  onMacroPress?: (macro: MacroData) => void;
}

export default function MacroRings({ macros, onMacroPress }: MacroRingsProps) {
  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getStatusColor = (percentage: number, type: string) => {
    if (type === 'calories') {
      if (percentage >= 90 && percentage <= 110) return '#10b981'; // Green for good range
      if (percentage >= 80 && percentage <= 120) return '#f59e0b'; // Yellow for acceptable
      return '#ef4444'; // Red for too high/low
    } else {
      if (percentage >= 90 && percentage <= 110) return '#10b981';
      if (percentage >= 75 && percentage <= 125) return '#f59e0b';
      return '#ef4444';
    }
  };

  const getStatusText = (percentage: number, type: string) => {
    if (type === 'calories') {
      if (percentage >= 90 && percentage <= 110) return 'Perfect!';
      if (percentage >= 80 && percentage <= 120) return 'Good';
      if (percentage < 80) return 'Low';
      return 'High';
    } else {
      if (percentage >= 90 && percentage <= 110) return 'Perfect!';
      if (percentage >= 75 && percentage <= 125) return 'Good';
      if (percentage < 75) return 'Low';
      return 'High';
    }
  };

  const MacroRing = ({ macro }: { macro: MacroData }) => {
    const percentage = getProgressPercentage(macro.current, macro.target);
    const statusColor = getStatusColor(percentage, macro.type);
    const statusText = getStatusText(percentage, macro.type);

    // Calculate ring dimensions
    const radius = 40;

    return (
      <TouchableOpacity
        style={styles.ringContainer}
        onPress={() => onMacroPress?.(macro)}
        activeOpacity={0.7}
      >
        <View style={styles.ringWrapper}>
          {/* Background Ring */}
          <View style={[styles.ringBackground, { width: radius * 2, height: radius * 2 }]}>
            <View style={[styles.ringProgress, {
              width: radius * 2,
              height: radius * 2,
              borderColor: statusColor,
              transform: [{ rotate: `${(percentage / 100) * 360}deg` }]
            }]} />
          </View>

          {/* Content */}
          <View style={styles.ringContent}>
            <Ionicons name={macro.icon as keyof typeof Ionicons.glyphMap} size={16} color={statusColor} />
            <Text style={[styles.ringValue, { color: statusColor }]}>
              {Math.round(macro.current)}
            </Text>
            <Text style={styles.ringUnit}>{macro.unit}</Text>
          </View>
        </View>

        <Text style={styles.ringLabel}>{macro.type.charAt(0).toUpperCase() + macro.type.slice(1)}</Text>
        <Text style={[styles.ringStatus, { color: statusColor }]}>{statusText}</Text>
        <Text style={styles.ringTarget}>Target: {macro.target}{macro.unit}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Macros</Text>
        <TouchableOpacity>
          <Text style={styles.viewDetailsText}>View Details</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.ringsGrid}>
        {macros.map((macro) => (
          <MacroRing key={macro.type} macro={macro} />
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="add" size={16} color="#3b82f6" />
          <Text style={styles.quickActionText}>Add Food</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="water" size={16} color="#06b6d4" />
          <Text style={styles.quickActionText}>Log Water</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="analytics" size={16} color="#8b5cf6" />
          <Text style={styles.quickActionText}>View Trends</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  viewDetailsText: {
    fontSize: FONT_SIZE.md,
    color: '#3b82f6',
    fontWeight: '500',
  },
  ringsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  ringContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  ringWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  ringBackground: {
    position: 'absolute',
    borderRadius: 40,
    borderWidth: 6,
    borderColor: '#e5e7eb',
  },
  ringProgress: {
    position: 'absolute',
    borderRadius: 40,
    borderWidth: 6,
    borderColor: 'transparent',
    borderTopColor: '#3b82f6',
  },
  ringContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
    marginTop: 2,
  },
  ringUnit: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text.secondary,
  },
  ringLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 2,
  },
  ringStatus: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  ringTarget: {
    fontSize: 9,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  quickActionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
});
