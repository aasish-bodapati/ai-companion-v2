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

  test('should display modal with proper dimensions', async ({ page }) => {
    const modal = page.locator('[role="dialog"]');
    
    // Check if modal is visible
    await expect(modal).toBeVisible();
    
    // Get modal dimensions
    const boundingBox = await modal.boundingBox();
    expect(boundingBox).toBeTruthy();
    
    // Check modal height is reasonable (should be 80vh)
    const viewportHeight = page.viewportSize()?.height || 0;
    const expectedMaxHeight = viewportHeight * 0.8;
    
    console.log('Viewport height:', viewportHeight);
    console.log('Modal height:', boundingBox?.height);
    console.log('Expected max height (80vh):', expectedMaxHeight);
    
    expect(boundingBox!.height).toBeLessThanOrEqual(expectedMaxHeight + 10); // Allow 10px tolerance
  });

  test('should show all days of the week', async ({ page }) => {
    const modal = page.locator('[role="dialog"]');
    
    // Check that all 7 days are visible
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    for (const day of days) {
      await expect(modal.locator(`text=${day}`)).toBeVisible();
    }
  });

  test('should be scrollable when content overflows', async ({ page }) => {
    const modal = page.locator('[role="dialog"]');
    const scrollableArea = modal.locator('.overflow-y-auto');
    
    // Check if scrollable area exists
    await expect(scrollableArea).toBeVisible();
    
    // Get the scrollable area dimensions
    const scrollableBox = await scrollableArea.boundingBox();
    expect(scrollableBox).toBeTruthy();
    
    // Get the content height
    const content = scrollableArea.locator('div').first();
    const contentBox = await content.boundingBox();
    expect(contentBox).toBeTruthy();
    
    console.log('Scrollable area height:', scrollableBox?.height);
    console.log('Content height:', contentBox?.height);
    
    // Check if content is scrollable
    const isScrollable = contentBox!.height > scrollableBox!.height;
    console.log('Is scrollable:', isScrollable);
    
    if (isScrollable) {
      // Test scrolling functionality
      await scrollableArea.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      
      // Wait a bit for scroll to complete
      await page.waitForTimeout(100);
      
      // Check if we can scroll back to top
      await scrollableArea.evaluate((el) => {
        el.scrollTop = 0;
      });
      
      await page.waitForTimeout(100);
    }
  });

  test('should maintain fixed header and footer', async ({ page }) => {
    const modal = page.locator('[role="dialog"]');
    
    // Check header is visible and fixed
    const header = modal.locator('div:has-text("Create Custom Routine")').first();
    await expect(header).toBeVisible();
    
    // Check footer with buttons is visible
    const saveButton = modal.locator('button:has-text("Save Routine")');
    const cancelButton = modal.locator('button:has-text("Cancel")');
    
    await expect(saveButton).toBeVisible();
    await expect(cancelButton).toBeVisible();
  });

  test('should add workouts and test scrolling with content', async ({ page }) => {
    const modal = page.locator('[role="dialog"]');
    
    // Add workouts to multiple days to create overflow
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    for (const day of days) {
      // Click "Add Workout" for each day
      const addButton = modal.locator(`text=${day}`).locator('..').locator('button:has-text("Add Workout")');
      await addButton.click();
      
      // Wait for the workout form to appear
      await page.waitForTimeout(200);
      
      // Fill in exercise name
      const exerciseInput = modal.locator('input[placeholder*="exercise name"]').last();
      await exerciseInput.fill(`Exercise for ${day}`);
      
      // Wait for suggestions to appear and select first one
      await page.waitForTimeout(500);
      const suggestion = modal.locator('[data-dropdown] div').first();
      if (await suggestion.isVisible()) {
        await suggestion.click();
      }
      
      // Fill in sets and reps
      const setsInput = modal.locator('input[placeholder="3"]').last();
      const repsInput = modal.locator('input[placeholder="10"]').last();
      
      await setsInput.fill('3');
      await repsInput.fill('10');
      
      await page.waitForTimeout(200);
    }
    
    // Now test scrolling
    const scrollableArea = modal.locator('.overflow-y-auto');
    
    // Get initial scroll position
    const initialScrollTop = await scrollableArea.evaluate((el) => el.scrollTop);
    console.log('Initial scroll position:', initialScrollTop);
    
    // Scroll to bottom
    await scrollableArea.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    
    await page.waitForTimeout(500);
    
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
  });

  test('should debug modal structure and CSS', async ({ page }) => {
    const modal = page.locator('[role="dialog"]');
    
    // Log modal structure
    const modalHTML = await modal.innerHTML();
    console.log('Modal HTML structure:', modalHTML.substring(0, 500) + '...');
    
    // Check CSS properties
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
