'use client';

import React from 'react';
import { MultiStepWizard } from '@/components/ui/multi-step-wizard';
import { useMultiStepWizard } from '@/hooks/useMultiStepWizard';
import { useNutritionLogger } from '@/hooks/useNutritionLogger';
import { MealData } from '@/services/nutritionLoggerService';
import { MealTypeStep } from './nutrition/MealTypeStep';
import { FoodSelectionStep } from './nutrition/FoodSelectionStep';
import { NutritionReviewStep } from './nutrition/NutritionReviewStep';
import { ContextStep } from './nutrition/ContextStep';
import { InstantFeedback } from './InstantFeedback';

interface ProgressiveNutritionLoggerProps {
  onSuccess?: () => void;
  initialData?: Partial<MealData>;
  routineContext?: {
    id: string;
    name: string;
    todaysMeals?: any[];
  };
}

export function ProgressiveNutritionLoggerWithWizard({
  onSuccess,
  initialData,
  routineContext
}: ProgressiveNutritionLoggerProps) {
  // Main nutrition logging hook
  const {
    mealData,
    foodSuggestions,
    searchResults,
    searchQuery,
    loading,
    lastLogId,
    showFeedback,
    updateMealData,
    addFoodItem,
    removeFoodItem,
    updateFoodItem,
    searchFoods,
    setSearchQuery,
    setShowFeedback,
    logMeal
  } = useNutritionLogger({
    initialData,
    routineContext,
    onSuccess
  });

  // Define steps
  const steps = [
    {
      id: 'meal_type',
      title: 'Meal Type',
      description: 'What meal are you logging?',
      component: MealTypeStep,
      isComplete: !!mealData.meal_type
    },
    {
      id: 'food_selection',
      title: 'Add Foods',
      description: 'What did you eat?',
      component: FoodSelectionStep,
      isComplete: mealData.food_items.length > 0
    },
    {
      id: 'nutrition_review',
      title: 'Nutrition Review',
      description: 'Check your macros',
      component: NutritionReviewStep,
      isComplete: true
    },
    {
      id: 'context',
      title: 'Finish Up',
      description: 'Notes and mood',
      component: ContextStep,
      isComplete: true,
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

  // Get the current step component
  const StepComponent = currentStepData.component;

  return (
    <>
      {/* Instant Feedback Modal */}
      {showFeedback && lastLogId && (
        <InstantFeedback
          logType="nutrition"
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
        onSubmit={logMeal}
        canProceed={canProceed}
        loading={loading}
        submitLabel="Log Meal"
      >
        <StepComponent
          mealData={mealData}
          updateMealData={updateMealData}
          addFoodItem={addFoodItem}
          removeFoodItem={removeFoodItem}
          updateFoodItem={updateFoodItem}
          foodSuggestions={foodSuggestions}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          onSearch={searchFoods}
          routineContext={routineContext}
        />
      </MultiStepWizard>
    </>
  );
}
