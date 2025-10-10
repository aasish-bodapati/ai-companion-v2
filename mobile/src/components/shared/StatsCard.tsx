import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UnifiedProgressRing } from '../ui/UnifiedProgressRing';
import { COLORS, BORDER_RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme/constants';

interface StatItem {
  id: string;
  label: string;
  value: number;
  target: number;
  unit: string;
  icon: string;
  color: string;
  type: 'ring' | 'bar' | 'number';
}

interface StatsCardProps {
  title: string;
  stats: StatItem[];
  layout?: 'grid' | 'horizontal' | 'vertical';
  showTargets?: boolean;
  onStatPress?: (stat: StatItem) => void;
  onViewAll?: () => void;
  style?: object;
}

export default function StatsCard({
  title,
  stats,
  layout = 'grid',
  showTargets = true,
  onStatPress,
  onViewAll,
  style,
}: StatsCardProps) {

  const getContainerStyle = () => {
    switch (layout) {
      case 'horizontal':
        return styles.horizontalContainer;
      case 'vertical':
        return styles.verticalContainer;
      default:
        return styles.gridContainer;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView
        horizontal={layout === 'horizontal'}
        showsHorizontalScrollIndicator={false}
        style={getContainerStyle()}
      >
        {stats.map((stat) => {
          const percentage = Math.min((stat.value / stat.target) * 100, 100);
          
          switch (stat.type) {
            case 'ring':
              return (
                 <UnifiedProgressRing
                   key={stat.id}
                   value={stat.value}
                   target={stat.target}
                   size={45}
                   color={stat.color}
                   icon={stat.icon}
                   label={stat.label}
                   unit={stat.unit}
                   onPress={onStatPress ? () => onStatPress(stat) : undefined}
                   variant="shared"
                 />
              );
            
            case 'bar':
              return (
                <TouchableOpacity
                  key={stat.id}
                  style={styles.barStat}
                  onPress={onStatPress ? () => onStatPress(stat) : undefined}
                  activeOpacity={0.7}
                >
                  <View style={styles.barHeader}>
                    <View style={styles.barIconContainer}>
                      <Ionicons name={stat.icon as keyof typeof Ionicons.glyphMap} size={FONT_SIZE.lg} color={stat.color} /> {/* 16 -> FONT_SIZE.lg */}
                    </View>
                    <Text style={styles.barLabel}>{stat.label}</Text>
                    <Text style={styles.barValue}>
                      {stat.value}{stat.unit}
                    </Text>
                  </View>
                  
                  <View style={styles.barContainer}>
                    <View style={[styles.barBackground, { backgroundColor: stat.color + '20' }]}>
                      <View 
                        style={[
                          styles.barFill,
                          { 
                            width: `${percentage}%`,
                            backgroundColor: stat.color
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.barPercentage}>{Math.round(percentage)}%</Text>
                  </View>
                  
                  {showTargets && (
                    <Text style={styles.barTarget}>
                      Target: {stat.target}{stat.unit}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            
            case 'number':
              return (
                <TouchableOpacity
                  key={stat.id}
                  style={styles.numberStat}
                  onPress={onStatPress ? () => onStatPress(stat) : undefined}
                  activeOpacity={0.7}
                >
                  <View style={[styles.numberIcon, { backgroundColor: stat.color + '20' }]}>
                    <Ionicons name={stat.icon as keyof typeof Ionicons.glyphMap} size={FONT_SIZE.xl} color={stat.color} /> {/* 20 -> FONT_SIZE.xl */}
                  </View>
                  <Text style={styles.numberValue}>{stat.value}</Text>
                  <Text style={styles.numberLabel}>{stat.label}</Text>
                  {showTargets && (
                    <Text style={styles.numberTarget}>
                      / {stat.target}{stat.unit}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            
            default:
              return null;
          }
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.primary, // '#ffffff' -> COLORS.background.primary
    borderRadius: BORDER_RADIUS.sm, // 6 -> BORDER_RADIUS.sm
    padding: SPACING.sm, // 6 -> SPACING.sm
    marginHorizontal: SPACING.sm, // 8 -> SPACING.sm
    marginBottom: SPACING.sm, // 6 -> SPACING.sm
    ...SHADOWS.small, // Replaced individual shadow properties with SHADOWS.small
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs, // 4 -> SPACING.xs
  },
  title: {
    fontSize: FONT_SIZE.md, // 14 -> FONT_SIZE.md
    fontWeight: FONT_WEIGHT.semibold, // '600' -> FONT_WEIGHT.semibold
    color: COLORS.text.primary, // '#1f2937' -> COLORS.text.primary
  },
  viewAllText: {
    fontSize: FONT_SIZE.md, // 14 -> FONT_SIZE.md
    color: COLORS.primary.main, // '#3b82f6' -> COLORS.primary.main
    fontWeight: FONT_WEIGHT.medium, // '500' -> FONT_WEIGHT.medium
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    gap: 2, // Keep as is for precise spacing
  },
  horizontalContainer: {
    paddingLeft: 0,
  },
  verticalContainer: {
    gap: SPACING.xs, // 4 -> SPACING.xs
  },
  // Ring stats (handled by ProgressRing component)
  
  // Bar stats
  barStat: {
    backgroundColor: COLORS.background.secondary, // '#f8fafc' -> COLORS.background.secondary
    borderRadius: BORDER_RADIUS.lg, // 12 -> BORDER_RADIUS.lg
    padding: SPACING.lg, // 16 -> SPACING.lg
    marginBottom: SPACING.md, // 12 -> SPACING.md
    borderWidth: 1,
    borderColor: COLORS.border.light, // '#e5e7eb' -> COLORS.border.light
    minWidth: 200,
  },
  barHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm, // 8 -> SPACING.sm
  },
  barIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.background.tertiary, // '#f3f4f6' -> COLORS.background.tertiary
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm, // 8 -> SPACING.sm
  },
  barLabel: {
    flex: 1,
    fontSize: FONT_SIZE.md, // 14 -> FONT_SIZE.md
    fontWeight: FONT_WEIGHT.medium, // '500' -> FONT_WEIGHT.medium
    color: COLORS.text.primary, // '#1f2937' -> COLORS.text.primary
  },
  barValue: {
    fontSize: FONT_SIZE.md, // 14 -> FONT_SIZE.md
    fontWeight: FONT_WEIGHT.semibold, // '600' -> FONT_WEIGHT.semibold
    color: COLORS.text.primary, // '#1f2937' -> COLORS.text.primary
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs, // 4 -> SPACING.xs
  },
  barBackground: {
    flex: 1,
    height: 6,
    borderRadius: 3, // Keep as is for precise bar height
    marginRight: SPACING.sm, // 8 -> SPACING.sm
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3, // Keep as is for precise bar height
  },
  barPercentage: {
    fontSize: FONT_SIZE.sm, // 12 -> FONT_SIZE.sm
    fontWeight: FONT_WEIGHT.semibold, // '600' -> FONT_WEIGHT.semibold
    color: COLORS.text.secondary, // '#6b7280' -> COLORS.text.secondary
    minWidth: 40,
    textAlign: 'right',
  },
  barTarget: {
    fontSize: FONT_SIZE.sm, // 12 -> FONT_SIZE.sm
    color: COLORS.text.tertiary, // '#9ca3af' -> COLORS.text.tertiary
  },
  
  // Number stats
  numberStat: {
    alignItems: 'center',
    padding: SPACING.lg, // 16 -> SPACING.lg
    backgroundColor: COLORS.background.secondary, // '#f8fafc' -> COLORS.background.secondary
    borderRadius: BORDER_RADIUS.lg, // 12 -> BORDER_RADIUS.lg
    borderWidth: 1,
    borderColor: COLORS.border.light, // '#e5e7eb' -> COLORS.border.light
    minWidth: 100,
    marginRight: SPACING.md, // 12 -> SPACING.md
  },
  numberIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm, // 8 -> SPACING.sm
  },
  numberValue: {
    fontSize: FONT_SIZE.xl, // 20 -> FONT_SIZE.xl
    fontWeight: FONT_WEIGHT.bold, // 'bold' -> FONT_WEIGHT.bold
    color: COLORS.text.primary, // '#1f2937' -> COLORS.text.primary
    marginBottom: SPACING.xs, // 4 -> SPACING.xs
  },
  numberLabel: {
    fontSize: FONT_SIZE.sm, // 12 -> FONT_SIZE.sm
    fontWeight: FONT_WEIGHT.medium, // '500' -> FONT_WEIGHT.medium
    color: COLORS.text.secondary, // '#6b7280' -> COLORS.text.secondary
    textAlign: 'center',
    marginBottom: 2, // Keep as is for precise spacing
  },
  numberTarget: {
    fontSize: 10, // Keep as is for very small text
    color: COLORS.text.tertiary, // '#9ca3af' -> COLORS.text.tertiary
  },
});
