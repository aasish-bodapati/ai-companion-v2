import { test, expect } from '@playwright/test';

test.describe('Modal HTML Debug', () => {
  test('should debug the HTML structure and modal issue', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log('Console error:', msg.text());
      }
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
    
    // Get the page HTML to see what's actually rendered
    const pageHTML = await page.content();
    console.log('Page HTML length:', pageHTML.length);
    
    // Check if the CustomRoutineBuilder component is rendered
    const hasCustomRoutineBuilder = pageHTML.includes('Create Custom Routine');
    console.log('Has CustomRoutineBuilder:', hasCustomRoutineBuilder);
    
    // Check if there are any Dialog components
    const hasDialog = pageHTML.includes('role="dialog"');
    console.log('Has dialog elements:', hasDialog);
    
    // Check if there are any DialogContent elements
    const hasDialogContent = pageHTML.includes('max-w-4xl');
    console.log('Has DialogContent elements:', hasDialogContent);
    
    // Look for the Create Routine button
    const createButton = page.locator('button:has-text("Create Routine")').first();
    if (await createButton.isVisible()) {
      console.log('Found Create Routine button');
      
      // Get the button's HTML
      const buttonHTML = await createButton.innerHTML();
      console.log('Button HTML:', buttonHTML);
      
      // Check if the button has the correct structure
      const hasDialogTrigger = buttonHTML.includes('data-state') || buttonHTML.includes('aria-haspopup');
      console.log('Button has dialog trigger attributes:', hasDialogTrigger);
      
      // Click the button
      await createButton.click();
      await page.waitForTimeout(2000);
      
      // Check the page HTML again after clicking
      const pageHTMLAfterClick = await page.content();
      const hasDialogAfterClick = pageHTMLAfterClick.includes('role="dialog"');
      console.log('Has dialog elements after click:', hasDialogAfterClick);
      
      // Check if any new elements were added
      const newElements = await page.locator('div[class*="max-w-4xl"]').all();
      console.log('Found max-w-4xl elements after click:', newElements.length);
      
      for (let i = 0; i < newElements.length; i++) {
        const isVisible = await newElements[i].isVisible();
        const className = await newElements[i].getAttribute('class');
        const text = await newElements[i].textContent();
        console.log(`Element ${i}: visible=${isVisible}, class="${className}", text="${text?.substring(0, 50)}..."`);
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
    await page.screenshot({ path: 'modal-html-debug.png' });
  });
});
