'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useNutritionLogger } from '@/hooks/useNutritionLogger';
import { useNutritionLoggerSteps } from '@/hooks/useNutritionLoggerSteps';
import { MealData } from '@/services/nutritionLoggerService';
import { NutritionLoggerProgress } from './nutrition/NutritionLoggerProgress';
import { NutritionLoggerNavigation } from './nutrition/NutritionLoggerNavigation';
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

export function ProgressiveNutritionLoggerRefactored({
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

  // Step navigation hook
  const {
    currentStep,
    currentStepData,
    progressPercentage,
    canProceed,
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep
  } = useNutritionLoggerSteps({
    mealData,
    steps
  });

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
      
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress Header */}
        <NutritionLoggerProgress
          currentStepData={currentStepData}
          currentStep={currentStep}
          totalSteps={steps.length}
          progressPercentage={progressPercentage}
        />

        {/* Step Content */}
        <Card>
          <CardContent className="p-6">
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
          </CardContent>
        </Card>

        {/* Navigation */}
        <NutritionLoggerNavigation
          steps={steps}
          currentStep={currentStep}
          canProceed={canProceed}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          loading={loading}
          onPrevStep={prevStep}
          onNextStep={nextStep}
          onSubmit={logMeal}
        />
      </div>
    </>
  );
}
