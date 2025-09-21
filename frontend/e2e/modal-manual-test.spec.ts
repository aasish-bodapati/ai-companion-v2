import { test, expect } from '@playwright/test';

test.describe('Modal Manual Test', () => {
  test('should manually test modal by forcing it to open', async ({ page }) => {
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
      
      // Click the button
      await createButton.click();
      await page.waitForTimeout(1000);
      
      // Try to force the modal to open by setting the state
      await page.evaluate(() => {
        // Look for any React components that might have the modal state
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          if (button.textContent?.includes('Create Custom Routine')) {
            // Try to find the parent component and set its state
            let element = button.parentElement;
            while (element) {
              if (element.__reactInternalInstance || element._reactInternalFiber) {
                console.log('Found React element, trying to set state...');
                break;
              }
              element = element.parentElement;
            }
          }
        }
      });
      
      // Check for any modals again
      const modals = await page.locator('[role="dialog"]').all();
      console.log('Found modals after manual intervention:', modals.length);
      
      // Try to find any elements that might be the modal content
      const modalContent = await page.locator('div[class*="max-w-4xl"][class*="h-\\[80vh\\]"]').all();
      console.log('Found modal content elements:', modalContent.length);
      
      for (let i = 0; i < modalContent.length; i++) {
        const isVisible = await modalContent[i].isVisible();
        const className = await modalContent[i].getAttribute('class');
        console.log(`Modal content ${i}: visible=${isVisible}, class="${className}"`);
      }
      
      // Check if there are any elements with the modal content
      const routineElements = await page.locator('text=Create Custom Routine').all();
      console.log('Found "Create Custom Routine" text elements:', routineElements.length);
      
      for (let i = 0; i < routineElements.length; i++) {
        const isVisible = await routineElements[i].isVisible();
        const text = await routineElements[i].textContent();
        console.log(`Routine element ${i}: visible=${isVisible}, text="${text}"`);
      }
      
    } else {
      console.log('Create Routine button not found');
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'modal-manual-test.png' });
  });
});
