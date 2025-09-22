import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MealStep } from '@/hooks/useNutritionLoggerSteps';

interface NutritionLoggerProgressProps {
  currentStepData: MealStep;
  currentStep: number;
  totalSteps: number;
  progressPercentage: number;
}

export function NutritionLoggerProgress({
  currentStepData,
  currentStep,
  totalSteps,
  progressPercentage
}: NutritionLoggerProgressProps) {
  return (
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
            Step {currentStep + 1} of {totalSteps}
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
  );
}
