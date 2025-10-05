import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { nutritionService } from '../../services/nutritionService';

const { width, height } = Dimensions.get('window');

interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  category: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  serving_size_g: number;
  serving_qty: number;
  serving_unit: string;
  serving_weight_g: number;
  photo?: string;
  type?: string;
  barcode?: string;
  // Serving nutrition data
  calories_per_serving?: number;
  protein_per_serving?: number;
  carbs_per_serving?: number;
  fat_per_serving?: number;
}

interface MealLog {
  id?: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_items: Array<{
    food_item: FoodItem;
    quantity: number;
    unit: string;
  }>;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  logged_at: string;
}

interface UnifiedNutritionLoggerProps {
  visible: boolean;
  onClose: () => void;
  onMealLogged: () => void;
  initialMeal?: MealLog;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

const getMealTypeByTime = (): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 11) {
    return 'breakfast';
  } else if (hour >= 11 && hour < 15) {
    return 'lunch';
  } else if (hour >= 15 && hour < 19) {
    return 'snack';
  } else if (hour >= 19 && hour < 24) {
    return 'dinner';
  } else {
    return 'snack';
  }
};

export default function UnifiedNutritionLogger({
  visible,
  onClose,
  onMealLogged,
  initialMeal,
  mealType,
}: UnifiedNutritionLoggerProps) {
  const [meal, setMeal] = useState<MealLog>({
    meal_type: mealType || getMealTypeByTime(),
    food_items: [],
    total_calories: 0,
    total_protein: 0,
    total_carbs: 0,
    total_fat: 0,
    logged_at: new Date().toISOString(),
  });
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadFoodItems();
      if (initialMeal) {
        setMeal(initialMeal);
      }
    }
  }, [visible, initialMeal]);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchFoods(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadFoodItems = async () => {
    try {
      setLoading(true);
      const data = await nutritionService.getFoodItems();
      setFoodItems(data);
    } catch (error) {
      console.error('Error loading food items:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchFoods = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    console.log('🔍 [NUTRITION LOGGER] Searching for:', query);
    setSearching(true);
    try {
      const results = await nutritionService.searchFoods(query);
      console.log('🔍 [NUTRITION LOGGER] Search results:', results);
      // Limit to 5 results
      setSearchResults(results.slice(0, 5));
    } catch (error) {
      console.error('Error searching foods:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectFood = (foodItem: FoodItem) => {
    addFoodItem(foodItem);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // Save the meal using nutrition service
      const mealData = {
        meal_type: meal.meal_type,
        total_calories: Math.round(meal.total_calories),
        protein_g: Math.round(meal.total_protein * 10) / 10,
        carbs_g: Math.round(meal.total_carbs * 10) / 10,
        fat_g: Math.round(meal.total_fat * 10) / 10,
        food_items: JSON.stringify(meal.food_items.map(item => ({
          food_id: Date.now(), // Temporary ID
          food_name: item.food_item.name,
          quantity: item.quantity,
          quantity_unit: item.unit,
          quantity_grams: item.quantity * 100,
          calories: Math.round((item.food_item.calories_per_100g || 0) * item.quantity),
          protein_g: Math.round(((item.food_item.protein_per_100g || 0) * item.quantity) * 10) / 10,
          carbs_g: Math.round(((item.food_item.carbs_per_100g || 0) * item.quantity) * 10) / 10,
          fat_g: Math.round(((item.food_item.fat_per_100g || 0) * item.quantity) * 10) / 10,
        }))),
        notes: '',
        meal_date: new Date().toISOString(), // Send current time in ISO format
      };
      
      await nutritionService.logMeal(mealData);
      onMealLogged();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', 'Failed to save meal');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMeal({
      meal_type: mealType || getMealTypeByTime(),
      food_items: [],
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fat: 0,
      logged_at: new Date().toISOString(),
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const calculateTotals = (foodItems: Array<{food_item: FoodItem, quantity: number, unit: string}>) => {
    const totals = foodItems.reduce((acc, item) => {
      const calories = (item.food_item.calories_per_100g || 0) * item.quantity;
      const protein = (item.food_item.protein_per_100g || 0) * item.quantity;
      const carbs = (item.food_item.carbs_per_100g || 0) * item.quantity;
      const fat = (item.food_item.fat_per_100g || 0) * item.quantity;
      
      return {
        total_calories: acc.total_calories + calories,
        total_protein: acc.total_protein + protein,
        total_carbs: acc.total_carbs + carbs,
        total_fat: acc.total_fat + fat,
      };
    }, { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 });
    
    return totals;
  };

  const addFoodItem = (foodItem: FoodItem) => {
    const existingItem = meal.food_items.find(item => item.food_item.id === foodItem.id);
    
    if (existingItem) {
      // Update quantity if item already exists
      updateFoodQuantity(foodItem.id, existingItem.quantity + 1);
    } else {
      // Add new food item
      const newFoodItem = {
        food_item: foodItem,
        quantity: 1,
        unit: foodItem.serving_unit,
      };
      
      const newFoodItems = [...meal.food_items, newFoodItem];
      const totals = calculateTotals(newFoodItems);
      
      setMeal(prev => ({
        ...prev,
        food_items: newFoodItems,
        ...totals,
      }));
    }
  };

  const updateFoodQuantity = (foodId: string, quantity: number) => {
    setMeal(prev => {
      const updatedFoodItems = prev.food_items.map(item => 
        item.food_item.id === foodId ? { ...item, quantity } : item
      );
      const totals = calculateTotals(updatedFoodItems);
      
      return {
        ...prev,
        food_items: updatedFoodItems,
        ...totals,
      };
    });
  };

  const removeFoodItem = (foodId: string) => {
    setMeal(prev => {
      const updatedFoodItems = prev.food_items.filter(item => item.food_item.id !== foodId);
      const totals = calculateTotals(updatedFoodItems);
      
      return {
        ...prev,
        food_items: updatedFoodItems,
        ...totals,
      };
    });
  };



  const filteredFoodItems = searchQuery.trim().length >= 2 ? searchResults : foodItems;

  const renderContent = () => {
    return (
      <View style={styles.content}>
        {/* Meal Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Meal Type</Text>
          <View style={styles.mealTypeGrid}>
            {[
              { type: 'breakfast', label: 'Breakfast', icon: 'sunny', color: '#f59e0b' },
              { type: 'lunch', label: 'Lunch', icon: 'restaurant', color: '#10b981' },
              { type: 'dinner', label: 'Dinner', icon: 'moon', color: '#3b82f6' },
              { type: 'snack', label: 'Snack', icon: 'cafe', color: '#8b5cf6' },
            ].map((mealTypeOption) => (
              <TouchableOpacity
                key={mealTypeOption.type}
                style={[
                  styles.mealTypeCard,
                  { 
                    borderColor: meal.meal_type === mealTypeOption.type ? mealTypeOption.color : '#e5e7eb',
                    backgroundColor: meal.meal_type === mealTypeOption.type ? mealTypeOption.color + '10' : '#ffffff',
                  }
                ]}
                onPress={() => setMeal(prev => ({ ...prev, meal_type: mealTypeOption.type as any }))}
              >
                <Ionicons 
                  name={mealTypeOption.icon as any} 
                  size={16} 
                  color={mealTypeOption.color} 
                />
                <Text style={[
                  styles.mealTypeLabel,
                  { color: meal.meal_type === mealTypeOption.type ? mealTypeOption.color : '#6b7280' }
                ]}>
                  {mealTypeOption.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Search and Add Foods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Foods</Text>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search foods..."
              placeholderTextColor="#9ca3af"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results Dropdown */}
          {searchQuery.length >= 2 && (
            <View style={styles.searchResultsOverlay}>
              {searching ? (
                <View style={styles.searchResultItem}>
                  <Text style={styles.searchResultName}>Searching...</Text>
                </View>
              ) : searchResults.length > 0 ? (
                searchResults.map((foodItem, index) => (
                  <TouchableOpacity
                    key={foodItem.id}
                    style={[
                      styles.searchResultItem,
                      index === searchResults.length - 1 && { borderBottomWidth: 0 }
                    ]}
                    onPress={() => handleSelectFood(foodItem)}
                  >
                    <View style={styles.searchResultContent}>
                      <Text style={styles.searchResultName}>{foodItem.name}</Text>
                    </View>
                    <Ionicons name="add-circle" size={18} color="#3b82f6" />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.searchResultItem}>
                  <Text style={styles.searchResultName}>No results found</Text>
                </View>
              )}
            </View>
          )}

          {/* Selected Foods Area */}
          <View style={styles.selectedFoodsArea}>
            {meal.food_items.length === 0 ? (
              <View style={styles.placeholderContainer}>
                <Ionicons name="restaurant-outline" size={32} color="#d1d5db" />
                <Text style={styles.placeholderTitle}>Add foods to your meal</Text>
                <Text style={styles.placeholderSubtitle}>
                  Search and select foods above to add them here
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.foodItemsList} showsVerticalScrollIndicator={false}>
                {meal.food_items.map((item, index) => (
                  <View key={item.food_item.id} style={styles.selectedFoodCard}>
                    <View style={styles.foodNumber}>
                      <Text style={styles.foodNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.selectedFoodInfo}>
                      <View style={styles.topRow}>
                        <Text style={styles.selectedFoodName} numberOfLines={1} ellipsizeMode="tail">
                          {item.food_item.name}
                        </Text>
                        <View style={styles.servingContainer}>
                          <TextInput
                            style={styles.servingInput}
                            value={item.quantity.toString()}
                            onChangeText={(text) => {
                              const newQuantity = parseFloat(text) || 0;
                              if (newQuantity >= 0) {
                                updateFoodQuantity(item.food_item.id, newQuantity);
                              }
                            }}
                            keyboardType="numeric"
                            selectTextOnFocus
                            placeholder="0"
                          />
                          <Text style={styles.servingUnit}>{item.unit}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => removeFoodItem(item.food_item.id)}
                          style={styles.removeFoodButton}
                        >
                          <Ionicons name="trash-outline" size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.macrosContainer}>
                        <View style={styles.macroItem}>
                          <Text style={styles.macroValue}>
                            {Math.round((item.food_item.calories_per_100g || 0) * item.quantity)}
                          </Text>
                          <Text style={styles.macroLabel}>cal</Text>
                        </View>
                        <View style={styles.macroItem}>
                          <Text style={styles.macroValue}>
                            {Math.round(((item.food_item.protein_per_100g || 0) * item.quantity) * 10) / 10}g
                          </Text>
                          <Text style={styles.macroLabel}>protein</Text>
                        </View>
                        <View style={styles.macroItem}>
                          <Text style={styles.macroValue}>
                            {Math.round(((item.food_item.carbs_per_100g || 0) * item.quantity) * 10) / 10}g
                          </Text>
                          <Text style={styles.macroLabel}>carbs</Text>
                        </View>
                        <View style={styles.macroItem}>
                          <Text style={styles.macroValue}>
                            {Math.round(((item.food_item.fat_per_100g || 0) * item.quantity) * 10) / 10}g
                          </Text>
                          <Text style={styles.macroLabel}>fat</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

        </View>


      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Log Meal</Text>
              <Text style={styles.subtitle}>Track your nutrition intake</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.contentScrollView}
            showsVerticalScrollIndicator={false}
          >
            {renderContent()}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleSave}
              disabled={loading || meal.food_items.length === 0}
            >
              <Text style={[
                styles.primaryButtonText,
                (loading || meal.food_items.length === 0) && styles.primaryButtonTextDisabled
              ]}>
                {loading ? 'Saving...' : 'Log Meal'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    maxHeight: '70%',
    marginHorizontal: 20,
    marginVertical: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
    flex: 1,
  },
  contentScrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  closeButton: {
    padding: 4,
    marginLeft: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  content: {
    padding: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  searchResults: {
    maxHeight: 200,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  searchResultsOverlay: {
    maxHeight: 150,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    lineHeight: 18,
  },
  searchResultCategory: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  selectedFoodsArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    padding: 20,
    marginTop: 16,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 6,
    marginBottom: 2,
  },
  placeholderSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 20,
  },
  mealTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  mealTypeCard: {
    width: '22%',
    alignItems: 'center',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'solid',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mealTypeLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  foodItemsList: {
    maxHeight: 300,
  },
  selectedFoodCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    padding: 8,
    marginBottom: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  foodNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 1,
  },
  foodNumberText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  selectedFoodInfo: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  selectedFoodName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  servingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  servingInput: {
    fontSize: 10,
    color: '#1f2937',
    fontWeight: '500',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 35,
    textAlign: 'center',
    height: 20,
  },
  servingUnit: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
    marginLeft: 3,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1f2937',
  },
  macroLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 0,
  },
  removeFoodButton: {
    padding: 2,
  },
  foodItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  foodItemInfo: {
    flex: 1,
  },
  foodItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  foodItemServing: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  foodItemMacros: {
    flexDirection: 'row',
    gap: 12,
  },
  macroText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  quantitiesList: {
    maxHeight: 400,
  },
  quantityCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quantityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quantityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityDisplay: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  quantityUnit: {
    fontSize: 12,
    color: '#6b7280',
  },
  quantityMacros: {
    flexDirection: 'row',
    gap: 12,
  },
  quantityMacroText: {
    fontSize: 12,
    color: '#6b7280',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonTextDisabled: {
    color: '#9ca3af',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
});