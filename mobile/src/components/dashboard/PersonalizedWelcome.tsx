import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PersonalizedWelcomeProps {
  userName: string;
  dailyMicroGoal: string;
  alignmentPercentage: number;
  onTapMicroGoal?: () => void;
}

export default function PersonalizedWelcome({ 
  userName, 
  dailyMicroGoal, 
  alignmentPercentage,
  onTapMicroGoal 
}: PersonalizedWelcomeProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getMotivationalMessage = () => {
    if (alignmentPercentage >= 80) return "You're crushing it!";
    if (alignmentPercentage >= 60) return "Great progress today!";
    if (alignmentPercentage >= 40) return "You're on the right track!";
    return "Let's make today count!";
  };

  const getAlignmentColor = (percentage: number) => {
    if (percentage >= 80) return '#10b981'; // Green
    if (percentage >= 60) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  return (
    <View style={styles.container}>
      <View style={styles.greetingSection}>
        <Text style={styles.greeting}>{getGreeting()}, {userName}!</Text>
        <Text style={styles.motivation}>{getMotivationalMessage()}</Text>
      </View>
      
      <View style={styles.microGoalContainer}>
        <View style={styles.microGoalHeader}>
          <Ionicons name="flag-outline" size={16} color="#3b82f6" />
          <Text style={styles.microGoalLabel}>Today's Focus</Text>
        </View>
        <Text style={styles.microGoalText}>{dailyMicroGoal}</Text>
        <View style={styles.alignmentIndicator}>
          <View style={styles.alignmentBar}>
            <View 
              style={[
                styles.alignmentFill,
                { 
                  width: `${Math.max(10, alignmentPercentage)}%`,
                  backgroundColor: getAlignmentColor(alignmentPercentage)
                }
              ]}
            />
          </View>
          <Text style={[styles.alignmentText, { color: getAlignmentColor(alignmentPercentage) }]}>
            {alignmentPercentage}% aligned
          </Text>
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
  greetingSection: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  motivation: {
    fontSize: 16,
    color: '#6b7280',
  },
  microGoalContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  microGoalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  microGoalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 6,
  },
  microGoalText: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 12,
    lineHeight: 22,
  },
  alignmentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alignmentBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginRight: 12,
  },
  alignmentFill: {
    height: '100%',
    borderRadius: 3,
  },
  alignmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
