import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { nutritionService, FoodItem } from '../../services/nutritionService';
import CalendarComponent from '../common/CalendarComponent';
import DateSelector from '../ui/DateSelector';

interface MealData {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_items: {
    food_id: string;
    food_name: string;
    quantity_grams: number;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }[];
}

interface LogMealModalProps {
  visible: boolean;
  onClose: () => void;
  onMealLogged: () => void;
  initialMealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export default function LogMealModal({
  visible,
  onClose,
  onMealLogged,
  initialMealType = 'breakfast',
}: LogMealModalProps) {
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>(initialMealType);
  const [foodItems, setFoodItems] = useState<{
    food_id: string;
    food_name: string;
    quantity_grams: number;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const mealTypes = [
    { key: 'breakfast', label: 'Breakfast', icon: 'sunny-outline', color: '#f59e0b' },
    { key: 'lunch', label: 'Lunch', icon: 'partly-sunny-outline', color: '#10b981' },
    { key: 'dinner', label: 'Dinner', icon: 'moon-outline', color: '#8b5cf6' },
    { key: 'snack', label: 'Snack', icon: 'cafe-outline', color: '#f97316' },
  ] as const;

  useEffect(() => {
    if (visible) {
      setMealType(initialMealType);
      setFoodItems([]);
      setSearchQuery('');
      setSearchResults([]);
      setShowSearch(false);
      setSelectedDate(new Date());
    }
  }, [visible, initialMealType]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);


  const searchFoods = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await nutritionService.searchFoods(query, 10);
      setSearchResults(response.foods || []);
    } catch (error) {
      console.error('Failed to search foods:', error);
      Alert.alert('Error', 'Failed to search foods. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      searchFoods(query);
    }, 300);
  };

  const addFoodItem = (food: FoodItem, quantity: number) => {
    const calories = (food.calories_per_100g * quantity) / 100;
    const protein = (food.protein_per_100g * quantity) / 100;
    const carbs = (food.carbs_per_100g * quantity) / 100;
    const fat = (food.fat_per_100g * quantity) / 100;

    const newFoodItem = {
      food_id: food.id,
      food_name: food.name,
      quantity_grams: quantity,
      calories: Math.round(calories),
      protein_g: Math.round(protein * 10) / 10,
      carbs_g: Math.round(carbs * 10) / 10,
      fat_g: Math.round(fat * 10) / 10,
    };

    setFoodItems(prev => [...prev, newFoodItem]);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
  };

  const removeFoodItem = (index: number) => {
    setFoodItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateFoodQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFoodItem(index);
      return;
    }

    setFoodItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity_grams: quantity } : item
    ));
  };

  const calculateTotals = () => {
    return foodItems.reduce((totals, item) => ({
      calories: totals.calories + item.calories,
      protein: totals.protein + item.protein_g,
      carbs: totals.carbs + item.carbs_g,
      fat: totals.fat + item.fat_g,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const isFormValid = () => {
    return foodItems.length > 0 && mealType;
  };

  const handleSaveMeal = async () => {
    if (!isFormValid()) {
      Alert.alert('Incomplete Meal', 'Please add at least one food item to log your meal.');
      return;
    }

    try {
      setSaving(true);

      const totals = calculateTotals();
      const mealData = {
        meal_type: mealType,
        total_calories: Math.round(totals.calories),
        food_items: foodItems,
        meal_date: selectedDate.toISOString(),
      };

      await nutritionService.logMeal(mealData);

      Alert.alert(
        'Meal Logged!',
        `Great job logging your ${mealType}!`,
        [
          {
            text: 'OK',
            onPress: () => {
              onMealLogged();
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to log meal:', error);
      Alert.alert('Error', 'Failed to log meal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const totals = calculateTotals();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <BlurView intensity={20} style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Log Meal</Text>
              <Text style={styles.subtitle}>Track your nutrition</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Date Selection */}
            <DateSelector
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              label="Meal Date"
              calendarModalTitle="Select Meal Date"
              showLogsIndicator={false}
            />
            {/* Meal Type Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Meal Type</Text>
              <View style={styles.mealTypeContainer}>
                {mealTypes.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.mealTypeButton,
                      { backgroundColor: type.color + '20', borderColor: type.color },
                      mealType === type.key && { backgroundColor: type.color }
                    ]}
                    onPress={() => setMealType(type.key)}
                  >
                    <Ionicons 
                      name={type.icon as any} 
                      size={20} 
                      color={mealType === type.key ? '#ffffff' : type.color} 
                    />
                    <Text style={[
                      styles.mealTypeText,
                      { color: mealType === type.key ? '#ffffff' : type.color }
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>


            {/* Food Items */}
            <TouchableOpacity 
              style={styles.foodSection}
              activeOpacity={1}
              onPress={() => {
                // Close search when tapping outside
                if (showSearch) {
                  setShowSearch(false);
                }
              }}
            >
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Food Items</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowSearch(true)}
                >
                  <Ionicons name="add" size={20} color="#3b82f6" />
                  <Text style={styles.addButtonText}>Add Food</Text>
                </TouchableOpacity>
              </View>

              {foodItems.length === 0 ? (
                <View style={styles.emptyFoodItems}>
                  <Ionicons name="restaurant-outline" size={48} color="#9ca3af" />
                  <Text style={styles.emptyText}>No food items added</Text>
                  <Text style={styles.emptySubtext}>Tap "Add Food" to get started</Text>
                </View>
              ) : (
                <View style={styles.foodItemsList}>
                  {foodItems.map((item, index) => (
                    <View key={index} style={styles.foodItem}>
                      <View style={styles.foodItemInfo}>
                        <Text style={styles.foodItemName}>{item.food_name}</Text>
                        <Text style={styles.foodItemCalories}>{item.calories} cal</Text>
                      </View>
                      <View style={styles.foodItemActions}>
                        <TextInput
                          style={styles.quantityInput}
                          value={item.quantity_grams.toString()}
                          onChangeText={(text) => {
                            const quantity = parseFloat(text) || 0;
                            updateFoodQuantity(index, quantity);
                          }}
                          keyboardType="numeric"
                          placeholder="g"
                          placeholderTextColor="#9ca3af"
                        />
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => removeFoodItem(index)}
                        >
                          <Ionicons name="trash-outline" size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Totals */}
              {foodItems.length > 0 && (
                <View style={styles.totalsContainer}>
                  <Text style={styles.totalsTitle}>Totals</Text>
                  <View style={styles.totalsGrid}>
                    <View style={styles.totalItem}>
                      <Text style={styles.totalValue}>{Math.round(totals.calories)}</Text>
                      <Text style={styles.totalLabel}>Calories</Text>
                    </View>
                    <View style={styles.totalItem}>
                      <Text style={styles.totalValue}>{totals.protein.toFixed(1)}g</Text>
                      <Text style={styles.totalLabel}>Protein</Text>
                    </View>
                    <View style={styles.totalItem}>
                      <Text style={styles.totalValue}>{totals.carbs.toFixed(1)}g</Text>
                      <Text style={styles.totalLabel}>Carbs</Text>
                    </View>
                    <View style={styles.totalItem}>
                      <Text style={styles.totalValue}>{totals.fat.toFixed(1)}g</Text>
                      <Text style={styles.totalLabel}>Fat</Text>
                    </View>
                  </View>
                </View>
              )}

            </View>
            </TouchableOpacity>
          </ScrollView>

          {/* Food Search Dropdown - Above Footer */}
          {showSearch && (
            <View style={styles.searchDropdownAboveFooter}>
              <View style={styles.searchHeader}>
                <Text style={styles.searchTitle}>Search Foods</Text>
                <TouchableOpacity
                  style={styles.searchCloseButton}
                  onPress={() => setShowSearch(false)}
                >
                  <Ionicons name="close" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search-outline" size={20} color="#6b7280" />
                <TextInput
                  ref={searchInputRef}
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={handleSearchQueryChange}
                  placeholder="Search for foods..."
                  placeholderTextColor="#9ca3af"
                  autoFocus
                />
                {searching && <ActivityIndicator size="small" color="#3b82f6" />}
              </View>

              <ScrollView style={styles.searchResults} showsVerticalScrollIndicator={false}>
                {searchResults.map((food) => (
                  <TouchableOpacity
                    key={food.id}
                    style={styles.searchResultItem}
                    onPress={() => {
                      // Add with default 100g quantity
                      addFoodItem(food, 100);
                    }}
                  >
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultName}>{food.name}</Text>
                      {food.brand && (
                        <Text style={styles.searchResultBrand}>{food.brand}</Text>
                      )}
                      <Text style={styles.searchResultCalories}>
                        {food.calories_per_100g} cal per 100g
                      </Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={24} color="#3b82f6" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.saveButton, 
                  (saving || !isFormValid()) && styles.saveButtonDisabled
                ]}
                onPress={handleSaveMeal}
                disabled={saving || !isFormValid()}
              >
                <Text style={[
                  styles.saveButtonText,
                  (saving || !isFormValid()) && styles.saveButtonTextDisabled
                ]}>
                  {saving ? 'Logging...' : 'Log Meal'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </BlurView>


    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '95%',
    maxHeight: '85%',
    minHeight: '50%',
    padding: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
    paddingBottom: 8,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  mealTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    minWidth: 90,
  },
  mealTypeText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  // Food Section Styles
  foodSection: {
    flex: 1,
  },
  // Search Dropdown Styles
  searchDropdown: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 8,
    maxHeight: 300,
  },
  searchDropdownAboveFooter: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginHorizontal: 12,
    marginBottom: 6,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  searchCloseButton: {
    padding: 4,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    marginLeft: 6,
  },
  searchResults: {
    maxHeight: 150,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 1,
  },
  searchResultBrand: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 1,
  },
  searchResultCalories: {
    fontSize: 11,
    color: '#9ca3af',
  },
  emptyFoodItems: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  foodItemsList: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  foodItemInfo: {
    flex: 1,
  },
  foodItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  foodItemCalories: {
    fontSize: 12,
    color: '#6b7280',
  },
  foodItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityInput: {
    width: 60,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  removeButton: {
    padding: 4,
  },
  totalsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  totalsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  totalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  totalItem: {
    alignItems: 'center',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 2,
  },
  totalLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#10b981',
    borderWidth: 1,
    borderColor: '#10b981',
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF',
  },
});
