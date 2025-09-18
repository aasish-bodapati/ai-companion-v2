'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { simpleRoutineApi, SimpleRoutineWithProgress } from '@/lib/simpleRoutineApi';
import { CustomRoutineBuilder } from '@/features/health/components/CustomRoutineBuilder';
import { EditRoutineDialog } from '@/features/health/components/EditRoutineDialog';
import { useAuth } from '@/contexts/AuthContext';
import { 
  PlusIcon, 
  PlayIcon, 
  PauseIcon, 
  PencilIcon, 
  TrashIcon,
  FireIcon
} from '@heroicons/react/24/outline';

interface SimpleRoutineTemplatesProps {
  onRoutineSelected?: () => void;
}

export function SimpleRoutineTemplates({ onRoutineSelected }: SimpleRoutineTemplatesProps) {
  const { isAuthenticated } = useAuth();
  const [routines, setRoutines] = useState<SimpleRoutineWithProgress[]>([]);
  const [routinesWithWorkouts, setRoutinesWithWorkouts] = useState<SimpleRoutineWithProgress[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingRoutine, setEditingRoutine] = useState<SimpleRoutineWithProgress | null>(null);

  const loadRoutines = useCallback(async () => {
    console.log('🔄 loadRoutines called, isAuthenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      console.log('❌ Not authenticated, skipping routine load');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('📡 Loading routines from database...');
      
      // Load routines from database via API
      const response = await simpleRoutineApi.getRoutines({
        user_created_only: false, // Get all routines including templates
        limit: 50
      });
      
      console.log('✅ Loaded routines from database:', response);
      console.log('📊 Number of routines found in database:', response.routines?.length || 0);
      setRoutines(response.routines);
      
      // Load detailed workout data for each routine
      console.log('🏋️ Loading detailed workout data for each routine...');
      const routinesWithWorkoutsData = await Promise.all(
        response.routines.map(async (routine) => {
          try {
            console.log(`Loading detailed workout data for routine: ${routine.name} (${routine.id})`);
            const detailedRoutine = await simpleRoutineApi.getRoutine(routine.id);
            console.log(`Successfully loaded detailed workout data for ${routine.name}:`, detailedRoutine);
            return detailedRoutine;
          } catch (error) {
            console.error(`Failed to load workout data for routine ${routine.id} (${routine.name}):`, error);
            console.error('Error details:', {
              message: (error as any).message,
              status: (error as any).status,
              data: (error as any).data
            });
            // Return basic routine with empty workout data if detailed loading fails
            return {
              ...routine,
              workout_schedule: [],
              total_workouts_per_week: 0
            };
          }
        })
      );
      
      console.log('🏋️ Routines with workout data loaded:', routinesWithWorkoutsData);
      console.log('🔍 Debug - First routine with workouts:', routinesWithWorkoutsData[0]);
      if (routinesWithWorkoutsData[0]) {
        console.log('🔍 Debug - First routine workout_schedule:', routinesWithWorkoutsData[0].workout_schedule);
        console.log('🔍 Debug - First routine total_workouts_per_week:', routinesWithWorkoutsData[0].total_workouts_per_week);
      }
      setRoutinesWithWorkouts(routinesWithWorkoutsData);
      
    } catch (error) {
      console.error('❌ Failed to load routines:', error);
      console.error('Error details:', error);
      toast.error('Failed to load routines. Please try again.');
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
      console.log('🚀 Starting routine:', routineId);
      const result = await simpleRoutineApi.startRoutine(routineId);
      console.log('✅ Routine started successfully:', result);
      toast.success('Routine set as active!');
      await loadRoutines();
      onRoutineSelected?.();
    } catch (error) {
      console.error('❌ Failed to start routine:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to set routine as active: ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStopRoutine = async (routineId: string) => {
    try {
      setActionLoading(routineId);
      await simpleRoutineApi.stopRoutine(routineId);
      toast.success('Routine set to inactive');
      await loadRoutines();
    } catch (error) {
      console.error('Failed to set routine to inactive:', error);
      toast.error('Failed to set routine to inactive. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };


  const handleDeleteRoutine = async (routineId: string) => {
    if (!confirm('Are you sure you want to delete this routine?')) return;
    
    try {
      setActionLoading(routineId);
      await simpleRoutineApi.deleteRoutine(routineId);
      toast.success('Routine deleted successfully');
      await loadRoutines();
    } catch (error: any) {
      console.error('Failed to delete routine:', error);
      
      // Handle specific error cases
      if (error.status === 403) {
        toast.error('You are not authorized to delete this routine. Only user-created routines can be deleted.');
      } else if (error.status === 404) {
        toast.error('Routine not found. It may have already been deleted.');
      } else {
        toast.error('Failed to delete routine. Please try again.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditRoutine = (routine: SimpleRoutineWithProgress) => {
    // Find the detailed routine with workout data
    const detailedRoutine = routinesWithWorkouts.find(r => r.id === routine.id) || routine;
    console.log('🔍 EditRoutineDialog - Using detailed routine:', detailedRoutine);
    setEditingRoutine(detailedRoutine);
  };

  const handleRoutineUpdated = () => {
    setEditingRoutine(null);
    loadRoutines();
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading routines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex justify-end">
        <CustomRoutineBuilder onRoutineCreated={loadRoutines} />
      </div>

      {/* Routines Grid */}
      {routines.length === 0 ? (
        <div className="text-center py-8">
          <FireIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No routines created yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Create your first routine using the button above
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routines.map((routine) => (
            <Card key={routine.id} className="hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg group-hover:text-orange-600 transition-colors duration-300">
                        {routine.name}
                      </CardTitle>
                      {routine.user_progress?.is_active && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {routine.description}
                    </p>
                    {routine.created_by_user_id && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
                        ✨ Your Custom Routine
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">

                {/* Workout Details */}
                {(() => {
                  const routineWithWorkouts = routinesWithWorkouts.find(r => r.id === routine.id);
                  const workoutSchedule = routineWithWorkouts?.workout_schedule || [];
                  const totalWorkouts = routineWithWorkouts?.total_workouts_per_week || 0;
                  
                  // Debug logging
                  console.log(`🔍 Debug for routine ${routine.name}:`, {
                    routineId: routine.id,
                    routineWithWorkouts: routineWithWorkouts,
                    workoutSchedule: workoutSchedule,
                    totalWorkouts: totalWorkouts,
                    routinesWithWorkoutsLength: routinesWithWorkouts.length
                  });
                  
                  // If we don't have detailed workout data, show appropriate message
                  if (!routineWithWorkouts || totalWorkouts === 0) {
                    return (
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                        <div className="text-sm text-orange-800 dark:text-orange-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">📋 Workout Plan:</span>
                            <span>No detailed workout plan available</span>
                          </div>
                          <div className="text-xs text-orange-600 dark:text-orange-300 mt-2">
                            ℹ️ This routine doesn't have a detailed workout schedule. You can edit it to add exercises.
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                      <div className="text-sm text-orange-800 dark:text-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">📋 Workout Plan:</span>
                          <span>{totalWorkouts > 0 ? `${totalWorkouts} workout days` : 'No workout details'}</span>
                        </div>
                        
                        {/* Show detailed workout schedule if available */}
                        {workoutSchedule.length > 0 && (
                          <div className="mt-2 space-y-2">
                            <div className="text-xs font-medium text-orange-700 dark:text-orange-300">
                              Workout Schedule:
                            </div>
                            <div className="space-y-2">
                              {workoutSchedule.map((day: any, index: number) => (
                                <div key={index} className="bg-orange-100 dark:bg-orange-800/30 rounded p-2">
                                  <div className="text-xs font-medium text-orange-800 dark:text-orange-200">
                                    {day.day}: {day.workout_name}
                                  </div>
                                  {day.exercises && day.exercises.length > 0 && (
                                    <div className="mt-1 space-y-1">
                                      {day.exercises.map((exercise: any, exIndex: number) => (
                                        <div key={exIndex} className="text-xs text-orange-700 dark:text-orange-300 ml-2">
                                          • {exercise.exercise_name}: {exercise.sets} sets × {exercise.reps} reps
                                          {exercise.weight_notes && ` (${exercise.weight_notes})`}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="text-xs text-orange-600 dark:text-orange-300 mt-2">
                          ✅ Detailed workout plans with exercises and sets/reps tracking!
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Progress Info */}
                {routine.user_progress && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <div className="flex items-center justify-between">
                        <span>Workouts Completed:</span>
                        <span className="font-semibold">{routine.user_progress.workouts_completed}</span>
                      </div>
                      {routine.user_progress.last_workout_date && (
                        <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                          Last workout: {new Date(routine.user_progress.last_workout_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {routine.user_progress?.is_active ? (
                    <Button
                      onClick={() => handleStopRoutine(routine.id)}
                      disabled={actionLoading === routine.id}
                      size="sm"
                      variant="outline"
                      className="flex-1 border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium"
                    >
                      <PauseIcon className="h-4 w-4 mr-1" />
                      {actionLoading === routine.id ? 'Setting Inactive...' : 'Set to Inactive'}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleStartRoutine(routine.id)}
                      disabled={actionLoading === routine.id}
                      size="sm"
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white border-2 border-orange-700 hover:border-orange-800 font-medium shadow-md"
                    >
                      <PlayIcon className="h-4 w-4 mr-1" />
                      {actionLoading === routine.id ? 'Setting Active...' : 'Set as Active'}
                    </Button>
                  )}

                  {/* Edit/Delete buttons for user-created routines only */}
                  {routine.created_by_user_id && (
                    <>
                      <Button
                        onClick={() => handleEditRoutine(routine)}
                        size="sm"
                        variant="outline"
                        className="px-3 h-8 border-2 border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteRoutine(routine.id)}
                        disabled={actionLoading === routine.id}
                        size="sm"
                        variant="outline"
                        className="px-3 h-8 border-2 border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Routine Dialog */}
      <EditRoutineDialog
        routine={editingRoutine}
        isOpen={editingRoutine !== null}
        onClose={() => setEditingRoutine(null)}
        onRoutineUpdated={handleRoutineUpdated}
      />
    </div>
  );
}

