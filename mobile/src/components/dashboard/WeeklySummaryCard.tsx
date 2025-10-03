import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DayData {
  day: string;
  workouts: number;
  meals: number;
  proteinAdherence: number; // 0-100
  caloriesHit: boolean;
  alignmentScore: number; // 0-100
}

interface WeeklySummaryCardProps {
  weekData: DayData[];
  weeklyTrend: 'up' | 'down' | 'stable';
  improvementPercentage: number;
  motivationalMessage: string;
  onDayPress?: (day: string) => void;
}

export default function WeeklySummaryCard({
  weekData,
  weeklyTrend,
  improvementPercentage,
  motivationalMessage,
  onDayPress,
}: WeeklySummaryCardProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'remove';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return '#10b981';
      case 'down': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getAlignmentColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getDayStatus = (day: DayData) => {
    const totalScore = (day.workouts > 0 ? 25 : 0) + 
                     (day.meals > 0 ? 25 : 0) + 
                     (day.proteinAdherence * 0.25) + 
                     (day.caloriesHit ? 25 : 0);
    
    if (totalScore >= 80) return 'excellent';
    if (totalScore >= 60) return 'good';
    if (totalScore >= 40) return 'okay';
    return 'needs-work';
  };

  const getDayStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#10b981';
      case 'good': return '#22c55e';
      case 'okay': return '#f59e0b';
      case 'needs-work': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
          <Text style={styles.title}>This Week</Text>
        </View>
        <View style={styles.trendIndicator}>
          <Ionicons 
            name={getTrendIcon(weeklyTrend) as any} 
            size={16} 
            color={getTrendColor(weeklyTrend)} 
          />
          <Text style={[styles.trendText, { color: getTrendColor(weeklyTrend) }]}>
            {improvementPercentage > 0 ? '+' : ''}{improvementPercentage}%
          </Text>
        </View>
      </View>

      <Text style={styles.motivationalMessage}>{motivationalMessage}</Text>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysContainer}
      >
        {weekData.map((day, index) => {
          const status = getDayStatus(day);
          const statusColor = getDayStatusColor(status);
          
          return (
            <TouchableOpacity
              key={index}
              style={[styles.dayCard, { borderColor: statusColor }]}
              onPress={() => onDayPress?.(day.day)}
              activeOpacity={0.7}
            >
              <Text style={styles.dayName}>{day.day}</Text>
              
              <View style={styles.dayStats}>
                <View style={styles.statItem}>
                  <Ionicons name="fitness-outline" size={12} color="#10b981" />
                  <Text style={styles.statValue}>{day.workouts}</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Ionicons name="restaurant-outline" size={12} color="#3b82f6" />
                  <Text style={styles.statValue}>{day.meals}</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Ionicons name="leaf-outline" size={12} color="#10b981" />
                  <Text style={styles.statValue}>{day.proteinAdherence}%</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Ionicons name="flame-outline" size={12} color="#f97316" />
                  <Text style={styles.statValue}>{day.caloriesHit ? '✓' : '✗'}</Text>
                </View>
              </View>

              <View style={styles.alignmentIndicator}>
                <View style={styles.alignmentBar}>
                  <View 
                    style={[
                      styles.alignmentFill,
                      { 
                        width: `${day.alignmentScore}%`,
                        backgroundColor: getAlignmentColor(day.alignmentScore)
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.alignmentScore, { color: getAlignmentColor(day.alignmentScore) }]}>
                  {day.alignmentScore}%
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.weeklyOverview}>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewValue}>
            {weekData.reduce((sum, day) => sum + day.workouts, 0)}
          </Text>
          <Text style={styles.overviewLabel}>Workouts</Text>
        </View>
        
        <View style={styles.overviewItem}>
          <Text style={styles.overviewValue}>
            {weekData.reduce((sum, day) => sum + day.meals, 0)}
          </Text>
          <Text style={styles.overviewLabel}>Meals</Text>
        </View>
        
        <View style={styles.overviewItem}>
          <Text style={styles.overviewValue}>
            {Math.round(weekData.reduce((sum, day) => sum + day.proteinAdherence, 0) / weekData.length)}%
          </Text>
          <Text style={styles.overviewLabel}>Avg Protein</Text>
        </View>
        
        <View style={styles.overviewItem}>
          <Text style={styles.overviewValue}>
            {weekData.filter(day => day.caloriesHit).length}
          </Text>
          <Text style={styles.overviewLabel}>Calorie Days</Text>
        </View>
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 8,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  motivationalMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  daysContainer: {
    paddingRight: 16,
  },
  dayCard: {
    width: 80,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  dayStats: {
    gap: 4,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 4,
  },
  alignmentIndicator: {
    width: '100%',
    alignItems: 'center',
  },
  alignmentBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginBottom: 4,
    overflow: 'hidden',
  },
  alignmentFill: {
    height: '100%',
    borderRadius: 2,
  },
  alignmentScore: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  weeklyOverview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  overviewItem: {
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
});
