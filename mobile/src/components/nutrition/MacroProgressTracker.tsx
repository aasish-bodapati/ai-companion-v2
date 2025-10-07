import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { nutritionGoalsService, NutritionGoals } from '../../services/nutritionGoalsService';

interface MacroProgressTrackerProps {
  current: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  targets: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  bodyTypeGoal?: 'sleek' | 'steady' | 'bold';
  onMacroPress?: (macro: string) => void;
}

const { width } = Dimensions.get('window');

export default function MacroProgressTracker({
  current,
  targets,
  bodyTypeGoal = 'steady',
  onMacroPress,
}: MacroProgressTrackerProps) {
  const [goals, setGoals] = useState<NutritionGoals | null>(null);
  const [progress, setProgress] = useState<{
    calories: { current: number; target: number; percentage: number };
    protein_g: { current: number; target: number; percentage: number };
    carbs_g: { current: number; target: number; percentage: number };
    fat_g: { current: number; target: number; percentage: number };
  } | null>(null);

  useEffect(() => {
    // Load goals from service
    const nutritionGoals = nutritionGoalsService.getGoals();
    if (nutritionGoals) {
      setGoals(nutritionGoals);
      const progressData = nutritionGoalsService.calculateProgress({
        calories: current.calories,
        protein_g: current.protein_g,
        carbs_g: current.carbs_g,
        fat_g: current.fat_g,
        water_ml: 0, // Will be loaded separately
        meals_count: 0, // Will be loaded separately
      });
      setProgress(progressData);
    }
  }, [current]);

  const getMacroColor = (macro: string) => {
    switch (macro) {
      case 'calories': return '#ef4444';
      case 'protein': return '#3b82f6';
      case 'carbs': return '#f59e0b';
      case 'fat': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getMacroIcon = (macro: string) => {
    switch (macro) {
      case 'calories': return 'flame';
      case 'protein': return 'fitness';
      case 'carbs': return 'leaf';
      case 'fat': return 'water';
      default: return 'nutrition';
    }
  };

  const getMacroLabel = (macro: string) => {
    switch (macro) {
      case 'calories': return 'Calories';
      case 'protein': return 'Protein';
      case 'carbs': return 'Carbs';
      case 'fat': return 'Fat';
      default: return macro;
    }
  };

  const getMacroUnit = (macro: string) => {
    switch (macro) {
      case 'calories': return 'cal';
      case 'protein': return 'g';
      case 'carbs': return 'g';
      case 'fat': return 'g';
      default: return '';
    }
  };

  const getBodyTypeRecommendations = () => {
    switch (bodyTypeGoal) {
      case 'sleek':
        return {
          protein: { min: 1.2, max: 1.6, unit: 'g/kg' },
          calories: { deficit: true, maintenance: true },
          focus: 'Cardio and light strength training'
        };
      case 'steady':
        return {
          protein: { min: 1.6, max: 2.0, unit: 'g/kg' },
          calories: { maintenance: true },
          focus: 'Balanced strength and cardio'
        };
      case 'bold':
        return {
          protein: { min: 1.8, max: 2.4, unit: 'g/kg' },
          calories: { surplus: true },
          focus: 'Heavy strength training and hypertrophy'
        };
      default:
        return {
          protein: { min: 1.6, max: 2.0, unit: 'g/kg' },
          calories: { maintenance: true },
          focus: 'Balanced approach'
        };
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressStatus = (current: number, target: number, macro: string) => {
    const percentage = getProgressPercentage(current, target);
    
    if (macro === 'calories') {
      if (percentage >= 90 && percentage <= 110) return 'excellent';
      if (percentage >= 80 && percentage <= 120) return 'good';
      if (percentage < 80) return 'low';
      return 'high';
    } else {
      if (percentage >= 90 && percentage <= 110) return 'excellent';
      if (percentage >= 75 && percentage <= 125) return 'good';
      if (percentage < 75) return 'low';
      return 'high';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'low': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string, macro: string) => {
    switch (status) {
      case 'excellent': return 'Perfect!';
      case 'good': return 'Good';
      case 'low': return 'Low';
      case 'high': return 'High';
      default: return '';
    }
  };

  const macros = [
    { key: 'calories', current: current.calories, target: targets.calories },
    { key: 'protein', current: current.protein_g, target: targets.protein_g },
    { key: 'carbs', current: current.carbs_g, target: targets.carbs_g },
    { key: 'fat', current: current.fat_g, target: targets.fat_g },
  ];

  const recommendations = getBodyTypeRecommendations();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Macro Progress</Text>
        <View style={styles.bodyTypeBadge}>
          <Text style={styles.bodyTypeText}>
            {bodyTypeGoal?.charAt(0).toUpperCase() + bodyTypeGoal?.slice(1)} & {bodyTypeGoal === 'sleek' ? 'Graceful' : bodyTypeGoal === 'steady' ? 'Steady' : 'Bold'}
          </Text>
        </View>
      </View>

      <View style={styles.macrosContainer}>
        {macros.map((macro) => {
          const percentage = getProgressPercentage(macro.current, macro.target);
          const status = getProgressStatus(macro.current, macro.target, macro.key);
          const statusColor = getStatusColor(status);
          const statusText = getStatusText(status, macro.key);
          
          return (
            <View key={macro.key} style={styles.macroItem}>
              <View style={styles.macroHeader}>
                <View style={styles.macroInfo}>
                  <Ionicons 
                    name={getMacroIcon(macro.key) as keyof typeof Ionicons.glyphMap} 
                    size={16} 
                    color={getMacroColor(macro.key)} 
                  />
                  <Text style={styles.macroLabel}>{getMacroLabel(macro.key)}</Text>
                </View>
                <View style={styles.macroValues}>
                  <Text style={styles.macroCurrent}>{Math.round(macro.current)}</Text>
                  <Text style={styles.macroTarget}>/ {Math.round(macro.target)}{getMacroUnit(macro.key)}</Text>
                </View>
              </View>
              
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${percentage}%`,
                        backgroundColor: statusColor 
                      }
                    ]} 
                  />
                </View>
                <View style={styles.progressInfo}>
                  <Text style={[styles.progressPercentage, { color: statusColor }]}>
                    {Math.round(percentage)}%
                  </Text>
                  <Text style={[styles.progressStatus, { color: statusColor }]}>
                    {statusText}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Body Type Recommendations */}
      <View style={styles.recommendationsContainer}>
        <Text style={styles.recommendationsTitle}>Recommendations for {bodyTypeGoal?.charAt(0).toUpperCase() + bodyTypeGoal?.slice(1)} & {bodyTypeGoal === 'sleek' ? 'Graceful' : bodyTypeGoal === 'steady' ? 'Steady' : 'Bold'}</Text>
        
        <View style={styles.recommendationItem}>
          <Ionicons name="fitness" size={16} color="#3b82f6" />
          <Text style={styles.recommendationText}>
            Protein: {recommendations.protein.min}-{recommendations.protein.max} {recommendations.protein.unit}
          </Text>
        </View>
        
        <View style={styles.recommendationItem}>
          <Ionicons name="flame" size={16} color="#ef4444" />
          <Text style={styles.recommendationText}>
            Calories: {recommendations.calories.deficit ? 'Deficit' : recommendations.calories.surplus ? 'Surplus' : 'Maintenance'}
          </Text>
        </View>
        
        <View style={styles.recommendationItem}>
          <Ionicons name="trending-up" size={16} color="#10b981" />
          <Text style={styles.recommendationText}>
            Focus: {recommendations.focus}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {macros.map((macro) => {
            const status = getProgressStatus(macro.current, macro.target, macro.key);
            if (status === 'low') {
              return (
                <View key={`action-${macro.key}`} style={styles.quickAction}>
                  <Ionicons 
                    name="add-circle" 
                    size={16} 
                    color={getMacroColor(macro.key)} 
                  />
                  <Text style={styles.quickActionText}>
                    Add {getMacroLabel(macro.key)}
                  </Text>
                </View>
              );
            }
            return null;
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
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
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  bodyTypeBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  bodyTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10b981',
  },
  macrosContainer: {
    gap: 12,
  },
  macroItem: {
    marginBottom: 8,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  macroInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  macroValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  macroCurrent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  macroTarget: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 80,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  recommendationsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 12,
    color: '#6b7280',
  },
  quickActionsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#6b7280',
  },
});
