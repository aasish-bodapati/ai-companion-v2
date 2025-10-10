import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UnifiedProgressRing } from '../ui/UnifiedProgressRing';

interface BodyTypeCardProps {
  goalName: string;
  dailyScore: number;
  weeklyAlignment: number;
  weeklyTrend: 'up' | 'down' | 'stable';
  alignment: 'closer' | 'further' | 'same';
  suggestions: string[];
  variant?: 'dashboard' | 'profile' | 'compact';
  loading?: boolean;
  onLogWorkout?: () => void;
  onLogMeal?: () => void;
  onViewAnalytics?: () => void;
  onEditGoals?: () => void;
  style?: object;
}

export default function BodyTypeCard({
  goalName,
  dailyScore,
  weeklyAlignment,
  weeklyTrend,
  alignment,
  suggestions,
  variant = 'dashboard',
  loading = false,
  onLogWorkout,
  onLogMeal,
  onViewAnalytics,
  onEditGoals,
  style,
}: BodyTypeCardProps) {
  const getTrendIcon = () => {
    switch (weeklyTrend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      case 'stable': return 'remove';
      default: return 'help';
    }
  };

  const getTrendColor = () => {
    switch (weeklyTrend) {
      case 'up': return '#10b981';
      case 'down': return '#ef4444';
      case 'stable': return '#6b7280';
      default: return '#9ca3af';
    }
  };

  const getAlignmentText = () => {
    switch (alignment) {
      case 'closer': return 'Getting closer to your goal!';
      case 'further': return 'Moving away from your goal';
      case 'same': return 'Maintaining your current progress';
      default: return '';
    }
  };


  const renderDashboardVariant = () => (
    <View style={styles.dashboardCard}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.goalName}>{goalName}</Text>
          <Text style={styles.alignmentText}>
            {loading ? 'Calculating...' : getAlignmentText()}
          </Text>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={styles.dailyScore}>
            {loading ? '...' : dailyScore}
          </Text>
          <Text style={styles.scoreLabel}>Today's Score</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.weeklyProgress}>
          <Text style={styles.weeklyLabel}>Weekly Alignment</Text>
          <View style={styles.weeklyValueContainer}>
            <Text style={styles.weeklyValue}>
              {loading ? '...' : `${weeklyAlignment}%`}
            </Text>
            {!loading && (
              <Ionicons 
                name={getTrendIcon() as keyof typeof Ionicons.glyphMap} 
                size={16} 
                color={getTrendColor()} 
              />
            )}
          </View>
        </View>
        
        <UnifiedProgressRing
          value={loading ? 0 : weeklyAlignment}
          target={100}
          size={60}
          color={loading ? '#9ca3af' : getTrendColor()}
          icon="trophy"
          showPercentage={false}
          variant="shared"
        />
      </View>

      {!loading && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Suggestions:</Text>
          {suggestions.map((suggestion, index) => (
            <Text key={index} style={styles.suggestion}>
              • {suggestion}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryAction]}
          onPress={onLogWorkout}
        >
          <Ionicons name="fitness" size={16} color="#ffffff" />
          <Text style={styles.actionText}>Log Workout</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryAction]}
          onPress={onLogMeal}
        >
          <Ionicons name="restaurant" size={16} color="#3b82f6" />
          <Text style={[styles.actionText, styles.secondaryActionText]}>Log Meal</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.analyticsButton}
          onPress={onViewAnalytics}
        >
          <Ionicons name="analytics" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProfileVariant = () => (
    <View style={styles.profileCard}>
      <View style={styles.profileHeader}>
        <View style={styles.profileTitleContainer}>
          <Text style={styles.profileGoalName}>{goalName}</Text>
          <Text style={styles.profileAlignmentText}>
            {getAlignmentText()}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.editButton}
          onPress={onEditGoals}
        >
          <Ionicons name="create" size={16} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileStats}>
        <View style={styles.profileStat}>
          <Text style={styles.profileStatValue}>{dailyScore}</Text>
          <Text style={styles.profileStatLabel}>Daily Score</Text>
        </View>
        
        <View style={styles.profileStat}>
          <Text style={styles.profileStatValue}>{weeklyAlignment}%</Text>
          <Text style={styles.profileStatLabel}>Weekly Alignment</Text>
        </View>
        
        <View style={styles.profileStat}>
          <Ionicons 
            name={getTrendIcon() as keyof typeof Ionicons.glyphMap} 
            size={24} 
            color={getTrendColor()} 
          />
          <Text style={styles.profileStatLabel}>Trend</Text>
        </View>
      </View>
    </View>
  );

  const renderCompactVariant = () => (
    <View style={styles.compactCard}>
      <View style={styles.compactHeader}>
        <Text style={styles.compactGoalName}>{goalName}</Text>
        <Text style={styles.compactScore}>{dailyScore}</Text>
      </View>
      
      <View style={styles.compactProgress}>
        <Text style={styles.compactAlignment}>{weeklyAlignment}% aligned</Text>
        <Ionicons 
          name={getTrendIcon() as keyof typeof Ionicons.glyphMap} 
          size={16} 
          color={getTrendColor()} 
        />
      </View>
    </View>
  );

  switch (variant) {
    case 'profile':
      return renderProfileVariant();
    case 'compact':
      return renderCompactVariant();
    default:
      return renderDashboardVariant();
  }
}

const styles = StyleSheet.create({
  // Dashboard variant
  dashboardCard: {
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
  },
  goalName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  alignmentText: {
    fontSize: 14,
    color: '#6b7280',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  dailyScore: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  weeklyProgress: {
    flex: 1,
  },
  weeklyLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  weeklyValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weeklyValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  suggestionsContainer: {
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  suggestion: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  primaryAction: {
    backgroundColor: '#3b82f6',
  },
  secondaryAction: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryActionText: {
    color: '#3b82f6',
  },
  analyticsButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },

  // Profile variant
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  profileTitleContainer: {
    flex: 1,
  },
  profileGoalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileAlignmentText: {
    fontSize: 14,
    color: '#6b7280',
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  profileStat: {
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileStatLabel: {
    fontSize: 12,
    color: '#6b7280',
  },

  // Compact variant
  compactCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactGoalName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  compactScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  compactProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactAlignment: {
    fontSize: 12,
    color: '#6b7280',
  },
});
