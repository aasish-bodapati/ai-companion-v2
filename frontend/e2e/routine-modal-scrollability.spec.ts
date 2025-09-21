import { test, expect } from '@playwright/test';

test.describe('Routine Modal Scrollability', () => {
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

  test('should test routine modal scrollability', async ({ page }) => {
    // Look for routine-related buttons
    const buttons = await page.locator('button').all();
    console.log('Found buttons after login:', buttons.length);
    
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      console.log(`Button ${i}: "${text}"`);
    }
    
    // Try to find and click any routine-related button
    const routineButtons = [
      'button:has-text("Routine")',
      'button:has-text("Create")',
      'button:has-text("Custom")',
      'button:has-text("Workout")',
      'button:has-text("Add")'
    ];
    
    let modalOpened = false;
    for (const selector of routineButtons) {
      const button = page.locator(selector).first();
      if (await button.isVisible()) {
        console.log(`Found button with selector: ${selector}`);
        await button.click();
        await page.waitForTimeout(1000);
        
        // Check if modal opened
        const modal = page.locator('[role="dialog"]').first();
        if (await modal.isVisible()) {
          console.log('Modal opened!');
          modalOpened = true;
          break;
        }
      }
    }
    
    if (!modalOpened) {
      console.log('No modal opened, taking screenshot for debugging');
      await page.screenshot({ path: 'fitness-page-no-modal.png' });
      return;
    }
    
    // Test the modal scrollability
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();
    
    // Get modal dimensions
    const boundingBox = await modal.boundingBox();
    console.log('Modal dimensions:', boundingBox);
    
    // Check for scrollable area
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
        console.log('Testing scroll functionality...');
        
        // Scroll to bottom
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
        
        // Test if all days are visible
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        for (const day of days) {
          const dayElement = modal.locator(`text=${day}`).first();
          const isVisible = await dayElement.isVisible();
          console.log(`${day} visible:`, isVisible);
        }
      } else {
        console.log('Content is not scrollable - all content fits in the modal');
      }
    } else {
      console.log('No scrollable area found');
    }
    
    // Take a screenshot of the modal
    await modal.screenshot({ path: 'routine-modal-debug.png' });
  });
});
