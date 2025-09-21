import { test, expect } from '@playwright/test';

test.describe('Focused Dropdown Test', () => {
  test('test dropdown positioning with detailed debugging', async ({ page }) => {
    // Go directly to fitness page
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');
    
    // Click on routines tab
    await page.click('text=My Routines');
    await page.waitForTimeout(2000);
    
    // Click create custom routine
    await page.click('text=Create Custom Routine');
    await page.waitForSelector('[role="dialog"]');
    
    // Fill routine name
    await page.fill('input[placeholder="e.g., My Custom Workout"]', 'Test');
    
    // Add workout
    await page.click('text=+ Add Workout');
    await page.waitForTimeout(1000);
    
    // Type in exercise input to trigger dropdown
    const exerciseInput = page.locator('input[placeholder="Exercise Name"]').first();
    await exerciseInput.click();
    await exerciseInput.fill('push');
    
    // Wait for dropdown to appear
    await page.waitForSelector('[data-dropdown]', { timeout: 5000 });
    
    // Get measurements
    const inputRect = await exerciseInput.boundingBox();
    const dropdown = page.locator('[data-dropdown]');
    const dropdownRect = await dropdown.boundingBox();
    
    console.log('Input rect:', inputRect);
    console.log('Dropdown rect:', dropdownRect);
    
    if (inputRect && dropdownRect) {
      const gap = dropdownRect.y - (inputRect.y + inputRect.height);
      console.log('Gap:', gap, 'px');
      
      // Take screenshot
      await page.screenshot({ 
        path: 'test-results/focused-dropdown-test.png',
        fullPage: true 
      });
      
      // Log the gap for debugging
      console.log(`Gap between input and dropdown: ${gap}px`);
    }
  });
});
