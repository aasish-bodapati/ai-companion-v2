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
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  serving_size: string;
  serving_unit: string;
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
  notes: string;
  logged_at: string;
}

interface UnifiedNutritionLoggerProps {
  visible: boolean;
  onClose: () => void;
  onSave: (meal: MealLog) => void;
  initialMeal?: MealLog;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export default function UnifiedNutritionLogger({
  visible,
  onClose,
  onSave,
  initialMeal,
  mealType = 'breakfast',
}: UnifiedNutritionLoggerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [meal, setMeal] = useState<MealLog>({
    meal_type: mealType,
    food_items: [],
    total_calories: 0,
    total_protein: 0,
    total_carbs: 0,
    total_fat: 0,
    notes: '',
    logged_at: new Date().toISOString(),
  });
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const steps = [
    { title: 'Meal Type', icon: 'restaurant' },
    { title: 'Add Foods', icon: 'add-circle' },
    { title: 'Quantities', icon: 'scale' },
    { title: 'Review & Save', icon: 'checkmark' },
  ];

  useEffect(() => {
    if (visible) {
      loadFoodItems();
      if (initialMeal) {
        setMeal(initialMeal);
      }
    }
  }, [visible, initialMeal]);

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

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await onSave(meal);
      onClose();
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to save meal');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setMeal({
      meal_type: mealType,
      food_items: [],
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fat: 0,
      notes: '',
      logged_at: new Date().toISOString(),
    });
    setSearchQuery('');
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
      
      setMeal(prev => ({
        ...prev,
        food_items: [...prev.food_items, newFoodItem],
      }));
    }
  };

  const updateFoodQuantity = (foodId: string, quantity: number) => {
    setMeal(prev => ({
      ...prev,
      food_items: prev.food_items.map(item => 
        item.food_item.id === foodId ? { ...item, quantity } : item
      ),
    }));
  };

  const removeFoodItem = (foodId: string) => {
    setMeal(prev => ({
      ...prev,
      food_items: prev.food_items.filter(item => item.food_item.id !== foodId),
    }));
  };

  const calculateTotals = () => {
    const totals = meal.food_items.reduce((acc, item) => {
      const multiplier = item.quantity;
      return {
        calories: acc.calories + (item.food_item.calories * multiplier),
        protein: acc.protein + (item.food_item.protein_g * multiplier),
        carbs: acc.carbs + (item.food_item.carbs_g * multiplier),
        fat: acc.fat + (item.food_item.fat_g * multiplier),
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    setMeal(prev => ({
      ...prev,
      total_calories: Math.round(totals.calories),
      total_protein: Math.round(totals.protein * 10) / 10,
      total_carbs: Math.round(totals.carbs * 10) / 10,
      total_fat: Math.round(totals.fat * 10) / 10,
    }));
  };

  useEffect(() => {
    calculateTotals();
  }, [meal.food_items]);

  const filteredFoodItems = foodItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Select Meal Type</Text>
            
            <View style={styles.mealTypeGrid}>
              {[
                { type: 'breakfast', label: 'Breakfast', icon: 'sunny', color: '#f59e0b' },
                { type: 'lunch', label: 'Lunch', icon: 'sunny', color: '#10b981' },
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
                    size={32} 
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
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Add Foods</Text>
            
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search foods..."
                placeholderTextColor="#9ca3af"
              />
            </View>

            <ScrollView style={styles.foodItemsList} showsVerticalScrollIndicator={false}>
              {filteredFoodItems.map((foodItem) => (
                <TouchableOpacity
                  key={foodItem.id}
                  style={styles.foodItemCard}
                  onPress={() => addFoodItem(foodItem)}
                >
                  <View style={styles.foodItemInfo}>
                    <Text style={styles.foodItemName}>{foodItem.name}</Text>
                    <Text style={styles.foodItemServing}>
                      {foodItem.serving_size} {foodItem.serving_unit}
                    </Text>
                    <View style={styles.foodItemMacros}>
                      <Text style={styles.macroText}>{foodItem.calories} cal</Text>
                      <Text style={styles.macroText}>{foodItem.protein_g}g protein</Text>
                      <Text style={styles.macroText}>{foodItem.carbs_g}g carbs</Text>
                      <Text style={styles.macroText}>{foodItem.fat_g}g fat</Text>
                    </View>
                  </View>
                  <Ionicons name="add-circle" size={24} color="#3b82f6" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Adjust Quantities</Text>
            
            <ScrollView style={styles.quantitiesList} showsVerticalScrollIndicator={false}>
              {meal.food_items.map((item, index) => (
                <View key={item.food_item.id} style={styles.quantityCard}>
                  <View style={styles.quantityHeader}>
                    <Text style={styles.quantityTitle}>{item.food_item.name}</Text>
                    <TouchableOpacity
                      onPress={() => removeFoodItem(item.food_item.id)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateFoodQuantity(item.food_item.id, Math.max(0, item.quantity - 0.5))}
                    >
                      <Ionicons name="remove" size={20} color="#6b7280" />
                    </TouchableOpacity>
                    
                    <View style={styles.quantityDisplay}>
                      <Text style={styles.quantityValue}>{item.quantity}</Text>
                      <Text style={styles.quantityUnit}>{item.unit}</Text>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateFoodQuantity(item.food_item.id, item.quantity + 0.5)}
                    >
                      <Ionicons name="add" size={20} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.quantityMacros}>
                    <Text style={styles.quantityMacroText}>
                      {Math.round(item.food_item.calories * item.quantity)} cal
                    </Text>
                    <Text style={styles.quantityMacroText}>
                      {Math.round(item.food_item.protein_g * item.quantity * 10) / 10}g protein
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Review & Save</Text>
            
            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>
                {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
              </Text>
              
              <View style={styles.reviewMacros}>
                <View style={styles.reviewMacro}>
                  <Text style={styles.reviewMacroValue}>{meal.total_calories}</Text>
                  <Text style={styles.reviewMacroLabel}>Calories</Text>
                </View>
                <View style={styles.reviewMacro}>
                  <Text style={styles.reviewMacroValue}>{meal.total_protein}g</Text>
                  <Text style={styles.reviewMacroLabel}>Protein</Text>
                </View>
                <View style={styles.reviewMacro}>
                  <Text style={styles.reviewMacroValue}>{meal.total_carbs}g</Text>
                  <Text style={styles.reviewMacroLabel}>Carbs</Text>
                </View>
                <View style={styles.reviewMacro}>
                  <Text style={styles.reviewMacroValue}>{meal.total_fat}g</Text>
                  <Text style={styles.reviewMacroLabel}>Fat</Text>
                </View>
              </View>
              
              <View style={styles.reviewFoods}>
                <Text style={styles.reviewFoodsTitle}>Food Items:</Text>
                {meal.food_items.map((item, index) => (
                  <Text key={index} style={styles.reviewFoodItem}>
                    • {item.food_item.name} ({item.quantity} {item.unit})
                  </Text>
                ))}
              </View>
              
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>Notes (optional):</Text>
                <TextInput
                  style={styles.notesInput}
                  value={meal.notes}
                  onChangeText={(text) => setMeal(prev => ({ ...prev, notes: text }))}
                  placeholder="Add any notes about this meal"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log Meal</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Progress Steps */}
        <View style={styles.progressContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepContainer}>
              <View style={[
                styles.stepCircle,
                { backgroundColor: index <= currentStep ? '#3b82f6' : '#e5e7eb' }
              ]}>
                <Ionicons 
                  name={step.icon as any} 
                  size={16} 
                  color={index <= currentStep ? '#ffffff' : '#6b7280'} 
                />
              </View>
              <Text style={[
                styles.stepText,
                { color: index <= currentStep ? '#3b82f6' : '#6b7280' }
              ]}>
                {step.title}
              </Text>
            </View>
          ))}
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderStepContent()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handlePrevious}
            >
              <Text style={styles.secondaryButtonText}>Previous</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              { flex: currentStep === 0 ? 1 : 0.6 }
            ]}
            onPress={currentStep === steps.length - 1 ? handleSave : handleNext}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {currentStep === steps.length - 1 ? 'Save Meal' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  placeholder: {
    width: 32,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
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
    flex: 1,
    padding: 20,
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
    gap: 12,
  },
  mealTypeCard: {
    width: (width - 64) / 2,
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'solid',
  },
  mealTypeLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
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
  foodItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  foodItemInfo: {
    flex: 1,
  },
  foodItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  foodItemServing: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  foodItemMacros: {
    flexDirection: 'row',
    gap: 12,
  },
  macroText: {
    fontSize: 12,
    color: '#9ca3af',
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
  reviewCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  reviewMacros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  reviewMacro: {
    alignItems: 'center',
  },
  reviewMacroValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  reviewMacroLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  reviewFoods: {
    marginBottom: 16,
  },
  reviewFoodsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  reviewFoodItem: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  notesContainer: {
    marginTop: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1f2937',
    height: 80,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
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
  secondaryButton: {
    backgroundColor: '#f3f4f6',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
});