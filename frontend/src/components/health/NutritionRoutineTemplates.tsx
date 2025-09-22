'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { nutritionRoutineApi, NutritionRoutine, NutritionUserRoutineProgress } from '@/lib/nutritionRoutineApi';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { 
  PlusIcon, 
  PlayIcon, 
  PauseIcon, 
  PencilIcon, 
  TrashIcon,
  FireIcon,
  CalendarIcon,
  ClockIcon,
  ChartBarIcon,
  BoltIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { UnifiedRoutineWizard } from './UnifiedRoutineWizard';

interface NutritionRoutineTemplatesProps {
  onRoutineSelected?: () => void;
}

export function NutritionRoutineTemplates({ onRoutineSelected }: NutritionRoutineTemplatesProps) {
  const { isAuthenticated } = useAuth();
  const [routines, setRoutines] = useState<NutritionRoutine[]>([]);
  const [activeProgress, setActiveProgress] = useState<NutritionUserRoutineProgress | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const loadRoutines = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load routines from database via API
      const [routinesData, progressData] = await Promise.all([
        nutritionRoutineApi.getRoutines(true), // Only user-created routines
        nutritionRoutineApi.getActiveRoutine()
      ]);
      
      setRoutines(routinesData);
      setActiveProgress(progressData);
      
      logger.debug('Loaded nutrition routines:', routinesData);
      logger.debug('Active progress:', progressData);
      
    } catch (error) {
      console.error('Failed to load nutrition routines:', error);
      toast.error('Failed to load nutrition routines');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadRoutines();
  }, [loadRoutines]);

  const handleStartRoutine = async (routineId: string) => {
    try {
      setActionLoading(routineId);
      await nutritionRoutineApi.startRoutine(routineId);
      toast.success('Nutrition routine set as active successfully!');
      loadRoutines();
      onRoutineSelected?.();
    } catch (error) {
      console.error('Failed to start routine:', error);
      toast.error('Failed to set routine as active');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStopRoutine = async (routineId: string) => {
    try {
      setActionLoading(routineId);
      await nutritionRoutineApi.stopRoutine(routineId);
      toast.success('Nutrition routine set as inactive successfully!');
      loadRoutines();
    } catch (error) {
      console.error('Failed to stop routine:', error);
      toast.error('Failed to set routine as inactive');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoutineCreated = (routine: NutritionRoutine) => {
    logger.info('Nutrition routine created:', routine);
    loadRoutines();
    onRoutineSelected?.();
  };

  const handleDeleteRoutine = async (routineId: string) => {
    if (!confirm('Are you sure you want to delete this nutrition routine?')) {
      return;
    }

    try {
      setActionLoading(routineId);
      await nutritionRoutineApi.deleteRoutine(routineId);
      toast.success('Nutrition routine deleted successfully!');
      loadRoutines();
    } catch (error) {
      console.error('Failed to delete routine:', error);
      toast.error('Failed to delete routine');
    } finally {
      setActionLoading(null);
    }
  };


  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-100';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-100';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-100';
    }
  };

  const isRoutineActive = (routineId: string) => {
    return activeProgress?.routine_id === routineId && activeProgress?.is_active;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nutrition Routines</h2>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Nutrition Routines</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage your personalized nutrition plans
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Routine
        </Button>
      </div>

      {activeProgress && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center">
              <PlayIcon className="h-5 w-5 mr-2" />
              Active Routine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  {routines.find(r => r.id === activeProgress.routine_id)?.name || 'Unknown Routine'}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Meals completed: {activeProgress.meals_completed} | 
                  Days completed: {activeProgress.days_completed}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStopRoutine(activeProgress.routine_id)}
                  className="border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium"
                >
                  <PauseIcon className="h-4 w-4 mr-2" />
                  Set as Inactive
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {routines.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <FireIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Nutrition Routines Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              No nutrition routines available. Check back later for new routine templates.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routines.map((routine) => (
            <Card key={routine.id} className="hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg group-hover:text-emerald-600 transition-colors duration-300">
                        {routine.name}
                      </CardTitle>
                      {isRoutineActive(routine.id) && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {routine.description}
                    </p>
                    {routine.created_by_user_id && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                        ✨ Your Custom Routine
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {routine.duration_weeks} weeks
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <FireIcon className="h-4 w-4 mr-2" />
                    {routine.target_calories} cal/day
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteRoutine(routine.id)}
                      disabled={actionLoading === routine.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {isRoutineActive(routine.id) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStopRoutine(routine.id)}
                      disabled={actionLoading === routine.id}
                      className="border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium"
                    >
                      <PauseIcon className="h-4 w-4 mr-2" />
                      Set as Inactive
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleStartRoutine(routine.id)}
                      disabled={actionLoading === routine.id}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-700 hover:border-emerald-800 font-medium shadow-md"
                    >
                      <PlayIcon className="h-4 w-4 mr-2" />
                      Set as Active
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Routine Dialog */}
      <UnifiedRoutineWizard
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={handleRoutineCreated}
      />
    </div>
  );
}
