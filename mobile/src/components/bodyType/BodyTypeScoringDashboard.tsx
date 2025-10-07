import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BodyTypeScoringService, ScoringResult, DailyLog, WeeklyLog } from '../../services/bodyTypeScoringService';
import { BodyTypeGoal, UserAttributes } from '../../services/bodyTypeGoals';

interface BodyTypeScoringDashboardProps {
  bodyTypeGoal: BodyTypeGoal;
  userAttributes: UserAttributes;
  dailyLog?: DailyLog;
  weeklyLog?: WeeklyLog;
  onRefresh?: () => void;
}

export default function BodyTypeScoringDashboard({
  bodyTypeGoal,
  userAttributes,
  dailyLog,
  weeklyLog,
  onRefresh,
}: BodyTypeScoringDashboardProps) {
  const [scoringService] = useState(() => new BodyTypeScoringService(bodyTypeGoal, userAttributes));
  const [dailyResult, setDailyResult] = useState<ScoringResult | null>(null);
  const [weeklyResult, setWeeklyResult] = useState<ScoringResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    calculateScores();
  }, [dailyLog, weeklyLog, calculateScores]);

  const calculateScores = useCallback(async () => {
    setLoading(true);
    try {
      if (dailyLog) {
        const result = scoringService.scoreDailyProgress(dailyLog);
        setDailyResult(result);
      }
      
      if (weeklyLog) {
        const result = scoringService.scoreWeeklyProgress(weeklyLog);
        setWeeklyResult(result);
      }
    } catch {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  }, [dailyLog, weeklyLog, scoringService]);

  const getAlignmentIcon = (alignment: string) => {
    switch (alignment) {
      case 'closer':
        return { name: 'trending-up', color: '#10b981' };
      case 'neutral':
        return { name: 'remove', color: '#f59e0b' };
      case 'farther':
        return { name: 'trending-down', color: '#ef4444' };
      default:
        return { name: 'help', color: '#6b7280' };
    }
  };

  const getAlignmentColor = (alignment: string) => {
    switch (alignment) {
      case 'closer':
        return '#10b981';
      case 'neutral':
        return '#f59e0b';
      case 'farther':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const renderScoreCard = (title: string, result: ScoringResult | null, isWeekly = false) => {
    if (!result) return null;

    const alignmentIcon = getAlignmentIcon(result.alignment);
    const alignmentColor = getAlignmentColor(result.alignment);

    return (
      <View style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreTitle}>{title}</Text>
          <View style={[styles.alignmentBadge, { backgroundColor: alignmentColor + '20' }]}>
            <Ionicons name={alignmentIcon.name as keyof typeof Ionicons.glyphMap} size={16} color={alignmentColor} />
            <Text style={[styles.alignmentText, { color: alignmentColor }]}>
              {result.alignment.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.scoreContent}>
          <View style={styles.scoreMain}>
            <Text style={styles.scoreValue}>{result.percentage}%</Text>
            <Text style={styles.scoreLabel}>Alignment</Text>
          </View>
          
          <View style={styles.scoreDetails}>
            <View style={styles.scoreDetail}>
              <Text style={styles.scoreDetailValue}>{result.score}</Text>
              <Text style={styles.scoreDetailLabel}>Points</Text>
            </View>
            <View style={styles.scoreDetail}>
              <Text style={styles.scoreDetailValue}>{result.maxScore}</Text>
              <Text style={styles.scoreDetailLabel}>Max</Text>
            </View>
          </View>
        </View>

        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${result.percentage}%`,
                backgroundColor: alignmentColor
              }
            ]} 
          />
        </View>

        <Text style={styles.feedbackText}>{result.feedback}</Text>

        {result.suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Suggestions:</Text>
            {result.suggestions.map((suggestion, index) => (
              <View key={index} style={styles.suggestionItem}>
                <Ionicons name="bulb-outline" size={14} color="#f59e0b" />
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderScoringTable = () => {
    const goalType = bodyTypeGoal.name;
    
    return (
      <View style={styles.tableCard}>
        <Text style={styles.tableTitle}>Scoring Guide for {goalType}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Activity</Text>
              <Text style={styles.tableHeaderText}>Points</Text>
            </View>
            
            {getScoringTableRows(goalType).map((row, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{row.activity}</Text>
                <Text style={[styles.tableCell, styles.tablePoints, { color: row.points >= 0 ? '#10b981' : '#ef4444' }]}>
                  {row.points > 0 ? '+' : ''}{row.points}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const getScoringTableRows = (goalType: string) => {
    if (goalType.includes('Sleek') && goalType.includes('Graceful')) {
      return [
        { activity: 'Cardio/Mobility/Yoga', points: 10 },
        { activity: 'Light/Moderate Strength', points: 5 },
        { activity: 'Heavy Hypertrophy', points: -5 },
        { activity: 'Skipped Workout', points: -8 },
        { activity: 'Protein 1.2-1.6 g/kg', points: 7 },
        { activity: 'Calorie Deficit/Maintenance', points: 10 },
        { activity: 'Overeating (+20%)', points: -10 },
        { activity: 'Junk/Processed Meal', points: -5 },
        { activity: '4-5 Sessions/Week', points: 15 },
        { activity: '2+ Missed Sessions', points: -10 },
      ];
    } else if (goalType.includes('Strong') && goalType.includes('Steady')) {
      return [
        { activity: 'Strength Training', points: 12 },
        { activity: 'Moderate Cardio', points: 5 },
        { activity: 'Only Cardio All Week', points: -5 },
        { activity: 'Skipped Workout', points: -10 },
        { activity: 'Protein 1.6-2.0 g/kg', points: 10 },
        { activity: 'Calories Near Maintenance', points: 8 },
        { activity: 'Severe Deficit (-20%)', points: -10 },
        { activity: 'Junk/Processed', points: -5 },
        { activity: '4-5 Sessions/Week', points: 15 },
        { activity: 'Progressive Overload', points: 10 },
      ];
    } else if (goalType.includes('Big') && goalType.includes('Bold')) {
      return [
        { activity: 'Heavy Strength/Hypertrophy', points: 15 },
        { activity: 'Moderate Cardio', points: 3 },
        { activity: 'Excess Cardio', points: -8 },
        { activity: 'Skipped Strength', points: -12 },
        { activity: 'Protein 1.8-2.4 g/kg', points: 12 },
        { activity: 'Calorie Surplus', points: 10 },
        { activity: 'Calorie Deficit', points: -15 },
        { activity: 'Junk/Processed', points: -7 },
        { activity: '5-6 Strength/Week', points: 20 },
        { activity: 'Progressive Overload', points: 15 },
      ];
    }
    return [];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Calculating your alignment...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Body Type Alignment</Text>
        <Text style={styles.subtitle}>Track how well your actions align with your {bodyTypeGoal.name} goal</Text>
        {onRefresh && (
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#3b82f6" />
          </TouchableOpacity>
        )}
      </View>

      {renderScoreCard('Today\'s Progress', dailyResult)}
      {renderScoreCard('This Week', weeklyResult)}
      {renderScoringTable()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  scoreCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  alignmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  alignmentText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  scoreContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreMain: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  scoreDetails: {
    alignItems: 'flex-end',
  },
  scoreDetail: {
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreDetailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  scoreDetailLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  feedbackText: {
    fontSize: 16,
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
  },
  tableCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  table: {
    minWidth: 300,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  tablePoints: {
    fontWeight: '600',
    textAlign: 'right',
  },
});
