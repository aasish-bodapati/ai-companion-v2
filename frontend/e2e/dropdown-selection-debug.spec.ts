import { test, expect } from '@playwright/test';

test.describe('Dropdown Selection Debug Test', () => {
  
  test('Debug and verify dropdown selection works correctly', async ({ page }) => {
    console.log('🔍 Starting dropdown selection debug test...');
    
    // Navigate to the fitness page
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');
    
    // Wait for the page to load completely
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Look for the "Create Custom Routine" button
    const createButton = page.locator('text=Create Custom Routine').first();
    await expect(createButton).toBeVisible({ timeout: 10000 });
    
    // Click to open the modal
    await createButton.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    console.log('✅ Modal opened successfully');
    
    // Fill in routine name
    const routineNameInput = page.locator('input[placeholder*="routine name"]').first();
    await routineNameInput.fill('Test Routine');
    
    // Add a workout to Monday
    const addWorkoutButton = page.locator('text=+ Add Workout').first();
    await addWorkoutButton.click();
    
    // Wait for the exercise input to appear
    const exerciseInput = page.locator('input[placeholder*="Exercise Name"]').first();
    await expect(exerciseInput).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Exercise input is visible');
    
    // Type to trigger dropdown
    await exerciseInput.fill('pu');
    
    // Wait for dropdown to appear
    const dropdown = page.locator('[data-dropdown]');
    await expect(dropdown).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Dropdown is visible');
    
    // Get dropdown items
    const dropdownItems = page.locator('[data-dropdown] > div');
    const itemCount = await dropdownItems.count();
    console.log(`📊 Found ${itemCount} dropdown items`);
    
    // Verify dropdown items are visible and clickable
    for (let i = 0; i < itemCount; i++) {
      const item = dropdownItems.nth(i);
      await expect(item).toBeVisible();
      console.log(`✅ Dropdown item ${i + 1} is visible`);
    }
    
    // Test clicking on the first dropdown item
    const firstItem = dropdownItems.first();
    const itemText = await firstItem.textContent();
    console.log(`🎯 Clicking on first item: "${itemText}"`);
    
    // Add event listeners to debug the click
    await page.evaluate(() => {
      // Listen for click events on dropdown items
      document.addEventListener('click', (e) => {
        if (e.target && (e.target as Element).closest('[data-dropdown]')) {
          console.log('🔍 Click detected on dropdown item:', e.target);
        }
      }, true);
      
      // Listen for state changes
      let lastState = '';
      const checkState = () => {
        const input = document.querySelector('input[placeholder*="Exercise Name"]') as HTMLInputElement;
        if (input && input.value !== lastState) {
          console.log('🔄 Input value changed:', lastState, '->', input.value);
          lastState = input.value;
        }
      };
      
      // Check state every 100ms
      setInterval(checkState, 100);
    });
    
    // Click the first dropdown item
    await firstItem.click();
    
    // Wait a moment for the state to update
    await page.waitForTimeout(500);
    
    // Check if the input value was updated
    const inputValue = await exerciseInput.inputValue();
    console.log(`📝 Input value after click: "${inputValue}"`);
    
    // Verify the input was updated
    expect(inputValue).toBeTruthy();
    expect(inputValue).not.toBe('pu');
    
    // Verify dropdown is closed
    await expect(dropdown).not.toBeVisible();
    
    console.log('✅ Dropdown selection test completed successfully');
  });
  
  test('Test multiple dropdown selections', async ({ page }) => {
    console.log('🔍 Testing multiple dropdown selections...');
    
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');
    
    // Open modal
    await page.locator('text=Create Custom Routine').first().click();
    await page.waitForSelector('[role="dialog"]');
    
    // Fill routine name
    await page.locator('input[placeholder*="routine name"]').first().fill('Multi Test Routine');
    
    // Add workout to Monday
    await page.locator('text=+ Add Workout').first().click();
    
    const exerciseInput = page.locator('input[placeholder*="Exercise Name"]').first();
    await expect(exerciseInput).toBeVisible();
    
    // Test first selection
    await exerciseInput.fill('push');
    await page.waitForSelector('[data-dropdown]');
    
    const dropdownItems = page.locator('[data-dropdown] > div');
    const firstItem = dropdownItems.first();
    await firstItem.click();
    
    await page.waitForTimeout(300);
    const firstValue = await exerciseInput.inputValue();
    console.log(`First selection: "${firstValue}"`);
    
    // Clear and test second selection
    await exerciseInput.fill('');
    await exerciseInput.fill('pull');
    await page.waitForSelector('[data-dropdown]');
    
    const secondItem = dropdownItems.first();
    await secondItem.click();
    
    await page.waitForTimeout(300);
    const secondValue = await exerciseInput.inputValue();
    console.log(`Second selection: "${secondValue}"`);
    
    // Verify both selections worked
    expect(firstValue).toBeTruthy();
    expect(secondValue).toBeTruthy();
    expect(firstValue).not.toBe(secondValue);
    
    console.log('✅ Multiple selections test completed');
  });
  
  test('Test dropdown positioning and selection accuracy', async ({ page }) => {
    console.log('🔍 Testing dropdown positioning and selection accuracy...');
    
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');
    
    // Open modal
    await page.locator('text=Create Custom Routine').first().click();
    await page.waitForSelector('[role="dialog"]');
    
    // Fill routine name
    await page.locator('input[placeholder*="routine name"]').first().fill('Position Test Routine');
    
    // Add workout to Monday
    await page.locator('text=+ Add Workout').first().click();
    
    const exerciseInput = page.locator('input[placeholder*="Exercise Name"]').first();
    await expect(exerciseInput).toBeVisible();
    
    // Get input position
    const inputBox = await exerciseInput.boundingBox();
    console.log('📐 Input position:', inputBox);
    
    // Type to show dropdown
    await exerciseInput.fill('shoulder');
    await page.waitForSelector('[data-dropdown]');
    
    // Get dropdown position
    const dropdown = page.locator('[data-dropdown]');
    const dropdownBox = await dropdown.boundingBox();
    console.log('📐 Dropdown position:', dropdownBox);
    
    // Verify dropdown is positioned correctly (should be below input with small gap)
    if (inputBox && dropdownBox) {
      const gap = dropdownBox.y - (inputBox.y + inputBox.height);
      console.log(`📏 Gap between input and dropdown: ${gap}px`);
      
      // Gap should be small (1-5px)
      expect(gap).toBeGreaterThanOrEqual(0);
      expect(gap).toBeLessThan(10);
    }
    
    // Test clicking on different items
    const dropdownItems = page.locator('[data-dropdown] > div');
    const itemCount = await dropdownItems.count();
    
    for (let i = 0; i < Math.min(itemCount, 3); i++) {
      const item = dropdownItems.nth(i);
      const itemText = await item.textContent();
      
      // Clear input and type again
      await exerciseInput.fill('');
      await exerciseInput.fill('shoulder');
      await page.waitForSelector('[data-dropdown]');
      
      // Click on this item
      await item.click();
      await page.waitForTimeout(200);
      
      const inputValue = await exerciseInput.inputValue();
      console.log(`Item ${i + 1} (${itemText}): Input = "${inputValue}"`);
      
      // Verify selection worked
      expect(inputValue).toBeTruthy();
    }
    
    console.log('✅ Positioning and selection accuracy test completed');
  });
  
  test('Debug event handling and state management', async ({ page }) => {
    console.log('🔍 Debugging event handling and state management...');
    
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');
    
    // Add debugging to the page
    await page.evaluate(() => {
      // Override console.log to capture all logs
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog(...args);
      };
      
      // Store logs globally for access
      (window as any).debugLogs = logs;
      
      // Add event listeners to track all clicks
      document.addEventListener('click', (e) => {
        const target = e.target as Element;
        console.log('🖱️ Click event:', {
          target: target.tagName,
          className: target.className,
          id: target.id,
          closestDropdown: !!target.closest('[data-dropdown]'),
          closestInput: !!target.closest('input[placeholder*="Exercise Name"]')
        });
      }, true);
      
      // Track state changes
      let lastInputValue = '';
      const input = document.querySelector('input[placeholder*="Exercise Name"]');
      if (input) {
        const observer = new MutationObserver(() => {
          const currentValue = (input as HTMLInputElement).value;
          if (currentValue !== lastInputValue) {
            console.log('🔄 Input value changed:', lastInputValue, '->', currentValue);
            lastInputValue = currentValue;
          }
        });
        observer.observe(input, { attributes: true, childList: true, subtree: true });
      }
    });
    
    // Open modal
    await page.locator('text=Create Custom Routine').first().click();
    await page.waitForSelector('[role="dialog"]');
    
    // Fill routine name
    await page.locator('input[placeholder*="routine name"]').first().fill('Debug Test Routine');
    
    // Add workout
    await page.locator('text=+ Add Workout').first().click();
    
    const exerciseInput = page.locator('input[placeholder*="Exercise Name"]').first();
    await expect(exerciseInput).toBeVisible();
    
    // Type to trigger dropdown
    await exerciseInput.fill('bench');
    await page.waitForSelector('[data-dropdown]');
    
    // Click on first item
    const firstItem = page.locator('[data-dropdown] > div').first();
    await firstItem.click();
    
    // Wait for state to settle
    await page.waitForTimeout(1000);
    
    // Get debug logs
    const debugLogs = await page.evaluate(() => (window as any).debugLogs);
    console.log('📋 Debug logs:', debugLogs);
    
    // Verify final state
    const finalValue = await exerciseInput.inputValue();
    console.log(`🎯 Final input value: "${finalValue}"`);
    
    expect(finalValue).toBeTruthy();
    expect(finalValue).not.toBe('bench');
    
    console.log('✅ Event handling debug test completed');
  });
});
