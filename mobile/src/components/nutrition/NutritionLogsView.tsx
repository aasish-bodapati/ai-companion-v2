import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { nutritionService } from '../../services/nutritionService';
import { getDateLocal } from '../../utils/dateUtils';

interface MealLog {
  id: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_name?: string;
  total_calories: number;
  notes?: string;
  meal_date?: string; // Optional since API returns logged_at
  logged_at?: string; // API actually returns this field
  created_at: string;
  food_items?: {
    id: number;
    food_name: string;
    quantity_grams: number;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }[];
}

interface NutritionLogsViewProps {
  onRefresh?: () => void;
}

export interface NutritionLogsViewRef {
  refreshLogs: () => void;
}

const NutritionLogsView = forwardRef<NutritionLogsViewRef, NutritionLogsViewProps>((props, ref) => {
  const { onRefresh } = props;
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingLog, setEditingLog] = useState<MealLog | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFoodItems, setEditFoodItems] = useState<{id: string, quantity: number, quantity_unit: string}[]>([]);
  const [editingSingleFood, setEditingSingleFood] = useState<{logId: number, foodItem: any} | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const loadLogs = async (date?: Date) => {
    try {
      console.log('🍽️ [NUTRITION LOGS] Starting loadLogs...');
      setLoading(true);
      const targetDate = date || selectedDate;
      // Use local date instead of UTC to match user's timezone
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      console.log('🍽️ [NUTRITION LOGS] Target date:', targetDate);
      console.log('🍽️ [NUTRITION LOGS] Date string (local):', dateStr);
      console.log('🍽️ [NUTRITION LOGS] UTC date string:', targetDate.toISOString().split('T')[0]);
      
      const requestParams = {
        start_date: dateStr,
        end_date: dateStr,
        page: 1,
        size: 50
      };
      console.log('🍽️ [NUTRITION LOGS] Request params:', requestParams);
      
      const response = await nutritionService.getNutritionLogs(requestParams);
      console.log('🍽️ [NUTRITION LOGS] Raw response:', response);
      
      const logs = response || [];
      console.log('🍽️ [NUTRITION LOGS] Processed logs:', logs);
      console.log('🍽️ [NUTRITION LOGS] Number of logs found:', logs.length);
      
      // Log each individual log for debugging
      logs.forEach((log, index) => {
        console.log(`🍽️ [NUTRITION LOGS] Log ${index + 1}:`, {
          id: log.id,
          meal_type: log.meal_type,
          meal_name: log.meal_name,
          total_calories: log.total_calories,
          meal_date: log.meal_date,
          created_at: log.created_at,
          food_items: log.food_items
        });
      });
      
      setLogs(logs);
    } catch (error) {
      console.error('🍽️ [NUTRITION LOGS] Failed to load nutrition logs:', error);
      Alert.alert('Error', 'Failed to load nutrition logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadLogsForDate = async (date: Date) => {
    try {
      setNavigating(true);
      // Use local date instead of UTC to match user's timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const response = await nutritionService.getNutritionLogs({
        start_date: dateStr,
        end_date: dateStr,
        page: 1,
        size: 50
      });
      setLogs(response || []);
    } catch (error) {
      console.error('Failed to load nutrition logs:', error);
      Alert.alert('Error', 'Failed to load nutrition logs. Please try again.');
    } finally {
      setNavigating(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
    loadLogsForDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    loadLogsForDate(today);
  };

  const formatDateForPicker = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const onRefreshLogs = async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
    onRefresh?.();
  };

  const handleEditLog = (log: MealLog) => {
    setEditingLog(log);
    setEditFoodItems(
      log.food_items?.map(item => ({
        id: `${log.id}-${item.food_id || item.id}`,
        quantity: item.quantity || 1,
        quantity_unit: item.quantity_unit || 'serving',
      })) || []
    );
    setEditingSingleFood(null);
    setEditModalVisible(true);
  };

  const handleEditSingleFood = (logId: number, foodItem: any) => {
    setEditingSingleFood({ logId, foodItem });
    setEditFoodItems([{
      id: `${logId}-${foodItem.food_id || foodItem.id}`,
      quantity: foodItem.quantity || 1,
      quantity_unit: foodItem.quantity_unit || 'serving',
    }]);
    setEditingLog(null);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingLog && !editingSingleFood) return;

    try {
      if (editingSingleFood) {
        // Editing a single food item
        const { logId, foodItem } = editingSingleFood;
        const log = logs.find(l => l.id === logId);
        if (!log) return;

        const editItem = editFoodItems[0];
        const quantity = editItem.quantity;
        
        // Calculate per-serving nutrition
        const originalCalories = foodItem.calories / (foodItem.quantity || 1);
        const originalProtein = foodItem.protein_g / (foodItem.quantity || 1);
        const originalCarbs = foodItem.carbs_g / (foodItem.quantity || 1);
        const originalFat = foodItem.fat_g / (foodItem.quantity || 1);

        // Update the specific food item
        const updatedFoodItems = log.food_items?.map(item => {
          if (item.food_id === foodItem.food_id || item.id === foodItem.id) {
            return {
              ...item,
              quantity: quantity,
              calories: originalCalories * quantity,
              protein_g: originalProtein * quantity,
              carbs_g: originalCarbs * quantity,
              fat_g: originalFat * quantity,
            };
          }
          return item;
        }) || [];

        const totalCalories = updatedFoodItems.reduce((sum, item) => sum + item.calories, 0);
        const totalProtein = updatedFoodItems.reduce((sum, item) => sum + item.protein_g, 0);
        const totalCarbs = updatedFoodItems.reduce((sum, item) => sum + item.carbs_g, 0);
        const totalFat = updatedFoodItems.reduce((sum, item) => sum + item.fat_g, 0);

        await nutritionService.updateMeal(logId.toString(), {
          food_items: JSON.stringify(updatedFoodItems),
          total_calories: totalCalories,
          protein_g: totalProtein,
          carbs_g: totalCarbs,
          fat_g: totalFat,
        });
      } else if (editingLog) {
        // Editing entire meal
        const updatedFoodItems = editingLog.food_items?.map(item => {
          const editItem = editFoodItems.find(editItem => 
            editItem.id === `${editingLog.id}-${item.food_id || item.id}`
          );
          
          if (editItem) {
            const quantity = editItem.quantity;
            const originalCalories = item.calories / (item.quantity || 1);
            const originalProtein = item.protein_g / (item.quantity || 1);
            const originalCarbs = item.carbs_g / (item.quantity || 1);
            const originalFat = item.fat_g / (item.quantity || 1);
            
            return {
              ...item,
              quantity: quantity,
              calories: originalCalories * quantity,
              protein_g: originalProtein * quantity,
              carbs_g: originalCarbs * quantity,
              fat_g: originalFat * quantity,
            };
          }
          return item;
        }) || [];

        const totalCalories = updatedFoodItems.reduce((sum, item) => sum + item.calories, 0);
        const totalProtein = updatedFoodItems.reduce((sum, item) => sum + item.protein_g, 0);
        const totalCarbs = updatedFoodItems.reduce((sum, item) => sum + item.carbs_g, 0);
        const totalFat = updatedFoodItems.reduce((sum, item) => sum + item.fat_g, 0);

        await nutritionService.updateMeal(editingLog.id.toString(), {
          food_items: JSON.stringify(updatedFoodItems),
          total_calories: totalCalories,
          protein_g: totalProtein,
          carbs_g: totalCarbs,
          fat_g: totalFat,
        });
      }

      // Reload logs to get updated data
      await loadLogs();

      setEditModalVisible(false);
      setEditingLog(null);
      setEditingSingleFood(null);
      setEditFoodItems([]);
      Alert.alert('Success', 'Meal log updated successfully!');
    } catch (error) {
      console.error('Failed to update log:', error);
      Alert.alert('Error', 'Failed to update meal log. Please try again.');
    }
  };

  const handleDeleteLog = async (logId: number) => {
    Alert.alert(
      'Delete Meal Log',
      'Are you sure you want to delete this meal log? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteLog(logId),
        },
      ]
    );
  };

  const handleDeleteFoodItem = async (logId: number, foodItemId: string) => {
    // Find the log and check how many food items it has
    const log = logs.find(l => l.id === logId);
    if (!log || !log.food_items) return;

    if (log.food_items.length === 1) {
      // If only one food item, delete the entire log
      handleDeleteLog(logId);
    } else {
      // If multiple food items, remove just this one
      Alert.alert(
        'Remove Food Item',
        'Are you sure you want to remove this food item from the meal?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => confirmDeleteFoodItem(logId, foodItemId),
          },
        ]
      );
    }
  };

  const confirmDeleteFoodItem = async (logId: number, foodItemId: string) => {
    try {
      setDeletingLogId(logId);
      
      // Find the log and remove the specific food item
      const log = logs.find(l => l.id === logId);
      if (!log || !log.food_items) return;

      const updatedFoodItems = log.food_items.filter(item => 
        `${log.id}-${item.id || log.food_items.indexOf(item)}` !== foodItemId
      );

      if (updatedFoodItems.length === 0) {
        // If no food items left, delete the entire log
        await nutritionService.deleteMeal(logId);
        setLogs(prevLogs => prevLogs.filter(log => log.id !== logId));
        Alert.alert('Success', 'Meal log deleted successfully!');
      } else {
        // Update the log with remaining food items
        const updatedLog = {
          ...log,
          food_items: updatedFoodItems,
          total_calories: updatedFoodItems.reduce((sum, item) => sum + (item.calories || 0), 0),
          protein_g: updatedFoodItems.reduce((sum, item) => sum + (item.protein_g || 0), 0),
          carbs_g: updatedFoodItems.reduce((sum, item) => sum + (item.carbs_g || 0), 0),
          fat_g: updatedFoodItems.reduce((sum, item) => sum + (item.fat_g || 0), 0),
        };

        // Update the log in the backend
        await nutritionService.updateMeal(logId, {
          food_items: JSON.stringify(updatedFoodItems.map(item => ({
            food_id: item.id,
            food_name: item.food_name,
            quantity: item.quantity || 1,
            quantity_unit: item.quantity_unit || 'serving',
            quantity_grams: item.quantity_grams || 100,
            calories: item.calories || 0,
            protein_g: item.protein_g || 0,
            carbs_g: item.carbs_g || 0,
            fat_g: item.fat_g || 0,
          }))),
          total_calories: updatedLog.total_calories,
          protein_g: updatedLog.protein_g,
          carbs_g: updatedLog.carbs_g,
          fat_g: updatedLog.fat_g,
        });

        // Update the local state
        setLogs(prevLogs => prevLogs.map(l => l.id === logId ? updatedLog : l));
        Alert.alert('Success', 'Food item removed successfully!');
      }
    } catch (error) {
      console.error('Failed to remove food item:', error);
      Alert.alert('Error', 'Failed to remove food item. Please try again.');
    } finally {
      setDeletingLogId(null);
    }
  };

  const confirmDeleteLog = async (logId: number) => {
    try {
      setDeletingLogId(logId);
      
      await nutritionService.deleteMeal(logId);
      
      setLogs(prevLogs => prevLogs.filter(log => log.id !== logId));
      
      Alert.alert('Success', 'Meal log deleted successfully!');
    } catch (error) {
      console.error('Failed to delete log:', error);
      Alert.alert('Error', 'Failed to delete meal log. Please try again.');
    } finally {
      setDeletingLogId(null);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Expose refresh method to parent component
  useImperativeHandle(ref, () => ({
    refreshLogs: loadLogs
  }));

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown Date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'Unknown Time';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Time';
      }
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Time';
    }
  };

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return 'sunny-outline';
      case 'lunch': return 'partly-sunny-outline';
      case 'dinner': return 'moon-outline';
      case 'snack': return 'cafe-outline';
      default: return 'restaurant-outline';
    }
  };

  const getMealTypeColor = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return '#f59e0b';
      case 'lunch': return '#10b981';
      case 'dinner': return '#8b5cf6';
      case 'snack': return '#f97316';
      default: return '#6b7280';
    }
  };

  const renderMealCards = () => {
    // Flatten all food items from all logs into individual cards
    const allFoodItems: Array<{
      id: string;
      food_name: string;
      quantity_grams: number;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      quantity: number;
      quantity_unit: string;
      log_id: number;
      meal_type: string;
      meal_date: string;
      created_at: string;
    }> = [];

    logs.forEach((log) => {
      if (log.food_items && log.food_items.length > 0) {
        log.food_items.forEach((item, index) => {
          allFoodItems.push({
            id: `${log.id}-${item.id || index}`,
            food_name: item.food_name,
            quantity_grams: item.quantity_grams,
            calories: item.calories,
            protein_g: item.protein_g,
            carbs_g: item.carbs_g,
            fat_g: item.fat_g,
            quantity: item.quantity || 1,
            quantity_unit: item.quantity_unit || 'serving',
            log_id: log.id,
            meal_type: log.meal_type,
            meal_date: log.meal_date || log.created_at,
            created_at: log.created_at
          });
        });
      }
    });

    return allFoodItems.map((foodItem) => (
      <View key={foodItem.id} style={styles.mealCard}>
        <View style={styles.mealHeader}>
          <Text style={styles.mealTitle} numberOfLines={1}>
            {foodItem.food_name} ({foodItem.quantity} {foodItem.quantity_unit})
          </Text>
          <View style={[styles.mealTypeBadge, { backgroundColor: getMealTypeColor(foodItem.meal_type) }]}>
            <Ionicons 
              name={getMealTypeIcon(foodItem.meal_type) as any} 
              size={8} 
              color="#ffffff"
              style={styles.badgeIcon}
            />
            <Text style={styles.mealTypeBadgeText}>
              {foodItem.meal_type.toUpperCase()}
            </Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditSingleFood(foodItem.log_id, foodItem)}
              disabled={deletingLogId === foodItem.log_id}
            >
              <Ionicons name="pencil-outline" size={14} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteFoodItem(foodItem.log_id, foodItem.id)}
              disabled={deletingLogId === foodItem.log_id}
            >
              {deletingLogId === foodItem.log_id ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <Ionicons name="trash-outline" size={14} color="#ef4444" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mealStatsRow}>
          <View style={styles.mealStatsLeft}>
            <Text style={styles.mealCalories}>{foodItem.calories} calories</Text>
            <Text style={styles.mealServingSize}>
              {foodItem.quantity_grams}g • {foodItem.protein_g}g protein • {foodItem.carbs_g}g carbs • {foodItem.fat_g}g fat
            </Text>
          </View>
          <View style={styles.mealTimeContainer}>
            <Text style={styles.mealTimeText}>
              {formatTime(foodItem.meal_date || foodItem.created_at)}
            </Text>
          </View>
        </View>

        {/* Notes section removed for individual food items */}
      </View>
    ));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading nutrition logs...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefreshLogs}
          colors={['#10b981']}
          tintColor="#10b981"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Nutrition Logs</Text>
        <Text style={styles.subtitle}>Track your meal history</Text>
      </View>

      {/* Date Picker Component */}
      <View style={styles.datePickerContainer}>
        <TouchableOpacity 
          style={styles.dateNavButton} 
          onPress={() => navigateDate('prev')}
          disabled={navigating}
        >
          {navigating ? (
            <ActivityIndicator size="small" color="#6b7280" />
          ) : (
            <Ionicons name="chevron-back" size={20} color="#6b7280" />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dateDisplayButton} 
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
          <Text style={styles.dateDisplayText}>{formatDateForPicker(selectedDate)}</Text>
          <Ionicons name="chevron-down" size={16} color="#6b7280" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dateNavButton} 
          onPress={() => navigateDate('next')}
          disabled={navigating}
        >
          {navigating ? (
            <ActivityIndicator size="small" color="#6b7280" />
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.todayButton, 
            isToday(selectedDate) && styles.todayButtonActive,
            navigating && styles.todayButtonDisabled
          ]} 
          onPress={goToToday}
          disabled={navigating}
        >
          <Text style={[
            styles.todayButtonText,
            isToday(selectedDate) && styles.todayButtonTextActive,
            navigating && styles.todayButtonTextDisabled
          ]}>Today</Text>
        </TouchableOpacity>
      </View>

      {logs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No Meal Logs</Text>
          <Text style={styles.emptyDescription}>
            Start logging your meals to see them here
          </Text>
        </View>
      ) : (
        <View style={styles.mealsContainer}>
          {renderMealCards()}
        </View>
      )}

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Meal Log</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>
                Meal: {editingLog?.meal_type || editingSingleFood?.foodItem.meal_type}
              </Text>
              
              {/* Food Items with serving quantities */}
              <Text style={styles.modalLabel}>Food Item:</Text>
              {editingSingleFood ? (
                // Editing single food item
                <View style={styles.foodItemEditContainer}>
                  <Text style={styles.foodItemName}>{editingSingleFood.foodItem.food_name}</Text>
                  <View style={styles.servingRow}>
                    <TextInput
                      style={styles.servingInput}
                      value={editFoodItems[0]?.quantity.toString() || '1'}
                      onChangeText={(text) => {
                        const quantity = parseFloat(text) || 1;
                        setEditFoodItems([{
                          ...editFoodItems[0],
                          quantity: quantity
                        }]);
                      }}
                      placeholder="1"
                      keyboardType="numeric"
                    />
                    <Text style={styles.servingUnit}>
                      {editFoodItems[0]?.quantity_unit || editingSingleFood.foodItem.quantity_unit || 'serving'}
                    </Text>
                  </View>
                </View>
              ) : editingLog ? (
                // Editing entire meal
                editingLog.food_items?.map((foodItem, index) => {
                  const editItem = editFoodItems.find(item => 
                    item.id === `${editingLog.id}-${foodItem.food_id || foodItem.id}`
                  );
                  return (
                    <View key={foodItem.id} style={styles.foodItemEditContainer}>
                      <Text style={styles.foodItemName}>{foodItem.food_name}</Text>
                      <View style={styles.servingRow}>
                        <TextInput
                          style={styles.servingInput}
                          value={editItem?.quantity.toString() || '1'}
                          onChangeText={(text) => {
                            const quantity = parseFloat(text) || 1;
                            setEditFoodItems(prev => 
                              prev.map(item => 
                                item.id === `${editingLog.id}-${foodItem.food_id || foodItem.id}`
                                  ? { ...item, quantity: quantity }
                                  : item
                              )
                            );
                          }}
                          placeholder="1"
                          keyboardType="numeric"
                        />
                        <Text style={styles.servingUnit}>
                          {editItem?.quantity_unit || foodItem.quantity_unit || 'serving'}
                        </Text>
                      </View>
                    </View>
                  );
                }) || <Text style={styles.noFoodItems}>No food items found</Text>
              ) : (
                <Text style={styles.noFoodItems}>No food items found</Text>
              )}
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
});

NutritionLogsView.displayName = 'NutritionLogsView';

export default NutritionLogsView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  mealsContainer: {
    marginBottom: 12,
  },
  mealCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#10b981',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  mealTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  mealTypeBadge: {
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginLeft: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  mealTypeBadgeText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  badgeIcon: {
    marginRight: 2,
  },
  mealTitleText: {
    flex: 1,
    marginLeft: 8,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  mealStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    minHeight: 18,
  },
  mealStatsLeft: {
    flex: 1,
  },
  mealCalories: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  mealServingSize: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  mealTimeContainer: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'center',
  },
  mealTimeText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 8,
  },
  actionButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mealStatText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 3,
  },
  mealDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealDateText: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 3,
  },
  mealNotesContainer: {
    backgroundColor: '#f8fafc',
    padding: 6,
    borderRadius: 4,
    marginTop: 4,
  },
  mealNotesText: {
    fontSize: 11,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  // Date Picker Styles
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#bbf7d0',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    padding: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#10b981',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateNavButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDisplayButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  dateDisplayText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '500',
  },
  todayButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  todayButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  todayButtonTextActive: {
    color: '#ffffff',
  },
  todayButtonDisabled: {
    opacity: 0.5,
  },
  todayButtonTextDisabled: {
    color: '#9ca3af',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  foodItemEditContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  foodItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  servingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  servingInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    color: '#374151',
    backgroundColor: 'white',
    minWidth: 60,
    textAlign: 'center',
  },
  servingUnit: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  noFoodItems: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
});
