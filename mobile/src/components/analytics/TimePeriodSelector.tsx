import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type TimePeriod = 'week' | 'month' | '3months' | 'year' | 'custom';

interface TimePeriodSelectorProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  customDateRange?: { start: Date; end: Date };
  onCustomRangePress?: () => void;
}

export default function TimePeriodSelector({
  selectedPeriod,
  onPeriodChange,
  customDateRange,
  onCustomRangePress,
}: TimePeriodSelectorProps) {
  const periods: { key: TimePeriod; label: string; icon: string }[] = [
    { key: 'week', label: 'Week', icon: 'calendar-outline' },
    { key: 'month', label: 'Month', icon: 'calendar' },
    { key: '3months', label: '3M', icon: 'trending-up-outline' },
    { key: 'year', label: 'Year', icon: 'stats-chart-outline' },
    { key: 'custom', label: 'Custom', icon: 'options-outline' },
  ];

  const getPeriodLabel = (period: TimePeriod) => {
    const now = new Date();
    switch (period) {
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case '3months':
        return 'Last 3 Months';
      case 'year':
        return 'This Year';
      case 'custom':
        if (customDateRange) {
          const start = customDateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const end = customDateRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return `${start} - ${end}`;
        }
        return 'Custom Range';
      default:
        return 'This Week';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>{getPeriodLabel(selectedPeriod)}</Text>
      </View>
      
      <View style={styles.selectorContainer}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.selectedPeriodButton
            ]}
            onPress={() => onPeriodChange(period.key)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={period.icon as any} 
              size={16} 
              color={selectedPeriod === period.key ? '#ffffff' : '#6b7280'} 
            />
            <Text style={[
              styles.periodLabel,
              selectedPeriod === period.key && styles.selectedPeriodLabel
            ]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedPeriod === 'custom' && customDateRange && (
        <TouchableOpacity 
          style={styles.customRangeButton}
          onPress={onCustomRangePress}
        >
          <Ionicons name="calendar-outline" size={16} color="#3b82f6" />
          <Text style={styles.customRangeText}>
            {customDateRange.start.toLocaleDateString()} - {customDateRange.end.toLocaleDateString()}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  selectorContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedPeriodButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 6,
  },
  selectedPeriodLabel: {
    color: '#ffffff',
  },
  customRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  customRangeText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
    flex: 1,
    marginLeft: 8,
  },
});
