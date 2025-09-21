import { test, expect } from '@playwright/test';

test.describe('Fitness Page Check', () => {
  test('Check what buttons are available on fitness page', async ({ page }) => {
    // Navigate to the fitness page
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');

    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'fitness-page-screenshot.png' });

    // Get all button text on the page
    const buttons = await page.locator('button').allTextContents();
    console.log('Available buttons:', buttons);

    // Get all text content to see what's on the page
    const pageText = await page.textContent('body');
    console.log('Page content:', pageText?.substring(0, 500));

    // Check if there are any buttons with "Custom" or "Routine" in the text
    const customButtons = await page.locator('button:has-text("Custom"), button:has-text("Routine")').count();
    console.log('Custom/Routine buttons found:', customButtons);
  });
});
