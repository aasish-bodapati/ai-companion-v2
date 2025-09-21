import { test, expect } from '@playwright/test';

test.describe('Routine Modal Scrollability - Force Content', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the fitness page
    await page.goto('/fitness');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we need to login
    const loginButton = page.locator('button:has-text("Sign in")').first();
    if (await loginButton.isVisible()) {
      console.log('Need to login first');
      
      // Click login button
      await loginButton.click();
      await page.waitForTimeout(1000);
      
      // Fill in login form
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'test123');
      
      // Click sign in button
      await page.click('button:has-text("Sign in")');
      
      // Wait for login to complete
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
  });

  test('should test routine modal scrollability with added content', async ({ page }) => {
    // Find and click the routine button
    const routineButton = page.locator('button:has-text("Create Routine")').first();
    await routineButton.click();
    await page.waitForTimeout(1000);
    
    // Wait for modal to open
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();
    
    console.log('Modal opened successfully');
    
    // Get initial modal dimensions
    const initialBoundingBox = await modal.boundingBox();
    console.log('Initial modal dimensions:', initialBoundingBox);
    
    // Add workouts to multiple days to create overflow
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    for (const day of days) {
      console.log(`Adding workout to ${day}...`);
      
      // Click "Add Workout" for each day
      const addButton = modal.locator(`text=${day}`).locator('..').locator('button:has-text("Add Workout")').first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(200);
        
        // Fill in exercise name
        const exerciseInput = modal.locator('input[placeholder*="exercise name"]').last();
        if (await exerciseInput.isVisible()) {
          await exerciseInput.fill(`Exercise for ${day}`);
          await page.waitForTimeout(500);
          
          // Try to select first suggestion if available
          const suggestion = modal.locator('[data-dropdown] div').first();
          if (await suggestion.isVisible()) {
            await suggestion.click();
            await page.waitForTimeout(200);
          }
          
          // Fill in sets and reps
          const setsInput = modal.locator('input[placeholder="3"]').last();
          const repsInput = modal.locator('input[placeholder="10"]').last();
          
          if (await setsInput.isVisible()) {
            await setsInput.fill('3');
          }
          if (await repsInput.isVisible()) {
            await repsInput.fill('10');
          }
          
          await page.waitForTimeout(200);
        }
      }
    }
    
    // Now test scrolling after adding content
    const scrollableArea = modal.locator('.overflow-y-auto');
    if (await scrollableArea.isVisible()) {
      console.log('Testing scroll functionality after adding content...');
      
      // Get dimensions after adding content
      const scrollableBox = await scrollableArea.boundingBox();
      const contentBox = await scrollableArea.locator('div').first().boundingBox();
      
      console.log('Scrollable area height after content:', scrollableBox?.height);
      console.log('Content height after content:', contentBox?.height);
      console.log('Is scrollable after content:', contentBox && scrollableBox && contentBox.height > scrollableBox.height);
      
      // Test scrolling if content overflows
      if (contentBox && scrollableBox && contentBox.height > scrollableBox.height) {
        console.log('Content overflows - testing scroll...');
        
        // Get initial scroll position
        const initialScrollTop = await scrollableArea.evaluate((el) => el.scrollTop);
        console.log('Initial scroll position:', initialScrollTop);
        
        // Scroll to bottom
        await scrollableArea.evaluate((el) => {
          el.scrollTop = el.scrollHeight;
        });
        
        await page.waitForTimeout(500);
        
        // Check final scroll position
        const finalScrollTop = await scrollableArea.evaluate((el) => el.scrollTop);
        console.log('Final scroll position:', finalScrollTop);
        console.log('Scroll height:', await scrollableArea.evaluate((el) => el.scrollHeight));
        
        // Check if we can see the last day (Sunday)
        const sundayCard = modal.locator('text=Sunday');
        const isSundayVisible = await sundayCard.isVisible();
        console.log('Sunday visible after scroll:', isSundayVisible);
        
        // Scroll back to top
        await scrollableArea.evaluate((el) => {
          el.scrollTop = 0;
        });
        
        await page.waitForTimeout(500);
        
        // Check if we can see the first day (Monday)
        const mondayCard = modal.locator('text=Monday');
        const isMondayVisible = await mondayCard.isVisible();
        console.log('Monday visible after scroll to top:', isMondayVisible);
        
        // Take screenshot of scrolled state
        await modal.screenshot({ path: 'routine-modal-scrolled.png' });
        
      } else {
        console.log('Content still fits in modal - no scrolling needed');
        
        // Take screenshot of current state
        await modal.screenshot({ path: 'routine-modal-no-scroll.png' });
      }
    } else {
      console.log('No scrollable area found');
    }
  });
});
