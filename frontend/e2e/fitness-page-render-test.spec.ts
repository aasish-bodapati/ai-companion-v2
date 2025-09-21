import { test, expect } from '@playwright/test';

test.describe('Fitness Page Render Test', () => {
  test('should check if fitness page is rendering properly', async ({ page }) => {
    // Navigate to the fitness page
    await page.goto('/fitness');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we're still on the fitness page
    const url = page.url();
    console.log('Current URL:', url);
    
    if (url.includes('/fitness')) {
      console.log('✅ Still on fitness page');
      
      // Login if needed
      const loginButton = page.locator('button:has-text("Sign in")').first();
      if (await loginButton.isVisible()) {
        console.log('Need to login');
        await loginButton.click();
        await page.waitForTimeout(1000);
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', 'test123');
        await page.click('button:has-text("Sign in")');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Check URL after login
        const urlAfterLogin = page.url();
        console.log('URL after login:', urlAfterLogin);
        
        if (urlAfterLogin.includes('/fitness')) {
          console.log('✅ Still on fitness page after login');
        } else {
          console.log('❌ Redirected away from fitness page after login');
        }
      }
      
      // Check if the page has the expected content
      const pageText = await page.textContent('body');
      const hasFitnessContent = pageText?.includes('Fitness') || pageText?.includes('Workout') || pageText?.includes('Exercise');
      console.log('Has fitness content:', hasFitnessContent);
      
      // Check for any React components
      const hasReactContent = pageText?.includes('data-testid') || pageText?.includes('class="');
      console.log('Has React content:', hasReactContent);
      
      // Take a screenshot
      await page.screenshot({ path: 'fitness-page-render-test.png' });
      
    } else {
      console.log('❌ Redirected away from fitness page');
      console.log('Redirected to:', url);
      
      // Take a screenshot of where we ended up
      await page.screenshot({ path: 'fitness-page-redirect.png' });
    }
  });
});
