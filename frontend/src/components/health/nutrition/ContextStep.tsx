import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MealData } from '@/services/nutritionLoggerService';
import { getMoodOptions } from '@/utils/nutritionUtils';

interface ContextStepProps {
  mealData: MealData;
  updateMealData: (updates: Partial<MealData>) => void;
}

export function ContextStep({ mealData, updateMealData }: ContextStepProps) {
  const moods = getMoodOptions();

  return (
    <div className="space-y-6">
      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <textarea
          id="notes"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          rows={3}
          placeholder="How was the meal? Any thoughts about taste, satisfaction, or preparation?"
          value={mealData.notes || ''}
          onChange={(e) => updateMealData({ notes: e.target.value })}
        />
      </div>

      {/* Mood Before */}
      <div>
        <Label>How did you feel before eating?</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {moods.map((mood) => (
            <Button
              key={mood}
              variant={mealData.mood_before === mood ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateMealData({ mood_before: mood })}
              className="text-sm"
            >
              {mood}
            </Button>
          ))}
        </div>
      </div>

      {/* Mood After */}
      <div>
        <Label>How do you feel after eating?</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {moods.map((mood) => (
            <Button
              key={mood}
              variant={mealData.mood_after === mood ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateMealData({ mood_after: mood })}
              className="text-sm"
            >
              {mood}
            </Button>
          ))}
        </div>
      </div>

      {/* Optional: Routine Context */}
      {mealData.routineId && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Routine Integration
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            This meal will be logged as part of your nutrition routine for better tracking and insights.
          </p>
        </div>
      )}
    </div>
  );
}
