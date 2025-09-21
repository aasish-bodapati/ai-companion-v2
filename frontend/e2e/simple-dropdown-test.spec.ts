import { test, expect } from '@playwright/test';

test.describe('Simple Dropdown Test', () => {
  
  test('Check page content and find Create Custom Routine button', async ({ page }) => {
    console.log('🔍 Starting simple dropdown test...');
    
    // Navigate to the fitness page
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'test-results/fitness-page.png' });
    
    // Check what's actually on the page
    const pageContent = await page.content();
    console.log('📄 Page content length:', pageContent.length);
    
    // Look for any text that might be the button
    const allText = await page.locator('*').allTextContents();
    console.log('📝 All text on page:', allText.slice(0, 20)); // First 20 text elements
    
    // Try different selectors for the button
    const possibleButtons = [
      'text=Create Custom Routine',
      'text=Create Routine',
      'text=Custom Routine',
      'button:has-text("Create")',
      'button:has-text("Custom")',
      'button:has-text("Routine")',
      '[data-testid*="create"]',
      '[data-testid*="routine"]'
    ];
    
    for (const selector of possibleButtons) {
      try {
        const element = page.locator(selector).first();
        const isVisible = await element.isVisible({ timeout: 1000 });
        if (isVisible) {
          console.log(`✅ Found button with selector: ${selector}`);
          const text = await element.textContent();
          console.log(`📝 Button text: "${text}"`);
          break;
        }
      } catch (e) {
        console.log(`❌ Selector failed: ${selector}`);
      }
    }
    
    // Check if there are any buttons at all
    const allButtons = await page.locator('button').all();
    console.log(`🔘 Found ${allButtons.length} buttons on page`);
    
    for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
      const button = allButtons[i];
      const text = await button.textContent();
      const isVisible = await button.isVisible();
      console.log(`Button ${i + 1}: "${text}" (visible: ${isVisible})`);
    }
    
    // Check if there are any modals or dialogs
    const modals = await page.locator('[role="dialog"]').all();
    console.log(`🪟 Found ${modals.length} modals on page`);
    
    // Check if there are any dropdowns
    const dropdowns = await page.locator('[data-dropdown]').all();
    console.log(`📋 Found ${dropdowns.length} dropdowns on page`);
    
    // Check if there are any input fields
    const inputs = await page.locator('input').all();
    console.log(`⌨️ Found ${inputs.length} input fields on page`);
    
    for (let i = 0; i < Math.min(inputs.length, 5); i++) {
      const input = inputs[i];
      const placeholder = await input.getAttribute('placeholder');
      const type = await input.getAttribute('type');
      console.log(`Input ${i + 1}: placeholder="${placeholder}", type="${type}"`);
    }
  });
  
  test('Test dropdown selection with manual navigation', async ({ page }) => {
    console.log('🔍 Testing dropdown selection with manual navigation...');
    
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');
    
    // Try to find any button that might open a modal
    const buttons = await page.locator('button').all();
    let modalOpened = false;
    
    for (const button of buttons) {
      const text = await button.textContent();
      if (text && (text.includes('Create') || text.includes('Custom') || text.includes('Routine'))) {
        console.log(`🎯 Trying to click button: "${text}"`);
        try {
          await button.click();
          await page.waitForTimeout(1000);
          
          // Check if a modal opened
          const modal = page.locator('[role="dialog"]');
          if (await modal.isVisible()) {
            console.log('✅ Modal opened!');
            modalOpened = true;
            break;
          }
        } catch (e) {
          console.log(`❌ Failed to click button: ${e}`);
        }
      }
    }
    
    if (!modalOpened) {
      console.log('❌ No modal opened, trying to find exercise input directly...');
      
      // Look for exercise input fields directly
      const exerciseInputs = page.locator('input[placeholder*="Exercise"]');
      const count = await exerciseInputs.count();
      console.log(`🔍 Found ${count} exercise input fields`);
      
      if (count > 0) {
        const firstInput = exerciseInputs.first();
        await firstInput.fill('push');
        await page.waitForTimeout(1000);
        
        // Check for dropdown
        const dropdown = page.locator('[data-dropdown]');
        if (await dropdown.isVisible()) {
          console.log('✅ Dropdown appeared!');
          
          // Try to click on first item
          const items = page.locator('[data-dropdown] > div');
          const itemCount = await items.count();
          console.log(`📋 Found ${itemCount} dropdown items`);
          
          if (itemCount > 0) {
            const firstItem = items.first();
            const itemText = await firstItem.textContent();
            console.log(`🎯 Clicking on item: "${itemText}"`);
            
            await firstItem.click();
            await page.waitForTimeout(500);
            
            const inputValue = await firstInput.inputValue();
            console.log(`📝 Input value after click: "${inputValue}"`);
            
            if (inputValue && inputValue !== 'push') {
              console.log('✅ Dropdown selection worked!');
            } else {
              console.log('❌ Dropdown selection failed');
            }
          }
        } else {
          console.log('❌ No dropdown appeared');
        }
      }
    }
  });
});