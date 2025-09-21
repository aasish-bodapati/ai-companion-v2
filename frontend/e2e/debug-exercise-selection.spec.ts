import { test, expect } from '@playwright/test';

test.describe('Exercise Selection Debug', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard page where the custom routine builder should be
    await page.goto('/dashboard');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should debug exercise selection in custom routine builder', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log(`[${msg.type()}] ${msg.text()}`);
    });

    // First, let's check what's on the page
    await page.screenshot({ path: 'debug-page-load.png' });
    
    // Look for any button that might be the create routine button
    const allButtons = await page.locator('button').all();
    console.log(`Found ${allButtons.length} buttons on the page`);
    
    for (let i = 0; i < allButtons.length; i++) {
      const text = await allButtons[i].textContent();
      console.log(`Button ${i}: "${text}"`);
    }

    // Try different selectors for the create button
    const createButton = page.locator('button:has-text("Create Custom Routine")').or(
      page.locator('button:has-text("Create Routine")')
    ).or(
      page.locator('[data-testid*="create"]')
    );
    
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();

    // Wait for the dialog to open
    await page.waitForSelector('[role="dialog"]');
    
    // Fill in routine name
    const routineNameInput = page.locator('input[placeholder*="routine name" i]');
    await routineNameInput.fill('Test Routine');

    // Click "Add Workout" for Monday
    const addWorkoutButton = page.locator('button:has-text("+ Add Workout")').first();
    await addWorkoutButton.click();

    // Wait for the workout form to appear
    await page.waitForSelector('input[placeholder*="exercise name" i]');

    // Click on the exercise name input
    const exerciseInput = page.locator('input[placeholder*="exercise name" i]');
    await exerciseInput.click();
    await exerciseInput.fill('push');

    // Wait for suggestions to appear
    await page.waitForSelector('[class*="fixed z-[9999]"]', { timeout: 5000 });

    // Get all suggestion options
    const suggestions = page.locator('[class*="fixed z-[9999]"] div[class*="cursor-pointer"]');
    const suggestionCount = await suggestions.count();
    
    console.log(`Found ${suggestionCount} suggestions`);

    // Log all available suggestions
    for (let i = 0; i < suggestionCount; i++) {
      const suggestion = suggestions.nth(i);
      const text = await suggestion.textContent();
      console.log(`Suggestion ${i}: ${text}`);
    }

    // Click on the first suggestion
    if (suggestionCount > 0) {
      console.log('Clicking on first suggestion...');
      await suggestions.first().click();
      
      // Wait a bit for the selection to process
      await page.waitForTimeout(1000);
      
      // Check if the form appears
      const formSection = page.locator('h5:has-text("Details")');
      const formVisible = await formSection.isVisible();
      console.log(`Form visible: ${formVisible}`);
      
      if (formVisible) {
        const formText = await formSection.textContent();
        console.log(`Form text: ${formText}`);
      }
      
      // Check the input value
      const inputValue = await exerciseInput.inputValue();
      console.log(`Input value after selection: ${inputValue}`);
      
      // Check if selectedExercise is set by looking for the form
      const hasForm = await page.locator('div:has-text("Details")').isVisible();
      console.log(`Has dynamic form: ${hasForm}`);
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'debug-exercise-selection.png' });
      
      // Assert that the form should appear
      expect(hasForm).toBe(true);
    } else {
      console.log('No suggestions found!');
      await page.screenshot({ path: 'debug-no-suggestions.png' });
    }
  });

  test('should check exercise data structure', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log(`[${msg.type()}] ${msg.text()}`);
    });

    // Navigate to the API endpoint to check exercise data
    const response = await page.request.get('http://localhost:8000/api/v1/health/exercises/all');
    console.log('Response status:', response.status());
    console.log('Response headers:', response.headers());
    
    const responseText = await response.text();
    console.log('Response text (first 500 chars):', responseText.substring(0, 500));
    
    if (response.status() === 200) {
      const data = JSON.parse(responseText);
      console.log('Exercise API response:', JSON.stringify(data, null, 2));
      
      // Check if we have exercises
      expect(data.exercises).toBeDefined();
      expect(data.exercises.length).toBeGreaterThan(0);
      
      // Check the structure of the first exercise
      const firstExercise = data.exercises[0];
      console.log('First exercise structure:', JSON.stringify(firstExercise, null, 2));
      
      // Verify required fields
      expect(firstExercise).toHaveProperty('id');
      expect(firstExercise).toHaveProperty('name');
      expect(firstExercise).toHaveProperty('logging_category');
      expect(firstExercise).toHaveProperty('logging_category_info');
      
      // Check logging category info structure
      expect(firstExercise.logging_category_info).toHaveProperty('display_name');
    } else {
      console.log('API request failed with status:', response.status());
    }
  });

  test('should check workout categories', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log(`[${msg.type()}] ${msg.text()}`);
    });

    // Navigate to the fitness page
    await page.goto('/fitness');
    await page.waitForLoadState('networkidle');

    // Execute script to check WORKOUT_CATEGORIES by importing it
    const categories = await page.evaluate(async () => {
      try {
        // Try to dynamically import the module
        const module = await import('/src/components/health/WorkoutCategorySelector.tsx');
        return module.WORKOUT_CATEGORIES || 'WORKOUT_CATEGORIES not found in module';
      } catch (error) {
        return `Error importing module: ${error.message}`;
      }
    });

    console.log('WORKOUT_CATEGORIES:', categories);
    
    // Also check if we can access it through the component
    const categoriesFromComponent = await page.evaluate(() => {
      // Look for any element that might have the categories data
      const elements = document.querySelectorAll('*');
      for (const el of elements) {
        if (el.textContent?.includes('bodyweight') || el.textContent?.includes('weighted')) {
          return el.textContent;
        }
      }
      return 'No category data found in DOM';
    });
    
    console.log('Categories from DOM:', categoriesFromComponent);
  });
});
