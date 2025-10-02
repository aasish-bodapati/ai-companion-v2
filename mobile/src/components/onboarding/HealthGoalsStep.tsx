import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MobileOptimizedCard from '../ui/MobileOptimizedCard';
import { hapticFeedback } from '../../utils/haptics';
import { COMMON_STYLES } from '../../theme/constants';

interface HealthGoal {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: 'fitness' | 'nutrition' | 'wellness' | 'lifestyle';
}

interface HealthGoalsStepProps {
  onGoalsChange: (goals: string[]) => void;
  initialGoals?: string[];
}

const HEALTH_GOALS: HealthGoal[] = [
  // Fitness Goals
  {
    id: 'lose_weight',
    title: 'Lose Weight',
    description: 'Burn fat and build lean muscle',
    icon: 'trending-down-outline',
    color: '#10b981',
    category: 'fitness',
  },
  {
    id: 'gain_weight',
    title: 'Gain Weight',
    description: 'Build muscle and increase mass',
    icon: 'trending-up-outline',
    color: '#3b82f6',
    category: 'fitness',
  },
  {
    id: 'build_muscle',
    title: 'Build Muscle',
    description: 'Increase strength and muscle mass',
    icon: 'barbell-outline',
    color: '#f59e0b',
    category: 'fitness',
  },
  {
    id: 'improve_endurance',
    title: 'Improve Endurance',
    description: 'Build cardiovascular fitness',
    icon: 'heart-outline',
    color: '#ef4444',
    category: 'fitness',
  },
  {
    id: 'get_stronger',
    title: 'Get Stronger',
    description: 'Increase overall strength',
    icon: 'fitness-outline',
    color: '#8b5cf6',
    category: 'fitness',
  },
  
  // Nutrition Goals
  {
    id: 'eat_healthier',
    title: 'Eat Healthier',
    description: 'Improve diet quality and nutrition',
    icon: 'leaf-outline',
    color: '#10b981',
    category: 'nutrition',
  },
  {
    id: 'track_calories',
    title: 'Track Calories',
    description: 'Monitor daily caloric intake',
    icon: 'calculator-outline',
    color: '#3b82f6',
    category: 'nutrition',
  },
  {
    id: 'drink_more_water',
    title: 'Drink More Water',
    description: 'Stay hydrated throughout the day',
    icon: 'water-outline',
    color: '#06b6d4',
    category: 'nutrition',
  },
  {
    id: 'reduce_sugar',
    title: 'Reduce Sugar',
    description: 'Cut down on added sugars',
    icon: 'close-circle-outline',
    color: '#f59e0b',
    category: 'nutrition',
  },
  
  // Wellness Goals
  {
    id: 'reduce_stress',
    title: 'Reduce Stress',
    description: 'Manage stress and anxiety',
    icon: 'flower-outline',
    color: '#10b981',
    category: 'wellness',
  },
  {
    id: 'improve_sleep',
    title: 'Improve Sleep',
    description: 'Get better quality sleep',
    icon: 'moon-outline',
    color: '#6366f1',
    category: 'wellness',
  },
  {
    id: 'meditate',
    title: 'Meditate',
    description: 'Practice mindfulness and meditation',
    icon: 'leaf-outline',
    color: '#8b5cf6',
    category: 'wellness',
  },
  {
    id: 'track_mood',
    title: 'Track Mood',
    description: 'Monitor emotional wellbeing',
    icon: 'happy-outline',
    color: '#f59e0b',
    category: 'wellness',
  },
  
  // Lifestyle Goals
  {
    id: 'be_consistent',
    title: 'Be Consistent',
    description: 'Build healthy habits and routines',
    icon: 'repeat-outline',
    color: '#3b82f6',
    category: 'lifestyle',
  },
  {
    id: 'stay_motivated',
    title: 'Stay Motivated',
    description: 'Maintain motivation and drive',
    icon: 'flame-outline',
    color: '#ef4444',
    category: 'lifestyle',
  },
  {
    id: 'track_progress',
    title: 'Track Progress',
    description: 'Monitor and celebrate achievements',
    icon: 'analytics-outline',
    color: '#10b981',
    category: 'lifestyle',
  },
];

const CATEGORIES = [
  { id: 'fitness', title: 'Fitness', icon: 'fitness-outline', color: '#ef4444' },
  { id: 'nutrition', title: 'Nutrition', icon: 'nutrition-outline', color: '#10b981' },
  { id: 'wellness', title: 'Wellness', icon: 'flower-outline', color: '#8b5cf6' },
  { id: 'lifestyle', title: 'Lifestyle', icon: 'person-outline', color: '#f59e0b' },
];

export default function HealthGoalsStep({ 
  onGoalsChange, 
  initialGoals = [],
}: HealthGoalsStepProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(initialGoals);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    onGoalsChange(selectedGoals);
  }, [selectedGoals, onGoalsChange]);

  const handleGoalToggle = (goalId: string) => {
    hapticFeedback.selection();
    setSelectedGoals(prev => {
      if (prev.includes(goalId)) {
        return prev.filter(id => id !== goalId);
      } else {
        return [...prev, goalId];
      }
    });
  };

  const handleCategorySelect = (categoryId: string) => {
    hapticFeedback.light();
    setSelectedCategory(prev => prev === categoryId ? null : categoryId);
  };

  const getGoalsByCategory = (categoryId: string) => {
    return HEALTH_GOALS.filter(goal => goal.category === categoryId);
  };

  const getFilteredGoals = () => {
    if (selectedCategory) {
      return getGoalsByCategory(selectedCategory).slice(0, 6);
    }
    return HEALTH_GOALS.slice(0, 8);
  };

  const renderCategoryFilter = () => (
    <View style={styles.categoryFilter}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          onPress={() => {
            hapticFeedback.light();
            setSelectedCategory(null);
          }}
          style={[
            styles.categoryButton,
            selectedCategory === null ? styles.categoryButtonSelected : styles.categoryButtonUnselected,
          ]}
        >
          <Text style={[
            styles.categoryButtonText,
            selectedCategory === null ? styles.categoryButtonTextSelected : styles.categoryButtonTextUnselected,
          ]}>
            All
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map(category => (
          <TouchableOpacity
            key={category.id}
            onPress={() => {
              hapticFeedback.light();
              handleCategorySelect(category.id);
            }}
            style={[
              styles.categoryButton,
              selectedCategory === category.id ? styles.categoryButtonSelected : styles.categoryButtonUnselected,
            ]}
          >
            <Ionicons 
              name={category.icon as any} 
              size={16} 
              color={selectedCategory === category.id ? '#ffffff' : category.color} 
            />
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category.id ? styles.categoryButtonTextSelected : styles.categoryButtonTextUnselected,
            ]}>
              {category.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderGoalCard = (goal: HealthGoal) => {
    const isSelected = selectedGoals.includes(goal.id);
    
    return (
      <MobileOptimizedCard
        key={goal.id}
        onPress={() => handleGoalToggle(goal.id)}
        variant={isSelected ? 'elevated' : 'outlined'}
        style={StyleSheet.flatten([
          styles.goalCard,
          isSelected ? { borderColor: goal.color } : {},
        ])}
        hapticFeedback="selection"
      >
        <View style={styles.goalContent}>
          <View style={styles.goalHeader}>
            <Ionicons
              name={goal.icon as any}
              size={24}
              color={isSelected ? goal.color : '#6b7280'}
            />
            {isSelected && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={goal.color}
                style={styles.checkIcon}
              />
            )}
          </View>
          
          <Text style={[
            styles.goalTitle,
            isSelected && { color: goal.color }
          ]}>
            {goal.title}
          </Text>
          
          <Text style={styles.goalDescription}>
            {goal.description}
          </Text>
        </View>
      </MobileOptimizedCard>
    );
  };

  const renderGoalsGrid = () => {
    const goals = getFilteredGoals();
    
    return (
      <View style={styles.goalsGrid}>
        {goals.map(goal => renderGoalCard(goal))}
      </View>
    );
  };

  const renderSelectedGoalsSummary = () => {
    return (
      <MobileOptimizedCard
        variant="filled"
        style={styles.summaryCard}
      >
        <View style={styles.summaryContent}>
          {selectedGoals.length === 0 ? (
            <View style={styles.summaryHeader}>
              <Ionicons name="flag-outline" size={24} color="#9ca3af" />
              <Text style={styles.summaryTitleEmpty}>
                Select your health goals below
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.summaryHeader}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                <Text style={styles.summaryTitle}>
                  {selectedGoals.length} Goal{selectedGoals.length !== 1 ? 's' : ''} Selected
                </Text>
              </View>
              
              <View style={styles.summaryGoals}>
                {selectedGoals.slice(0, 3).map(goalId => {
                  const goal = HEALTH_GOALS.find(g => g.id === goalId);
                  return goal ? (
                    <View key={goalId} style={styles.summaryGoal}>
                      <Ionicons name={goal.icon as any} size={16} color={goal.color} />
                      <Text style={styles.summaryGoalText}>{goal.title}</Text>
                    </View>
                  ) : null;
                })}
                {selectedGoals.length > 3 && (
                  <Text style={styles.moreGoalsText}>
                    +{selectedGoals.length - 3} more
                  </Text>
                )}
              </View>
            </>
          )}
        </View>
      </MobileOptimizedCard>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>What are your health goals?</Text>
          <Text style={styles.subtitle}>
            Select all that apply. You can change these later in settings.
          </Text>
        </View>

        {/* Category Filter */}
        {renderCategoryFilter()}

        {/* Selected Goals Summary */}
        {renderSelectedGoalsSummary()}

        {/* Goals Grid */}
        {renderGoalsGrid()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COMMON_STYLES.secondaryBackground,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  categoryFilter: {
    marginBottom: 12,
  },
  categoryButton: {
    marginRight: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  categoryButtonSelected: {
    backgroundColor: '#3b82f6',
  },
  categoryButtonUnselected: {
    backgroundColor: '#f3f4f6',
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryButtonTextSelected: {
    color: '#ffffff',
  },
  categoryButtonTextUnselected: {
    color: '#6b7280',
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryContent: {
    padding: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  summaryTitleEmpty: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9ca3af',
    marginLeft: 8,
  },
  summaryGoals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryGoal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: COMMON_STYLES.standardRadius,
  },
  summaryGoalText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  moreGoalsText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  goalsGrid: {
    gap: 8,
  },
  goalCard: {
    marginBottom: 0,
  },
  goalContent: {
    padding: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkIcon: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  goalDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
});
