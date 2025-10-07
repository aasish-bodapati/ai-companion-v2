import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BodyTypeGoal, UserAttributes } from '../../services/bodyTypeGoals';
import { useBodyTypeScoring } from '../../hooks/useBodyTypeScoring';

export default function BodyTypeProgressCard() {
  const navigation = useNavigation();
  const [bodyTypeGoal, setBodyTypeGoal] = useState<BodyTypeGoal | null>(null);
  const [userAttributes, setUserAttributes] = useState<UserAttributes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load user's body type goal
      const { getBodyTypeGoalById } = await import('../../services/bodyTypeGoals');
      const { profileService } = await import('../../services/profileService');
      
      const profile = await profileService.getUserProfile();
      if (profile?.bodyTypeGoal) {
        const goal = await getBodyTypeGoalById(profile.bodyTypeGoal);
        setBodyTypeGoal(goal);
      }

      // Set user attributes
      if (profile?.health_data) {
        setUserAttributes({
          age: parseInt(profile.health_data.age || '25'),
          weight: parseInt(profile.health_data.weight || '70'),
          height: parseInt(profile.health_data.height || '175'),
          gender: (profile.health_data.gender as 'male' | 'female' | 'other') || 'male',
          activityLevel: (profile.health_data.activity_level as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active') || 'moderate',
        });
      }
      
    } catch {
      // Handle error silently for dashboard card
    } finally {
      setLoading(false);
    }
  };

  const {
    dailyResult,
    weeklyResult,
  } = useBodyTypeScoring({
    bodyTypeGoal,
    userAttributes,
    dailyLog: undefined, // Mock data for now
    weeklyLog: undefined, // Mock data for now
  });

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

  if (loading || !bodyTypeGoal || !userAttributes) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="trending-up-outline" size={24} color="#3b82f6" />
          <Text style={styles.title}>Body Type Progress</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
      </View>
    );
  }

  const alignmentIcon = dailyResult ? getAlignmentIcon(dailyResult.alignment) : { name: 'help', color: '#6b7280' };
  const alignmentColor = dailyResult ? getAlignmentColor(dailyResult.alignment) : '#6b7280';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="trending-up-outline" size={24} color="#3b82f6" />
        <Text style={styles.title}>Body Type Progress</Text>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('Analytics' as never)}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.goalInfo}>
          <Text style={styles.goalName}>{bodyTypeGoal.name}</Text>
          <View style={styles.alignmentIndicator}>
            <Ionicons name={alignmentIcon.name as keyof typeof Ionicons.glyphMap} size={16} color={alignmentColor} />
            <Text style={[styles.alignmentText, { color: alignmentColor }]}>
              {dailyResult?.alignment || 'Neutral'}
            </Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Today's Score</Text>
            <Text style={[styles.progressValue, { color: alignmentColor }]}>
              {dailyResult ? `+${dailyResult.score}` : '--'}
            </Text>
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${Math.max(10, dailyResult?.percentage || 0)}%`,
                  backgroundColor: alignmentColor,
                }
              ]}
            />
          </View>
          
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Weekly Alignment</Text>
            <Text style={styles.progressValue}>
              {weeklyResult?.percentage || 0}%
            </Text>
          </View>
        </View>

        {dailyResult?.suggestions && dailyResult.suggestions.length > 0 && (
          <View style={styles.suggestionContainer}>
            <Text style={styles.suggestionText}>
              💡 {dailyResult.suggestions[0]}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 12,
    flex: 1,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3b82f6',
    marginRight: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  content: {
    gap: 16,
  },
  goalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  alignmentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alignmentText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  progressSection: {
    gap: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  suggestionContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
  },
  suggestionText: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
  },
});
