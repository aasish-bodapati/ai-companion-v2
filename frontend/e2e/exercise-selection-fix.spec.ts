import { test, expect } from '@playwright/test';

test.describe('Exercise Selection Fix', () => {
  test('should test exercise selection with proper login', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log(`[${msg.type()}] ${msg.text()}`);
    });

    // Navigate to the dashboard page
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check if we need to log in
    const signInButton = page.locator('button:has-text("Sign in")').first();
    if (await signInButton.isVisible()) {
      console.log('User needs to log in, clicking sign in button');
      await signInButton.click();
      
      // Wait for login to complete
      await page.waitForLoadState('networkidle');
      
      // Take screenshot after login
      await page.screenshot({ path: 'debug-after-login.png' });
    }

    // Now look for the custom routine builder
    const allText = await page.textContent('body');
    console.log('Page contains "Custom Routine":', allText?.includes('Custom Routine'));
    console.log('Page contains "Create":', allText?.includes('Create'));

    // Look for any buttons that might be the create routine button
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons after login`);
    
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      const isVisible = await buttons[i].isVisible();
      console.log(`Button ${i}: "${text}" (visible: ${isVisible})`);
    }

    // Look for elements containing "routine" or "custom"
    const routineElements = await page.locator('*:has-text("routine")').all();
    const customElements = await page.locator('*:has-text("custom")').all();
    console.log(`Found ${routineElements.length} elements containing "routine"`);
    console.log(`Found ${customElements.length} elements containing "custom"`);
    
    // If we can't find the custom routine builder, let's check what's actually on the page
    if (routineElements.length === 0 && customElements.length === 0) {
      console.log('Custom routine builder not found. Checking page content...');
      
      // Look for any cards or sections that might contain the routine builder
      const cards = await page.locator('[class*="card"]').all();
      console.log(`Found ${cards.length} card elements`);
      
      for (let i = 0; i < Math.min(cards.length, 3); i++) {
        const text = await cards[i].textContent();
        console.log(`Card ${i}: "${text?.substring(0, 200)}..."`);
      }
    }
  });

  test('should test WORKOUT_CATEGORIES mapping', async ({ page }) => {
    // Test the API response and check if the logging categories match
    const response = await page.request.get('http://localhost:8000/api/v1/health/exercises/all');
    
    if (response.status() === 200) {
      const data = await response.json();
      const exercises = data.exercises || [];
      
      console.log(`Testing ${exercises.length} exercises...`);
      
      // Get unique logging categories from the API
      const apiCategories = [...new Set(exercises.map(ex => ex.logging_category))];
      console.log('API logging categories:', apiCategories);
      
      // Test if we can find matching categories in WORKOUT_CATEGORIES
      const categoryMatches = await page.evaluate((apiCats) => {
        // Try to import WORKOUT_CATEGORIES
        try {
          // This won't work in the browser, but let's see what happens
          return { error: 'Cannot import in browser context' };
        } catch (error) {
          return { error: error.message };
        }
      }, apiCategories);
      
      console.log('Category matching result:', categoryMatches);
      
      // Test a specific exercise
      const testExercise = exercises.find(ex => ex.logging_category === 'hold_static');
      if (testExercise) {
        console.log('Test exercise (hold_static):', JSON.stringify(testExercise, null, 2));
        
        // Check if the logging_category_info has the right structure
        const categoryInfo = testExercise.logging_category_info;
        console.log('Category info structure:', {
          hasId: !!categoryInfo.id,
          hasName: !!categoryInfo.name,
          hasDisplayName: !!categoryInfo.display_name,
          hasLoggingAttributes: !!categoryInfo.logging_attributes,
          hasRequired: !!(categoryInfo.logging_attributes?.required),
          hasOptional: !!(categoryInfo.logging_attributes?.optional)
        });
      }
    }
  });
});
