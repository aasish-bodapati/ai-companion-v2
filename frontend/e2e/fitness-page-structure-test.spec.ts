import { test, expect } from '@playwright/test';

test.describe('Fitness Page Structure Test', () => {
  test('should check the actual structure of the fitness page', async ({ page }) => {
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
      await page.waitForTimeout(3000);
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'fitness-page-structure.png' });
    
    // Check the page content
    const pageText = await page.textContent('body');
    console.log('Page text length:', pageText?.length);
    
    // Check for specific elements that should be on the fitness page
    const hasTabs = pageText?.includes('Workout Logs') || pageText?.includes('My Routines') || pageText?.includes('Log Workout');
    console.log('Has tabs content:', hasTabs);
    
    // Look for any div elements with tab-related classes
    const tabElements = await page.locator('div[class*="tab"], [role="tab"]').all();
    console.log('Found tab elements:', tabElements.length);
    
    // Look for any buttons
    const buttons = await page.locator('button').all();
    console.log('Found buttons:', buttons.length);
    
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      const isVisible = await buttons[i].isVisible();
      console.log(`Button ${i}: "${text}", visible: ${isVisible}`);
    }
    
    // Check if there are any React components rendered
    const reactElements = await page.locator('[data-testid]').all();
    console.log('Found React elements with data-testid:', reactElements.length);
    
    // Check for any divs with specific classes that might be the fitness content
    const fitnessDivs = await page.locator('div[class*="fitness"], div[class*="workout"], div[class*="exercise"]').all();
    console.log('Found fitness-related divs:', fitnessDivs.length);
    
    // Check if the page is actually the fitness page
    const url = page.url();
    console.log('Current URL:', url);
    
    if (url.includes('/fitness')) {
      console.log('✅ On fitness page');
      
      // Check if the page has any content at all
      const bodyText = await page.textContent('body');
      const hasContent = bodyText && bodyText.length > 1000;
      console.log('Page has substantial content:', hasContent);
      
      if (!hasContent) {
        console.log('❌ Page appears to be empty or not rendering');
        
        // Check for any error messages
        const errorElements = await page.locator('[class*="error"], [class*="Error"]').all();
        console.log('Found error elements:', errorElements.length);
        
        for (let i = 0; i < errorElements.length; i++) {
          const text = await errorElements[i].textContent();
          console.log(`Error element ${i}: "${text}"`);
        }
      }
    } else {
      console.log('❌ Not on fitness page, redirected to:', url);
    }
  });
});
