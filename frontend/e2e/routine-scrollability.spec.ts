import { test, expect } from '@playwright/test';

test.describe('Routine Creation Popup Scrollability', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the fitness page
    await page.goto('/fitness');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Click on the "Create Custom Routine" button
    await page.click('button:has-text("Create Custom Routine")');
    
    // Wait for the modal to appear
    await page.waitForSelector('[role="dialog"]');
  });

  test('should display modal with proper dimensions and scrollability', async ({ page }) => {
    const modal = page.locator('[role="dialog"]');
    
    // Check if modal is visible
    await expect(modal).toBeVisible();
    
    // Get modal dimensions
    const boundingBox = await modal.boundingBox();
    expect(boundingBox).toBeTruthy();
    
    console.log('Modal dimensions:', boundingBox);
    
    // Check that all 7 days are visible
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    for (const day of days) {
      const dayElement = modal.locator(`text=${day}`).first();
      const isVisible = await dayElement.isVisible();
      console.log(`${day} visible:`, isVisible);
      
      if (!isVisible) {
        // If not visible, check if it's in the scrollable area
        const scrollableArea = modal.locator('.overflow-y-auto');
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
          
          const isVisibleAfterScroll = await dayElement.isVisible();
          console.log(`${day} visible after scroll:`, isVisibleAfterScroll);
        }
      }
    }
  });

  test('should debug modal CSS properties', async ({ page }) => {
    const modal = page.locator('[role="dialog"]');
    
    // Check modal CSS properties
    const modalStyles = await modal.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el);
      return {
        height: computedStyle.height,
        maxHeight: computedStyle.maxHeight,
        overflow: computedStyle.overflow,
        display: computedStyle.display,
        flexDirection: computedStyle.flexDirection
      };
    });
    
    console.log('Modal CSS properties:', modalStyles);
    
    // Check scrollable area styles
    const scrollableArea = modal.locator('.overflow-y-auto');
    const scrollableStyles = await scrollableArea.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el);
      return {
        height: computedStyle.height,
        maxHeight: computedStyle.maxHeight,
        overflow: computedStyle.overflow,
        overflowY: computedStyle.overflowY,
        flex: computedStyle.flex,
        flexGrow: computedStyle.flexGrow,
        flexShrink: computedStyle.flexShrink
      };
    });
    
    console.log('Scrollable area CSS properties:', scrollableStyles);
  });
});
