import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FormModal from '../ui/FormModal';
import MobileOptimizedCard from '../ui/MobileOptimizedCard';
import TouchOptimizedButton from '../ui/TouchOptimizedButton';
import { onboardingService } from '../../services/onboardingService';
import { hapticFeedback } from '../../utils/haptics';
import { showToast } from '../../utils/toast';

interface EditGoalsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (goals: string[]) => void;
  initialGoals?: string[];
}

const HEALTH_GOALS = [
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

export default function EditGoalsModal({
  visible,
  onClose,
  onSave,
  initialGoals = [],
}: EditGoalsModalProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(initialGoals);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedGoals(initialGoals);
    }
  }, [visible, initialGoals]);

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

  const handleSave = async () => {
    try {
      setLoading(true);
      hapticFeedback.success();
      
      await onboardingService.updateGoals(selectedGoals);
      onSave(selectedGoals);
      onClose();
      
      showToast.success('Success!', 'Goals updated successfully');
    } catch (error) {
      console.error('Failed to save goals:', error);
      hapticFeedback.error();
      showToast.error('Error', 'Failed to save goals');
    } finally {
      setLoading(false);
    }
  };

  const getGoalsByCategory = (categoryId: string) => {
    return HEALTH_GOALS.filter(goal => goal.category === categoryId);
  };

  const getFilteredGoals = () => {
    if (selectedCategory) {
      return getGoalsByCategory(selectedCategory);
    }
    return HEALTH_GOALS;
  };

  const renderCategoryFilter = () => (
    <View style={styles.categoryFilter}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchOptimizedButton
          title="All"
          onPress={() => setSelectedCategory(null)}
          variant={selectedCategory === null ? 'primary' : 'outline'}
          size="small"
          hapticFeedback="light"
          style={styles.categoryButton}
        />
        {CATEGORIES.map(category => (
          <TouchOptimizedButton
            key={category.id}
            title={category.title}
            icon={category.icon}
            onPress={() => handleCategorySelect(category.id)}
            variant={selectedCategory === category.id ? 'primary' : 'outline'}
            size="small"
            hapticFeedback="light"
            style={styles.categoryButton}
          />
        ))}
      </ScrollView>
    </View>
  );

  const renderGoalCard = (goal: typeof HEALTH_GOALS[0]) => {
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
    if (selectedGoals.length === 0) return null;

    return (
      <MobileOptimizedCard
        variant="filled"
        style={styles.summaryCard}
      >
        <View style={styles.summaryContent}>
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
        </View>
      </MobileOptimizedCard>
    );
  };

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      title="Edit Health Goals"
      subtitle="Select your primary health and fitness goals"
      variant="bottomSheet"
      size="full"
      showCloseButton={true}
      closeOnBackdrop={true}
      primaryAction={{
        label: "Save Goals",
        onPress: handleSave,
        variant: "primary",
        disabled: selectedGoals.length === 0,
      }}
      secondaryAction={{
        label: "Cancel",
        onPress: onClose,
        variant: "outline",
      }}
      isFormValid={selectedGoals.length > 0}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Category Filter */}
        {renderCategoryFilter()}

        {/* Selected Goals Summary */}
        {renderSelectedGoalsSummary()}

        {/* Goals Grid */}
        {renderGoalsGrid()}
      </ScrollView>
    </FormModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categoryFilter: {
    marginBottom: 20,
  },
  categoryButton: {
    marginRight: 8,
  },
  summaryCard: {
    marginBottom: 20,
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
    borderRadius: 12,
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
    gap: 12,
  },
  goalCard: {
    marginBottom: 0,
  },
  goalContent: {
    padding: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkIcon: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});
