import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface TrendChartProps {
  title: string;
  data: TrendDataPoint[];
  color: string;
  icon: string;
  unit: string;
  onDataPointPress?: (dataPoint: TrendDataPoint) => void;
}

function TrendChart({ title, data, color, icon, unit, onDataPointPress }: TrendChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <View style={styles.chartTitleContainer}>
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={color} />
          <Text style={styles.chartTitle}>{title}</Text>
        </View>
        <Text style={styles.chartUnit}>{unit}</Text>
      </View>

      <View style={styles.chartContent}>
        <View style={styles.chartArea}>
          {data.map((point, index) => {
            const height = ((point.value - minValue) / range) * 100;
            const isLast = index === data.length - 1;
            
            return (
              <TouchableOpacity
                key={index}
                style={styles.dataPointContainer}
                onPress={() => onDataPointPress?.(point)}
                activeOpacity={0.7}
              >
                <View style={styles.dataPointWrapper}>
                  <View 
                    style={[
                      styles.dataPoint,
                      { 
                        height: `${Math.max(10, height)}%`,
                        backgroundColor: color,
                        opacity: isLast ? 1 : 0.7
                      }
                    ]}
                  />
                  {isLast && (
                    <View style={[styles.currentIndicator, { backgroundColor: color }]} />
                  )}
                </View>
                <Text style={styles.dataPointLabel}>
                  {point.date.split('-')[2]} {/* Day of month */}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        <View style={styles.chartAxis}>
          <Text style={styles.axisLabel}>{minValue.toFixed(0)}</Text>
          <Text style={styles.axisLabel}>{maxValue.toFixed(0)}</Text>
        </View>
      </View>

      <View style={styles.chartStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{data[data.length - 1]?.value.toFixed(0) || 0}</Text>
          <Text style={styles.statLabel}>Current</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {data.length > 1 ? 
              ((data[data.length - 1]?.value - data[data.length - 2]?.value) / data[data.length - 2]?.value * 100).toFixed(1) : 0
            }%
          </Text>
          <Text style={styles.statLabel}>Change</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{(data.reduce((sum, d) => sum + d.value, 0) / data.length).toFixed(0)}</Text>
          <Text style={styles.statLabel}>Average</Text>
        </View>
      </View>
    </View>
  );
}

interface TimeBasedTrendsProps {
  workoutData: TrendDataPoint[];
  nutritionData: TrendDataPoint[];
  moodData: TrendDataPoint[];
  onWorkoutDataPointPress?: (dataPoint: TrendDataPoint) => void;
  onNutritionDataPointPress?: (dataPoint: TrendDataPoint) => void;
  onMoodDataPointPress?: (dataPoint: TrendDataPoint) => void;
}

export default function TimeBasedTrends({
  workoutData,
  nutritionData,
  moodData,
  onWorkoutDataPointPress,
  onNutritionDataPointPress,
  onMoodDataPointPress,
}: TimeBasedTrendsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Time-Based Trends</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartsContainer}
      >
        <TrendChart
          title="Workouts"
          data={workoutData}
          color="#10b981"
          icon="fitness-outline"
          unit="sessions"
          onDataPointPress={onWorkoutDataPointPress}
        />
        
        <TrendChart
          title="Nutrition"
          data={nutritionData}
          color="#3b82f6"
          icon="restaurant-outline"
          unit="calories"
          onDataPointPress={onNutritionDataPointPress}
        />
        
        <TrendChart
          title="Mood & Wellness"
          data={moodData}
          color="#8b5cf6"
          icon="heart-outline"
          unit="rating"
          onDataPointPress={onMoodDataPointPress}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  chartsContainer: {
    paddingRight: 16,
  },
  chartContainer: {
    width: 280,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  chartUnit: {
    fontSize: 12,
    color: '#6b7280',
  },
  chartContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 12,
  },
  chartArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
  },
  dataPointContainer: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  dataPointWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  dataPoint: {
    width: 20,
    borderRadius: 10,
    minHeight: 4,
  },
  currentIndicator: {
    position: 'absolute',
    top: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dataPointLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
  chartAxis: {
    width: 30,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    paddingBottom: 20,
  },
  axisLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  chartStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
});
