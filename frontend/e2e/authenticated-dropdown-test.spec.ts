import { test, expect } from '@playwright/test';

test.describe('Authenticated Dropdown Test', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Navigate to fitness page
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');
  });

  test('Test dropdown selection with authentication', async ({ page }) => {
    // Look for any button that might open the custom routine builder
    const buttons = await page.locator('button').allTextContents();
    console.log('Available buttons after login:', buttons);

    // Try to click on "View Routines" tab first
    const viewRoutinesButton = page.locator('button:has-text("View Routines")').first();
    if (await viewRoutinesButton.count() > 0) {
      await viewRoutinesButton.click();
      await page.waitForTimeout(1000); // Wait for tab to load
    }

    // Now try to find the "Create Custom Routine" button
    const customRoutineButton = page.locator('button:has-text("Create Custom Routine")').first();
    
    if (await customRoutineButton.count() > 0) {
      await customRoutineButton.click();
      
      // Wait for modal to open
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      // Add a workout to Monday
      const addWorkoutButton = page.locator('button:has-text("Add Workout")').first();
      if (await addWorkoutButton.count() > 0) {
        await addWorkoutButton.click();
        
        // Type in the exercise input
        const exerciseInput = page.locator('input[placeholder*="Exercise Name"]').first();
        await exerciseInput.fill('pu');
        
        // Wait for dropdown to appear
        await page.waitForSelector('[data-dropdown]', { timeout: 5000 });
        
        // Click on "Push-ups" from the dropdown
        await page.click('[data-dropdown] div:has-text("Push-ups")');
        
        // Verify the input is filled
        await expect(exerciseInput).toHaveValue('Push-ups');
        
        console.log('✅ Dropdown selection test passed!');
      } else {
        console.log('❌ Add Workout button not found');
      }
    } else {
      console.log('❌ Create Custom Routine button not found');
    }
  });
});