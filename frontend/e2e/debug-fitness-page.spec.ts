import { test, expect } from '@playwright/test';

test.describe('Debug Fitness Page', () => {
  test('should debug what is on the fitness page', async ({ page }) => {
    // Navigate to the fitness page
    await page.goto('/fitness');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Login if needed
    const loginButton = page.locator('button:has-text("Sign in")').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(1000);
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'test123');
      await page.click('button:has-text("Sign in")');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'fitness-page-debug.png' });
    
    // List all buttons on the page
    const buttons = await page.locator('button').all();
    console.log('Found buttons:', buttons.length);
    
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      console.log(`Button ${i}: "${text}"`);
    }
    
    // List all tabs
    const tabs = await page.locator('[data-testid*="tab"]').all();
    console.log('Found tabs:', tabs.length);
    
    for (let i = 0; i < tabs.length; i++) {
      const text = await tabs[i].textContent();
      console.log(`Tab ${i}: "${text}"`);
    }
    
    // Try to click on the routines tab using data-testid
    const routinesTab = page.locator('[data-testid="routines-tab"]');
    if (await routinesTab.isVisible()) {
      console.log('Found routines tab, clicking...');
      await routinesTab.click();
      await page.waitForTimeout(1000);
      
      // Take another screenshot
      await page.screenshot({ path: 'fitness-page-routines-tab.png' });
      
      // Look for the Create Custom Routine button
      const createButton = page.locator('button:has-text("Create Custom Routine")');
      if (await createButton.isVisible()) {
        console.log('Found Create Custom Routine button, clicking...');
        await createButton.click();
        await page.waitForTimeout(1000);
        
        // Check if modal opened
        const modal = page.locator('[role="dialog"]');
        if (await modal.isVisible()) {
          console.log('Modal opened!');
          
          // Test scrolling
          const scrollableArea = modal.locator('.overflow-y-auto');
          if (await scrollableArea.isVisible()) {
            console.log('Found scrollable area');
            
            // Get dimensions
            const scrollableBox = await scrollableArea.boundingBox();
            const contentBox = await scrollableArea.locator('div').first().boundingBox();
            
            console.log('Scrollable area height:', scrollableBox?.height);
            console.log('Content height:', contentBox?.height);
            console.log('Is scrollable:', contentBox && scrollableBox && contentBox.height > scrollableBox.height);
            
            // Test scroll functionality
            if (contentBox && scrollableBox && contentBox.height > scrollableBox.height) {
              console.log('Testing scroll...');
              
              const initialScrollTop = await scrollableArea.evaluate((el) => el.scrollTop);
              console.log('Initial scroll position:', initialScrollTop);
              
              await scrollableArea.evaluate((el) => {
                el.scrollTop = el.scrollHeight;
              });
              
              await page.waitForTimeout(500);
              
              const finalScrollTop = await scrollableArea.evaluate((el) => el.scrollTop);
              console.log('Final scroll position:', finalScrollTop);
              console.log('Scroll worked:', finalScrollTop > initialScrollTop);
            } else {
              console.log('Content fits in modal - no scrolling needed');
            }
          }
          
          // Take screenshot of modal
          await modal.screenshot({ path: 'modal-debug.png' });
        } else {
          console.log('Modal did not open');
        }
      } else {
        console.log('Create Custom Routine button not found');
      }
    } else {
      console.log('Routines tab not found');
    }
  });
});
