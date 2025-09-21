import { test, expect } from '@playwright/test';

test.describe('Login Redirect Test', () => {
  test('should check what happens after login', async ({ page }) => {
    // Navigate to the fitness page
    await page.goto('/fitness');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check initial URL
    let url = page.url();
    console.log('Initial URL:', url);
    
    // Login if needed
    const loginButton = page.locator('button:has-text("Sign in")').first();
    if (await loginButton.isVisible()) {
      console.log('Need to login');
      await loginButton.click();
      await page.waitForTimeout(1000);
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'test123');
      await page.click('button:has-text("Sign in")');
      
      // Wait for login to complete
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // Check URL after login
      url = page.url();
      console.log('URL after login:', url);
      
      if (url.includes('/fitness')) {
        console.log('✅ Still on fitness page after login');
        
        // Check if the page content is now visible
        const pageText = await page.textContent('body');
        const hasFitnessContent = pageText?.includes('Workout Logs') || pageText?.includes('My Routines');
        console.log('Has fitness content after login:', hasFitnessContent);
        
        if (hasFitnessContent) {
          console.log('✅ Fitness page content is visible');
          
          // Look for the Create Routine button
          const createButton = page.locator('button:has-text("Create Custom Routine")').first();
          if (await createButton.isVisible()) {
            console.log('✅ Found Create Custom Routine button');
            
            // Click the button
            await createButton.click();
            await page.waitForTimeout(1000);
            
            // Check if modal opened
            const modal = page.locator('[role="dialog"]').first();
            if (await modal.isVisible()) {
              console.log('✅ Modal opened successfully!');
              
              // Test scrolling
              const scrollableArea = modal.locator('.overflow-y-auto');
              if (await scrollableArea.isVisible()) {
                console.log('✅ Found scrollable area');
                
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
                  
                  if (finalScrollTop > initialScrollTop) {
                    console.log('✅ Modal scrolling is working!');
                  } else {
                    console.log('❌ Modal scroll is not working properly');
                  }
                } else {
                  console.log('Content fits in modal - no scrolling needed');
                }
              }
              
              // Take screenshot of modal
              await modal.screenshot({ path: 'modal-working-test.png' });
            } else {
              console.log('❌ Modal did not open');
            }
          } else {
            console.log('❌ Create Custom Routine button not found');
          }
        } else {
          console.log('❌ Fitness page content is not visible');
        }
      } else {
        console.log('❌ Redirected away from fitness page after login');
        console.log('Redirected to:', url);
      }
    } else {
      console.log('Already logged in or no login needed');
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'login-redirect-test.png' });
  });
});
