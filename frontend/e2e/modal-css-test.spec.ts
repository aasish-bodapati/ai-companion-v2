import { test, expect } from '@playwright/test';

test.describe('Modal CSS Test', () => {
  test('should test modal CSS properties and scrolling', async ({ page }) => {
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
    
    // Look for any button that might open a modal
    const buttons = await page.locator('button').all();
    let modalOpened = false;
    
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      if (text && (text.includes('Create') || text.includes('Routine'))) {
        console.log(`Trying button: "${text}"`);
        await buttons[i].click();
        await page.waitForTimeout(1000);
        
        const modal = page.locator('[role="dialog"]').first();
        if (await modal.isVisible()) {
          console.log('Modal opened!');
          modalOpened = true;
          break;
        }
      }
    }
    
    if (!modalOpened) {
      console.log('Could not open modal, taking screenshot for debugging');
      await page.screenshot({ path: 'fitness-page-no-modal.png' });
      return;
    }
    
    // Test the modal
    const modal = page.locator('[role="dialog"]').first();
    
    // Get modal dimensions
    const modalBox = await modal.boundingBox();
    console.log('Modal dimensions:', modalBox);
    
    // Check for scrollable area
    const scrollableArea = modal.locator('.overflow-y-auto');
    if (await scrollableArea.isVisible()) {
      console.log('Found scrollable area');
      
      // Get scrollable area dimensions
      const scrollableBox = await scrollableArea.boundingBox();
      console.log('Scrollable area dimensions:', scrollableBox);
      
      // Get content dimensions
      const contentBox = await scrollableArea.locator('div').first().boundingBox();
      console.log('Content dimensions:', contentBox);
      
      // Check if content overflows
      const isOverflowing = contentBox && scrollableBox && contentBox.height > scrollableBox.height;
      console.log('Is content overflowing:', isOverflowing);
      
      // Get CSS properties for debugging
      const scrollableStyles = await scrollableArea.evaluate((el) => {
        const computedStyle = window.getComputedStyle(el);
        return {
          height: computedStyle.height,
          maxHeight: computedStyle.maxHeight,
          overflow: computedStyle.overflow,
          overflowY: computedStyle.overflowY,
          flex: computedStyle.flex,
          flexGrow: computedStyle.flexGrow,
          flexShrink: computedStyle.flexShrink,
          minHeight: computedStyle.minHeight,
          position: computedStyle.position,
          display: computedStyle.display
        };
      });
      
      console.log('Scrollable area CSS properties:', scrollableStyles);
      
      // Get parent container styles
      const parentStyles = await scrollableArea.evaluate((el) => {
        const parent = el.parentElement;
        if (parent) {
          const computedStyle = window.getComputedStyle(parent);
          return {
            height: computedStyle.height,
            maxHeight: computedStyle.maxHeight,
            overflow: computedStyle.overflow,
            display: computedStyle.display,
            flex: computedStyle.flex,
            flexDirection: computedStyle.flexDirection
          };
        }
        return null;
      });
      
      console.log('Parent container CSS properties:', parentStyles);
      
      if (isOverflowing) {
        console.log('Content overflows - testing scroll...');
        
        // Test scroll functionality
        const initialScrollTop = await scrollableArea.evaluate((el) => el.scrollTop);
        console.log('Initial scroll position:', initialScrollTop);
        
        // Scroll to bottom
        await scrollableArea.evaluate((el) => {
          el.scrollTop = el.scrollHeight;
        });
        
        await page.waitForTimeout(500);
        
        const finalScrollTop = await scrollableArea.evaluate((el) => el.scrollTop);
        console.log('Final scroll position:', finalScrollTop);
        console.log('Scroll height:', await scrollableArea.evaluate((el) => el.scrollHeight));
        
        // Check if scroll actually worked
        const scrollWorked = finalScrollTop > initialScrollTop;
        console.log('Scroll worked:', scrollWorked);
        
        if (scrollWorked) {
          console.log('✅ Modal scrolling is working!');
        } else {
          console.log('❌ Modal scroll is not working properly');
        }
        
      } else {
        console.log('Content fits in modal - no scrolling needed');
        console.log('This is normal behavior when content is small');
      }
      
    } else {
      console.log('No scrollable area found');
    }
    
    // Take a screenshot for debugging
    await modal.screenshot({ path: 'modal-css-test.png' });
  });
});
