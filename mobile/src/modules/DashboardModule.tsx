
import { View, StyleSheet, ScrollView, RefreshControl, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import WelcomeCard from '../components/dashboard/WelcomeCard';
import WaterLogger from '../components/health/WaterLogger';
import { useProgressMetricsData } from '../hooks/useProgressMetrics';
import { useAuth } from '../contexts/AuthContext';
import useResponsive from '../hooks/useResponsive';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../theme/constants';

import { DebugUtils } from '../utils/debugUtils';

const styles = StyleSheet.create({
  statsContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  quickActionsCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginLeft: 8,
  },
});

interface DashboardModuleProps {
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  activeRoutineId?: number | null;
}

export default function DashboardModule({
  onRefresh,
  refreshing = false,
  onNavigate,
  activeRoutineId,
}: DashboardModuleProps) {
  const { user } = useAuth();
  const progressData = useProgressMetricsData();
  const responsive = useResponsive();

  const quickStats = [
    {
      label: 'Workouts',
      value: progressData?.rings?.[0]?.value || 0,
      icon: 'fitness-outline',
      color: '#3b82f6',
    },
    {
      label: 'Calories',
      value: progressData?.rings?.[1]?.value || 0,
      icon: 'flame-outline',
      color: '#ef4444',
    },
    {
      label: 'Protein',
      value: progressData?.rings?.[2]?.value || 0,
      icon: 'nutrition-outline',
      color: '#10b981',
    },
    {
      label: 'Water',
      value: progressData?.rings?.[3]?.value || 0,
      icon: 'water-outline',
      color: '#06b6d4',
    },
  ];

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8fafc',
    },
    content: {
      flex: 1,
      paddingHorizontal: responsive.breakpoints.isTablet ? 24 : 0,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <ScrollView
        style={dynamicStyles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        {/* Welcome Card */}
        <WelcomeCard
          userName={user?.full_name || 'there'}
          onPress={() => onNavigate?.('Profile')}
        />

        {/* Today's Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Today's Progress</Text>
          <View style={styles.statsGrid}>
            {quickStats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                  <Ionicons name={stat.icon as any} size={24} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onNavigate?.('Fitness', { mode: 'workout' })}
            >
              <Ionicons name="fitness-outline" size={20} color="#3b82f6" />
              <Text style={styles.actionButtonText}>Log Workout</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onNavigate?.('Nutrition')}
            >
              <Ionicons name="restaurant-outline" size={20} color="#10b981" />
              <Text style={styles.actionButtonText}>Log Meal</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Water Logging */}
        <WaterLogger />
      </ScrollView>
    </View>
  );
}
