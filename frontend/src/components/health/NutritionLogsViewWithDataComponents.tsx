'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClockIcon, FireIcon, HeartIcon, ChartBarIcon, PencilIcon, TrashIcon, TrophyIcon, PlusIcon } from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { useSuccessToast, useErrorToast, useWarningToast } from '@/components/ui/toast';
import { AnimatedButton, AnimatedCard, AnimatedCounter } from '@/components/ui/micro-interactions';
import { PageLoading, StatsCardSkeleton } from '@/components/ui/loading-states';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { DataViewContainer } from '@/components/ui/data-view-container';
import { StatsGrid, StatItem } from '@/components/ui/stats-grid';
import { SearchAndFilter } from '@/components/ui/search-and-filter';
import { EmptyState } from '@/components/ui/empty-state';
import api from '@/lib/api';
import { SmartMealLogger } from './SmartMealLogger';

interface NutritionLog {
  id: string;
  user_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_name?: string;
  total_calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  food_items: Array<{
    name: string;
    quantity: string;
    calories: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    fiber_g?: number;
    sodium_mg?: number;
  }>;
  notes?: string;
  mood_before?: string;
  mood_after?: string;
  meal_date: string;
  created_at: string;
}

interface NutritionLogsViewProps {
  className?: string;
  refreshTrigger?: number;
  isActive?: boolean;
}

function NutritionLogsViewWithDataComponents({ className = '', refreshTrigger, isActive = true }: NutritionLogsViewProps) {
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [mealTypeFilter, setMealTypeFilter] = useState<string>('all');
  const [editingLog, setEditingLog] = useState<NutritionLog | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [showSmartLogger, setShowSmartLogger] = useState(false);
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [period, setPeriod] = useState('week');
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [stats, setStats] = useState({
    totalMeals: 0,
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    totalFiber: 0,
    totalSugar: 0,
    totalSodium: 0,
    avgCaloriesPerMeal: 0,
    currentStreak: 0
  });

  // Toast notifications
  const successToast = useSuccessToast();
  const errorToast = useErrorToast();
  const warningToast = useWarningToast();

  // Load nutrition logs with comprehensive data
  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/health/logging/nutrition', {
        params: {
          period: period,
          page: currentPage,
          size: pageSize,
          meal_type: mealTypeFilter !== 'all' ? mealTypeFilter : undefined,
          start_date: format(selectedDate, 'yyyy-MM-dd'),
          end_date: format(selectedDate, 'yyyy-MM-dd')
        }
      });

      console.log('Nutrition logs API response:', response);
      
      if (response.logs) {
        console.log('Setting logs from response.logs:', response.logs);
        setLogs(response.logs);
        setTotalLogs(response.pagination?.total || response.logs.length);
        setTotalPages(response.pagination?.total_pages || 1);
        calculateStats(response.logs);
      } else if (Array.isArray(response)) {
        console.log('Setting logs from direct array:', response);
        setLogs(response);
        setTotalLogs(response.length);
        setTotalPages(1);
        calculateStats(response);
      } else {
        console.log('No logs found in response');
        calculateStats([]);
      }
    } catch (error) {
      console.error('Failed to load nutrition logs:', error);
      errorToast('Failed to load nutrition logs', 'Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [period, currentPage, pageSize, searchTerm, mealTypeFilter, selectedDate, errorToast]);

  // Calculate stats from logs
  const calculateStats = useCallback((logsData: NutritionLog[]) => {
    const totalMeals = logsData.length;
    const totalCalories = logsData.reduce((sum, log) => sum + (log.total_calories || 0), 0);
    const avgCaloriesPerMeal = totalMeals > 0 ? totalCalories / totalMeals : 0;
    
    // Calculate current streak (simplified - count consecutive days with meals)
    const mealDates = logsData.map(log => new Date(log.meal_date).toDateString()).sort();
    const uniqueDates = [...new Set(mealDates)];
    const currentStreak = uniqueDates.length; // Simplified streak calculation
    
    setStats({
      totalMeals,
      totalCalories,
      totalProtein: 0,  // Not available in current model
      totalCarbs: 0,    // Not available in current model
      totalFat: 0,      // Not available in current model
      totalFiber: 0,    // Not available in current model
      totalSugar: 0,    // Not available in current model
      totalSodium: 0,   // Not available in current model
      avgCaloriesPerMeal: Math.round(avgCaloriesPerMeal),
      currentStreak
    });
  }, []);

  // Load data when component mounts or dependencies change
  useEffect(() => {
    if (isActive) {
      loadLogs();
    }
  }, [isActive, loadLogs]);

  // Refresh when trigger changes
  useEffect(() => {
    if (refreshTrigger) {
      loadLogs();
    }
  }, [refreshTrigger, loadLogs]);

  // Convert stats to StatItem format for StatsGrid
  const mainStatsItems: StatItem[] = [
    {
      id: 'totalMeals',
      label: 'Total Meals',
      value: stats.totalMeals,
      unit: 'meals logged',
      icon: <HeartIcon className="h-8 w-8" />,
      color: 'green',
      gradient: false,
      animated: true
    },
    {
      id: 'totalCalories',
      label: 'Total Calories',
      value: Math.round(stats.totalCalories),
      unit: 'calories',
      icon: <FireIcon className="h-8 w-8" />,
      color: 'orange',
      gradient: false,
      animated: true
    },
    {
      id: 'avgCaloriesPerMeal',
      label: 'Avg per Meal',
      value: Math.round(stats.avgCaloriesPerMeal),
      unit: 'calories/meal',
      icon: <ChartBarIcon className="h-8 w-8" />,
      color: 'blue',
      gradient: false,
      animated: true
    },
    {
      id: 'currentStreak',
      label: 'Current Streak',
      value: stats.currentStreak,
      unit: 'days',
      icon: <TrophyIcon className="h-8 w-8" />,
      color: 'purple',
      gradient: false,
      animated: true
    }
  ];


  // Search and filter configuration
  const filterOptions = [
    { value: 'all', label: 'All Meals' },
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' }
  ];

  const periodOptions = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' }
  ];

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    setCurrentPage(1);
  };

  const handleMealTypeFilter = (filter: string) => {
    setMealTypeFilter(filter);
    setCurrentPage(1);
  };

  const handlePeriodFilter = (filter: string) => {
    setPeriod(filter);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setMealTypeFilter('all');
    setPeriod('week');
    setCurrentPage(1);
  };

  // CRUD operations
  const handleAddLog = () => {
    setShowSmartLogger(true);
  };

  const handleEditLog = (log: NutritionLog) => {
    setEditingLog(log);
    setShowSmartLogger(true);
  };

  const handleDeleteLog = (logId: string) => {
    setLogToDelete(logId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!logToDelete) return;

    try {
      await api.delete(`/health/nutrition-logs/${logToDelete}/`);
      successToast('Meal deleted successfully!');
      setLogs(prev => prev.filter(log => log.id !== logToDelete));
      calculateStats(logs.filter(log => log.id !== logToDelete));
    } catch (error) {
      console.error('Failed to delete meal:', error);
      errorToast('Failed to delete meal', 'Please try again.');
    } finally {
      setShowDeleteDialog(false);
      setLogToDelete(null);
    }
  };

  const handleBulkDelete = () => {
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    try {
      const logIds = Array.from(selectedLogs);
      await api.post('/health/nutrition-logs/bulk-delete/', { log_ids: logIds });
      successToast(`${logIds.length} meals deleted successfully!`);
      setLogs(prev => prev.filter(log => !selectedLogs.has(log.id)));
      setSelectedLogs(new Set());
      calculateStats(logs.filter(log => !selectedLogs.has(log.id)));
    } catch (error) {
      console.error('Failed to delete meals:', error);
      errorToast('Failed to delete meals', 'Please try again.');
    } finally {
      setShowBulkDeleteDialog(false);
    }
  };

  const handleLogSuccess = () => {
    setShowSmartLogger(false);
    setEditingLog(null);
    loadLogs();
  };

  const toggleLogSelection = (logId: string) => {
    setSelectedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const selectAllLogs = () => {
    setSelectedLogs(new Set(logs.map(log => log.id)));
  };

  const clearSelection = () => {
    setSelectedLogs(new Set());
  };

  // Empty state configuration - compact like fitness logs
  const emptyStateConfig = {
    title: 'No Meals Yet',
    description: 'Start your nutrition journey by logging your first meal!',
    icon: <HeartIcon className="h-8 w-8 text-gray-400" />,
    action: {
      label: 'Add Meal',
      onClick: handleAddLog
    }
  };

  // Filtered logs for display
  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.meal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.food_items && log.food_items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesMealType = mealTypeFilter === 'all' || log.meal_type === mealTypeFilter;
    
    return matchesSearch && matchesMealType;
  });

  return (
    <DataViewContainer
      loading={loading}
      error={null}
      onRetry={loadLogs}
      isEmpty={filteredLogs.length === 0}
      emptyComponent={<EmptyState {...emptyStateConfig} variant="card" />}
      className={`space-y-6 ${className}`}
      data-testid="nutrition-logs-container"
    >
      {/* View Controls - Match fitness logs height */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Meal Logs</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredLogs.length} meals logged
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowSmartLogger(true)}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Meal
          </Button>
        </div>
      </div>

      {/* Main Stats Grid - Single row like fitness logs */}
      <StatsGrid
        stats={mainStatsItems}
        columns={4}
        loading={loading}
        data-testid="stats-grid"
      />

      {/* Search and Filter Controls */}
      <SearchAndFilter
        searchQuery={searchTerm}
        onSearchChange={handleSearch}
        searchPlaceholder="Search meals..."
        filters={[
          {
            key: 'mealType',
            label: 'Meal Type',
            value: mealTypeFilter,
            options: filterOptions,
            onValueChange: handleMealTypeFilter
          }
        ]}
        onClearFilters={handleClearFilters}
        onAdd={handleAddLog}
        addLabel="Log Meal"
        data-testid="search-filter"
      />



      {/* Meals Grid - Ultra compact format */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2" data-testid="meals-list">
        {filteredLogs.map((log) => (
          <div key={log.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2 hover:shadow-sm dark:hover:bg-gray-750 transition-all duration-200">
            {/* Card Header */}
            <div className="flex items-center justify-end mb-1">
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditLog(log)}
                  className="h-3 w-3 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <PencilIcon className="h-1.5 w-1.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteLog(log.id)}
                  className="h-3 w-3 p-0 hover:bg-red-100 dark:hover:bg-red-900"
                >
                  <TrashIcon className="h-1.5 w-1.5" />
                </Button>
              </div>
            </div>

            {/* Card Content */}
            <div className="space-y-1">
              <div>
                <h3 className="font-medium text-xs text-gray-900 dark:text-white truncate">
                  {log.meal_name || `${log.meal_type} meal`}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {format(parseISO(log.meal_date), 'h:mm a')}
                </p>
              </div>

              {/* Nutrition Info Grid */}
              <div className="grid grid-cols-2 gap-1 pt-1 border-t border-gray-100 dark:border-gray-700">
                <div className="text-center">
                  <div className="text-xs font-bold text-orange-600">{log.total_calories}</div>
                  <div className="text-xs text-gray-500">cal</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-red-600">{log.protein_g?.toFixed(0) || 0}</div>
                  <div className="text-xs text-gray-500">p</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-blue-600">{log.carbs_g?.toFixed(0) || 0}</div>
                  <div className="text-xs text-gray-500">c</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-yellow-600">{log.fat_g?.toFixed(0) || 0}</div>
                  <div className="text-xs text-gray-500">f</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>


      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Meal</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this meal? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Multiple Meals</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete {selectedLogs.size} selected meals? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmBulkDelete}>
              Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Smart Meal Logger */}
      <SmartMealLogger
        isOpen={showSmartLogger}
        onClose={() => {
          setShowSmartLogger(false);
          setEditingLog(null);
        }}
        onSuccess={handleLogSuccess}
      />
    </DataViewContainer>
  );
}

export { NutritionLogsViewWithDataComponents };
