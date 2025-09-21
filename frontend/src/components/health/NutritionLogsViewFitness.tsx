'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  meal_date: string;
  notes?: string;
  food_items?: any[];
  created_at: string;
  updated_at: string;
}

interface NutritionLogsViewProps {
  className?: string;
  refreshTrigger?: number;
  isActive?: boolean;
}

function NutritionLogsView({ className = '', refreshTrigger, isActive = true }: NutritionLogsViewProps) {
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [mealTypeFilter, setMealTypeFilter] = useState('all');
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [editingLog, setEditingLog] = useState<NutritionLog | null>(null);
  const [showSmartLogger, setShowSmartLogger] = useState(false);

  // Toast notifications
  const successToast = useSuccessToast();
  const errorToast = useErrorToast();
  const warningToast = useWarningToast();

  // Load nutrition logs
  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/health/logging/nutrition');
      
      // The API is returning the data directly as an array, not wrapped in a response object
      const logsData = Array.isArray(response) ? response : (response.data || []);
      setLogs(logsData || []);
    } catch (error) {
      console.error('Failed to load nutrition logs:', error);
      errorToast('Failed to load nutrition logs', 'Please try again later');
    } finally {
      setLoading(false);
    }
  }, [errorToast]);

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
      // Handle both ISO string format and YYYY-MM-DD format
      let logDate: Date;
      if (log.meal_date.includes('T')) {
        // ISO string format
        logDate = parseISO(log.meal_date);
      } else {
        // YYYY-MM-DD format
        logDate = new Date(log.meal_date + 'T00:00:00');
      }
      
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

  // Calculate daily totals
  const dailyTotals = filteredLogs.reduce((totals, log) => ({
    calories: totals.calories + log.total_calories,
    protein: totals.protein + (log.protein_g || 0),
    carbs: totals.carbs + (log.carbs_g || 0),
    fat: totals.fat + (log.fat_g || 0),
    fiber: totals.fiber + (log.fiber_g || 0),
    sugar: totals.sugar + (log.sugar_g || 0),
    sodium: totals.sodium + (log.sodium_mg || 0)
  }), {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  });

  // Handle log deletion
  const handleDeleteLog = async (logId: string) => {
    try {
      await api.delete(`/health/logging/nutrition/${logId}`);
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
        api.delete(`/health/logging/nutrition/${logId}`)
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
      const response = await api.put(`/health/logging/nutrition/${editingLog.id}`, updatedLog);
      setLogs(prev => prev.map(log => log.id === editingLog.id ? response.data : log));
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

  // Handle smart logger success
  const handleSmartLoggerSuccess = () => {
    setShowSmartLogger(false);
    loadLogs();
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`min-h-screen bg-gray-900 ${className}`}>
        {/* Header with Date Navigation */}
        <div className="flex items-center justify-between mb-6 px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(prev => subDays(prev, 1))}
              className="flex items-center space-x-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span>Prev</span>
            </Button>
            
            <div className="text-center">
              <h2 className="text-lg font-semibold text-white">
                {format(selectedDate, 'MMM dd, yyyy')}
              </h2>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(prev => addDays(prev, 1))}
              className="flex items-center space-x-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <span>Next</span>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
              className="ml-2 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Today
            </Button>
          </div>

          {/* Summary Stats */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">{filteredLogs.length}</span>
              </div>
              <span className="text-gray-400 text-sm">meals</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-4 w-4 text-gray-400" />
              <span className="text-gray-400 text-sm">{Math.round(dailyTotals.calories)} cal</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <ChartBarIcon className="h-4 w-4 text-gray-400" />
              <span className="text-gray-400 text-sm">{Math.round(dailyTotals.protein)}g</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 mb-8"></div>

        {/* Main Content */}
        <div className="px-6">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <TrophyIcon className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Meals This Day
              </h3>
              <p className="text-gray-400 text-center mb-6">
                No meals logged for {format(selectedDate, 'MMMM dd, yyyy')}
              </p>
              <Button
                onClick={handleAddLog}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Log Your First Meal
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div key={log.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedLogs.has(log.id)}
                        onChange={() => toggleLogSelection(log.id)}
                        className="h-4 w-4 text-green-600 rounded border-gray-600 bg-gray-700"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge 
                            variant="secondary" 
                            className="text-xs bg-gray-700 text-gray-300 border-gray-600"
                          >
                            {log.meal_type}
                          </Badge>
                          <h4 className="font-medium text-white">
                            {log.meal_name || `${log.meal_type} meal`}
                          </h4>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="flex items-center">
                            <FireIcon className="h-4 w-4 mr-1" />
                            {Math.round(log.total_calories)} cal
                          </span>
                          <span className="flex items-center">
                            <HeartIcon className="h-4 w-4 mr-1" />
                            {Math.round(log.protein_g || 0)}g protein
                          </span>
                          <span className="flex items-center">
                            <ChartBarIcon className="h-4 w-4 mr-1" />
                            {Math.round(log.carbs_g || 0)}g carbs
                          </span>
                          <span className="flex items-center">
                            <TrophyIcon className="h-4 w-4 mr-1" />
                            {Math.round(log.fat_g || 0)}g fat
                          </span>
                        </div>
                        {log.notes && (
                          <p className="text-sm text-gray-500 mt-2">
                            {log.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingLog(log)}
                        className="text-gray-400 hover:text-white hover:bg-gray-700"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLog(log.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-gray-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Smart Meal Logger Modal */}
        {showSmartLogger && (
          <SmartMealLogger
            isOpen={showSmartLogger}
            onClose={() => setShowSmartLogger(false)}
            onSuccess={handleSmartLoggerSuccess}
          />
        )}

        {/* Bulk Delete Dialog */}
        <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Selected Meals</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete {selectedLogs.size} selected meals? This action cannot be undone.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmBulkDelete}>
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
