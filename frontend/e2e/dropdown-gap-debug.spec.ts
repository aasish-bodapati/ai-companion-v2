import { test, expect } from '@playwright/test';

test.describe('Dropdown Gap Debug - Complete Fix', () => {
  test('debug and fix dropdown positioning gap', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/debug-initial.png', fullPage: true });
    
    // Check if we need to login
    const loginButton = page.locator('button:has-text("Sign in")');
    if (await loginButton.isVisible()) {
      // Try to login with test credentials
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'testpassword');
      await loginButton.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Navigate to fitness page
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of fitness page
    await page.screenshot({ path: 'test-results/debug-fitness-page.png', fullPage: true });
    
    // Look for routines tab or custom routine button
    const routinesTab = page.locator('text=My Routines').first();
    if (await routinesTab.isVisible()) {
      await routinesTab.click();
      await page.waitForTimeout(1000);
    }
    
    // Look for Create Custom Routine button
    const createButton = page.locator('text=Create Custom Routine').first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      // Fill routine name
      await page.fill('input[placeholder="e.g., My Custom Workout"]', 'Test Routine');
      
      // Add workout
      await page.click('text=+ Add Workout');
      await page.waitForTimeout(1000);
      
      // Find exercise name input
      const exerciseInput = page.locator('input[placeholder="Exercise Name"]').first();
      await expect(exerciseInput).toBeVisible();
      
      // Type to trigger dropdown
      await exerciseInput.fill('push');
      await page.waitForTimeout(1000);
      
      // Wait for dropdown
      const dropdown = page.locator('[data-dropdown]');
      if (await dropdown.isVisible()) {
        // Get bounding boxes
        const inputBox = await exerciseInput.boundingBox();
        const dropdownBox = await dropdown.boundingBox();
        
        console.log('Input bounding box:', inputBox);
        console.log('Dropdown bounding box:', dropdownBox);
        
        if (inputBox && dropdownBox) {
          const gap = dropdownBox.y - (inputBox.y + inputBox.height);
          console.log('Gap between input and dropdown:', gap, 'px');
          
          // Take screenshot for debugging
          await page.screenshot({ 
            path: 'test-results/debug-dropdown-gap.png',
            fullPage: true 
          });
          
          // The gap should be 0 or negative (overlapping)
          expect(gap).toBeLessThanOrEqual(2);
        }
      }
    }
  });
});
