import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE } from '../../theme/constants';

interface QuickStat {
  icon: string;
  label: string;
  value: string;
  progress: number; // 0-100
  color: string;
  onPress?: () => void;
}

interface QuickStatsRowProps {
  stats: QuickStat[];
}

export default function QuickStatsRow({ stats }: QuickStatsRowProps) {
  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <TouchableOpacity
          key={index}
          style={styles.statCard}
          onPress={stat.onPress}
          activeOpacity={0.7}
        >
          <View style={styles.statHeader}>
            <Ionicons name={stat.icon as keyof typeof Ionicons.glyphMap} size={20} color={stat.color} />
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
          <Text style={styles.statLabel}>{stat.label}</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${Math.max(5, stat.progress)}%`,
                  backgroundColor: stat.color
                }
              ]}
            />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginLeft: 6,
  },
  statLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
