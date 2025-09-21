'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  ClockIcon,
  FireIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface RecentItem {
  id: string;
  name: string;
  type: 'food' | 'exercise';
  calories?: number;
  lastUsed: string;
}

interface SmartSuggestion {
  id: string;
  name: string;
  type: 'food' | 'exercise';
  reason: string;
  calories?: number;
}

export default function QuickAddModal({ isOpen, onClose, onSuccess }: QuickAddModalProps) {
  const [currentStep, setCurrentStep] = useState<'select' | 'food' | 'exercise'>('select');
  const [activeTab, setActiveTab] = useState<'food' | 'exercise'>('food');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadRecentItems = useCallback(async () => {
    try {
      setIsLoading(true);
      // Mock data for now - replace with actual API calls
      const mockRecentItems: RecentItem[] = [
        { id: '1', name: 'Banana', type: 'food', calories: 89, lastUsed: '2 hours ago' },
        { id: '2', name: 'Push-ups', type: 'exercise', calories: 50, lastUsed: '1 day ago' },
        { id: '3', name: 'Chicken Breast', type: 'food', calories: 165, lastUsed: '2 days ago' },
        { id: '4', name: 'Running', type: 'exercise', calories: 300, lastUsed: '3 days ago' },
      ];
      setRecentItems(mockRecentItems.filter(item => item.type === activeTab));
    } catch (error) {
      console.error('Failed to load recent items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  const loadSmartSuggestions = useCallback(async () => {
    try {
      const currentHour = new Date().getHours();
      let suggestions: SmartSuggestion[] = [];

      if (activeTab === 'food') {
        if (currentHour >= 6 && currentHour < 10) {
          suggestions = [
            { id: 's1', name: 'Oatmeal', type: 'food', reason: 'Perfect for breakfast', calories: 150 },
            { id: 's2', name: 'Greek Yogurt', type: 'food', reason: 'High protein breakfast', calories: 100 },
          ];
        } else if (currentHour >= 12 && currentHour < 14) {
          suggestions = [
            { id: 's3', name: 'Grilled Chicken Salad', type: 'food', reason: 'Great lunch option', calories: 250 },
            { id: 's4', name: 'Quinoa Bowl', type: 'food', reason: 'Nutritious lunch', calories: 300 },
          ];
        } else if (currentHour >= 18 && currentHour < 20) {
          suggestions = [
            { id: 's5', name: 'Salmon', type: 'food', reason: 'Perfect for dinner', calories: 200 },
            { id: 's6', name: 'Sweet Potato', type: 'food', reason: 'Healthy dinner side', calories: 120 },
          ];
        }
      } else {
        suggestions = [
          { id: 'e1', name: 'Morning Walk', type: 'exercise', reason: 'Great way to start the day', calories: 100 },
          { id: 'e2', name: 'Push-ups', type: 'exercise', reason: 'Quick strength workout', calories: 50 },
          { id: 'e3', name: 'Yoga', type: 'exercise', reason: 'Perfect for relaxation', calories: 80 },
        ];
      }

      setSmartSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to load smart suggestions:', error);
    }
  }, [activeTab]);

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('select');
      setSearchQuery('');
    }
  }, [isOpen]);

  // Load recent items and smart suggestions when step changes
  useEffect(() => {
    if (currentStep !== 'select') {
      loadRecentItems();
      loadSmartSuggestions();
    }
  }, [currentStep, loadRecentItems, loadSmartSuggestions]);

  const handleQuickAdd = async (item: RecentItem | SmartSuggestion) => {
    try {
      setIsLoading(true);
      
      if (item.type === 'food') {
        // Quick add food - use existing nutrition logging
        const foodData = {
          meal_type: getMealTypeByHour(),
          meal_name: item.name,
          total_calories: item.calories || 0,
          food_items: [{ name: item.name, quantity_grams: 100, calories: item.calories || 0 }]
        };
        
        await api.post('/health/nutrition-logs/', foodData);
      } else {
        // Quick add exercise - use existing fitness logging
        const exerciseData = {
          activity_type: 'exercise',
          activity_name: item.name,
          duration_minutes: 30, // Default duration
          calories_burned: item.calories || 0
        };
        
        await api.post('/health/fitness-logs/', exerciseData);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to quick add item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMealTypeByHour = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 10) return 'breakfast';
    if (hour >= 12 && hour < 14) return 'lunch';
    if (hour >= 18 && hour < 20) return 'dinner';
    return 'snack';
  };

  const handleSearch = async (query: string) => {
    if (query.length < 2) return;
    
    try {
      setIsLoading(true);
      // TODO: Implement actual search API calls
      console.log('Searching for:', query, 'type:', activeTab);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeSelection = (type: 'food' | 'exercise') => {
    setActiveTab(type);
    setCurrentStep(type);
  };

  const handleBackToSelection = () => {
    setCurrentStep('select');
    setSearchQuery('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            Quick Add
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {currentStep === 'select' ? (
            // Selection Screen
            <div className="space-y-4">
              <p className="text-center text-gray-600 dark:text-gray-400">
                What would you like to log?
              </p>
              
              <div className="grid grid-cols-1 gap-3">
                <motion.button
                  onClick={() => handleTypeSelection('food')}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <FireIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Food & Nutrition</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Log meals and track calories</p>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => handleTypeSelection('exercise')}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <ChartBarIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Fitness & Workout</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Log exercises and track progress</p>
                  </div>
                </motion.button>
              </div>
            </div>
          ) : (
            // Food or Exercise Logging Screen
            <>
              {/* Back Button */}
              <button
                onClick={handleBackToSelection}
                className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="h-4 w-4 rotate-45" />
                Back to selection
              </button>

              {/* Tab Selector */}
              <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('food')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'food'
                      ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <FireIcon className="h-4 w-4" />
                  Food
                </button>
                <button
                  onClick={() => setActiveTab('exercise')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'exercise'
                      ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <ChartBarIcon className="h-4 w-4" />
                  Exercise
                </button>
              </div>
            </>
          )}

          {currentStep !== 'select' && (
            <>

          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={`Search ${activeTab === 'food' ? 'foods' : 'exercises'}...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="pl-10"
            />
          </div>

          {/* Smart Suggestions */}
          {smartSuggestions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Smart Suggestions
              </h3>
              <div className="space-y-1">
                {smartSuggestions.map((suggestion) => (
                  <motion.button
                    key={suggestion.id}
                    onClick={() => handleQuickAdd(suggestion)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {suggestion.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {suggestion.reason}
                        </p>
                      </div>
                      {suggestion.calories && (
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.calories} cal
                        </Badge>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Items */}
          {recentItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Recent {activeTab === 'food' ? 'Foods' : 'Exercises'}
              </h3>
              <div className="space-y-1">
                {recentItems.map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => handleQuickAdd(item)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {item.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.lastUsed}
                        </p>
                      </div>
                      {item.calories && (
                        <Badge variant="secondary" className="text-xs">
                          {item.calories} cal
                        </Badge>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            </div>
          )}

              {/* Empty State */}
              {!isLoading && smartSuggestions.length === 0 && recentItems.length === 0 && (
                <div className="text-center py-8">
                  <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No {activeTab === 'food' ? 'foods' : 'exercises'} found
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
