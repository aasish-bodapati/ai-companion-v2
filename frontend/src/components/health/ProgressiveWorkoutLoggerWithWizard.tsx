'use client';

import { useState, useEffect } from 'react';
import { MultiStepWizard } from '@/components/ui/multi-step-wizard';
import { useMultiStepWizard } from '@/hooks/useMultiStepWizard';
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

export function ProgressiveWorkoutLoggerWithWizard({
  onSuccess,
  initialData,
  routineContext
}: ProgressiveWorkoutLoggerProps) {
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
  const steps = [
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

  // Use the new wizard hook
  const {
    currentStep,
    currentStepData,
    progressPercentage,
    canProceed,
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep
  } = useMultiStepWizard({ steps });

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

  const handleSubmit = async () => {
    if (!canProceed) {
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

  // Get the current step component
  const StepComponent = currentStepData.component;

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
      
      {/* Use the new MultiStepWizard component */}
      <MultiStepWizard
        steps={steps}
        currentStep={currentStep}
        onStepChange={() => {}} // Not used in this implementation
        onNext={nextStep}
        onPrevious={prevStep}
        onSubmit={handleSubmit}
        canProceed={canProceed}
        loading={loading}
        submitLabel="Log Workout"
      >
        <StepComponent
          workoutData={workoutData}
          updateWorkoutData={updateWorkoutData}
          exercises={exercises}
          smartSuggestions={smartSuggestions}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={searchExercises}
          routineContext={routineContext}
        />
      </MultiStepWizard>
    </>
  );
}

// Step Components (keeping the existing step components)

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
    { id: 'strength', name: 'Strength Training', icon: '💪' },
    { id: 'cardio', name: 'Cardio', icon: '❤️' },
    { id: 'flexibility', name: 'Flexibility', icon: '🧘' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
    { id: 'other', name: 'Other', icon: '🏃' }
  ];

  const handleExerciseSelect = (exercise: Exercise) => {
    updateWorkoutData({ 
      selectedExercise: exercise,
      activityType: exercise.category,
      activityName: exercise.name
    });
  };

  const handleCustomActivity = () => {
    updateWorkoutData({ 
      selectedExercise: undefined,
      activityType: selectedCategory,
      activityName: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Routine Context */}
      {routineContext && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            {routineContext.name} Plan
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Following your workout routine for optimal results
          </p>
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
            {smartSuggestions.map((exercise: Exercise) => (
              <div
                key={exercise.id}
                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleExerciseSelect(exercise)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{exercise.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{exercise.category}</p>
                    {exercise.user_times_performed && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Done {exercise.user_times_performed} times
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Selection */}
      <div>
        <h3 className="font-medium mb-4">Choose Activity Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors text-center ${
                workoutData.activityType === category.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <div className="text-2xl mb-2">{category.icon}</div>
              <h4 className="font-medium">{category.name}</h4>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Activity Name */}
      {selectedCategory && (
        <div>
          <label className="block text-sm font-medium mb-2">Activity Name</label>
          <input
            type="text"
            placeholder={`Enter ${selectedCategory} activity name`}
            value={workoutData.activityName}
            onChange={(e) => updateWorkoutData({ activityName: e.target.value })}
            className="w-full p-2 border rounded"
          />
          <button
            onClick={handleCustomActivity}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Use Custom Activity
          </button>
        </div>
      )}

      {/* Exercise Search */}
      <div>
        <label className="block text-sm font-medium mb-2">Search Exercises</label>
        <input
          type="text"
          placeholder="Search for specific exercises..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            onSearch(e.target.value);
          }}
          className="w-full p-2 border rounded"
        />
      </div>
    </div>
  );
}

function WorkoutDetailsStep({ workoutData, updateWorkoutData }: any) {
  const intensities = [
    { id: 'low', name: 'Low', description: 'Light effort' },
    { id: 'medium', name: 'Medium', description: 'Moderate effort' },
    { id: 'high', name: 'High', description: 'Intense effort' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
        <input
          type="number"
          value={workoutData.duration_minutes || ''}
          onChange={(e) => updateWorkoutData({ duration_minutes: parseInt(e.target.value) || 0 })}
          className="w-full p-2 border rounded"
          placeholder="Enter duration in minutes"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Intensity Level</label>
        <div className="grid grid-cols-3 gap-3">
          {intensities.map((intensity) => (
            <div
              key={intensity.id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors text-center ${
                workoutData.intensity === intensity.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => updateWorkoutData({ intensity: intensity.id })}
            >
              <h4 className="font-medium">{intensity.name}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">{intensity.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExerciseSpecificsStep({ workoutData, updateWorkoutData }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Weight (kg)</label>
          <input
            type="number"
            value={workoutData.weight_kg || ''}
            onChange={(e) => updateWorkoutData({ weight_kg: parseFloat(e.target.value) || 0 })}
            className="w-full p-2 border rounded"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Reps</label>
          <input
            type="number"
            value={workoutData.reps || ''}
            onChange={(e) => updateWorkoutData({ reps: parseInt(e.target.value) || 0 })}
            className="w-full p-2 border rounded"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Sets</label>
          <input
            type="number"
            value={workoutData.sets || ''}
            onChange={(e) => updateWorkoutData({ sets: parseInt(e.target.value) || 0 })}
            className="w-full p-2 border rounded"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Distance (km)</label>
          <input
            type="number"
            value={workoutData.distance_km || ''}
            onChange={(e) => updateWorkoutData({ distance_km: parseFloat(e.target.value) || 0 })}
            className="w-full p-2 border rounded"
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
}

function ContextStep({ workoutData, updateWorkoutData }: any) {
  const moods = ['energetic', 'tired', 'motivated', 'challenged', 'accomplished'];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
        <textarea
          value={workoutData.notes || ''}
          onChange={(e) => updateWorkoutData({ notes: e.target.value })}
          className="w-full p-3 border rounded resize-none"
          rows={3}
          placeholder="How did the workout feel? Any thoughts or observations?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">How do you feel?</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {moods.map((mood) => (
            <button
              key={mood}
              className={`p-2 border rounded text-sm ${
                workoutData.mood === mood
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => updateWorkoutData({ mood })}
            >
              {mood}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
