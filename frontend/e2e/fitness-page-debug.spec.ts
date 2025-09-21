import { test, expect } from '@playwright/test';

test.describe('Fitness Page Debug', () => {
  test('should debug what is actually on the fitness page', async ({ page }) => {
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
    
    // Get the page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Get the page URL
    const url = page.url();
    console.log('Page URL:', url);
    
    // Check if we're on the fitness page
    const isFitnessPage = url.includes('/fitness');
    console.log('Is fitness page:', isFitnessPage);
    
    // Get all text content on the page
    const pageText = await page.textContent('body');
    console.log('Page text length:', pageText?.length);
    
    // Check for specific text that should be on the fitness page
    const hasWorkoutLogs = pageText?.includes('Workout Logs');
    const hasMyRoutines = pageText?.includes('My Routines');
    const hasLogWorkout = pageText?.includes('Log Workout');
    const hasProgress = pageText?.includes('Progress');
    
    console.log('Has Workout Logs:', hasWorkoutLogs);
    console.log('Has My Routines:', hasMyRoutines);
    console.log('Has Log Workout:', hasLogWorkout);
    console.log('Has Progress:', hasProgress);
    
    // Check for any buttons
    const buttons = await page.locator('button').all();
    console.log('Found buttons:', buttons.length);
    
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      console.log(`Button ${i}: "${text}"`);
    }
    
    // Check for any tabs
    const tabs = await page.locator('[role="tab"], [data-testid*="tab"]').all();
    console.log('Found tabs:', tabs.length);
    
    for (let i = 0; i < tabs.length; i++) {
      const text = await tabs[i].textContent();
      console.log(`Tab ${i}: "${text}"`);
    }
    
    // Check for any divs with tab-related classes
    const tabDivs = await page.locator('div[class*="tab"]').all();
    console.log('Found tab divs:', tabDivs.length);
    
    for (let i = 0; i < tabDivs.length; i++) {
      const text = await tabDivs[i].textContent();
      const className = await tabDivs[i].getAttribute('class');
      console.log(`Tab div ${i}: "${text}", class="${className}"`);
    }
    
    // Check if there are any errors in the console
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log('Console error:', msg.text());
      }
    });
    
    // Wait a bit to catch any errors
    await page.waitForTimeout(1000);
    
    if (errors.length > 0) {
      console.log('Errors found:', errors);
    } else {
      console.log('No errors found');
    }
  });
});
