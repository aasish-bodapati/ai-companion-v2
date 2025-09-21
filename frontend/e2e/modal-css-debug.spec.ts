import { test, expect } from '@playwright/test';

test.describe('Modal CSS Debug', () => {
  test('should analyze modal CSS and scrollability', async ({ page }) => {
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
    
    // Find and click the routine button
    const routineButton = page.locator('button:has-text("Create Routine")').first();
    if (await routineButton.isVisible()) {
      await routineButton.click();
      await page.waitForTimeout(1000);
      
      // Wait for modal to open
      const modal = page.locator('[role="dialog"]').first();
      if (await modal.isVisible()) {
        console.log('Modal opened successfully');
        
        // Analyze the modal structure and CSS
        const modalStyles = await modal.evaluate((el) => {
          const computedStyle = window.getComputedStyle(el);
          return {
            height: computedStyle.height,
            maxHeight: computedStyle.maxHeight,
            overflow: computedStyle.overflow,
            display: computedStyle.display,
            flexDirection: computedStyle.flexDirection,
            position: computedStyle.position
          };
        });
        
        console.log('Modal CSS properties:', modalStyles);
        
        // Check for scrollable area
        const scrollableArea = modal.locator('.overflow-y-auto');
        if (await scrollableArea.isVisible()) {
          console.log('Found scrollable area');
          
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
              minHeight: computedStyle.minHeight
            };
          });
          
          console.log('Scrollable area CSS properties:', scrollableStyles);
          
          // Get dimensions
          const scrollableBox = await scrollableArea.boundingBox();
          const contentBox = await scrollableArea.locator('div').first().boundingBox();
          
          console.log('Scrollable area dimensions:', scrollableBox);
          console.log('Content dimensions:', contentBox);
          
          // Check if content overflows
          const isOverflowing = contentBox && scrollableBox && contentBox.height > scrollableBox.height;
          console.log('Is content overflowing:', isOverflowing);
          
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
            
          } else {
            console.log('Content fits in modal - no scrolling needed');
            
            // Let's try to force some content to see if we can make it scroll
            console.log('Trying to add content to force scrolling...');
            
            // Look for day cards and try to add workouts
            const dayCards = await modal.locator('[data-testid*="day"], .day-card, div:has-text("Monday")').all();
            console.log('Found day cards:', dayCards.length);
            
            // Try to add workouts to create overflow
            for (let i = 0; i < Math.min(3, dayCards.length); i++) {
              const addButton = dayCards[i].locator('button:has-text("Add Workout")').first();
              if (await addButton.isVisible()) {
                await addButton.click();
                await page.waitForTimeout(200);
                
                // Fill in some data
                const exerciseInput = modal.locator('input[placeholder*="exercise"]').last();
                if (await exerciseInput.isVisible()) {
                  await exerciseInput.fill(`Test Exercise ${i + 1}`);
                  await page.waitForTimeout(200);
                }
              }
            }
            
            // Check dimensions again after adding content
            const newScrollableBox = await scrollableArea.boundingBox();
            const newContentBox = await scrollableArea.locator('div').first().boundingBox();
            
            console.log('New scrollable area dimensions:', newScrollableBox);
            console.log('New content dimensions:', newContentBox);
            
            const newIsOverflowing = newContentBox && newScrollableBox && newContentBox.height > newScrollableBox.height;
            console.log('Is content overflowing after adding content:', newIsOverflowing);
          }
        } else {
          console.log('No scrollable area found');
        }
        
        // Take a screenshot for debugging
        await modal.screenshot({ path: 'modal-debug.png' });
        
      } else {
        console.log('Modal did not open');
      }
    } else {
      console.log('Routine button not found');
    }
  });
});
