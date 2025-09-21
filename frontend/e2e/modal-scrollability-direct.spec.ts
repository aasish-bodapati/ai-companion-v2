import { test, expect } from '@playwright/test';

test.describe('Modal Scrollability Direct Test', () => {
  test('should test modal scrollability by clicking Create Routine directly', async ({ page }) => {
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
    
    // Look for the "Create Routine" button
    const createButton = page.locator('button:has-text("Create Routine")').first();
    await expect(createButton).toBeVisible();
    
    console.log('Found Create Routine button');
    
    // Click the button to open the modal
    await createButton.click();
    await page.waitForTimeout(1000);
    
    // Wait for modal to open
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();
    
    console.log('Modal opened successfully');
    
    // Get modal dimensions
    const modalBox = await modal.boundingBox();
    console.log('Modal dimensions:', modalBox);
    
    // Check for scrollable area
    const scrollableArea = modal.locator('.overflow-y-auto');
    await expect(scrollableArea).toBeVisible();
    
    console.log('Found scrollable area');
    
    // Get initial scrollable area dimensions
    const initialScrollableBox = await scrollableArea.boundingBox();
    console.log('Initial scrollable area dimensions:', initialScrollableBox);
    
    // Add multiple workouts to force scrolling
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      console.log(`Adding workout to ${day}...`);
      
      // Find the day card
      const dayCard = modal.locator(`text=${day}`).locator('..').first();
      if (await dayCard.isVisible()) {
        // Click "Add Workout" button for this day
        const addButton = dayCard.locator('button:has-text("Add Workout")').first();
        if (await addButton.isVisible()) {
          await addButton.click();
          await page.waitForTimeout(300);
          
          // Fill in exercise name
          const exerciseInput = modal.locator('input[placeholder*="exercise"]').last();
          if (await exerciseInput.isVisible()) {
            await exerciseInput.fill(`Exercise ${i + 1} for ${day}`);
            await page.waitForTimeout(200);
            
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
    }
    
    // Add more workouts to the same days to create more content
    for (let i = 0; i < 3; i++) {
      const day = days[i % days.length];
      console.log(`Adding second workout to ${day}...`);
      
      const dayCard = modal.locator(`text=${day}`).locator('..').first();
      if (await dayCard.isVisible()) {
        const addButton = dayCard.locator('button:has-text("Add Workout")').first();
        if (await addButton.isVisible()) {
          await addButton.click();
          await page.waitForTimeout(300);
          
          const exerciseInput = modal.locator('input[placeholder*="exercise"]').last();
          if (await exerciseInput.isVisible()) {
            await exerciseInput.fill(`Second Exercise ${i + 1} for ${day}`);
            await page.waitForTimeout(200);
            
            const setsInput = modal.locator('input[placeholder="3"]').last();
            const repsInput = modal.locator('input[placeholder="10"]').last();
            
            if (await setsInput.isVisible()) {
              await setsInput.fill('4');
            }
            if (await repsInput.isVisible()) {
              await repsInput.fill('12');
            }
            
            await page.waitForTimeout(200);
          }
        }
      }
    }
    
    // Now test scrolling after adding content
    const finalScrollableBox = await scrollableArea.boundingBox();
    console.log('Final scrollable area dimensions:', finalScrollableBox);
    
    // Get content height
    const contentBox = await scrollableArea.locator('div').first().boundingBox();
    console.log('Content dimensions:', contentBox);
    
    // Check if content overflows
    const isOverflowing = contentBox && finalScrollableBox && contentBox.height > finalScrollableBox.height;
    console.log('Is content overflowing:', isOverflowing);
    
    if (isOverflowing) {
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
      
      // Check if scroll actually worked
      const scrollWorked = finalScrollTop > initialScrollTop;
      console.log('Scroll worked:', scrollWorked);
      
      if (scrollWorked) {
        console.log('✅ Modal scrolling is working!');
        
        // Test scrolling back to top
        await scrollableArea.evaluate((el) => {
          el.scrollTop = 0;
        });
        
        await page.waitForTimeout(500);
        
        const backToTopScroll = await scrollableArea.evaluate((el) => el.scrollTop);
        console.log('Back to top scroll position:', backToTopScroll);
        
        if (backToTopScroll === 0) {
          console.log('✅ Scrolling back to top works!');
        } else {
          console.log('❌ Scrolling back to top failed');
        }
        
      } else {
        console.log('❌ Modal scroll is not working properly');
      }
      
    } else {
      console.log('Content still fits in modal - no scrolling needed');
      console.log('This might indicate the modal is too large or content is too small');
    }
    
    // Take a screenshot for debugging
    await modal.screenshot({ path: 'modal-scrollability-direct-test.png' });
  });
});
