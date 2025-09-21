import { test, expect } from '@playwright/test';

test.describe('Modal Debug Errors', () => {
  test('should debug modal opening issues', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log('Console error:', msg.text());
      }
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      console.log('Page error:', error.message);
      errors.push(error.message);
    });
    
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
    
    // Look for the Create Routine button
    const createButton = page.locator('button:has-text("Create Routine")').first();
    if (await createButton.isVisible()) {
      console.log('Found Create Routine button');
      
      // Check if the button is clickable
      const isEnabled = await createButton.isEnabled();
      console.log('Button is enabled:', isEnabled);
      
      // Get button properties
      const buttonBox = await createButton.boundingBox();
      console.log('Button dimensions:', buttonBox);
      
      // Click the button
      await createButton.click();
      await page.waitForTimeout(2000);
      
      // Check for any modals or dialogs
      const modals = await page.locator('[role="dialog"], .modal, [data-testid*="modal"]').all();
      console.log('Found modals after click:', modals.length);
      
      for (let i = 0; i < modals.length; i++) {
        const isVisible = await modals[i].isVisible();
        const text = await modals[i].textContent();
        console.log(`Modal ${i}: visible=${isVisible}, text="${text?.substring(0, 100)}..."`);
      }
      
      // Check for any elements with "dialog" in the class name
      const dialogElements = await page.locator('[class*="dialog"], [class*="Dialog"]').all();
      console.log('Found dialog elements:', dialogElements.length);
      
      for (let i = 0; i < dialogElements.length; i++) {
        const isVisible = await dialogElements[i].isVisible();
        const className = await dialogElements[i].getAttribute('class');
        console.log(`Dialog element ${i}: visible=${isVisible}, class="${className}"`);
      }
      
      // Check if there are any hidden modals
      const hiddenModals = await page.locator('[role="dialog"][style*="display: none"], [role="dialog"][style*="visibility: hidden"]').all();
      console.log('Found hidden modals:', hiddenModals.length);
      
      // Check for any elements that might be the modal content
      const possibleModals = await page.locator('div[class*="max-w"], div[class*="h-\\[80vh\\]"]').all();
      console.log('Found possible modal containers:', possibleModals.length);
      
      for (let i = 0; i < possibleModals.length; i++) {
        const isVisible = await possibleModals[i].isVisible();
        const className = await possibleModals[i].getAttribute('class');
        console.log(`Possible modal ${i}: visible=${isVisible}, class="${className}"`);
      }
      
    } else {
      console.log('Create Routine button not found');
    }
    
    // Log any errors that occurred
    if (errors.length > 0) {
      console.log('Errors found:', errors);
    } else {
      console.log('No errors found');
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'modal-debug-errors.png' });
  });
});
