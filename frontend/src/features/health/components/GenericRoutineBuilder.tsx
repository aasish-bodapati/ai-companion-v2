'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

// Generic interfaces
interface DayItems<T> {
  day: string;
  items: T[];
}

interface RoutineBuilderConfig<T, S> {
  routineType: 'fitness' | 'nutrition';
  itemType: string; // 'workouts' or 'meals'
  subItemType: string; // 'exercises' or 'food_items'
  itemTypeOptions: string[]; // ['strength', 'cardio'] or ['breakfast', 'lunch', 'dinner', 'snack']
  defaultItemName: string; // 'New Workout' or 'New Meal'
  defaultSubItemName: string; // 'New Exercise' or 'New Food'
  
  // API functions
  createRoutine: (data: any) => Promise<any>;
  
  // Item creation functions
  createItem: (itemType: string) => T;
  createSubItem: () => S;
  
  // Item update functions
  updateItem: (item: T, updates: Partial<T>) => T;
  updateSubItem: (subItem: S, updates: Partial<S>) => S;
  
  // Validation
  validateItem: (item: T) => boolean;
  validateSubItem: (subItem: S) => boolean;
  
  // Rendering
  renderItemForm: (item: T, onUpdate: (updates: Partial<T>) => void) => React.ReactNode;
  renderSubItemForm: (subItem: S, onUpdate: (updates: Partial<S>) => void) => React.ReactNode;
}

interface GenericRoutineBuilderProps<T, S> {
  config: RoutineBuilderConfig<T, S>;
  onRoutineCreated?: (routine: any) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function GenericRoutineBuilder<T, S>({ 
  config, 
  onRoutineCreated 
}: GenericRoutineBuilderProps<T, S>) {
  const [isOpen, setIsOpen] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [targetCalories, setTargetCalories] = useState(2000);
  const [dayItems, setDayItems] = useState<DayItems<T>[]>([]);
  const [loading, setLoading] = useState(false);

  const addDayItems = (day: string) => {
    const newDayItems: DayItems<T> = {
      day: day,
      items: []
    };
    setDayItems(prev => [...prev, newDayItems]);
  };

  const removeDayItems = (day: string) => {
    setDayItems(prev => prev.filter(dayItem => dayItem.day !== day));
  };

  const addItem = (day: string) => {
    const newItem = config.createItem(config.itemTypeOptions[0]);
    setDayItems(prev => prev.map(dayItem => 
      dayItem.day === day 
        ? { ...dayItem, items: [...dayItem.items, newItem] }
        : dayItem
    ));
  };

  const removeItem = (day: string, itemId: string) => {
    setDayItems(prev => prev.map(dayItem => 
      dayItem.day === day 
        ? { ...dayItem, items: dayItem.items.filter((item: any) => item.id !== itemId) }
        : dayItem
    ));
  };

  const updateItem = (day: string, itemId: string, updates: Partial<T>) => {
    setDayItems(prev => prev.map(dayItem => 
      dayItem.day === day 
        ? { 
            ...dayItem, 
            items: dayItem.items.map((item: any) => 
              item.id === itemId ? config.updateItem(item, updates) : item
            )
          }
        : dayItem
    ));
  };

  const addSubItem = (day: string, itemId: string) => {
    const newSubItem = config.createSubItem();
    setDayItems(prev => prev.map(dayItem => 
      dayItem.day === day 
        ? { 
            ...dayItem, 
            items: dayItem.items.map((item: any) => 
              item.id === itemId 
                ? { ...item, [config.subItemType]: [...(item[config.subItemType] || []), newSubItem] }
                : item
            )
          }
        : dayItem
    ));
  };

  const removeSubItem = (day: string, itemId: string, subItemId: string) => {
    setDayItems(prev => prev.map(dayItem => 
      dayItem.day === day 
        ? { 
            ...dayItem, 
            items: dayItem.items.map((item: any) => 
              item.id === itemId 
                ? { 
                    ...item, 
                    [config.subItemType]: (item[config.subItemType] || []).filter((subItem: any) => subItem.id !== subItemId)
                  }
                : item
            )
          }
        : dayItem
    ));
  };

  const updateSubItem = (day: string, itemId: string, subItemId: string, updates: Partial<S>) => {
    setDayItems(prev => prev.map(dayItem => 
      dayItem.day === day 
        ? { 
            ...dayItem, 
            items: dayItem.items.map((item: any) => 
              item.id === itemId 
                ? { 
                    ...item, 
                    [config.subItemType]: (item[config.subItemType] || []).map((subItem: any) => 
                      subItem.id === subItemId ? config.updateSubItem(subItem, updates) : subItem
                    )
                  }
                : item
            )
          }
        : dayItem
    ));
  };

  const saveRoutine = async () => {
    if (!routineName.trim()) {
      toast.error('Please enter a routine name');
      return;
    }

    if (dayItems.length === 0) {
      toast.error('Please add at least one day');
      return;
    }

    // Validate all items
    const allItems = dayItems.flatMap(day => day.items);
    const invalidItems = allItems.filter(item => !config.validateItem(item));
    if (invalidItems.length > 0) {
      toast.error(`Please complete all ${config.itemType} information`);
      return;
    }

    try {
      setLoading(true);
      
      const routineData = {
        name: routineName,
        description: routineDescription || `Custom ${config.routineType} routine with ${dayItems.length} day plans`,
        difficulty,
        duration_weeks: durationWeeks,
        target_calories: targetCalories
      };

      const itemsData = dayItems.map(dayItem => ({
        day_name: dayItem.day.toLowerCase(),
        day_order: DAYS.indexOf(dayItem.day),
        plan_name: `${dayItem.day} Plan`,
        description: `${config.routineType} plan for ${dayItem.day}`,
        daily_calories: targetCalories,
        [config.itemType]: dayItem.items.map((item: any, index: number) => ({
          ...item,
          order_index: index
        }))
      }));

      logger.debug(`Creating ${config.routineType} routine:`, routineData);
      logger.debug('Items data:', itemsData);
      
      const savedRoutine = await config.createRoutine({
        routine_data: routineData,
        [config.itemType === 'workouts' ? 'workout_days' : 'meal_plans']: itemsData
      });
      
      logger.info(`${config.routineType} routine created successfully:`, savedRoutine);
      toast.success(`${config.routineType} routine "${routineName}" created successfully!`);
      
      // Reset form
      setRoutineName('');
      setRoutineDescription('');
      setDifficulty('beginner');
      setDurationWeeks(4);
      setTargetCalories(2000);
      setDayItems([]);
      setIsOpen(false);
      
      onRoutineCreated?.(savedRoutine);
      
    } catch (error) {
      console.error(`Failed to create ${config.routineType} routine:`, error);
      toast.error(`Failed to create ${config.routineType} routine. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Custom Routine
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden p-0 bg-white dark:bg-gray-900 border-0 shadow-2xl flex flex-col">
        <div className="flex flex-col h-full min-h-0">
          <DialogHeader className="p-6 border-b border-gray-200 dark:border-gray-700">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Create Custom {config.routineType.charAt(0).toUpperCase() + config.routineType.slice(1)} Routine
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Design your personalized {config.routineType} plan with detailed {config.itemType} and {config.subItemType}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="routineName">Routine Name *</Label>
                  <Input
                    id="routineName"
                    value={routineName}
                    onChange={(e) => setRoutineName(e.target.value)}
                    placeholder={`e.g., My Custom ${config.routineType.charAt(0).toUpperCase() + config.routineType.slice(1)} Plan`}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={difficulty} onValueChange={(value: any) => setDifficulty(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="durationWeeks">Duration (weeks)</Label>
                  <Input
                    id="durationWeeks"
                    type="number"
                    value={durationWeeks}
                    onChange={(e) => setDurationWeeks(parseInt(e.target.value) || 4)}
                    min="1"
                    max="52"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="targetCalories">Target Calories (per day)</Label>
                  <Input
                    id="targetCalories"
                    type="number"
                    value={targetCalories}
                    onChange={(e) => setTargetCalories(parseInt(e.target.value) || 2000)}
                    min="500"
                    max="10000"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="routineDescription">Description</Label>
                <Textarea
                  id="routineDescription"
                  value={routineDescription}
                  onChange={(e) => setRoutineDescription(e.target.value)}
                  placeholder={`Describe your ${config.routineType} routine...`}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>

            {/* Day Plans */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Day Plans</h3>
                <Select onValueChange={addDayItems}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Add Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map(day => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {dayItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No days added yet. Select a day to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {dayItems.map((dayItem) => (
                    <div key={dayItem.day} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-gray-900 dark:text-white">{dayItem.day}</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeDayItems(dayItem.day)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Items */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h5 className="font-medium text-gray-700 dark:text-gray-300">
                            {config.itemType.charAt(0).toUpperCase() + config.itemType.slice(1)}
                          </h5>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addItem(dayItem.day)}
                          >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            Add {config.itemType.charAt(0).toUpperCase() + config.itemType.slice(1, -1)}
                          </Button>
                        </div>

                        {dayItem.items.map((item: any) => (
                          <div key={item.id} className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-600 p-3">
                            <div className="flex justify-between items-center mb-2">
                              <h6 className="font-medium text-gray-600 dark:text-gray-400">
                                {item[`${config.itemType.slice(0, -1)}_name`] || config.defaultItemName}
                              </h6>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeItem(dayItem.day, item.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <TrashIcon className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Item Form */}
                            {config.renderItemForm(item, (updates) => updateItem(dayItem.day, item.id, updates))}

                            {/* Sub Items */}
                            <div className="space-y-2 mt-4">
                              <div className="flex justify-between items-center">
                                <Label className="text-xs text-gray-500">
                                  {config.subItemType.charAt(0).toUpperCase() + config.subItemType.slice(1).replace('_', ' ')}
                                </Label>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => addSubItem(dayItem.day, item.id)}
                                  className="h-6 text-xs"
                                >
                                  <PlusIcon className="h-3 w-3 mr-1" />
                                  Add {config.subItemType.slice(0, -1).replace('_', ' ')}
                                </Button>
                              </div>

                              {(item[config.subItemType] || []).map((subItem: any) => (
                                <div key={subItem.id} className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                      {subItem[`${config.subItemType.slice(0, -1).replace('_', '_')}_name`] || config.defaultSubItemName}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => removeSubItem(dayItem.day, item.id, subItem.id)}
                                      className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
                                    >
                                      <TrashIcon className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  {config.renderSubItemForm(subItem, (updates) => updateSubItem(dayItem.day, item.id, subItem.id, updates))}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex gap-4">
              <Button
                onClick={saveRoutine}
                disabled={loading || !routineName.trim() || dayItems.length === 0}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </div>
                ) : (
                  `Create ${config.routineType.charAt(0).toUpperCase() + config.routineType.slice(1)} Routine`
                )}
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
