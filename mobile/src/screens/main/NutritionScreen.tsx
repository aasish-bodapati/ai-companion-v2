import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { nutritionService } from '../../services/nutritionService';
import NutritionLogsView from '../../components/nutrition/NutritionLogsView';
import LogMealModal from '../../components/nutrition/LogMealModal';

export default function NutritionScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'routines'>('overview');
  const [showLogMealModal, setShowLogMealModal] = useState(false);
  const nutritionLogsRef = useRef<any>(null);
  const [todayStats, setTodayStats] = useState({
    meals: 0,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTodayStats = async () => {
    try {
      setLoading(true);
      const response = await nutritionService.getTodayNutrition();
      setTodayStats({
        meals: response.meals || 0,
        calories: response.calories || 0,
        protein: response.protein || 0,
        carbs: response.carbs || 0,
        fat: response.fat || 0,
      });
    } catch (error) {
      console.error('Failed to load today\'s nutrition:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTodayStats();
    setRefreshing(false);
  };

  useEffect(() => {
    loadTodayStats();
  }, []);

  const StatCard = ({ icon, title, value, subtitle, color }: {
    icon: string;
    title: string;
    value: string | number;
    subtitle?: string;
    color: string;
  }) => (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      <View style={styles.statContent}>
        <View style={styles.statInfo}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
        <Ionicons name={icon as any} size={32} color="#ffffff" />
      </View>
    </View>
  );


  const renderOverview = () => (
    <ScrollView
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >

      {/* Today's Snapshot */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Snapshot</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.snapshotScroll}
        >
          <View style={styles.snapshotCard}>
            <Ionicons name="restaurant-outline" size={20} color="#10b981" />
            <Text style={styles.snapshotValue}>{todayStats.meals}</Text>
            <Text style={styles.snapshotLabel}>Meals</Text>
            <View style={styles.trendIndicator}>
              <Ionicons name="trending-up" size={12} color="#10b981" />
            </View>
          </View>
          <View style={styles.snapshotCard}>
            <Ionicons name="flame-outline" size={20} color="#ef4444" />
            <Text style={styles.snapshotValue}>{todayStats.calories}</Text>
            <Text style={styles.snapshotLabel}>Calories</Text>
            <View style={styles.trendIndicator}>
              <Ionicons name="trending-up" size={12} color="#10b981" />
            </View>
          </View>
          <View style={styles.snapshotCard}>
            <Ionicons name="fitness-outline" size={20} color="#3b82f6" />
            <Text style={styles.snapshotValue}>{todayStats.protein.toFixed(0)}g</Text>
            <Text style={styles.snapshotLabel}>Protein</Text>
            <View style={styles.trendIndicator}>
              <Ionicons name="trending-up" size={12} color="#10b981" />
            </View>
          </View>
          <View style={styles.snapshotCard}>
            <Ionicons name="analytics-outline" size={20} color="#f59e0b" />
            <Text style={styles.snapshotValue}>{todayStats.carbs.toFixed(0)}g</Text>
            <Text style={styles.snapshotLabel}>Carbs</Text>
            <View style={styles.trendIndicator}>
              <Ionicons name="trending-up" size={12} color="#10b981" />
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Quick Meals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Meals</Text>
        <View style={styles.quickMealsGrid}>
          <TouchableOpacity style={styles.quickMealCard}>
            <Ionicons name="cafe" size={24} color="#f59e0b" />
            <Text style={styles.quickMealTitle}>Breakfast</Text>
            <Text style={styles.quickMealSubtitle}>5 recipes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickMealCard}>
            <Ionicons name="sunny" size={24} color="#ef4444" />
            <Text style={styles.quickMealTitle}>Lunch</Text>
            <Text style={styles.quickMealSubtitle}>12 recipes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickMealCard}>
            <Ionicons name="moon" size={24} color="#8b5cf6" />
            <Text style={styles.quickMealTitle}>Dinner</Text>
            <Text style={styles.quickMealSubtitle}>18 recipes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickMealCard}>
            <Ionicons name="ice-cream" size={24} color="#ec4899" />
            <Text style={styles.quickMealTitle}>Snacks</Text>
            <Text style={styles.quickMealSubtitle}>8 recipes</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Macro Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Macro Breakdown</Text>
        <View style={styles.macroCard}>
          <View style={styles.macroItem}>
            <View style={[styles.macroBar, { backgroundColor: '#3b82f6' }]}>
              <View style={[styles.macroFill, { width: `${Math.min((todayStats.protein / 100) * 100, 100)}%` }]} />
            </View>
            <View style={styles.macroInfo}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>{todayStats.protein.toFixed(1)}g</Text>
            </View>
          </View>
          <View style={styles.macroItem}>
            <View style={[styles.macroBar, { backgroundColor: '#f59e0b' }]}>
              <View style={[styles.macroFill, { width: `${Math.min((todayStats.carbs / 200) * 100, 100)}%` }]} />
            </View>
            <View style={styles.macroInfo}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>{todayStats.carbs.toFixed(1)}g</Text>
            </View>
          </View>
          <View style={styles.macroItem}>
            <View style={[styles.macroBar, { backgroundColor: '#8b5cf6' }]}>
              <View style={[styles.macroFill, { width: `${Math.min((todayStats.fat / 60) * 100, 100)}%` }]} />
            </View>
            <View style={styles.macroInfo}>
              <Text style={styles.macroLabel}>Fat</Text>
              <Text style={styles.macroValue}>{todayStats.fat.toFixed(1)}g</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderRoutines = () => (
    <ScrollView
      style={styles.content}
      showsVerticalScrollIndicator={false}
    >

      {/* Quick Start Routines */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Start Routines</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.quickRoutinesScroll}
        >
          <TouchableOpacity style={styles.quickRoutineCard}>
            <View style={styles.quickRoutineIcon}>
              <Ionicons name="fitness" size={28} color="#10b981" />
            </View>
            <Text style={styles.quickRoutineTitle}>Muscle Building</Text>
            <Text style={styles.quickRoutineCalories}>2500 cal/day</Text>
            <Text style={styles.quickRoutineMeals}>5 meals</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickRoutineCard}>
            <View style={styles.quickRoutineIcon}>
              <Ionicons name="leaf" size={28} color="#10b981" />
            </View>
            <Text style={styles.quickRoutineTitle}>Weight Loss</Text>
            <Text style={styles.quickRoutineCalories}>1800 cal/day</Text>
            <Text style={styles.quickRoutineMeals}>4 meals</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickRoutineCard}>
            <View style={styles.quickRoutineIcon}>
              <Ionicons name="heart" size={28} color="#ef4444" />
            </View>
            <Text style={styles.quickRoutineTitle}>Heart Health</Text>
            <Text style={styles.quickRoutineCalories}>2000 cal/day</Text>
            <Text style={styles.quickRoutineMeals}>3 meals</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Routine Templates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Routine Templates</Text>
        <View style={styles.templateList}>
          <TouchableOpacity style={styles.templateItem}>
            <View style={styles.templateInfo}>
              <Text style={styles.templateTitle}>Keto Diet Plan</Text>
              <Text style={styles.templateDetails}>Low carb, high fat • 7 days</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.templateItem}>
            <View style={styles.templateInfo}>
              <Text style={styles.templateTitle}>Intermittent Fasting</Text>
              <Text style={styles.templateDetails}>16:8 schedule • 14 days</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.templateItem}>
            <View style={styles.templateInfo}>
              <Text style={styles.templateTitle}>Mediterranean Style</Text>
              <Text style={styles.templateDetails}>Balanced nutrition • 30 days</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Create Routine Button */}
      <TouchableOpacity
        style={styles.createRoutineButton}
        onPress={() => setShowLogMealModal(true)}
      >
        <Ionicons name="add-circle" size={24} color="#ffffff" />
        <Text style={styles.createRoutineButtonText}>Create New Routine</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading nutrition data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Nutrition</Text>
        <Text style={styles.subtitle}>Track your meals and nutrition</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons 
            name="grid-outline" 
            size={20} 
            color={activeTab === 'overview' ? '#10b981' : '#6b7280'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'overview' && styles.activeTabText
          ]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'logs' && styles.activeTab]}
          onPress={() => setActiveTab('logs')}
        >
          <Ionicons 
            name="list-outline" 
            size={20} 
            color={activeTab === 'logs' ? '#10b981' : '#6b7280'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'logs' && styles.activeTabText
          ]}>
            Logs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'routines' && styles.activeTab]}
          onPress={() => setActiveTab('routines')}
        >
          <Ionicons 
            name="repeat-outline" 
            size={20} 
            color={activeTab === 'routines' ? '#10b981' : '#6b7280'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'routines' && styles.activeTabText
          ]}>
            Routines
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'overview' ? renderOverview() : 
       activeTab === 'logs' ? <NutritionLogsView ref={nutritionLogsRef} onRefresh={onRefresh} /> : 
       renderRoutines()}

      {/* Log Meal Modal */}
      <LogMealModal
        visible={showLogMealModal}
        onClose={() => setShowLogMealModal(false)}
        onMealLogged={() => {
          setShowLogMealModal(false);
          loadTodayStats();
          // Refresh logs if we're on the logs tab
          if (activeTab === 'logs' && nutritionLogsRef.current) {
            nutritionLogsRef.current.refreshLogs();
          }
        }}
      />
    </View>
  );
}

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
    marginTop: 12,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#10b981',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  viewAllText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
  },
  snapshotScroll: {
    paddingLeft: 0,
  },
  snapshotCard: {
    width: 100,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  snapshotValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
  },
  snapshotLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  trendIndicator: {
    marginTop: 4,
  },
  macroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  macroItem: {
    marginBottom: 16,
  },
  macroBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
  },
  macroInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  // Routine styles
  quickRoutinesScroll: {
    paddingLeft: 0,
  },
  quickRoutineCard: {
    width: 160,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginRight: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickRoutineIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickRoutineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  quickRoutineCalories: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
    marginBottom: 4,
  },
  quickRoutineMeals: {
    fontSize: 12,
    color: '#6b7280',
  },
  templateList: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  templateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  templateInfo: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  templateDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  createRoutineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  createRoutineButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
