import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BodyTypeHeroCardProps {
  goalName: string;
  dailyScore: number;
  weeklyAlignment: number;
  weeklyTrend: 'up' | 'down' | 'stable';
  alignment: 'closer' | 'neutral' | 'farther';
  suggestions: string[];
  onLogWorkout?: () => void;
  onLogMeal?: () => void;
  onSuggestionPress?: (suggestion: string) => void;
}

export default function BodyTypeHeroCard({
  goalName,
  dailyScore,
  weeklyAlignment,
  weeklyTrend,
  alignment,
  suggestions,
  onLogWorkout,
  onLogMeal,
  onSuggestionPress,
}: BodyTypeHeroCardProps) {
  const getAlignmentColor = (alignment: string) => {
    switch (alignment) {
      case 'closer': return '#10b981';
      case 'neutral': return '#f59e0b';
      case 'farther': return '#ef4444';
      default: return '#6b7280';
    }
  };

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

  const alignmentColor = getAlignmentColor(alignment);
  const trendColor = getTrendColor(weeklyTrend);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.goalInfo}>
          <Ionicons name="trophy-outline" size={24} color="#3b82f6" />
          <View style={styles.goalText}>
            <Text style={styles.goalName}>{goalName}</Text>
            <Text style={styles.goalSubtext}>Your body type goal</Text>
          </View>
        </View>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.dailyScore}>
          <Text style={styles.scoreLabel}>Today's Score</Text>
          <Text style={[styles.scoreValue, { color: alignmentColor }]}>
            +{dailyScore}
          </Text>
        </View>
        
        <View style={styles.weeklyAlignment}>
          <View style={styles.alignmentHeader}>
            <Text style={styles.alignmentLabel}>Weekly Alignment</Text>
            <View style={styles.trendIndicator}>
              <Ionicons 
                name={getTrendIcon(weeklyTrend) as keyof typeof Ionicons.glyphMap} 
                size={16} 
                color={trendColor} 
              />
              <Text style={[styles.trendText, { color: trendColor }]}>
                {weeklyTrend === 'up' ? '↑' : weeklyTrend === 'down' ? '↓' : '→'}
              </Text>
            </View>
          </View>
          <Text style={[styles.alignmentValue, { color: alignmentColor }]}>
            {weeklyAlignment}%
          </Text>
        </View>
      </View>

      {/* Interactive Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { 
                width: `${Math.max(10, weeklyAlignment)}%`,
                backgroundColor: alignmentColor
              }
            ]}
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>Closer ↗</Text>
          <Text style={styles.progressLabel}>Farther ↘</Text>
        </View>
      </View>

      {/* Smart Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryButton]}
          onPress={onLogWorkout}
        >
          <Ionicons name="fitness-outline" size={18} color="#ffffff" />
          <Text style={styles.actionButtonText}>Log Workout</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={onLogMeal}
        >
          <Ionicons name="restaurant-outline" size={18} color="#3b82f6" />
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Log Meal</Text>
        </TouchableOpacity>
      </View>

      {/* Mini Suggestions */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Quick Actions</Text>
          <View style={styles.suggestionsList}>
            {suggestions.slice(0, 2).map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => onSuggestionPress?.(suggestion)}
              >
                <Ionicons name="bulb-outline" size={14} color="#f59e0b" />
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    margin: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalText: {
    marginLeft: 12,
    flex: 1,
  },
  goalName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  goalSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dailyScore: {
    alignItems: 'center',
    flex: 1,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  weeklyAlignment: {
    alignItems: 'center',
    flex: 1,
  },
  alignmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alignmentLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  alignmentValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 6,
  },
  secondaryButtonText: {
    color: '#3b82f6',
  },
  suggestionsContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  suggestionsList: {
    flexDirection: 'row',
    gap: 8,
  },
  suggestionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  suggestionText: {
    fontSize: 12,
    color: '#4b5563',
    marginLeft: 4,
    flex: 1,
  },
});
