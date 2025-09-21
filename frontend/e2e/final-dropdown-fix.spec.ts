import { test, expect } from '@playwright/test';

test.describe('Final Dropdown Fix', () => {
  
  test('Navigate to real component and test dropdown', async ({ page }) => {
    console.log('🔍 Starting final dropdown test...');
    
    // Go to home page first
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ On home page');
    
    // Look for any navigation to fitness
    const links = await page.locator('a').all();
    let fitnessFound = false;
    
    for (const link of links) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      if (href?.includes('fitness') || text?.toLowerCase().includes('fitness')) {
        console.log('🔍 Found fitness link:', text, href);
        await link.click();
        fitnessFound = true;
        break;
      }
    }
    
    if (!fitnessFound) {
      console.log('🔍 No fitness link found, trying direct navigation...');
      await page.goto('http://localhost:3000/fitness');
    }
    
    await page.waitForLoadState('networkidle');
    console.log('✅ On fitness page');
    
    // Take screenshot
    await page.screenshot({ path: 'final-fitness-page.png' });
    
    // Look for tabs - try multiple approaches
    const tabsSelectors = [
      '[role="tab"]',
      '[data-testid*="tab"]',
      'button:has-text("Routine")',
      'button:has-text("My Routines")',
      '.tab',
      '[role="tablist"] button'
    ];
    
    let routinesTab = null;
    for (const selector of tabsSelectors) {
      const tabs = await page.locator(selector).all();
      console.log(`🔍 Found ${tabs.length} elements with selector: ${selector}`);
      
      for (const tab of tabs) {
        const text = await tab.textContent();
        console.log(`🔍 Tab text: "${text}"`);
        if (text?.toLowerCase().includes('routine')) {
          routinesTab = tab;
          break;
        }
      }
      if (routinesTab) break;
    }
    
    if (routinesTab) {
      console.log('✅ Found routines tab, clicking...');
      await routinesTab.click();
      await page.waitForTimeout(2000);
      
      // Take screenshot after clicking tab
      await page.screenshot({ path: 'final-after-tab-click.png' });
    } else {
      console.log('❌ No routines tab found, checking if content is already visible...');
    }
    
    // Look for Create Custom Routine button
    const customButtonSelectors = [
      'text=Create Custom Routine',
      'button:has-text("Create Custom Routine")',
      'button:has-text("Custom Routine")',
      'button:has-text("Custom")',
      '[data-testid*="custom"]'
    ];
    
    let customButton = null;
    for (const selector of customButtonSelectors) {
      const button = page.locator(selector).first();
      const exists = await button.count() > 0;
      console.log(`🔍 Custom button selector "${selector}" exists: ${exists}`);
      if (exists) {
        customButton = button;
        break;
      }
    }
    
    if (customButton) {
      console.log('✅ Found custom routine button, clicking...');
      await customButton.click();
      await page.waitForTimeout(3000);
      
      // Take screenshot after clicking button
      await page.screenshot({ path: 'final-after-button-click.png' });
      
      // Look for dialog
      const dialog = page.locator('[role="dialog"]');
      const dialogExists = await dialog.count() > 0;
      console.log('🔍 Dialog exists:', dialogExists);
      
      if (dialogExists) {
        // Fill routine name if needed
        const routineNameInput = page.locator('input[placeholder*="Custom Workout"]');
        const routineNameExists = await routineNameInput.count() > 0;
        if (routineNameExists) {
          await routineNameInput.fill('Test Routine');
          console.log('✅ Filled routine name');
        }
        
        // Look for Add Workout button
        const addWorkoutBtn = page.locator('text=+ Add Workout').or(page.locator('button:has-text("Add Workout")'));
        const addWorkoutExists = await addWorkoutBtn.count() > 0;
        console.log('🔍 Add Workout button exists:', addWorkoutExists);
        
        if (addWorkoutExists) {
          await addWorkoutBtn.first().click();
          await page.waitForTimeout(1000);
          console.log('✅ Clicked Add Workout');
          
          // Now look for exercise input
          const exerciseInputSelectors = [
            'input[placeholder*="exercise"]',
            'input[placeholder*="Exercise"]',
            'input[placeholder*="Type exercise"]',
            'input[placeholder*="activity"]'
          ];
          
          let exerciseInput = null;
          for (const selector of exerciseInputSelectors) {
            const input = page.locator(selector);
            const exists = await input.count() > 0;
            console.log(`🔍 Exercise input "${selector}" exists: ${exists}`);
            if (exists) {
              exerciseInput = input.first();
              break;
            }
          }
          
          if (exerciseInput) {
            console.log('✅ Found exercise input, testing dropdown...');
            
            // Set up console logging
            page.on('console', msg => {
              if (msg.text().includes('🔍') || msg.text().includes('Exercise') || msg.text().includes('dropdown') || msg.text().includes('suggestion')) {
                console.log('BROWSER:', msg.text());
              }
            });
            
            // Type in the input
            await exerciseInput.fill('pu');
            console.log('✅ Typed "pu"');
            await page.waitForTimeout(2000);
            
            // Check for dropdown
            let dropdown = page.locator('[data-dropdown]');
            let dropdownExists = await dropdown.count();
            let dropdownVisible = dropdownExists > 0 ? await dropdown.first().isVisible() : false;
            
            console.log('🔍 After "pu" - Dropdown elements:', dropdownExists);
            console.log('🔍 After "pu" - Dropdown visible:', dropdownVisible);
            
            // Type more
            await exerciseInput.fill('push');
            console.log('✅ Typed "push"');
            await page.waitForTimeout(3000);
            
            dropdown = page.locator('[data-dropdown]');
            dropdownExists = await dropdown.count();
            dropdownVisible = dropdownExists > 0 ? await dropdown.first().isVisible() : false;
            
            console.log('🔍 After "push" - Dropdown elements:', dropdownExists);
            console.log('🔍 After "push" - Dropdown visible:', dropdownVisible);
            
            if (dropdownExists > 0) {
              const dropdownStyles = await dropdown.first().getAttribute('style');
              const dropdownClasses = await dropdown.first().getAttribute('class');
              const dropdownHTML = await dropdown.first().innerHTML();
              
              console.log('🔍 Dropdown styles:', dropdownStyles);
              console.log('🔍 Dropdown classes:', dropdownClasses);
              console.log('🔍 Dropdown has content:', dropdownHTML.length > 0);
              
              if (dropdownVisible) {
                // Test positioning
                const inputBox = await exerciseInput.boundingBox();
                const dropdownBox = await dropdown.first().boundingBox();
                
                if (inputBox && dropdownBox) {
                  const gap = dropdownBox.y - (inputBox.y + inputBox.height);
                  console.log('🔍 Gap between input and dropdown:', gap, 'pixels');
                  
                  if (gap <= 2) {
                    console.log('✅ Dropdown positioning is correct!');
                  } else {
                    console.log('❌ Dropdown positioning has gap:', gap, 'pixels');
                  }
                }
              }
            }
            
            // Take final screenshot
            await page.screenshot({ path: 'final-dropdown-test-complete.png' });
            
            // The test should pass if we got this far and have dropdown elements
            expect(dropdownExists).toBeGreaterThan(0);
            
          } else {
            console.log('❌ No exercise input found');
            throw new Error('Exercise input not found');
          }
        } else {
          console.log('❌ No Add Workout button found');
          throw new Error('Add Workout button not found');
        }
      } else {
        console.log('❌ No dialog found');
        throw new Error('Dialog not found');
      }
    } else {
      console.log('❌ No custom routine button found');
      throw new Error('Custom routine button not found');
    }
  });
});
