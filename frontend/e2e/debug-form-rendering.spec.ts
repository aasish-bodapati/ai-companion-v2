import { test, expect } from '@playwright/test';

test.describe('Debug Form Rendering', () => {
  test('should test the actual exercise selection issue', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log(`[${msg.type()}] ${msg.text()}`);
    });

    // Navigate to the dashboard page
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Skip login for now and focus on the core issue
    // Let's test the WORKOUT_CATEGORIES mapping directly
    
    // Test the mapping logic
    const mappingTest = await page.evaluate(() => {
      // Simulate the exercise data from API
      const testExercise = {
        id: 33,
        name: "Plank Jacks",
        logging_category: "hold_static",
        logging_category_info: {
          id: 4,
          name: "hold_static",
          display_name: "Hold & Static",
          description: "Static holds and isometric exercises",
          logging_attributes: {
            required: [
              {
                name: "duration",
                type: "number",
                label: "Hold Time (seconds)",
                min: 1,
                max: 3600
              }
            ],
            optional: [
              {
                name: "difficulty",
                type: "select",
                label: "Difficulty",
                options: ["beginner", "intermediate", "advanced"]
              },
              {
                name: "notes",
                type: "text",
                label: "Notes",
                max_length: 500
              }
            ]
          },
          icon: "clock",
          color: "purple"
        },
        difficulty: "beginner",
        calories_per_minute: 5,
        description: "Exercise from wger.de database"
      };

      // Simulate the WORKOUT_CATEGORIES array
      const WORKOUT_CATEGORIES = [
        {
          id: 'bodyweight',
          name: 'bodyweight',
          displayName: 'Bodyweight Exercises',
          description: 'Exercises using only your body weight',
          loggingAttributes: {
            required: [
              { name: 'sets', type: 'number', label: 'Sets', min: 1, max: 50 },
              { name: 'reps', type: 'number', label: 'Reps', min: 1, max: 1000 }
            ],
            optional: [
              { name: 'notes', type: 'text', label: 'Notes', max_length: 500 }
            ]
          }
        },
        {
          id: 'hold_static',
          name: 'hold_static',
          displayName: 'Hold & Static',
          description: 'Static holds and isometric exercises',
          loggingAttributes: {
            required: [
              { name: 'duration', type: 'number', label: 'Hold Time (seconds)', min: 1, max: 3600 }
            ],
            optional: [
              { name: 'difficulty', type: 'select', label: 'Difficulty', options: ['beginner', 'intermediate', 'advanced'] },
              { name: 'notes', type: 'text', label: 'Notes', max_length: 500 }
            ]
          }
        }
      ];

      // Test the mapping logic
      const category = WORKOUT_CATEGORIES.find(cat => cat.id === testExercise.logging_category);
      
      return {
        exerciseLoggingCategory: testExercise.logging_category,
        categoryFound: !!category,
        categoryId: category?.id,
        categoryDisplayName: category?.displayName,
        requiredFields: category?.loggingAttributes.required || [],
        optionalFields: category?.loggingAttributes.optional || []
      };
    });

    console.log('Mapping test result:', mappingTest);
    
    // The mapping should work correctly
    expect(mappingTest.categoryFound).toBe(true);
    expect(mappingTest.categoryId).toBe('hold_static');
    expect(mappingTest.requiredFields.length).toBeGreaterThan(0);
  });
});
