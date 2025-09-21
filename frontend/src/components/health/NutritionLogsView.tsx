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
import { CalendarIcon, ClockIcon, FireIcon, HeartIcon, ChartBarIcon, ChevronLeftIcon, ChevronRightIcon, PencilIcon, TrashIcon, PlusIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { useSuccessToast, useErrorToast, useWarningToast } from '@/components/ui/toast';
import { AnimatedButton, AnimatedCard, AnimatedCounter } from '@/components/ui/micro-interactions';
import { LoadingOverlay, StatsCardSkeleton } from '@/components/ui/loading-states';
import { ErrorBoundary } from '@/components/ui/error-boundary';
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
  isActive?: boolean; // Add prop to know when tab is active
}

function NutritionLogsView({ className = '', refreshTrigger, isActive = true }: NutritionLogsViewProps) {
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
      const response = await api.get('/health/nutrition-logs/', {
        params: {
          period: period,
          page: currentPage,
          size: pageSize,
          meal_type: mealTypeFilter !== 'all' ? mealTypeFilter : undefined
        }
      });
      
      // The new API returns structured data with logs, stats, and pagination
      const logsData = response.logs || [];
      const statsData = response.stats || {};
      const paginationData = response.pagination || {};
      
      setLogs(logsData);
      setStats(statsData);
      setTotalPages(paginationData.totalPages || 1);
      setTotalLogs(paginationData.total || 0);
    } catch (error) {
      console.error('Failed to load nutrition logs:', error);
      errorToast('Failed to load nutrition logs', 'Please try again later');
    } finally {
      setLoading(false);
    }
  }, [errorToast, period, currentPage, pageSize, mealTypeFilter]);

  useEffect(() => {
    loadLogs();
  }, [refreshTrigger, loadLogs]);

  // Refresh when tab becomes active
  useEffect(() => {
    if (isActive) {
      loadLogs();
    }
  }, [isActive, loadLogs]);

  // Filter logs based on search and filters
  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.meal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMealType = mealTypeFilter === 'all' || log.meal_type === mealTypeFilter;
    
    try {
      const logDate = parseISO(log.meal_date);
      // Convert both dates to local date strings for comparison
      const logDateString = logDate.toLocaleDateString();
      const selectedDateString = selectedDate.toLocaleDateString();
      const matchesDate = logDateString === selectedDateString;
      
      
      return matchesSearch && matchesMealType && matchesDate;
    } catch (error) {
      console.error('❌ Date parsing error:', error, 'for meal_date:', log.meal_date);
      // Fallback: if date parsing fails, include the log anyway
      return matchesSearch && matchesMealType;
    }
  });

  // Use stats from API instead of calculating locally
  const dailyTotals = {
    calories: stats.totalCalories,
    protein: stats.totalProtein,
    carbs: stats.totalCarbs,
    fat: stats.totalFat,
    fiber: stats.totalFiber,
    sugar: stats.totalSugar,
    sodium: stats.totalSodium
  };

  // Handle log deletion
  const handleDeleteLog = async (logId: string) => {
    try {
      await api.delete(`/health/nutrition-logs/${logId}`);
      setLogs(prev => prev.filter(log => log.id !== logId));
      successToast('Meal deleted', 'The meal has been removed from your logs');
    } catch (error) {
      console.error('Failed to delete nutrition log:', error);
      errorToast('Failed to delete meal', 'Please try again');
    }
  };

  // Handle bulk delete
  const confirmBulkDelete = async () => {
    try {
      const deletePromises = Array.from(selectedLogs).map(logId => 
        api.delete(`/health/nutrition-logs/${logId}`)
      );
      await Promise.all(deletePromises);
      
      setLogs(prev => prev.filter(log => !selectedLogs.has(log.id)));
      setSelectedLogs(new Set());
      setShowBulkDeleteDialog(false);
      successToast('Meals deleted', `${selectedLogs.size} meals have been removed`);
    } catch (error) {
      console.error('Failed to delete nutrition logs:', error);
      errorToast('Failed to delete meals', 'Please try again');
    }
  };

  // Handle log update
  const handleUpdateLog = async (updatedLog: Partial<NutritionLog>) => {
    if (!editingLog) return;
    
    try {
      const response = await api.put(`/health/nutrition-logs/${editingLog.id}`, updatedLog);
      setLogs(prev => prev.map(log => log.id === editingLog.id ? response : log));
      setEditingLog(null);
      successToast('Meal updated', 'Your meal has been updated successfully');
    } catch (error) {
      console.error('Failed to update nutrition log:', error);
      errorToast('Failed to update meal', 'Please try again');
    }
  };

  // Handle log addition
  const handleAddLog = () => {
    setShowSmartLogger(true);
  };

  // Toggle log selection
  const toggleLogSelection = (logId: string) => {
    const newSelection = new Set(selectedLogs);
    if (newSelection.has(logId)) {
      newSelection.delete(logId);
    } else {
      newSelection.add(logId);
    }
    setSelectedLogs(newSelection);
  };

  // Get meal type color
  const getMealTypeColor = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'lunch': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'dinner': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'snack': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'h:mm a');
    } catch {
      return 'Unknown time';
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Meals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`space-y-6 ${className}`}>
        {/* Comprehensive Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatedCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Meals</p>
                <AnimatedCounter 
                  value={stats.totalMeals} 
                  className="text-2xl font-bold text-green-600 dark:text-green-400"
                />
                <p className="text-xs text-gray-500">meals logged</p>
              </div>
              <HeartIcon className="h-8 w-8 text-green-500" />
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Calories</p>
                <AnimatedCounter 
                  value={Math.round(stats.totalCalories)} 
                  className="text-2xl font-bold text-orange-600 dark:text-orange-400"
                />
                <p className="text-xs text-gray-500">calories</p>
              </div>
              <FireIcon className="h-8 w-8 text-orange-500" />
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg per Meal</p>
                <AnimatedCounter 
                  value={Math.round(stats.avgCaloriesPerMeal)} 
                  className="text-2xl font-bold text-blue-600 dark:text-blue-400"
                />
                <p className="text-xs text-gray-500">calories/meal</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-blue-500" />
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Streak</p>
                <AnimatedCounter 
                  value={stats.currentStreak} 
                  className="text-2xl font-bold text-purple-600 dark:text-purple-400"
                />
                <p className="text-xs text-gray-500">days</p>
              </div>
              <TrophyIcon className="h-8 w-8 text-purple-500" />
            </div>
          </AnimatedCard>
        </div>

        {/* Macro Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AnimatedCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Protein</p>
                <AnimatedCounter 
                  value={Math.round(stats.totalProtein)} 
                  className="text-2xl font-bold text-red-600 dark:text-red-400"
                />
                <p className="text-xs text-gray-500">grams</p>
              </div>
              <HeartIcon className="h-8 w-8 text-red-500" />
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Carbs</p>
                <AnimatedCounter 
                  value={Math.round(stats.totalCarbs)} 
                  className="text-2xl font-bold text-blue-600 dark:text-blue-400"
                />
                <p className="text-xs text-gray-500">grams</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-blue-500" />
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fat</p>
                <AnimatedCounter 
                  value={Math.round(stats.totalFat)} 
                  className="text-2xl font-bold text-yellow-600 dark:text-yellow-400"
                />
                <p className="text-xs text-gray-500">grams</p>
              </div>
              <TrophyIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </AnimatedCard>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Today&apos;s Meals</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2">
                <AnimatedButton
                  onClick={handleAddLog}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Log Meal
                </AnimatedButton>
                
                {selectedLogs.size > 0 && (
                  <AnimatedButton
                    onClick={() => setShowBulkDeleteDialog(true)}
                    variant="destructive"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete ({selectedLogs.size})
                  </AnimatedButton>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* Date Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">
                    {format(selectedDate, 'MMM d, yyyy')}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>

              {/* Search */}
              <Input
                placeholder="Search meals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />

              {/* Meal Type Filter */}
              <Select value={mealTypeFilter} onValueChange={setMealTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Meal Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Meals</SelectItem>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>

              {/* Period Filter */}
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalLogs)} of {totalLogs} meals
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}


            {/* Meals List */}
            <div className="space-y-4">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No meals logged
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {searchTerm || mealTypeFilter !== 'all' 
                      ? 'No meals match your current filters'
                      : 'Start logging your meals to track your nutrition'
                    }
                  </p>
                  <AnimatedButton
                    onClick={handleAddLog}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Log Your First Meal
                  </AnimatedButton>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <AnimatedCard key={log.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedLogs.has(log.id)}
                          onChange={() => toggleLogSelection(log.id)}
                          className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={getMealTypeColor(log.meal_type)}>
                              {log.meal_type.charAt(0).toUpperCase() + log.meal_type.slice(1)}
                            </Badge>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatTime(log.meal_date)}
                            </span>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {log.meal_name || `${log.meal_type.charAt(0).toUpperCase() + log.meal_type.slice(1)}`}
                          </h3>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Calories:</span>
                              <span className="ml-1 font-medium text-orange-600 dark:text-orange-400">
                                {log.total_calories}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Protein:</span>
                              <span className="ml-1 font-medium text-red-600 dark:text-red-400">
                                {Math.round(log.protein_g || 0)}g
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Carbs:</span>
                              <span className="ml-1 font-medium text-blue-600 dark:text-blue-400">
                                {Math.round(log.carbs_g || 0)}g
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Fat:</span>
                              <span className="ml-1 font-medium text-yellow-600 dark:text-yellow-400">
                                {Math.round(log.fat_g || 0)}g
                              </span>
                            </div>
                          </div>
                          
                          {log.notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                              {log.notes}
                            </p>
                          )}
                          
                          {log.food_items && log.food_items.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Food items:</p>
                              <div className="flex flex-wrap gap-1">
                                {log.food_items.map((item, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {item.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingLog(log)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setLogToDelete(log.id);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </AnimatedCard>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Smart Meal Logger Modal */}
        <SmartMealLogger
          isOpen={showSmartLogger}
          onClose={() => setShowSmartLogger(false)}
          onSuccess={() => {
            loadLogs();
            setShowSmartLogger(false);
          }}
        />

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
              <Button
                variant="destructive"
                onClick={() => {
                  if (logToDelete) {
                    handleDeleteLog(logToDelete);
                    setShowDeleteDialog(false);
                    setLogToDelete(null);
                  }
                }}
              >
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
            <p>
              Are you sure you want to delete {selectedLogs.size} selected meals? 
              This action cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkDeleteDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmBulkDelete}
              >
                Delete {selectedLogs.size} Meals
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
}

export default NutritionLogsView;
