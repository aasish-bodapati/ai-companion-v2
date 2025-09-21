'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FireIcon,
  PlusIcon,
  CheckCircleIcon,
  PencilIcon,
  XMarkIcon,
  ClockIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import api from '@/lib/api';

interface RoutineExercise {
  id: string;
  name: string;
  category: string;
  default_weight?: number;
  default_reps?: number;
  default_sets?: number;
  default_duration?: number;
  muscle_groups?: string[];
  equipment_needed?: string[];
}

interface TodayWorkout {
  exercise: RoutineExercise;
  weight: number;
  reps: number;
  sets: number;
  duration?: number;
  completed: boolean;
  notes?: string;
}

interface SmartWorkoutLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: {
    workout_name?: string;
    duration_minutes?: number;
    calories_burned?: number;
    notes?: string;
    exercises?: Array<{
      exercise_name: string;
      sets: number;
      reps: string;
      weight_used?: number;
      notes?: string;
    }>;
  };
}

export function SmartWorkoutLogger({ isOpen, onClose, onSuccess, initialData }: SmartWorkoutLoggerProps) {
  const [todayWorkouts, setTodayWorkouts] = useState<TodayWorkout[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('routine');
  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{weight: number; reps: number; sets: number; notes: string}>({
    weight: 0,
    reps: 0,
    sets: 0,
    notes: ''
  });

  // Manual workout form state
  const [manualWorkoutName, setManualWorkoutName] = useState('');
  const [manualWorkoutNotes, setManualWorkoutNotes] = useState('');
  const [manualExercises, setManualExercises] = useState<Array<{
    id: string;
    exercise_name: string;
    sets: number;
    reps: string;
    weight_used?: number;
    notes?: string;
  }>>([]);
  const [manualDuration, setManualDuration] = useState(0);
  const [manualCalories, setManualCalories] = useState(0);

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  const loadTodayWorkouts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get all routines and find the active one
      const routinesResponse = await api.get('/health/simple-routines/');
      const activeRoutine = routinesResponse.routines?.find((routine: any) => 
        routine.user_progress?.is_active === true
      );
      
      logger.debug('🔍 Active routine:', activeRoutine);
      logger.debug('📅 Current day:', currentDay);
      
      if (!activeRoutine) {
        logger.debug('❌ No active routine found');
        setTodayWorkouts([]);
        return;
      }

      // Fetch detailed routine data with workout schedule
      const detailedRoutine = await api.get(`/health/simple-routines/${activeRoutine.id}`);
      logger.debug('🔍 Detailed routine:', detailedRoutine);

      // Get today's workout schedule - workout_schedule is an array, not an object
      const todaySchedule = detailedRoutine.workout_schedule?.find((day: any) => 
        day.day.toLowerCase() === currentDay
      )?.exercises || [];
      
      logger.debug('🏋️ Today\'s schedule:', todaySchedule);
      
      const workouts: TodayWorkout[] = todaySchedule.map((exercise: any, index: number) => ({
        exercise: {
          id: `exercise_${index}_${Date.now()}`, // Generate unique ID with timestamp
          name: exercise.exercise_name,
          category: 'Strength', // Default category
          default_weight: 0, // No default weight in the data
          default_reps: parseInt(exercise.reps) || 10,
          default_sets: exercise.sets || 3,
          default_duration: 30, // Default duration
          muscle_groups: [], // No muscle groups in current data
          equipment_needed: [] // No equipment info in current data
        },
        weight: 0, // Start with 0, user can edit
        reps: parseInt(exercise.reps) || 10,
        sets: exercise.sets || 3,
        duration: 30, // Default duration
        completed: false,
        notes: exercise.notes || ''
      }));

      setTodayWorkouts(workouts);
    } catch (error) {
      console.error('Failed to load today\'s workouts:', error);
      toast.error('Failed to load your routine');
    } finally {
      setLoading(false);
    }
  }, [currentDay]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Editing mode - populate manual form with initial data
        setManualWorkoutName(initialData.workout_name || '');
        setManualWorkoutNotes(initialData.notes || '');
        setManualDuration(initialData.duration_minutes || 0);
        setManualCalories(initialData.calories_burned || 0);
        setManualExercises(initialData.exercises?.map((ex, index) => ({
          id: `manual-${index}`,
          exercise_name: ex.exercise_name,
          sets: ex.sets,
          reps: ex.reps,
          weight_used: ex.weight_used,
          notes: ex.notes || ''
        })) || []);
        setActiveTab('manual');
      } else {
        // New workout mode - load today's routine
        loadTodayWorkouts();
      }
    }
  }, [isOpen, initialData, loadTodayWorkouts]);

  const updateWorkout = (exerciseId: string, field: string, value: any) => {
    setTodayWorkouts(prev => 
      prev.map(workout => 
        workout.exercise.id === exerciseId 
          ? { ...workout, [field]: value }
          : workout
      )
    );
  };

  const startEditing = (exerciseId: string) => {
    const workout = todayWorkouts.find(w => w.exercise.id === exerciseId);
    if (workout) {
      setEditingExercise(exerciseId);
      setEditValues({
        weight: workout.weight,
        reps: workout.reps,
        sets: workout.sets,
        notes: workout.notes || ''
      });
    }
  };

  const saveEdit = (exerciseId: string) => {
    updateWorkout(exerciseId, 'weight', editValues.weight);
    updateWorkout(exerciseId, 'reps', editValues.reps);
    updateWorkout(exerciseId, 'sets', editValues.sets);
    updateWorkout(exerciseId, 'notes', editValues.notes);
    setEditingExercise(null);
    toast.success('Workout updated!');
  };

  const cancelEdit = () => {
    setEditingExercise(null);
    setEditValues({ weight: 0, reps: 0, sets: 0, notes: '' });
  };

  const toggleCompleted = (exerciseId: string) => {
    updateWorkout(exerciseId, 'completed', !todayWorkouts.find(w => w.exercise.id === exerciseId)?.completed);
  };

  const logWorkouts = async () => {
    try {
      setLoading(true);
      
      const completedWorkouts = todayWorkouts.filter(w => w.completed);
      
      if (completedWorkouts.length === 0) {
        toast.error('Please complete at least one workout');
        return;
      }

      // Log each completed workout
      for (const workout of completedWorkouts) {
        // Only include non-null/non-zero values to avoid validation issues
        const now = new Date();
        const workoutData: any = {
          activity_type: 'weightlifting', // Required field
          activity_name: workout.exercise.name,
          duration_minutes: workout.duration || 30,
          intensity: 'medium',
          notes: workout.notes || `Logged from routine: ${workout.exercise.name}`,
          activity_date: now.toISOString(), // Use current time
          use_smart_defaults: true
        };

        // Only add exercise-specific fields if they have meaningful values
        if (workout.exercise.id && workout.exercise.id !== '' && !workout.exercise.id.includes('undefined')) {
          workoutData.exercise_id = workout.exercise.id;
        }
        if (workout.weight && workout.weight > 0) {
          workoutData.weight_kg = workout.weight;
        }
        if (workout.reps && workout.reps > 0) {
          workoutData.reps = workout.reps;
        }
        if (workout.sets && workout.sets > 0) {
          workoutData.sets = workout.sets;
        }
        
        logger.debug('🏋️ FRONTEND: Sending workout data:', workoutData);
        logger.debug('🏋️ FRONTEND: API endpoint: /health/contextual-logging/workout/smart');
        
        await api.post('/health/contextual-logging/workout/smart', workoutData);
      }

      toast.success(`${completedWorkouts.length} workout${completedWorkouts.length > 1 ? 's' : ''} logged successfully! 🎉`);
      onSuccess?.();
      onClose();
      
    } catch (error) {
      console.error('Failed to log workouts:', error);
      toast.error('Failed to log workouts');
    } finally {
      setLoading(false);
    }
  };

  const completedCount = todayWorkouts.filter(w => w.completed).length;
  const totalCount = todayWorkouts.length;

  // Manual workout functions
  const addManualExercise = () => {
    const newExercise = {
      id: `manual-${Date.now()}`,
      exercise_name: '',
      sets: 1,
      reps: '10',
      weight_used: 0,
      notes: ''
    };
    setManualExercises([...manualExercises, newExercise]);
  };

  const updateManualExercise = (id: string, field: string, value: any) => {
    setManualExercises(prev => 
      prev.map(ex => ex.id === id ? { ...ex, [field]: value } : ex)
    );
  };

  const removeManualExercise = (id: string) => {
    setManualExercises(prev => prev.filter(ex => ex.id !== id));
  };

  const logManualWorkout = async () => {
    if (!manualWorkoutName.trim()) {
      logger.debug('Please enter a workout name');
      return;
    }

    if (manualExercises.length === 0) {
      logger.debug('Please add at least one exercise');
      return;
    }

    try {
      setLoading(true);
      
      const now = new Date();
      await api.post('/health/contextual-logging/workout/smart', {
        activity_type: 'weightlifting',
        activity_name: manualWorkoutName,
        duration_minutes: manualDuration || undefined,
        calories_burned: manualCalories || undefined,
        intensity: 'medium',
        notes: manualWorkoutNotes,
        activity_date: now.toISOString(),
        exercises: manualExercises.map(ex => ({
          exercise_name: ex.exercise_name,
          sets: ex.sets,
          reps: ex.reps,
          weight_used: ex.weight_used || undefined,
          notes: ex.notes || undefined
        })),
        use_smart_defaults: true
      });

      logger.debug('Manual workout logged successfully!');
      onSuccess?.();
    } catch (error) {
      console.error('Failed to log manual workout:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 w-[90vw]">
        <div className="flex flex-col h-full">
          {/* Clean Header */}
          <DialogHeader className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-white">
                Today&apos;s Workout
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400 mt-1">
                {currentDay.charAt(0).toUpperCase() + currentDay.slice(1)} • Track your fitness progress
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8">

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger 
                  value="routine" 
                  className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <ClockIcon className="h-4 w-4" />
                  Routine Workouts
                </TabsTrigger>
                <TabsTrigger 
                  value="manual" 
                  className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <PlusIcon className="h-4 w-4" />
                  Manual Log
                </TabsTrigger>
              </TabsList>

          <TabsContent value="routine" className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FireIcon className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <span className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading your routine...</span>
              </div>
            ) : todayWorkouts.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                    <FireIcon className="h-10 w-10 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    No Workouts Scheduled
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    You don&apos;t have any workouts scheduled for today. Start logging your fitness journey manually.
                  </p>
                  <Button 
                    onClick={() => setActiveTab('manual')} 
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Log Manual Workout
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Clean Progress Header */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Progress</h3>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {completedCount}/{totalCount}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Clean Workout List */}
                <div className="space-y-4">
                  {todayWorkouts.map((workout) => (
                    <Card key={workout.exercise.id} className={`transition-all duration-200 ${
                      workout.completed 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                        : 'hover:shadow-md border-gray-200 dark:border-gray-700'
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => toggleCompleted(workout.exercise.id)}
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                              workout.completed
                                ? 'bg-green-600 border-green-600 text-white'
                                : 'border-gray-300 hover:border-green-500'
                            }`}
                          >
                            {workout.completed && <CheckCircleIcon className="h-4 w-4" />}
                          </button>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className={`text-lg font-semibold ${
                                workout.completed 
                                  ? 'line-through text-gray-500' 
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {workout.exercise.name}
                              </h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditing(workout.exercise.id)}
                                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                              <span><strong>{workout.weight}kg</strong> weight</span>
                              <span><strong>{workout.reps}</strong> reps</span>
                              <span><strong>{workout.sets}</strong> sets</span>
                              {workout.duration && <span><strong>{workout.duration}</strong> min</span>}
                            </div>
                          </div>
                        </div>

                        {/* Edit Form */}
                        {editingExercise === workout.exercise.id && (
                          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <Label htmlFor="weight" className="text-xs">Weight (kg)</Label>
                                <Input
                                  id="weight"
                                  type="number"
                                  value={editValues.weight || ''}
                                  onChange={(e) => setEditValues(prev => ({ 
                                    ...prev, 
                                    weight: parseFloat(e.target.value) || 0 
                                  }))}
                                  placeholder="e.g. 20.5"
                                  className="h-8 placeholder:text-gray-400 placeholder:italic"
                                />
                              </div>
                              <div>
                                <Label htmlFor="reps" className="text-xs">Reps</Label>
                                <Input
                                  id="reps"
                                  type="number"
                                  value={editValues.reps || ''}
                                  onChange={(e) => setEditValues(prev => ({ 
                                    ...prev, 
                                    reps: parseInt(e.target.value) || 0 
                                  }))}
                                  placeholder="e.g. 12"
                                  className="h-8 placeholder:text-gray-400 placeholder:italic"
                                />
                              </div>
                              <div>
                                <Label htmlFor="sets" className="text-xs">Sets</Label>
                                <Input
                                  id="sets"
                                  type="number"
                                  value={editValues.sets || ''}
                                  onChange={(e) => setEditValues(prev => ({ 
                                    ...prev, 
                                    sets: parseInt(e.target.value) || 0 
                                  }))}
                                  placeholder="e.g. 3"
                                  className="h-8 placeholder:text-gray-400 placeholder:italic"
                                />
                              </div>
                              <div className="flex items-end">
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => saveEdit(workout.exercise.id)}>
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3">
                              <Label htmlFor="notes" className="text-xs">Notes (optional)</Label>
                              <Input
                                id="notes"
                                value={editValues.notes}
                                onChange={(e) => setEditValues(prev => ({ 
                                  ...prev, 
                                  notes: e.target.value 
                                }))}
                                placeholder="Add workout notes..."
                                className="mt-1"
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Clean Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={logWorkouts}
                    disabled={completedCount === 0 || loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="log-workouts-button"
                  >
                    {loading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    ) : (
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                    )}
                    Log {completedCount} Workout{completedCount !== 1 ? 's' : ''}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Manual Workout Entry</h3>
                    <p className="text-gray-600 dark:text-gray-400">Create a custom workout log for today</p>
                  </div>

                  {/* Workout Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="manual-workout-name" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                        Workout Name
                      </Label>
                      <Input
                        id="manual-workout-name"
                        value={manualWorkoutName}
                        onChange={(e) => setManualWorkoutName(e.target.value)}
                        placeholder="e.g., Push Day - Chest & Shoulders"
                        className="h-12 text-lg border-2 focus:border-orange-500 dark:focus:border-orange-400"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={addManualExercise} 
                        className="w-full"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Exercise
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="manual-duration">Duration (minutes)</Label>
                      <Input
                        id="manual-duration"
                        type="number"
                        value={manualDuration || ''}
                        onChange={(e) => setManualDuration(parseInt(e.target.value) || 0)}
                        placeholder="e.g., 45"
                      />
                    </div>
                    <div>
                      <Label htmlFor="manual-calories">Calories Burned</Label>
                      <Input
                        id="manual-calories"
                        type="number"
                        value={manualCalories || ''}
                        onChange={(e) => setManualCalories(parseInt(e.target.value) || 0)}
                        placeholder="e.g., 300"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="manual-notes">Workout Notes</Label>
                    <Textarea
                      id="manual-notes"
                      value={manualWorkoutNotes}
                      onChange={(e) => setManualWorkoutNotes(e.target.value)}
                      placeholder="e.g., Felt strong today, focused on form..."
                      rows={2}
                    />
                  </div>

                  {/* Exercises */}
                  {manualExercises.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold">Exercises</h4>
                      {manualExercises.map((exercise, index) => (
                        <div key={exercise.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium">Exercise {index + 1}</h5>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeManualExercise(exercise.id)}
                            >
                              Remove
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label>Exercise Name</Label>
                              <Input
                                value={exercise.exercise_name}
                                onChange={(e) => updateManualExercise(exercise.id, 'exercise_name', e.target.value)}
                                placeholder="e.g., Bench Press"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label>Sets</Label>
                                <Input
                                  type="number"
                                  value={exercise.sets}
                                  onChange={(e) => updateManualExercise(exercise.id, 'sets', parseInt(e.target.value) || 0)}
                                />
                              </div>
                              <div>
                                <Label>Reps</Label>
                                <Input
                                  value={exercise.reps}
                                  onChange={(e) => updateManualExercise(exercise.id, 'reps', e.target.value)}
                                  placeholder="10"
                                />
                              </div>
                              <div>
                                <Label>Weight (kg)</Label>
                                <Input
                                  type="number"
                                  value={exercise.weight_used || ''}
                                  onChange={(e) => updateManualExercise(exercise.id, 'weight_used', parseInt(e.target.value) || 0)}
                                />
                              </div>
                            </div>
                            <div className="md:col-span-2">
                              <Label>Notes (Optional)</Label>
                              <Input
                                value={exercise.notes || ''}
                                onChange={(e) => updateManualExercise(exercise.id, 'notes', e.target.value)}
                                placeholder="e.g., Focus on form"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Clean Log Button */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button 
                      variant="outline" 
                      onClick={onClose}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={logManualWorkout} 
                      disabled={loading || !manualWorkoutName.trim() || manualExercises.length === 0}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {loading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                          Logging...
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Log Workout
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
