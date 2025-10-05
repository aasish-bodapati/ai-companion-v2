import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProgressRing from './ProgressRing';

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
  style?: any;
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
                 <ProgressRing
                   key={stat.id}
                   value={stat.value}
                   target={stat.target}
                   size={45}
                   color={stat.color}
                   icon={stat.icon}
                   label={stat.label}
                   unit={stat.unit}
                   onPress={onStatPress ? () => onStatPress(stat) : undefined}
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
                      <Ionicons name={stat.icon as any} size={16} color={stat.color} />
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
                    <Ionicons name={stat.icon as any} size={20} color={stat.color} />
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
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 6,
    marginHorizontal: 8,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    gap: 2,
  },
  horizontalContainer: {
    paddingLeft: 0,
  },
  verticalContainer: {
    gap: 4,
  },
  // Ring stats (handled by ProgressRing component)
  
  // Bar stats
  barStat: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 200,
  },
  barHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  barIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  barLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  barValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  barBackground: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  barPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    minWidth: 40,
    textAlign: 'right',
  },
  barTarget: {
    fontSize: 12,
    color: '#9ca3af',
  },
  
  // Number stats
  numberStat: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 100,
    marginRight: 12,
  },
  numberIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  numberValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  numberLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 2,
  },
  numberTarget: {
    fontSize: 10,
    color: '#9ca3af',
  },
});
