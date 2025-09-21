import { test, expect } from '@playwright/test';

test.describe('Dropdown Positioning Debug', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the fitness page where the custom routine builder is located
    await page.goto('http://localhost:3000/fitness');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should debug dropdown positioning gap', async ({ page }) => {
    // Click on "Create Custom Routine" button
    await page.click('text=Create Custom Routine');
    
    // Wait for the dialog to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Fill in routine name
    await page.fill('input[placeholder="e.g., My Custom Workout"]', 'Test Routine');
    
    // Add a workout for Monday
    await page.click('text=+ Add Workout');
    
    // Wait for the workout form to appear
    await page.waitForSelector('input[placeholder="Exercise Name"]', { timeout: 5000 });
    
    // Get the input field element
    const inputField = page.locator('input[placeholder="Exercise Name"]').first();
    await expect(inputField).toBeVisible();
    
    // Type in the input field to trigger dropdown
    await inputField.fill('pu');
    
    // Wait for dropdown to appear
    await page.waitForSelector('[data-dropdown]', { timeout: 5000 });
    
    // Get the dropdown element
    const dropdown = page.locator('[data-dropdown]');
    await expect(dropdown).toBeVisible();
    
    // Get bounding boxes for debugging
    const inputBox = await inputField.boundingBox();
    const dropdownBox = await dropdown.boundingBox();
    
    console.log('Input field bounding box:', inputBox);
    console.log('Dropdown bounding box:', dropdownBox);
    
    if (inputBox && dropdownBox) {
      // Calculate the gap between input and dropdown
      const gap = dropdownBox.y - (inputBox.y + inputBox.height);
      console.log('Gap between input and dropdown:', gap, 'px');
      
      // The gap should be minimal (ideally 1-4px)
      expect(gap).toBeLessThan(10); // Allow some tolerance
      
      // Check if dropdown is positioned correctly relative to input
      expect(dropdownBox.x).toBeCloseTo(inputBox.x, 1); // Should be aligned horizontally
      expect(dropdownBox.width).toBeCloseTo(inputBox.width, 1); // Should have same width
    }
    
    // Verify dropdown content is visible
    await expect(dropdown.locator('text=Push-ups')).toBeVisible();
    await expect(dropdown.locator('text=Pull-ups')).toBeVisible();
    
    // Take a screenshot for visual debugging
    await page.screenshot({ 
      path: 'test-results/dropdown-positioning-debug.png',
      fullPage: true 
    });
  });

  test('should fix dropdown positioning with minimal gap', async ({ page }) => {
    // This test will be used to verify the fix
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');
    
    // Open custom routine builder
    await page.click('text=Create Custom Routine');
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Fill routine name and add workout
    await page.fill('input[placeholder="e.g., My Custom Workout"]', 'Test Routine');
    await page.click('text=+ Add Workout');
    await page.waitForSelector('input[placeholder="Exercise Name"]', { timeout: 5000 });
    
    // Type to trigger dropdown
    const inputField = page.locator('input[placeholder="Exercise Name"]').first();
    await inputField.fill('pu');
    await page.waitForSelector('[data-dropdown]', { timeout: 5000 });
    
    // Measure the gap
    const inputBox = await inputField.boundingBox();
    const dropdownBox = await page.locator('[data-dropdown]').boundingBox();
    
    if (inputBox && dropdownBox) {
      const gap = dropdownBox.y - (inputBox.y + inputBox.height);
      console.log('Fixed gap:', gap, 'px');
      
      // After fix, gap should be 1-4px
      expect(gap).toBeGreaterThanOrEqual(0);
      expect(gap).toBeLessThan(5);
    }
  });
});
