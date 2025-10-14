/**
 * MobileDashboard - Mobile-first dashboard optimized for one-handed use
 * Clean, focused interface for busy professionals
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ThumbZoneLayout from '../ui/ThumbZoneLayout';
import MobileButton from '../ui/MobileButton';
import FloatingActionButton from '../ui/FloatingActionButton';
import SwipeableCard from '../ui/SwipeableCard';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../theme/constants';
import { hapticFeedback } from '../../utils/haptics';

interface MobileDashboardProps {
  onLogWorkout: () => void;
  onLogMeal: () => void;
  onLogWater: () => void;
  onLogMood: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

interface QuickStat {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress?: () => void;
}

const QUICK_STATS: QuickStat[] = [
  {
    id: 'workouts',
    title: 'Workouts',
    value: '3',
    subtitle: 'This week',
    icon: 'fitness',
    color: COLORS.primary,
  },
  {
    id: 'water',
    title: 'Water',
    value: '6/8',
    subtitle: 'Glasses today',
    icon: 'water',
    color: COLORS.info,
  },
  {
    id: 'calories',
    title: 'Calories',
    value: '1,850',
    subtitle: 'Burned today',
    icon: 'flame',
    color: COLORS.warning,
  },
  {
    id: 'streak',
    title: 'Streak',
    value: '7',
    subtitle: 'Days logging',
    icon: 'trophy',
    color: COLORS.success,
  },
];

const QUICK_ACTIONS = [
  {
    id: 'workout',
    title: 'Log Workout',
    icon: 'fitness',
    color: COLORS.primary,
    onPress: () => {},
  },
  {
    id: 'meal',
    title: 'Log Meal',
    icon: 'restaurant',
    color: COLORS.success,
    onPress: () => {},
  },
  {
    id: 'water',
    title: 'Log Water',
    icon: 'water',
    color: COLORS.info,
    onPress: () => {},
  },
  {
    id: 'mood',
    title: 'Log Mood',
    icon: 'happy',
    color: COLORS.warning,
    onPress: () => {},
  },
];

export default function MobileDashboard({
  onLogWorkout,
  onLogMeal,
  onLogWater,
  onLogMood,
  onRefresh,
  refreshing = false,
}: MobileDashboardProps) {
  const [selectedStat, setSelectedStat] = useState<string | null>(null);

  const handleStatPress = (stat: QuickStat) => {
    hapticFeedback.light();
    setSelectedStat(stat.id);
    stat.onPress?.();
  };

  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    hapticFeedback.medium();
    action.onPress();
  };

  const handleSwipeAction = (action: string) => {
    hapticFeedback.medium();
    switch (action) {
      case 'workout':
        onLogWorkout();
        break;
      case 'meal':
        onLogMeal();
        break;
      case 'water':
        onLogWater();
        break;
      case 'mood':
        onLogMood();
        break;
    }
  };

  return (
    <ThumbZoneLayout>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Good morning!</Text>
          <Text style={styles.welcomeSubtitle}>Ready to log your health today?</Text>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.statsGrid}>
            {QUICK_STATS.map((stat) => (
              <TouchableOpacity
                key={stat.id}
                style={[
                  styles.statCard,
                  selectedStat === stat.id && styles.selectedStatCard
                ]}
                onPress={() => handleStatPress(stat)}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              >
                <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                  <Ionicons name={stat.icon} size={24} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
                <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <MobileButton
                key={action.id}
                title={action.title}
                icon={action.icon}
                onPress={() => handleQuickAction(action)}
                variant="secondary"
                size="medium"
                style={[styles.actionButton, { borderLeftColor: action.color }]}
              />
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <SwipeableCard
            swipeActions={[
              {
                id: 'workout',
                label: 'Log',
                icon: 'fitness',
                color: COLORS.white,
                backgroundColor: COLORS.primary,
                onPress: () => handleSwipeAction('workout'),
              },
              {
                id: 'water',
                label: 'Water',
                icon: 'water',
                color: COLORS.white,
                backgroundColor: COLORS.info,
                onPress: () => handleSwipeAction('water'),
              },
            ]}
          >
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="fitness" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Morning Workout</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
              <View style={styles.activityBadge}>
                <Text style={styles.activityBadgeText}>30 min</Text>
              </View>
            </View>
          </SwipeableCard>

          <SwipeableCard
            swipeActions={[
              {
                id: 'meal',
                label: 'Log',
                icon: 'restaurant',
                color: COLORS.white,
                backgroundColor: COLORS.success,
                onPress: () => handleSwipeAction('meal'),
              },
            ]}
          >
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="restaurant" size={20} color={COLORS.success} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Lunch</Text>
                <Text style={styles.activityTime}>1 hour ago</Text>
              </View>
              <View style={styles.activityBadge}>
                <Text style={styles.activityBadgeText}>450 cal</Text>
              </View>
            </View>
          </SwipeableCard>
        </View>

        {/* Bottom Spacing for FAB */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton
        onPress={onLogWorkout}
        icon="add"
        label="Quick Log"
        variant="primary"
        size="large"
        position="bottom-right"
      />
    </ThumbZoneLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: SPACING.large,
    paddingVertical: SPACING.medium,
  },
  welcomeTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  welcomeSubtitle: {
    fontSize: FONT_SIZE.medium,
    color: COLORS.text.secondary,
  },
  statsSection: {
    paddingHorizontal: SPACING.large,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.large,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.medium,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.small,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedStatCard: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.small,
  },
  statValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  statTitle: {
    fontSize: FONT_SIZE.medium,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  statSubtitle: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.secondary,
  },
  actionsSection: {
    paddingHorizontal: SPACING.large,
    marginBottom: SPACING.xl,
  },
  actionsGrid: {
    gap: SPACING.small,
  },
  actionButton: {
    borderLeftWidth: 4,
  },
  activitySection: {
    paddingHorizontal: SPACING.large,
    marginBottom: SPACING.xl,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.medium,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: FONT_SIZE.medium,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  activityTime: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.secondary,
  },
  activityBadge: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: BORDER_RADIUS.small,
    paddingHorizontal: SPACING.small,
    paddingVertical: SPACING.xs,
  },
  activityBadgeText: {
    fontSize: FONT_SIZE.small,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.primary,
  },
  bottomSpacing: {
    height: 100, // Space for FAB
  },
});
