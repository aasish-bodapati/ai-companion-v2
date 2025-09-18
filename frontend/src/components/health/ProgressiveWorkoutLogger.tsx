'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CheckCircleIcon,
  ClockIcon,
  FireIcon,
  TrophyIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { InstantFeedback } from './InstantFeedback';
import api from '@/lib/api';

interface Exercise {
  id: string;
  name: string;
  category: string;
  muscle_groups: string[];
  equipment_needed: string[];
  difficulty_level: string;
  calories_per_minute?: number;
  user_times_performed?: number;
  user_avg_duration?: number;
  user_personal_records?: {
    max_weight_kg?: number;
    max_reps?: number;
    max_distance_km?: number;
  };
}

interface WorkoutStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  isComplete: boolean;
  isOptional?: boolean;
}

interface WorkoutData {
  // Step 1: Exercise Selection
  selectedExercise?: Exercise;
  activityType: string;
  activityName: string;
  
  // Step 2: Workout Details
  duration_minutes?: number;
  intensity?: string;
  
  // Step 3: Exercise Specifics (if applicable)
  weight_kg?: number;
  reps?: number;
  sets?: number;
  distance_km?: number;
  
  // Step 4: Context & Notes
  routineId?: string;
  notes?: string;
  mood?: string;
}

interface ProgressiveWorkoutLoggerProps {
  onSuccess?: () => void;
  initialData?: Partial<WorkoutData>;
  routineContext?: {
    id: string;
    name: string;
    todaysExercises?: Exercise[];
  };
}

export function ProgressiveWorkoutLogger({
  onSuccess,
  initialData,
  routineContext
}: ProgressiveWorkoutLoggerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [workoutData, setWorkoutData] = useState<WorkoutData>({
    activityType: '',
    activityName: '',
    intensity: 'medium',
    ...initialData
  });
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [smartSuggestions, setSmartSuggestions] = useState<Exercise[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastLogId, setLastLogId] = useState<string | null>(null);

  // Define steps
  const steps: WorkoutStep[] = [
    {
      id: 'exercise',
      title: 'Choose Exercise',
      description: 'What are you working out today?',
      component: ExerciseSelectionStep,
      isComplete: !!workoutData.selectedExercise || !!workoutData.activityType
    },
    {
      id: 'details',
      title: 'Workout Details',
      description: 'Duration and intensity',
      component: WorkoutDetailsStep,
      isComplete: !!workoutData.duration_minutes && !!workoutData.intensity
    },
    {
      id: 'specifics',
      title: 'Exercise Specifics',
      description: 'Weights, reps, sets (if applicable)',
      component: ExerciseSpecificsStep,
      isComplete: true, // Optional step
      isOptional: true
    },
    {
      id: 'context',
      title: 'Finish Up',
      description: 'Notes and final details',
      component: ContextStep,
      isComplete: true, // Always complete
      isOptional: true
    }
  ];

  const currentStepData = steps[currentStep];
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  useEffect(() => {
    loadSmartSuggestions();
  }, []);

  const loadSmartSuggestions = async () => {
    try {
      const response = await api.get('/health/exercises/suggestions?limit=5');
      setSmartSuggestions(response.suggestions?.map((s: any) => s.exercise) || []);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const searchExercises = async (query: string) => {
    if (!query.trim()) {
      setExercises([]);
      return;
    }

    try {
      const response = await api.get(`/health/exercises/search?query=${encodeURIComponent(query)}&limit=10`);
      setExercises(response.foods || []);
    } catch (error) {
      console.error('Failed to search exercises:', error);
    }
  };

  const updateWorkoutData = (updates: Partial<WorkoutData>) => {
    setWorkoutData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    const step = steps[currentStep];
    return step.isComplete || step.isOptional;
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1 && canProceed()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) {
      toast.error('Please complete the required fields');
      return;
    }

    setLoading(true);
    try {
      const logData = {
        activity_type: workoutData.selectedExercise?.category || workoutData.activityType,
        activity_name: workoutData.selectedExercise?.name || workoutData.activityName,
        exercise_id: workoutData.selectedExercise?.id,
        duration_minutes: workoutData.duration_minutes,
        intensity: workoutData.intensity,
        weight_kg: workoutData.weight_kg,
        reps: workoutData.reps,
        sets: workoutData.sets,
        distance_km: workoutData.distance_km,
        routine_id: workoutData.routineId || routineContext?.id,
        notes: workoutData.notes,
        activity_date: new Date().toISOString(),
        use_smart_defaults: true
      };

      const response = await api.post('/health/contextual-logging/workout/smart', logData);
      
      toast.success('Workout logged successfully! 🎉');
      
      // Show instant feedback
      if (response.log_id) {
        setLastLogId(response.log_id);
        setShowFeedback(true);
      }

      onSuccess?.();
    } catch (error) {
      console.error('Failed to log workout:', error);
      toast.error('Failed to log workout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Instant Feedback Modal */}
      {showFeedback && lastLogId && (
        <InstantFeedback
          logType="fitness"
          logId={lastLogId}
          onClose={() => setShowFeedback(false)}
        />
      )}
      
      <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {currentStepData.description}
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          <currentStepData.component
            workoutData={workoutData}
            updateWorkoutData={updateWorkoutData}
            exercises={exercises}
            smartSuggestions={smartSuggestions}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={searchExercises}
            routineContext={routineContext}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`w-2 h-2 rounded-full ${
                    index < currentStep
                      ? 'bg-green-500'
                      : index === currentStep
                      ? 'bg-blue-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Logging...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    Log Workout
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
}

// Step Components

function ExerciseSelectionStep({
  workoutData,
  updateWorkoutData,
  smartSuggestions,
  searchQuery,
  setSearchQuery,
  onSearch,
  routineContext
}: any) {
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = [
    { id: 'cardio', name: 'Cardio', icon: '🏃', description: 'Running, cycling, swimming' },
    { id: 'strength', name: 'Strength', icon: '💪', description: 'Weight lifting, bodyweight' },
    { id: 'flexibility', name: 'Flexibility', icon: '🧘', description: 'Yoga, stretching' },
    { id: 'sports', name: 'Sports', icon: '⚽', description: 'Basketball, tennis, etc.' }
  ];

  const handleExerciseSelect = (exercise: Exercise) => {
    updateWorkoutData({
      selectedExercise: exercise,
      activityType: exercise.category,
      activityName: exercise.name,
      // Apply smart defaults if available
      duration_minutes: exercise.user_avg_duration || (exercise.category === 'cardio' ? 30 : 45),
      weight_kg: exercise.user_personal_records?.max_weight_kg,
      reps: exercise.user_personal_records?.max_reps
    });
  };

  const handleQuickActivity = (category: string) => {
    setSelectedCategory(category);
    updateWorkoutData({
      activityType: category,
      activityName: '',
      selectedExercise: undefined
    });
  };

  return (
    <div className="space-y-6">
      {/* Routine Context */}
      {routineContext && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Today&apos;s {routineContext.name} Workout
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Based on your routine, here are today&apos;s recommended exercises
          </p>
          {routineContext.todaysExercises && (
            <div className="flex flex-wrap gap-2 mt-3">
              {routineContext.todaysExercises.map((exercise: any) => (
                <Button
                  key={exercise.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleExerciseSelect(exercise)}
                  className="text-xs"
                >
                  {exercise.name}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Smart Suggestions */}
      {smartSuggestions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <SparklesIcon className="h-5 w-5 text-yellow-500" />
            <h3 className="font-medium">Suggested for You</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {smartSuggestions.map((exercise: any) => (
              <div
                key={exercise.id}
                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleExerciseSelect(exercise)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{exercise.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {exercise.category}
                    </p>
                    {exercise.user_times_performed && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Done {exercise.user_times_performed} times before
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {exercise.difficulty_level}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Selection */}
      <div>
        <h3 className="font-medium mb-3">Or Choose a Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categories.map((category: any) => (
            <div
              key={category.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors text-center ${
                selectedCategory === category.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => handleQuickActivity(category.id)}
            >
              <div className="text-2xl mb-2">{category.icon}</div>
              <h4 className="font-medium">{category.name}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {category.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Activity Name */}
      {selectedCategory && (
        <div>
          <Label htmlFor="activity-name">Activity Name</Label>
          <Input
            id="activity-name"
            placeholder={`Enter ${selectedCategory} activity name`}
            value={workoutData.activityName}
            onChange={(e) => updateWorkoutData({ activityName: e.target.value })}
          />
        </div>
      )}

      {/* Exercise Search */}
      <div>
        <Label htmlFor="exercise-search">Search Exercises</Label>
        <Input
          id="exercise-search"
          placeholder="Search for specific exercises..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            onSearch(e.target.value);
          }}
        />
      </div>
    </div>
  );
}

function WorkoutDetailsStep({ workoutData, updateWorkoutData }: any) {
  const intensityOptions = [
    { value: 'low', label: 'Low', description: 'Light activity, easy pace', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', description: 'Moderate effort, can hold conversation', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', description: 'Hard effort, challenging pace', color: 'bg-red-100 text-red-800' }
  ];

  const suggestedDurations = [15, 20, 30, 45, 60, 90];

  return (
    <div className="space-y-6">
      {/* Duration */}
      <div>
        <Label htmlFor="duration">Duration (minutes)</Label>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {suggestedDurations.map((duration: any) => (
              <Button
                key={duration}
                variant={workoutData.duration_minutes === duration ? "default" : "outline"}
                size="sm"
                onClick={() => updateWorkoutData({ duration_minutes: duration })}
              >
                {duration} min
              </Button>
            ))}
          </div>
          <Input
            id="duration"
            type="number"
            placeholder="Or enter custom duration"
            value={workoutData.duration_minutes || ''}
            onChange={(e) => updateWorkoutData({ duration_minutes: parseInt(e.target.value) || undefined })}
          />
        </div>
      </div>

      {/* Intensity */}
      <div>
        <Label>Intensity Level</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
          {intensityOptions.map((option: any) => (
            <div
              key={option.value}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                workoutData.intensity === option.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => updateWorkoutData({ intensity: option.value })}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{option.label}</h4>
                <Badge className={option.color}>{option.label}</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {option.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Estimated Calories */}
      {workoutData.duration_minutes && workoutData.selectedExercise?.calories_per_minute && (
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <FireIcon className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-900 dark:text-green-100">
              Estimated: {Math.round(workoutData.duration_minutes * workoutData.selectedExercise.calories_per_minute)} calories
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseSpecificsStep({ workoutData, updateWorkoutData }: any) {
  const isStrengthTraining = workoutData.selectedExercise?.category === 'strength' || 
                           workoutData.activityType === 'strength';
  const isCardio = workoutData.selectedExercise?.category === 'cardio' || 
                   workoutData.activityType === 'cardio';

  return (
    <div className="space-y-6">
      <div className="text-center text-gray-600 dark:text-gray-400 mb-6">
        <p>These details are optional but help track your progress</p>
      </div>

      {isStrengthTraining && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.5"
              placeholder="0"
              value={workoutData.weight_kg || ''}
              onChange={(e) => updateWorkoutData({ weight_kg: parseFloat(e.target.value) || undefined })}
            />
          </div>
          <div>
            <Label htmlFor="reps">Reps</Label>
            <Input
              id="reps"
              type="number"
              placeholder="0"
              value={workoutData.reps || ''}
              onChange={(e) => updateWorkoutData({ reps: parseInt(e.target.value) || undefined })}
            />
          </div>
          <div>
            <Label htmlFor="sets">Sets</Label>
            <Input
              id="sets"
              type="number"
              placeholder="0"
              value={workoutData.sets || ''}
              onChange={(e) => updateWorkoutData({ sets: parseInt(e.target.value) || undefined })}
            />
          </div>
        </div>
      )}

      {isCardio && (
        <div>
          <Label htmlFor="distance">Distance (km)</Label>
          <Input
            id="distance"
            type="number"
            step="0.1"
            placeholder="0.0"
            value={workoutData.distance_km || ''}
            onChange={(e) => updateWorkoutData({ distance_km: parseFloat(e.target.value) || undefined })}
          />
        </div>
      )}

      {/* Personal Records */}
      {workoutData.selectedExercise?.user_personal_records && (
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <TrophyIcon className="h-5 w-5 text-purple-600" />
            <h3 className="font-medium text-purple-900 dark:text-purple-100">Your Personal Records</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {workoutData.selectedExercise.user_personal_records.max_weight_kg && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Max Weight:</span>
                <span className="font-medium ml-1">
                  {workoutData.selectedExercise.user_personal_records.max_weight_kg}kg
                </span>
              </div>
            )}
            {workoutData.selectedExercise.user_personal_records.max_reps && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Max Reps:</span>
                <span className="font-medium ml-1">
                  {workoutData.selectedExercise.user_personal_records.max_reps}
                </span>
              </div>
            )}
            {workoutData.selectedExercise.user_personal_records.max_distance_km && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Max Distance:</span>
                <span className="font-medium ml-1">
                  {workoutData.selectedExercise.user_personal_records.max_distance_km}km
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ContextStep({ workoutData, updateWorkoutData }: any) {
  const moods = ['energetic', 'motivated', 'tired', 'stressed', 'happy', 'focused'];

  return (
    <div className="space-y-6">
      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <textarea
          id="notes"
          className="w-full p-3 border border-gray-300 rounded-md resize-none"
          rows={4}
          placeholder="How did the workout feel? Any observations or goals for next time?"
          value={workoutData.notes || ''}
          onChange={(e) => updateWorkoutData({ notes: e.target.value })}
        />
      </div>

      {/* Mood */}
      <div>
        <Label>How are you feeling?</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {moods.map((mood: any) => (
            <Button
              key={mood}
              variant={workoutData.mood === mood ? "default" : "outline"}
              size="sm"
              onClick={() => updateWorkoutData({ mood: mood })}
              className="capitalize"
            >
              {mood}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-medium mb-3">Workout Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Activity:</span>
            <span className="font-medium">
              {workoutData.selectedExercise?.name || workoutData.activityName || workoutData.activityType}
            </span>
          </div>
          {workoutData.duration_minutes && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Duration:</span>
              <span className="font-medium">{workoutData.duration_minutes} minutes</span>
            </div>
          )}
          {workoutData.intensity && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Intensity:</span>
              <span className="font-medium capitalize">{workoutData.intensity}</span>
            </div>
          )}
          {workoutData.weight_kg && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Weight:</span>
              <span className="font-medium">{workoutData.weight_kg}kg</span>
            </div>
          )}
          {workoutData.reps && workoutData.sets && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Sets × Reps:</span>
              <span className="font-medium">{workoutData.sets} × {workoutData.reps}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
