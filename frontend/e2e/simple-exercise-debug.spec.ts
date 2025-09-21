import { test, expect } from '@playwright/test';

test.describe('Simple Exercise Debug', () => {
  test('should test exercise selection directly', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log(`[${msg.type()}] ${msg.text()}`);
    });

    // Navigate to the dashboard page
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'debug-dashboard.png' });

    // Check if we can access the API directly
    const response = await page.request.get('http://localhost:8000/api/v1/health/exercises/all');
    console.log('API Response status:', response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      console.log('Number of exercises:', data.exercises?.length || 0);
      
      if (data.exercises && data.exercises.length > 0) {
        const firstExercise = data.exercises[0];
        console.log('First exercise:', JSON.stringify(firstExercise, null, 2));
        
        // Check if the exercise has the required structure
        expect(firstExercise).toHaveProperty('id');
        expect(firstExercise).toHaveProperty('name');
        expect(firstExercise).toHaveProperty('logging_category');
        expect(firstExercise).toHaveProperty('logging_category_info');
        
        // Check the logging category
        console.log('Logging category:', firstExercise.logging_category);
        console.log('Logging category info:', firstExercise.logging_category_info);
      }
    }

    // Now let's try to find any element that might contain the custom routine builder
    const allText = await page.textContent('body');
    console.log('Page contains "Custom Routine":', allText?.includes('Custom Routine'));
    console.log('Page contains "Create":', allText?.includes('Create'));
    console.log('Page contains "Routine":', allText?.includes('Routine'));

    // Look for any buttons or elements that might be the create button
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons`);
    
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      const isVisible = await buttons[i].isVisible();
      console.log(`Button ${i}: "${text}" (visible: ${isVisible})`);
    }

    // Look for any dialogs or modals
    const dialogs = await page.locator('[role="dialog"]').all();
    console.log(`Found ${dialogs.length} dialogs`);

    // Look for any elements with "routine" in the text
    const routineElements = await page.locator('*:has-text("routine")').all();
    console.log(`Found ${routineElements.length} elements containing "routine"`);
    
    for (let i = 0; i < Math.min(routineElements.length, 5); i++) {
      const text = await routineElements[i].textContent();
      const tagName = await routineElements[i].evaluate(el => el.tagName);
      console.log(`Routine element ${i} (${tagName}): "${text?.substring(0, 100)}..."`);
    }
  });

  test('should check WORKOUT_CATEGORIES constant', async ({ page }) => {
    // Navigate to the page
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Try to access WORKOUT_CATEGORIES through the window object
    const categories = await page.evaluate(() => {
      // Check if it's available on window
      if ((window as any).WORKOUT_CATEGORIES) {
        return (window as any).WORKOUT_CATEGORIES;
      }
      
      // Try to find it in the React component tree
      const reactRoot = document.querySelector('#__next');
      if (reactRoot) {
        // Look for any data attributes that might contain the categories
        const dataAttrs = Array.from(reactRoot.attributes)
          .filter(attr => attr.name.startsWith('data-'))
          .map(attr => ({ name: attr.name, value: attr.value }));
        
        return { found: 'data-attributes', attrs: dataAttrs };
      }
      
      return 'WORKOUT_CATEGORIES not found';
    });

    console.log('WORKOUT_CATEGORIES check:', categories);
  });
});
