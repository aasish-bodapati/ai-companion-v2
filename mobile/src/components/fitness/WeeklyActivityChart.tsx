import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface WeeklyActivityChartProps {
  weeklyData: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
  maxValue?: number;
  color?: string;
}

const WeeklyActivityChart: React.FC<WeeklyActivityChartProps> = ({
  weeklyData,
  maxValue,
  color = '#3b82f6'
}) => {
  const days = [
    { key: 'monday', label: 'Mon', value: weeklyData.monday },
    { key: 'tuesday', label: 'Tue', value: weeklyData.tuesday },
    { key: 'wednesday', label: 'Wed', value: weeklyData.wednesday },
    { key: 'thursday', label: 'Thu', value: weeklyData.thursday },
    { key: 'friday', label: 'Fri', value: weeklyData.friday },
    { key: 'saturday', label: 'Sat', value: weeklyData.saturday },
    { key: 'sunday', label: 'Sun', value: weeklyData.sunday },
  ];

  const max = maxValue || Math.max(...days.map(d => d.value), 1);

  const getBarHeight = (value: number) => {
    return Math.max((value / max) * 100, value > 0 ? 8 : 0); // Minimum height for non-zero values
  };

  const getBarColor = (value: number) => {
    if (value === 0) return '#e5e7eb';
    if (value === max) return color;
    return `${color}80`; // 50% opacity for non-max values
  };

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        {days.map((day, index) => (
          <View key={day.key} style={styles.dayColumn}>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${getBarHeight(day.value)}%`,
                    backgroundColor: getBarColor(day.value),
                  }
                ]}
              />
              {day.value > 0 && (
                <Text style={styles.barValue}>{day.value}</Text>
              )}
            </View>
            <Text style={[
              styles.dayLabel,
              day.value > 0 && styles.dayLabelActive
            ]}>
              {day.label}
            </Text>
          </View>
        ))}
      </View>
      
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: color }]} />
          <Text style={styles.legendText}>Workouts</Text>
        </View>
        <Text style={styles.maxValue}>Max: {max}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 16,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  },
  bar: {
    width: '80%',
    borderRadius: 4,
    minHeight: 4,
  },
  barValue: {
    position: 'absolute',
    top: -20,
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  dayLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
    fontWeight: '500',
  },
  dayLabelActive: {
    color: '#374151',
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  maxValue: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
});

export default WeeklyActivityChart;
