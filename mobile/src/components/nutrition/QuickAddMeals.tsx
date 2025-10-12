
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';


import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../../theme/constants';

interface FoodItem {
  name: string;
  quantity: number;
  quantity_unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface QuickAddMealsProps {
  onQuickAdd: (mealType: string, foodItems: FoodItem[]) => void;
  onCustomAdd: () => void;
}

interface QuickMeal {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_items: FoodItem[];
}

const QUICK_MEALS: QuickMeal[] = [
  {
    id: 'protein-smoothie',
    name: 'Protein Smoothie',
    description: 'High protein breakfast',
    icon: 'fitness',
    color: '#3b82f6',
    calories: 350,
    protein_g: 35,
    carbs_g: 25,
    fat_g: 8,
    meal_type: 'breakfast',
    food_items: [
      { name: 'Protein Powder', quantity: 1, quantity_unit: 'scoop', calories: 120, protein_g: 25, carbs_g: 3, fat_g: 1 },
      { name: 'Banana', quantity: 1, quantity_unit: 'medium', calories: 105, protein_g: 1.3, carbs_g: 27, fat_g: 0.4 },
      { name: 'Almond Milk', quantity: 1, quantity_unit: 'cup', calories: 60, protein_g: 1, carbs_g: 3, fat_g: 2.5 },
      { name: 'Peanut Butter', quantity: 1, quantity_unit: 'tbsp', calories: 95, protein_g: 4, carbs_g: 3, fat_g: 8 },
    ]
  },
  {
    id: 'chicken-salad',
    name: 'Chicken Salad',
    description: 'Balanced lunch option',
    icon: 'restaurant',
    color: '#10b981',
    calories: 450,
    protein_g: 40,
    carbs_g: 20,
    fat_g: 22,
    meal_type: 'lunch',
    food_items: [
      { name: 'Grilled Chicken Breast', quantity: 150, quantity_unit: 'g', calories: 250, protein_g: 46, carbs_g: 0, fat_g: 5 },
      { name: 'Mixed Greens', quantity: 2, quantity_unit: 'cups', calories: 20, protein_g: 2, carbs_g: 4, fat_g: 0 },
      { name: 'Avocado', quantity: 0.5, quantity_unit: 'medium', calories: 120, protein_g: 2, carbs_g: 6, fat_g: 11 },
      { name: 'Olive Oil Dressing', quantity: 1, quantity_unit: 'tbsp', calories: 60, protein_g: 0, carbs_g: 0, fat_g: 7 },
    ]
  },
  {
    id: 'salmon-dinner',
    name: 'Salmon Dinner',
    description: 'Omega-3 rich dinner',
    icon: 'fish',
    color: '#8b5cf6',
    calories: 520,
    protein_g: 45,
    carbs_g: 35,
    fat_g: 20,
    meal_type: 'dinner',
    food_items: [
      { name: 'Salmon Fillet', quantity: 150, quantity_unit: 'g', calories: 280, protein_g: 40, carbs_g: 0, fat_g: 12 },
      { name: 'Sweet Potato', quantity: 1, quantity_unit: 'medium', calories: 120, protein_g: 2, carbs_g: 28, fat_g: 0 },
      { name: 'Broccoli', quantity: 1, quantity_unit: 'cup', calories: 55, protein_g: 5, carbs_g: 11, fat_g: 0.6 },
      { name: 'Olive Oil', quantity: 1, quantity_unit: 'tsp', calories: 40, protein_g: 0, carbs_g: 0, fat_g: 4.5 },
    ]
  },
  {
    id: 'greek-yogurt-snack',
    name: 'Greek Yogurt',
    description: 'Protein-rich snack',
    icon: 'cafe',
    color: '#f59e0b',
    calories: 180,
    protein_g: 20,
    carbs_g: 15,
    fat_g: 5,
    meal_type: 'snack',
    food_items: [
      { name: 'Greek Yogurt', quantity: 1, quantity_unit: 'cup', calories: 130, protein_g: 20, carbs_g: 9, fat_g: 0 },
      { name: 'Berries', quantity: 0.5, quantity_unit: 'cup', calories: 40, protein_g: 0.5, carbs_g: 10, fat_g: 0.2 },
      { name: 'Honey', quantity: 1, quantity_unit: 'tsp', calories: 20, protein_g: 0, carbs_g: 5, fat_g: 0 },
    ]
  },
  {
    id: 'overnight-oats',
    name: 'Overnight Oats',
    description: 'Fiber-rich breakfast',
    icon: 'leaf',
    color: '#10b981',
    calories: 320,
    protein_g: 15,
    carbs_g: 45,
    fat_g: 8,
    meal_type: 'breakfast',
    food_items: [
      { name: 'Rolled Oats', quantity: 0.5, quantity_unit: 'cup', calories: 150, protein_g: 5, carbs_g: 27, fat_g: 3 },
      { name: 'Chia Seeds', quantity: 1, quantity_unit: 'tbsp', calories: 60, protein_g: 3, carbs_g: 5, fat_g: 4 },
      { name: 'Almond Milk', quantity: 1, quantity_unit: 'cup', calories: 60, protein_g: 1, carbs_g: 3, fat_g: 2.5 },
      { name: 'Blueberries', quantity: 0.5, quantity_unit: 'cup', calories: 40, protein_g: 0.5, carbs_g: 10, fat_g: 0.2 },
    ]
  },
  {
    id: 'quinoa-bowl',
    name: 'Quinoa Bowl',
    description: 'Complete protein lunch',
    icon: 'nutrition',
    color: '#f97316',
    calories: 480,
    protein_g: 18,
    carbs_g: 65,
    fat_g: 16,
    meal_type: 'lunch',
    food_items: [
      { name: 'Quinoa', quantity: 1, quantity_unit: 'cup', calories: 220, protein_g: 8, carbs_g: 40, fat_g: 4 },
      { name: 'Black Beans', quantity: 0.5, quantity_unit: 'cup', calories: 110, protein_g: 7, carbs_g: 20, fat_g: 0.5 },
      { name: 'Avocado', quantity: 0.5, quantity_unit: 'medium', calories: 120, protein_g: 2, carbs_g: 6, fat_g: 11 },
      { name: 'Lime Dressing', quantity: 1, quantity_unit: 'tbsp', calories: 30, protein_g: 0, carbs_g: 1, fat_g: 0.5 },
    ]
  }
];

export default function QuickAddMeals({
  onQuickAdd,
  onCustomAdd,
}: QuickAddMealsProps) {

  const handleQuickAdd = (meal: QuickMeal) => {
    onQuickAdd(meal.meal_type, meal.food_items);
  };

  const getMealTypeIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return 'sunny';
      case 'lunch': return 'restaurant';
      case 'dinner': return 'moon';
      case 'snack': return 'cafe';
      default: return 'restaurant';
    }
  };

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case 'breakfast': return '#f59e0b';
      case 'lunch': return '#10b981';
      case 'dinner': return '#8b5cf6';
      case 'snack': return '#f97316';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quick Add Meals</Text>
        <Text style={styles.subtitle}>One-tap logging for common meals</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {QUICK_MEALS.map((meal) => (
          <TouchableOpacity
            key={meal.id}
            style={[styles.mealCard, { borderColor: meal.color }]}
            onPress={() => handleQuickAdd(meal)}
            activeOpacity={0.8}
          >
            <View style={styles.mealHeader}>
              <View style={[styles.mealIcon, { backgroundColor: meal.color }]}>
                <Ionicons name={meal.icon as keyof typeof Ionicons.glyphMap} size={24} color="#ffffff" />
              </View>
              <View style={[styles.mealTypeBadge, { backgroundColor: getMealTypeColor(meal.meal_type) }]}>
                <Ionicons
                  name={getMealTypeIcon(meal.meal_type) as keyof typeof Ionicons.glyphMap}
                  size={12}
                  color="#ffffff"
                />
                <Text style={styles.mealTypeText}>
                  {meal.meal_type.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.mealContent}>
              <Text style={styles.mealName}>{meal.name}</Text>
              <Text style={styles.mealDescription}>{meal.description}</Text>

              <View style={styles.mealNutrition}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{meal.calories}</Text>
                  <Text style={styles.nutritionLabel}>cal</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{meal.protein_g}g</Text>
                  <Text style={styles.nutritionLabel}>protein</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{meal.carbs_g}g</Text>
                  <Text style={styles.nutritionLabel}>carbs</Text>
                </View>
              </View>
            </View>

            <View style={styles.mealFooter}>
              <Text style={styles.foodItemsText}>
                {meal.food_items.length} items
              </Text>
              <Ionicons name="add-circle" size={20} color={meal.color} />
            </View>
          </TouchableOpacity>
        ))}

        {/* Custom Add Card */}
        <TouchableOpacity
          style={styles.customCard}
          onPress={onCustomAdd}
          activeOpacity={0.8}
        >
          <View style={styles.customIcon}>
            <Ionicons name="add" size={32} color="#6b7280" />
          </View>
          <Text style={styles.customText}>Custom Meal</Text>
          <Text style={styles.customSubtext}>Search & add your own</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: SPACING.md,
    marginBottom: 12,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
  },
  scrollView: {
    paddingLeft: 16,
  },
  scrollContent: {
    paddingRight: 16,
  },
  mealCard: {
    width: 200,
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginRight: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mealIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.xxl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    gap: 2,
  },
  mealTypeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.text.inverse,
  },
  mealContent: {
    flex: 1,
    marginBottom: 12,
  },
  mealName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  mealDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    marginBottom: 12,
  },
  mealNutrition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  nutritionLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  mealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  foodItemsText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
  },
  customCard: {
    width: 200,
    backgroundColor: '#f9fafb',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  customIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  customText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  customSubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
});
