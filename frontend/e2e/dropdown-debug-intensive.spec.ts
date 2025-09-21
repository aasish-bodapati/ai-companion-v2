import { test, expect, Page } from '@playwright/test';

test.describe('Dropdown Debug - Intensive Testing', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Navigate to fitness page
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');
    
    // Open custom routine dialog
    await page.click('text=Create Custom Routine');
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    
    // Fill routine name
    await page.fill('input[placeholder="e.g., My Custom Workout"]', 'Debug Test Routine');
    
    // Add a workout for Monday
    await page.click('text=+ Add Workout');
    await page.waitForSelector('input[placeholder*="Type exercise name"]', { timeout: 10000 });
  });

  test('Debug dropdown step by step', async () => {
    console.log('🔍 Starting comprehensive dropdown debug...');
    
    // Get the input field
    const inputField = page.locator('input[placeholder*="Type exercise name"]').first();
    await expect(inputField).toBeVisible();
    
    console.log('✅ Input field is visible');
    
    // Check initial state
    let dropdownVisible = await page.locator('[data-dropdown]').isVisible();
    console.log('🔍 Initial dropdown visible:', dropdownVisible);
    
    // Type a single character
    await inputField.fill('p');
    await page.waitForTimeout(500);
    
    dropdownVisible = await page.locator('[data-dropdown]').isVisible();
    console.log('🔍 After typing "p" - dropdown visible:', dropdownVisible);
    
    // Type two characters to trigger search
    await inputField.fill('pu');
    await page.waitForTimeout(1000);
    
    dropdownVisible = await page.locator('[data-dropdown]').isVisible();
    console.log('🔍 After typing "pu" - dropdown visible:', dropdownVisible);
    
    // Wait longer for API response
    await page.waitForTimeout(2000);
    
    dropdownVisible = await page.locator('[data-dropdown]').isVisible();
    console.log('🔍 After 2s wait - dropdown visible:', dropdownVisible);
    
    // Check if dropdown exists in DOM at all
    const dropdownExists = await page.locator('[data-dropdown]').count();
    console.log('🔍 Dropdown elements in DOM:', dropdownExists);
    
    // Check console logs for our debug messages
    page.on('console', msg => {
      if (msg.text().includes('🔍')) {
        console.log('BROWSER LOG:', msg.text());
      }
    });
    
    // Try typing a more specific term
    await inputField.fill('push');
    await page.waitForTimeout(2000);
    
    dropdownVisible = await page.locator('[data-dropdown]').isVisible();
    console.log('🔍 After typing "push" - dropdown visible:', dropdownVisible);
    
    // Check for any network errors
    const responses: string[] = [];
    page.on('response', response => {
      if (response.url().includes('exercise') || response.url().includes('search')) {
        responses.push(`${response.status()} - ${response.url()}`);
      }
    });
    
    // Try one more time with a fresh input
    await inputField.clear();
    await inputField.fill('pushup');
    await page.waitForTimeout(3000);
    
    console.log('🔍 Network responses:', responses);
    
    dropdownVisible = await page.locator('[data-dropdown]').isVisible();
    console.log('🔍 Final check - dropdown visible:', dropdownVisible);
    
    // Get input field position for debugging
    const inputBox = await inputField.boundingBox();
    console.log('🔍 Input field position:', inputBox);
    
    // Check if dropdown has any content
    if (dropdownExists > 0) {
      const dropdownContent = await page.locator('[data-dropdown]').textContent();
      console.log('🔍 Dropdown content:', dropdownContent);
      
      const dropdownBox = await page.locator('[data-dropdown]').boundingBox();
      console.log('🔍 Dropdown position:', dropdownBox);
    }
    
    // If dropdown is not visible, let's check the component state
    const componentState = await page.evaluate(() => {
      // Access React DevTools or component state if possible
      const inputElement = document.querySelector('input[placeholder*="Type exercise name"]') as HTMLInputElement;
      return {
        inputValue: inputElement?.value,
        inputFocused: document.activeElement === inputElement,
        dataDropdownElements: document.querySelectorAll('[data-dropdown]').length
      };
    });
    
    console.log('🔍 Component state:', componentState);
    
    // This test should fail if dropdown is not working, so we can see what's wrong
    if (!dropdownVisible) {
      console.log('❌ DROPDOWN NOT VISIBLE - This is the bug we need to fix!');
      
      // Let's check the React component's internal state by looking at console logs
      await page.evaluate(() => {
        console.log('🔍 Triggering manual debug check...');
        const event = new Event('input', { bubbles: true });
        const input = document.querySelector('input[placeholder*="Type exercise name"]') as HTMLInputElement;
        if (input) {
          input.value = 'debug';
          input.dispatchEvent(event);
        }
      });
      
      await page.waitForTimeout(1000);
    }
    
    // Force the test to show us what we found
    expect(dropdownVisible).toBe(true);
  });

  test('Check API connectivity', async () => {
    console.log('🔍 Testing API connectivity...');
    
    // Test the API endpoint directly
    const response = await page.request.get('http://localhost:8000/api/v1/exercises/search?q=push&limit=5');
    console.log('🔍 API Response status:', response.status());
    
    if (response.ok()) {
      const data = await response.json();
      console.log('🔍 API Response data:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ API request failed');
    }
  });

  test('Manual dropdown trigger', async () => {
    console.log('🔍 Testing manual dropdown trigger...');
    
    const inputField = page.locator('input[placeholder*="Type exercise name"]').first();
    
    // Manually trigger the dropdown logic
    await page.evaluate(() => {
      // Find the input and manually trigger the change handler
      const input = document.querySelector('input[placeholder*="Type exercise name"]') as HTMLInputElement;
      if (input) {
        // Set value and trigger events
        input.value = 'push';
        
        // Trigger input event
        const inputEvent = new Event('input', { bubbles: true });
        input.dispatchEvent(inputEvent);
        
        // Trigger change event
        const changeEvent = new Event('change', { bubbles: true });
        input.dispatchEvent(changeEvent);
        
        console.log('🔍 Manually triggered input events');
      }
    });
    
    await page.waitForTimeout(3000);
    
    const dropdownVisible = await page.locator('[data-dropdown]').isVisible();
    console.log('🔍 After manual trigger - dropdown visible:', dropdownVisible);
  });
});
