'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import { WorkoutCategorySelector, WorkoutCategory, WORKOUT_CATEGORIES } from './WorkoutCategorySelector';
import { WorkoutInputComponents } from './WorkoutInputComponents';
import { useSuccessToast, useErrorToast } from '@/components/ui/toast';
import api from '@/lib/api';

interface DynamicWorkoutLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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

export function DynamicWorkoutLogger({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialData 
}: DynamicWorkoutLoggerProps) {
  const [step, setStep] = useState<'category' | 'details' | 'summary'>('category');
  const [selectedCategory, setSelectedCategory] = useState<WorkoutCategory | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [workoutData, setWorkoutData] = useState({
    workout_name: initialData?.workout_name || '',
    duration_minutes: initialData?.duration_minutes || 0,
    calories_burned: initialData?.calories_burned || 0,
    notes: initialData?.notes || '',
    exercises: initialData?.exercises || []
  });
  const [exerciseData, setExerciseData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  
  const successToast = useSuccessToast();
  const errorToast = useErrorToast();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('category');
      setSelectedCategory(null);
      setWorkoutData({
        workout_name: initialData?.workout_name || '',
        duration_minutes: initialData?.duration_minutes || 0,
        calories_burned: initialData?.calories_burned || 0,
        notes: initialData?.notes || '',
        exercises: initialData?.exercises || []
      });
      setExerciseData({});
    }
  }, [isOpen, initialData]);

  const handleCategorySelect = (category: WorkoutCategory) => {
    setSelectedCategory(category);
    setSelectedExercise(null); // Reset exercise when category changes
  };

  const handleExerciseSelect = (exercise: any) => {
    setSelectedExercise(exercise);
    setStep('details');
    
    // Initialize exercise data with default values
    const initialExerciseData: Record<string, any> = {};
    selectedCategory?.loggingAttributes.required.forEach(attr => {
      initialExerciseData[attr.name] = '';
    });
    selectedCategory?.loggingAttributes.optional.forEach(attr => {
      initialExerciseData[attr.name] = '';
    });
    setExerciseData(initialExerciseData);
  };

  const handleExerciseDataChange = (field: string, value: any) => {
    setExerciseData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWorkoutDataChange = (field: string, value: any) => {
    setWorkoutData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateExerciseData = () => {
    if (!selectedCategory) return false;
    
    // Check required fields
    for (const attr of selectedCategory.loggingAttributes.required) {
      if (!exerciseData[attr.name] || exerciseData[attr.name] === '') {
        return false;
      }
    }
    
    return true;
  };

  const handleNext = () => {
    if (step === 'category' && selectedCategory) {
      setStep('details');
    } else if (step === 'details') {
      if (validateExerciseData()) {
        setStep('summary');
      } else {
        errorToast('Please fill in all required fields');
      }
    }
  };

  const handleBack = () => {
    if (step === 'details') {
      setStep('category');
    } else if (step === 'summary') {
      setStep('details');
    }
  };

  const handleSave = async () => {
    if (!selectedCategory || !validateExerciseData()) {
      errorToast('Please complete all required fields');
      return;
    }

    setLoading(true);
    try {
      // Create exercise entry based on category
      const exercise = {
        exercise_name: workoutData.workout_name,
        sets: exerciseData.sets || 1,
        reps: String(exerciseData.reps || 1),
        weight_used: exerciseData.weight || 0,
        notes: exerciseData.notes || ''
      };

      // Add category-specific fields
      if (selectedCategory.id === 'cardio_duration') {
        exercise.duration = exerciseData.duration;
        exercise.distance = exerciseData.distance;
        exercise.intensity = exerciseData.intensity;
        exercise.heart_rate = exerciseData.heart_rate;
      } else if (selectedCategory.id === 'hold_static') {
        exercise.duration = exerciseData.duration;
        exercise.difficulty = exerciseData.difficulty;
      } else if (selectedCategory.id === 'repetition_only') {
        exercise.total_reps = exerciseData.total_reps;
      } else if (selectedCategory.id === 'distance_based') {
        exercise.distance = exerciseData.distance;
        exercise.time = exerciseData.time;
        exercise.pace = exerciseData.pace;
      }

      const logData = {
        workout_name: workoutData.workout_name,
        duration_minutes: workoutData.duration_minutes,
        calories_burned: workoutData.calories_burned,
        notes: workoutData.notes,
        exercises: [exercise],
        activity_date: new Date().toISOString().split('T')[0]
      };

      await api.post('/health/fitness-logs/', logData);
      successToast('Workout logged successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save workout:', error);
      errorToast('Failed to save workout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'category':
        return (
          <WorkoutCategorySelector
            selectedCategory={selectedCategory?.id || null}
            selectedExercise={selectedExercise}
            onCategorySelect={handleCategorySelect}
            onExerciseSelect={handleExerciseSelect}
          />
        );
      
      case 'details':
        return (
          <div className="space-y-6">
            {/* Workout Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Workout Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="workout_name">Workout Name *</Label>
                    <Input
                      id="workout_name"
                      value={workoutData.workout_name}
                      onChange={(e) => handleWorkoutDataChange('workout_name', e.target.value)}
                      placeholder="Enter workout name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                    <Input
                      id="duration_minutes"
                      type="number"
                      value={workoutData.duration_minutes || ''}
                      onChange={(e) => handleWorkoutDataChange('duration_minutes', e.target.value ? Number(e.target.value) : 0)}
                      placeholder="Enter duration"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calories_burned">Calories Burned</Label>
                    <Input
                      id="calories_burned"
                      type="number"
                      value={workoutData.calories_burned || ''}
                      onChange={(e) => handleWorkoutDataChange('calories_burned', e.target.value ? Number(e.target.value) : 0)}
                      placeholder="Enter calories burned"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Workout Notes</Label>
                  <Textarea
                    id="notes"
                    value={workoutData.notes}
                    onChange={(e) => handleWorkoutDataChange('notes', e.target.value)}
                    placeholder="Add any additional notes about your workout..."
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Exercise Details */}
            {selectedCategory && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Exercise Details
                    <Badge variant="outline" className="ml-2">
                      {selectedCategory.displayName}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WorkoutInputComponents
                    category={selectedCategory}
                    values={exerciseData}
                    onChange={handleExerciseDataChange}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        );
      
      case 'summary':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Workout Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Workout Name</Label>
                    <p className="text-lg font-semibold">{workoutData.workout_name}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Category</Label>
                    <p className="text-lg font-semibold">{selectedCategory?.displayName}</p>
                  </div>
                  
                  {workoutData.duration_minutes > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Duration</Label>
                      <p className="text-lg font-semibold">{workoutData.duration_minutes} minutes</p>
                    </div>
                  )}
                  
                  {workoutData.calories_burned > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Calories Burned</Label>
                      <p className="text-lg font-semibold">{workoutData.calories_burned}</p>
                    </div>
                  )}
                </div>
                
                {/* Exercise Summary */}
                {selectedCategory && (
                  <div className="mt-6">
                    <Label className="text-sm font-medium text-gray-500">Exercise Details</Label>
                    <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {selectedCategory.loggingAttributes.required.map((attr) => (
                        <div key={attr.name} className="flex justify-between py-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{attr.label}:</span>
                          <span className="text-sm font-medium">{exerciseData[attr.name] || 'Not set'}</span>
                        </div>
                      ))}
                      {selectedCategory.loggingAttributes.optional.map((attr) => (
                        exerciseData[attr.name] && (
                          <div key={attr.name} className="flex justify-between py-1">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{attr.label}:</span>
                            <span className="text-sm font-medium">{exerciseData[attr.name]}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'category':
        return 'Choose Workout Type';
      case 'details':
        return 'Enter Workout Details';
      case 'summary':
        return 'Review & Save';
      default:
        return 'Log Workout';
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'category':
        return selectedCategory !== null;
      case 'details':
        return workoutData.workout_name.trim() !== '' && validateExerciseData();
      case 'summary':
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step !== 'category' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-1"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
            )}
            {getStepTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {renderStepContent()}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex items-center gap-2">
            {step === 'category' && (
              <span className="text-sm text-gray-500">Step 1 of 3</span>
            )}
            {step === 'details' && (
              <span className="text-sm text-gray-500">Step 2 of 3</span>
            )}
            {step === 'summary' && (
              <span className="text-sm text-gray-500">Step 3 of 3</span>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            
            {step === 'summary' ? (
              <Button 
                onClick={handleSave} 
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4" />
                    Save Workout
                  </div>
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleNext} 
                disabled={!canProceed()}
              >
                Next
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

