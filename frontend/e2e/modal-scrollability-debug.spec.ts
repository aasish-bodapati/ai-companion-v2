import { test, expect } from '@playwright/test';

test.describe('Modal Scrollability Debug', () => {
  test('should test modal scrollability directly', async ({ page }) => {
    // Navigate to the fitness page
    await page.goto('/fitness');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'fitness-page-debug.png' });
    
    // Look for any button that might open a routine modal
    const buttons = await page.locator('button').all();
    console.log('Found buttons:', buttons.length);
    
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      console.log(`Button ${i}: "${text}"`);
    }
    
    // Try to find and click any routine-related button
    const routineButton = page.locator('button:has-text("Routine")').first();
    if (await routineButton.isVisible()) {
      console.log('Found routine button, clicking...');
      await routineButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Look for any modal that might have appeared
    const modals = await page.locator('[role="dialog"], .modal, [data-testid*="modal"]').all();
    console.log('Found modals:', modals.length);
    
    if (modals.length > 0) {
      const modal = modals[0];
      await expect(modal).toBeVisible();
      
      // Test scrollability
      const scrollableArea = modal.locator('.overflow-y-auto');
      if (await scrollableArea.isVisible()) {
        console.log('Found scrollable area');
        
        // Get dimensions
        const scrollableBox = await scrollableArea.boundingBox();
        const contentBox = await scrollableArea.locator('div').first().boundingBox();
        
        console.log('Scrollable area height:', scrollableBox?.height);
        console.log('Content height:', contentBox?.height);
        console.log('Is scrollable:', contentBox && scrollableBox && contentBox.height > scrollableBox.height);
        
        // Test scrolling
        if (contentBox && scrollableBox && contentBox.height > scrollableBox.height) {
          await scrollableArea.evaluate((el) => {
            el.scrollTop = el.scrollHeight;
          });
          
          await page.waitForTimeout(500);
          console.log('Scrolled to bottom');
          
          // Check if we can scroll back to top
          await scrollableArea.evaluate((el) => {
            el.scrollTop = 0;
          });
          
          await page.waitForTimeout(500);
          console.log('Scrolled back to top');
        }
      }
    }
  });
});
