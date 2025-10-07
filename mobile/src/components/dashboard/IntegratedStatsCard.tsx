import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NutritionStats {
  calories: { current: number; target: number };
  protein: { current: number; target: number };
  carbs: { current: number; target: number };
  fat: { current: number; target: number };
}

interface WellnessStats {
  water: { current: number; target: number };
  mood: string;
  sleep: { current: number; target: number };
}

interface IntegratedStatsCardProps {
  nutrition: NutritionStats;
  wellness: WellnessStats;
  onLogMeal?: () => void;
  onLogWater?: () => void;
  onLogMood?: () => void;
}

export default function IntegratedStatsCard({
  nutrition,
  wellness,
  onLogMeal,
  onLogWater,
  onLogMood,
}: IntegratedStatsCardProps) {
  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 90) return '#10b981';
    if (percentage >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const getMoodIcon = (mood: string) => {
    switch (mood.toLowerCase()) {
      case 'excellent': return 'happy';
      case 'good': return 'happy-outline';
      case 'okay': return 'remove-circle-outline';
      case 'bad': return 'sad-outline';
      case 'terrible': return 'sad';
      default: return 'help-outline';
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood.toLowerCase()) {
      case 'excellent': return '#10b981';
      case 'good': return '#22c55e';
      case 'okay': return '#f59e0b';
      case 'bad': return '#f97316';
      case 'terrible': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Stats</Text>
      
      {/* Nutrition Row */}
      <View style={styles.nutritionRow}>
        <View style={styles.nutritionItem}>
          <View style={styles.nutritionHeader}>
            <Ionicons name="flame-outline" size={16} color="#f97316" />
            <Text style={styles.nutritionValue}>{nutrition.calories.current}</Text>
            <Text style={styles.nutritionTarget}>/{nutrition.calories.target}</Text>
          </View>
          <Text style={styles.nutritionLabel}>Calories</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${Math.min(100, (nutrition.calories.current / nutrition.calories.target) * 100)}%`,
                  backgroundColor: getProgressColor(nutrition.calories.current, nutrition.calories.target)
                }
              ]}
            />
          </View>
        </View>

        <View style={styles.nutritionItem}>
          <View style={styles.nutritionHeader}>
            <Ionicons name="fitness-outline" size={16} color="#3b82f6" />
            <Text style={styles.nutritionValue}>{nutrition.protein.current}g</Text>
            <Text style={styles.nutritionTarget}>/{nutrition.protein.target}g</Text>
          </View>
          <Text style={styles.nutritionLabel}>Protein</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${Math.min(100, (nutrition.protein.current / nutrition.protein.target) * 100)}%`,
                  backgroundColor: getProgressColor(nutrition.protein.current, nutrition.protein.target)
                }
              ]}
            />
          </View>
        </View>

        <View style={styles.nutritionItem}>
          <View style={styles.nutritionHeader}>
            <Ionicons name="leaf-outline" size={16} color="#10b981" />
            <Text style={styles.nutritionValue}>{nutrition.carbs.current}g</Text>
            <Text style={styles.nutritionTarget}>/{nutrition.carbs.target}g</Text>
          </View>
          <Text style={styles.nutritionLabel}>Carbs</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${Math.min(100, (nutrition.carbs.current / nutrition.carbs.target) * 100)}%`,
                  backgroundColor: getProgressColor(nutrition.carbs.current, nutrition.carbs.target)
                }
              ]}
            />
          </View>
        </View>

        <View style={styles.nutritionItem}>
          <View style={styles.nutritionHeader}>
            <Ionicons name="water-outline" size={16} color="#8b5cf6" />
            <Text style={styles.nutritionValue}>{nutrition.fat.current}g</Text>
            <Text style={styles.nutritionTarget}>/{nutrition.fat.target}g</Text>
          </View>
          <Text style={styles.nutritionLabel}>Fat</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${Math.min(100, (nutrition.fat.current / nutrition.fat.target) * 100)}%`,
                  backgroundColor: getProgressColor(nutrition.fat.current, nutrition.fat.target)
                }
              ]}
            />
          </View>
        </View>
      </View>

      {/* Wellness Row */}
      <View style={styles.wellnessRow}>
        <TouchableOpacity 
          style={styles.wellnessItem}
          onPress={onLogWater}
        >
          <View style={styles.wellnessHeader}>
            <Ionicons name="water" size={16} color="#3b82f6" />
            <Text style={styles.wellnessValue}>{wellness.water.current}L</Text>
            <Text style={styles.wellnessTarget}>/{wellness.water.target}L</Text>
          </View>
          <Text style={styles.wellnessLabel}>Water</Text>
          <View style={styles.progressDots}>
            {Array.from({ length: 5 }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: i < (wellness.water.current / wellness.water.target) * 5 
                      ? '#3b82f6' 
                      : '#e5e7eb'
                  }
                ]}
              />
            ))}
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.wellnessItem}
          onPress={onLogMood}
        >
          <View style={styles.wellnessHeader}>
            <Ionicons 
              name={getMoodIcon(wellness.mood) as keyof typeof Ionicons.glyphMap} 
              size={16} 
              color={getMoodColor(wellness.mood)} 
            />
            <Text style={[styles.wellnessValue, { color: getMoodColor(wellness.mood) }]}>
              {wellness.mood}
            </Text>
          </View>
          <Text style={styles.wellnessLabel}>Mood</Text>
        </TouchableOpacity>

        <View style={styles.wellnessItem}>
          <View style={styles.wellnessHeader}>
            <Ionicons name="moon-outline" size={16} color="#8b5cf6" />
            <Text style={styles.wellnessValue}>{wellness.sleep.current}h</Text>
            <Text style={styles.wellnessTarget}>/{wellness.sleep.target}h</Text>
          </View>
          <Text style={styles.wellnessLabel}>Sleep</Text>
          <View style={styles.progressDots}>
            {Array.from({ length: 5 }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: i < (wellness.sleep.current / wellness.sleep.target) * 5 
                      ? '#8b5cf6' 
                      : '#e5e7eb'
                  }
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onLogMeal}
        >
          <Ionicons name="restaurant-outline" size={18} color="#3b82f6" />
          <Text style={styles.actionButtonText}>Log Meal</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onLogWater}
        >
          <Ionicons name="water-outline" size={18} color="#3b82f6" />
          <Text style={styles.actionButtonText}>Log Water</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onLogMood}
        >
          <Ionicons name="happy-outline" size={18} color="#3b82f6" />
          <Text style={styles.actionButtonText}>Log Mood</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  nutritionRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
  },
  nutritionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 4,
  },
  nutritionTarget: {
    fontSize: 14,
    color: '#6b7280',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  wellnessRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  wellnessItem: {
    flex: 1,
    alignItems: 'center',
  },
  wellnessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  wellnessValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 4,
  },
  wellnessTarget: {
    fontSize: 12,
    color: '#6b7280',
  },
  wellnessLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 4,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
    marginLeft: 6,
  },
});
