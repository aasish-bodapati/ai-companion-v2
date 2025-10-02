import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LoggingModal from '../ui/LoggingModal';
import LoggingItem, { LoggingItemData } from '../ui/LoggingItem';
import { nutritionService, FoodItem } from '../../services/nutritionService';
import { hapticFeedback } from '../../utils/haptics';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme/constants';

interface MealData {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_items: {
    food_id: number;
    food_name: string;
    quantity: number;
    quantity_unit: string;
    quantity_grams: number;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }[];
}

interface MealLoggingModalProps {
  visible: boolean;
  onClose: () => void;
  onMealLogged: () => void;
  initialMealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export default function MealLoggingModal({
  visible,
  onClose,
  onMealLogged,
  initialMealType = 'breakfast',
}: MealLoggingModalProps) {
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>(initialMealType);
  const [foodItems, setFoodItems] = useState<LoggingItemData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Debug logging for search results
  useEffect(() => {
    console.log('🍽️ [MEAL LOGGING] Search results updated:', searchResults);
  }, [searchResults]);
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setMealType(initialMealType);
      setFoodItems([]);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [visible, initialMealType]);

  const searchFoods = useCallback(async (query: string) => {
    console.log('🍽️ [MEAL LOGGING] Search query:', query);
    
    if (query.trim().length < 2) {
      console.log('🍽️ [MEAL LOGGING] Query too short, clearing results');
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      console.log('🍽️ [MEAL LOGGING] Calling nutritionService.searchFoods...');
      const results = await nutritionService.searchFoods(query);
      console.log('🍽️ [MEAL LOGGING] Search results received:', results);
      console.log('🍽️ [MEAL LOGGING] Setting search results to:', results);
      setSearchResults(results);
    } catch (error) {
      console.error('🍽️ [MEAL LOGGING] Error searching foods:', error);
      console.log('🍽️ [MEAL LOGGING] Setting search results to empty array due to error');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleClearSearch = useCallback(() => {
    console.log('🍽️ [MEAL LOGGING] handleClearSearch called - clearing results');
    setSearchResults([]);
  }, []);

  const handleSelectFood = useCallback((food: FoodItem) => {
    console.log('🍽️ [MEAL LOGGING] handleSelectFood called with:', food);
    setFoodItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === food.id);
      if (existingItem) {
        console.log('🍽️ [MEAL LOGGING] Updating existing item');
        // Update quantity if item already exists
        return prevItems.map(item => {
          if (item.id === food.id) {
            const newQuantity = (item.quantity || 0) + 1;
            const updatedItem = { ...item, quantity: newQuantity };
            
            // Recalculate nutrition if we have original food data
            if (item.originalFood) {
              const food = item.originalFood;
              updatedItem.calories = (food.calories_per_serving || food.calories_per_100g) * newQuantity;
              updatedItem.protein_g = (food.protein_per_serving || food.protein_per_100g) * newQuantity;
              updatedItem.carbs_g = (food.carbs_per_serving || food.carbs_per_100g) * newQuantity;
              updatedItem.fat_g = (food.fat_per_serving || food.fat_per_100g) * newQuantity;
            }
            
            return updatedItem;
          }
          return item;
        });
      } else {
        console.log('🍽️ [MEAL LOGGING] Adding new item');
        // Add new item
        const newItem: LoggingItemData = {
          id: food.id,
          name: food.name,
          quantity: 1,
          quantity_unit: food.serving_unit || 'serving',
          calories: food.calories_per_serving || food.calories_per_100g,
          protein_g: food.protein_per_serving || food.protein_per_100g,
          carbs_g: food.carbs_per_serving || food.carbs_per_100g,
          fat_g: food.fat_per_serving || food.fat_per_100g,
          // Store original food data for calculations
          originalFood: food,
        };
        return [...prevItems, newItem];
      }
    });
    hapticFeedback.selection();
  }, []);

  const handleAddItem = useCallback((item: LoggingItemData) => {
    setFoodItems(prevItems => [...prevItems, item]);
  }, []);

  const handleRemoveItem = useCallback((id: number | string) => {
    setFoodItems(prevItems => prevItems.filter(item => item.id !== id));
    hapticFeedback.light();
  }, []);

  const handleUpdateItem = useCallback((id: number | string, updates: Partial<LoggingItemData>) => {
    setFoodItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, ...updates };
        
        // Recalculate nutrition if quantity changed and we have original food data
        if (updates.quantity && item.originalFood) {
          const quantity = updates.quantity;
          const food = item.originalFood;
          
          updatedItem.calories = (food.calories_per_serving || food.calories_per_100g) * quantity;
          updatedItem.protein_g = (food.protein_per_serving || food.protein_per_100g) * quantity;
          updatedItem.carbs_g = (food.carbs_per_serving || food.carbs_per_100g) * quantity;
          updatedItem.fat_g = (food.fat_per_serving || food.fat_per_100g) * quantity;
        }
        
        return updatedItem;
      }
      return item;
    }));
  }, []);

  const isFormValid = () => {
    return foodItems.length > 0 && mealType;
  };

  const getFormData = () => {
    const totalCalories = foodItems.reduce((sum, item) => sum + (item.calories || 0), 0);
    const totalProtein = foodItems.reduce((sum, item) => sum + (item.protein_g || 0), 0);
    const totalCarbs = foodItems.reduce((sum, item) => sum + (item.carbs_g || 0), 0);
    const totalFat = foodItems.reduce((sum, item) => sum + (item.fat_g || 0), 0);

    return {
      meal_type: mealType,
      total_calories: Math.round(totalCalories),
      protein_g: Math.round(totalProtein * 10) / 10,
      carbs_g: Math.round(totalCarbs * 10) / 10,
      fat_g: Math.round(totalFat * 10) / 10,
      food_items: JSON.stringify(foodItems.map(item => ({
        food_id: item.id,
        food_name: item.name,
        quantity: item.quantity || 1,
        quantity_unit: item.quantity_unit || 'serving',
        quantity_grams: (item.quantity || 1) * 100, // Assuming 100g per serving
        calories: item.calories || 0,
        protein_g: item.protein_g || 0,
        carbs_g: item.carbs_g || 0,
        fat_g: item.fat_g || 0,
      }))),
    };
  };

  const handleSave = async (data: any) => {
    setSaving(true);
    try {
      await nutritionService.logMeal(data);
      onMealLogged();
      onClose();
    } catch (error) {
      console.error('Error logging meal:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const renderFoodItem = useCallback((item: LoggingItemData, index: number) => (
    <LoggingItem
      key={item.id}
      item={item}
      itemType="meal"
      onUpdate={handleUpdateItem}
      onRemove={handleRemoveItem}
      showNutrition={true}
      testID={`meal-item-${index}`}
    />
  ), []);

  const renderMealTypeSelector = useCallback(() => (
    <View style={styles.mealTypeSection}>
      <Text style={styles.sectionTitle}>Meal Type</Text>
      <View style={styles.mealTypeButtons}>
        {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.mealTypeButton,
              mealType === type && styles.mealTypeButtonActive,
            ]}
            onPress={() => {
              setMealType(type);
              hapticFeedback.light();
            }}
            testID={`meal-type-${type}`}
          >
            <Ionicons
              name={
                type === 'breakfast' ? 'sunny' :
                type === 'lunch' ? 'restaurant' :
                type === 'dinner' ? 'moon' : 'cafe'
              }
              size={20}
              color={mealType === type ? COLORS.primary : COLORS.text.secondary}
            />
            <Text style={[
              styles.mealTypeText,
              mealType === type && styles.mealTypeTextActive,
            ]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  ), [mealType]);

  return (
    <LoggingModal
      visible={visible}
      onClose={onClose}
      onSave={handleSave}
      title="Log Meal"
      subtitle="Track your nutrition"
      formType="meal"
      searchPlaceholder="Search for food items..."
      searchResults={searchResults}
      onSearch={searchFoods}
      onSelectItem={handleSelectFood}
      onClearSearch={handleClearSearch}
      searchLoading={searching}
      items={foodItems}
      onAddItem={handleAddItem}
      onRemoveItem={handleRemoveItem}
      onUpdateItem={handleUpdateItem}
      renderItem={renderFoodItem}
      isFormValid={isFormValid}
      getFormData={getFormData}
      additionalFields={renderMealTypeSelector()}
      saving={saving}
      variant="fullScreen"
      testID="meal-logging-modal"
    />
  );
}

const styles = StyleSheet.create({
  mealTypeSection: {
    marginBottom: SPACING.medium,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.medium,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.small,
  },
  mealTypeButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  mealTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.small,
    paddingHorizontal: SPACING.xs,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.small,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    gap: SPACING.xs,
  },
  mealTypeButtonActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  mealTypeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  mealTypeTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
