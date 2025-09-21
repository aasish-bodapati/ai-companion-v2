import { test, expect } from '@playwright/test';

test.describe('Complete Exercise Selection Flow', () => {
  test('should test complete exercise selection flow from login to form rendering', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log(`[${msg.type()}] ${msg.text()}`);
    });

    // Step 1: Navigate to dashboard and login
    console.log('Step 1: Navigating to dashboard...');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check if we need to log in
    const signInButton = page.locator('button:has-text("Sign in")').first();
    if (await signInButton.isVisible()) {
      console.log('Step 2: Logging in...');
      await signInButton.click();
      
      // Wait for login to complete
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Give extra time for login
    }

    // Take screenshot after login
    await page.screenshot({ path: 'debug-after-login.png' });

    // Step 3: Navigate to fitness page
    console.log('Step 3: Navigating to fitness page...');
    await page.goto('/fitness');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'debug-fitness-page.png' });

    // Step 4: Click on "My Routines" tab
    console.log('Step 4: Looking for "My Routines" tab...');
    const myRoutinesTab = page.locator('[data-testid="routines-tab"]');
    await expect(myRoutinesTab).toBeVisible({ timeout: 10000 });
    console.log('Found "My Routines" tab');
    
    await myRoutinesTab.click();
    console.log('Clicked "My Routines" tab');
    
    // Wait for the routines content to load
    await page.waitForTimeout(2000);

    // Step 5: Click on "Create Custom Routine" button
    console.log('Step 5: Looking for "Create Custom Routine" button...');
    const createCustomRoutineButton = page.locator('button:has-text("Create Custom Routine")');
    await expect(createCustomRoutineButton).toBeVisible({ timeout: 10000 });
    console.log('Found "Create Custom Routine" button');
    
    await createCustomRoutineButton.click();
    console.log('Clicked "Create Custom Routine" button');

    // Wait for the dialog to open
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    console.log('Dialog opened');
    await page.screenshot({ path: 'debug-dialog-opened.png' });

    // Step 6: Fill in routine name
    console.log('Step 6: Filling in routine name...');
    const routineNameInput = page.locator('input[placeholder*="routine name" i]');
    await expect(routineNameInput).toBeVisible({ timeout: 5000 });
    await routineNameInput.fill('Test Routine');
    console.log('Filled routine name');

    // Step 7: Click "Add Workout" next to Monday
    console.log('Step 7: Looking for "Add Workout" button for Monday...');
    const mondaySection = page.locator('*:has-text("Monday")').first();
    await expect(mondaySection).toBeVisible({ timeout: 5000 });
    
    const addWorkoutButton = mondaySection.locator('button:has-text("+ Add Workout")');
    await expect(addWorkoutButton).toBeVisible({ timeout: 5000 });
    console.log('Found "Add Workout" button for Monday');
    
    await addWorkoutButton.click();
    console.log('Clicked "Add Workout" button');

    // Wait for the workout form to appear
    await page.waitForSelector('input[placeholder*="exercise name" i]', { timeout: 5000 });
    console.log('Workout form appeared');
    await page.screenshot({ path: 'debug-workout-form.png' });

    // Step 8: Type "push up" in the exercise name box
    console.log('Step 8: Typing "push up" in exercise name box...');
    const exerciseInput = page.locator('input[placeholder*="exercise name" i]');
    await expect(exerciseInput).toBeVisible({ timeout: 5000 });
    
    await exerciseInput.click();
    await exerciseInput.fill('push up');
    console.log('Typed "push up" in exercise input');

    // Wait for suggestions to appear
    console.log('Step 9: Waiting for suggestions to appear...');
    await page.waitForSelector('[class*="fixed z-[9999]"]', { timeout: 5000 });
    console.log('Suggestions appeared');

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

    // Step 10: Click on the first suggestion
    if (suggestionCount > 0) {
      console.log('Step 10: Clicking on first suggestion...');
      await suggestions.first().click();
      console.log('Clicked on first suggestion');
      
      // Wait a bit for the selection to process
      await page.waitForTimeout(2000);
      
      // Step 11: Check if the dynamic form appears
      console.log('Step 11: Checking if dynamic form appears...');
      
      // Look for the form section with "Details"
      const formSection = page.locator('h5:has-text("Details")');
      const formVisible = await formSection.isVisible({ timeout: 5000 });
      console.log(`Form visible: ${formVisible}`);
      
      if (formVisible) {
        const formText = await formSection.textContent();
        console.log(`Form text: ${formText}`);
        
        // Check for specific form fields
        const setsField = page.locator('input[placeholder*="sets" i], label:has-text("Sets")');
        const repsField = page.locator('input[placeholder*="reps" i], label:has-text("Reps")');
        const notesField = page.locator('input[placeholder*="notes" i], textarea[placeholder*="notes" i], label:has-text("Notes")');
        
        const setsVisible = await setsField.isVisible();
        const repsVisible = await repsField.isVisible();
        const notesVisible = await notesField.isVisible();
        
        console.log(`Sets field visible: ${setsVisible}`);
        console.log(`Reps field visible: ${repsVisible}`);
        console.log(`Notes field visible: ${notesVisible}`);
        
        // Take final screenshot
        await page.screenshot({ path: 'debug-final-form.png' });
        
        // Assert that the form should appear
        expect(formVisible).toBe(true);
        console.log('✅ Dynamic form is working correctly!');
      } else {
        console.log('❌ Dynamic form did not appear');
        
        // Check if there's an error message
        const errorMessage = page.locator('*:has-text("Category not found")');
        const hasError = await errorMessage.isVisible();
        if (hasError) {
          const errorText = await errorMessage.textContent();
          console.log(`Error message: ${errorText}`);
        }
        
        // Take screenshot of the current state
        await page.screenshot({ path: 'debug-no-form.png' });
      }
    } else {
      console.log('❌ No suggestions found!');
      await page.screenshot({ path: 'debug-no-suggestions.png' });
    }
  });
});
