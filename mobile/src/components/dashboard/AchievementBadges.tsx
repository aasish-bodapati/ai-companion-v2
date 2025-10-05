import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DUPLICATE_STYLES } from '../../theme/duplicateStyles';
import { isFeatureEnabled } from '../../config/featureFlags';
import { MigrationHelpers } from '../../utils/migrationHelpers';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  progress?: number;
  target?: number;
  category: 'fitness' | 'nutrition' | 'wellness' | 'streak';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementBadgesProps {
  achievements?: Achievement[];
  onAchievementPress?: (achievement: Achievement) => void;
  onViewAll?: () => void;
  style?: any;
}

const defaultAchievements: Achievement[] = [
  {
    id: 'first_workout',
    title: 'First Steps',
    description: 'Complete your first workout',
    icon: 'fitness',
    color: '#3b82f6',
    unlocked: true,
    category: 'fitness',
    rarity: 'common',
  },
  {
    id: 'week_streak',
    title: 'Week Warrior',
    description: 'Work out for 7 days straight',
    icon: 'flame',
    color: '#f59e0b',
    unlocked: true,
    category: 'fitness',
    rarity: 'rare',
  },
  {
    id: 'nutrition_master',
    title: 'Nutrition Master',
    description: 'Log meals for 30 days',
    icon: 'restaurant',
    color: '#10b981',
    unlocked: false,
    progress: 15,
    target: 30,
    category: 'nutrition',
    rarity: 'epic',
  },
  {
    id: 'hydration_hero',
    title: 'Hydration Hero',
    description: 'Drink 8 glasses of water daily for a week',
    icon: 'water',
    color: '#06b6d4',
    unlocked: false,
    progress: 3,
    target: 7,
    category: 'wellness',
    rarity: 'common',
  },
];

export default function AchievementBadges({
  achievements = defaultAchievements,
  onAchievementPress,
  onViewAll,
  style,
}: AchievementBadgesProps) {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#6b7280';
      case 'rare': return '#3b82f6';
      case 'epic': return '#8b5cf6';
      case 'legendary': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'rare': return '#3b82f620';
      case 'epic': return '#8b5cf620';
      case 'legendary': return '#f59e0b20';
      default: return 'transparent';
    }
  };


  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="trophy" size={20} color="#3b82f6" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Achievements</Text>
            <Text style={styles.subtitle}>Celebrate your wins</Text>
          </View>
        </View>
        {onViewAll && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onViewAll}
            activeOpacity={0.7}
          >
            <Text style={styles.actionText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.achievementsContainer}
      >
        {achievements.map((achievement) => {
          const rarityColor = getRarityColor(achievement.rarity);
          const rarityGlow = getRarityGlow(achievement.rarity);
          const progress = achievement.progress && achievement.target 
            ? (achievement.progress / achievement.target) * 100 
            : 0;

          return (
            <TouchableOpacity
              key={achievement.id}
              style={[
                styles.achievementCard,
                {
                  borderColor: achievement.unlocked ? rarityColor : '#e5e7eb',
                  backgroundColor: achievement.unlocked ? rarityGlow : '#f8fafc',
                },
              ]}
              onPress={() => onAchievementPress?.(achievement)}
              activeOpacity={0.7}
            >
              <View style={styles.achievementIcon}>
                <View
                  style={[
                    styles.achievementIconContainer,
                    {
                      backgroundColor: achievement.unlocked 
                        ? achievement.color + '20' 
                        : '#e5e7eb',
                    },
                  ]}
                >
                  <Ionicons
                    name={achievement.icon as any}
                    size={24}
                    color={achievement.unlocked ? achievement.color : '#9ca3af'}
                  />
                </View>
                
                {achievement.unlocked && (
                  <View style={[styles.unlockedBadge, { backgroundColor: rarityColor }]}>
                    <Ionicons name="checkmark" size={12} color="#ffffff" />
                  </View>
                )}
              </View>
              
              <View style={styles.achievementInfo}>
                <Text
                  style={[
                    styles.achievementTitle,
                    {
                      color: achievement.unlocked ? '#1f2937' : '#9ca3af',
                    },
                  ]}
                >
                  {achievement.title}
                </Text>
                <Text
                  style={[
                    styles.achievementDescription,
                    {
                      color: achievement.unlocked ? '#6b7280' : '#9ca3af',
                    },
                  ]}
                >
                  {achievement.description}
                </Text>
                
                {!achievement.unlocked && achievement.progress && achievement.target && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${progress}%`,
                            backgroundColor: achievement.color,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {achievement.progress}/{achievement.target}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: MigrationHelpers.replaceStyle({
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }, {
    backgroundColor: DUPLICATE_STYLES.BACKGROUND_WHITE,
    borderRadius: DUPLICATE_STYLES.BORDER_RADIUS_16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }),
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: MigrationHelpers.replaceStyle({
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  }, {
    fontSize: DUPLICATE_STYLES.FONT_SIZE_18,
    fontWeight: '600',
    color: DUPLICATE_STYLES.COLORS.TEXT_PRIMARY,
  }),
  subtitle: MigrationHelpers.replaceStyle({
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  }, {
    fontSize: DUPLICATE_STYLES.FONT_SIZE_14,
    color: DUPLICATE_STYLES.COLORS.TEXT_SECONDARY,
    marginTop: 2,
  }),
  actionButton: MigrationHelpers.replaceStyle({
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    gap: 4,
  }, {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: DUPLICATE_STYLES.BACKGROUND_F8FAFC,
    borderRadius: DUPLICATE_STYLES.BORDER_RADIUS_8,
    gap: 4,
  }),
  actionText: MigrationHelpers.replaceStyle({
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  }, {
    fontSize: DUPLICATE_STYLES.FONT_SIZE_14,
    color: DUPLICATE_STYLES.COLORS.PRIMARY,
    fontWeight: '500',
  }),
  achievementsContainer: {
    gap: 16,
  },
  achievementCard: {
    width: 140,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  achievementIcon: {
    position: 'relative',
    marginBottom: 12,
  },
  achievementIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementInfo: {
    alignItems: 'center',
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
});
