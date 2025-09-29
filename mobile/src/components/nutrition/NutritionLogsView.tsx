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
  const [editNotes, setEditNotes] = useState('');
  const [deletingLogId, setDeletingLogId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const loadLogs = async (date?: Date) => {
    try {
      setLoading(true);
      const targetDate = date || selectedDate;
      const dateStr = targetDate.toISOString().split('T')[0];
      const response = await nutritionService.getMealLogs({
        start_date: dateStr,
        end_date: dateStr,
        page: 1,
        size: 50
      });
      console.log('📊 Nutrition logs response:', response);
      console.log('📊 Logs data:', response.logs);
      if (response.logs && response.logs.length > 0) {
        console.log('📊 First log meal_date:', response.logs[0].meal_date);
        console.log('📊 First log logged_at:', response.logs[0].logged_at);
      }
      setLogs(response.logs || []);
    } catch (error) {
      console.error('Failed to load nutrition logs:', error);
      Alert.alert('Error', 'Failed to load nutrition logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadLogsForDate = async (date: Date) => {
    try {
      setNavigating(true);
      const dateStr = date.toISOString().split('T')[0];
      const response = await nutritionService.getMealLogs({
        start_date: dateStr,
        end_date: dateStr,
        page: 1,
        size: 50
      });
      setLogs(response.logs || []);
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
    setEditNotes(log.notes || '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingLog) return;

    try {
      await nutritionService.updateMealLog(editingLog.id, {
        notes: editNotes
      });

      // Update in the logs array
      setLogs(prevLogs => 
        prevLogs.map(log => 
          log.id === editingLog.id ? { ...log, notes: editNotes } : log
        )
      );

      setEditModalVisible(false);
      setEditingLog(null);
      setEditNotes('');

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

  const confirmDeleteLog = async (logId: number) => {
    try {
      setDeletingLogId(logId);
      
      await nutritionService.deleteMealLog(logId);
      
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
      console.log('🕐 Formatting time:', { dateString, date, isValid: !isNaN(date.getTime()) });
      if (isNaN(date.getTime())) {
        return 'Invalid Time';
      }
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.log('🕐 Time formatting error:', error);
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
    return logs.map((log) => (
      <View key={log.id} style={styles.mealCard}>
        <View style={styles.mealHeader}>
          <View style={styles.mealTitleContainer}>
            <View style={styles.mealTypeBadge}>
              <Text style={[styles.mealTypeBadgeText, { color: getMealTypeColor(log.meal_type) }]}>
                {log.meal_type.charAt(0).toUpperCase() + log.meal_type.slice(1)}
              </Text>
            </View>
            <View style={styles.mealTitleText}>
              <Text style={styles.mealTitle}>
                {log.food_items && log.food_items.length > 0 
                  ? log.food_items.map(item => item.food_name).join(', ')
                  : 'No food items logged'
                }
              </Text>
              <Text style={styles.mealCalories}>{log.total_calories} calories</Text>
            </View>
          </View>
          <View style={styles.mealActionsContainer}>
            <View style={styles.mealTimeContainer}>
              <Ionicons name="time-outline" size={14} color="#6b7280" />
              <Text style={styles.mealTime}>
                {formatTime(log.logged_at || log.meal_date || '')}
              </Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditLog(log)}
                disabled={deletingLogId === log.id}
              >
                <Ionicons name="pencil-outline" size={16} color="#3b82f6" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteLog(log.id)}
                disabled={deletingLogId === log.id}
              >
                {deletingLogId === log.id ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.mealStatsContainer}>
          {/* Time display removed - already shown in header */}
        </View>


        {log.notes && log.notes.trim() && (
          <View style={styles.mealNotesContainer}>
            <Text style={styles.mealNotesText}>{log.notes}</Text>
          </View>
        )}
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
              <Text style={styles.modalLabel}>Meal: {editingLog?.meal_type}</Text>
              <Text style={styles.modalLabel}>Notes:</Text>
              <TextInput
                style={styles.notesInput}
                value={editNotes}
                onChangeText={setEditNotes}
                placeholder="Add notes about your meal..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
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
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  mealTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  mealTypeBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mealTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  mealTitleText: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  mealCalories: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  mealActionsContainer: {
    alignItems: 'flex-end',
  },
  mealTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  mealTime: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
    minHeight: 32,
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
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  mealNotesText: {
    fontSize: 12,
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
  notesInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#f9fafb',
    minHeight: 100,
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
});
