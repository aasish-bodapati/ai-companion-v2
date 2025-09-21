import { test, expect } from '@playwright/test';

test.describe('Comprehensive Dropdown Debug', () => {
  
  test('Full page exploration and dropdown test', async ({ page }) => {
    console.log('🔍 Starting comprehensive debug...');
    
    // Navigate to fitness page
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ On fitness page');
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'debug-fitness-page.png' });
    
    // Look for all tabs
    console.log('🔍 Looking for all tabs...');
    const allTabs = await page.locator('[role="tab"]').all();
    for (const tab of allTabs) {
      const text = await tab.textContent();
      console.log('🔍 Found tab:', text);
    }
    
    // Look for tabs by test id
    const routinesTabById = page.locator('[data-testid="routines-tab"]');
    const routinesTabCount = await routinesTabById.count();
    console.log('🔍 Routines tab by testid found:', routinesTabCount > 0);
    
    // Look for tabs by text content
    const tabsContainer = page.locator('[role="tablist"]');
    const tabsContainerExists = await tabsContainer.count();
    console.log('🔍 Tabs container found:', tabsContainerExists > 0);
    
    if (tabsContainerExists > 0) {
      const tabText = await tabsContainer.textContent();
      console.log('🔍 All tabs text:', tabText);
      
      // Try to find any tab with "routine" in it
      const routineTab = page.locator('[role="tab"]:has-text("Routine")');
      const routineTabExists = await routineTab.count();
      console.log('🔍 Routine tab by text found:', routineTabExists > 0);
      
      if (routineTabExists > 0) {
        console.log('✅ Clicking on Routine tab...');
        await routineTab.first().click();
        await page.waitForTimeout(2000);
        
        // Take screenshot after clicking tab
        await page.screenshot({ path: 'debug-after-tab-click.png' });
        
        // Look for custom routine button
        const customButton = page.locator('text=Create Custom Routine');
        const customButtonExists = await customButton.count();
        console.log('🔍 Custom routine button found:', customButtonExists > 0);
        
        if (customButtonExists > 0) {
          console.log('✅ Clicking Create Custom Routine...');
          await customButton.click();
          await page.waitForTimeout(3000);
          
          // Take screenshot after clicking button
          await page.screenshot({ path: 'debug-after-button-click.png' });
          
          // Check for dialog
          const dialog = page.locator('[role="dialog"]');
          const dialogExists = await dialog.count();
          console.log('🔍 Dialog found:', dialogExists > 0);
          
          if (dialogExists > 0) {
            // Add a workout first
            const addWorkoutBtn = page.locator('text=+ Add Workout');
            const addWorkoutExists = await addWorkoutBtn.count();
            console.log('🔍 Add Workout button found:', addWorkoutExists > 0);
            
            if (addWorkoutExists > 0) {
              await addWorkoutBtn.first().click();
              await page.waitForTimeout(1000);
              
              // Now look for exercise input
              const exerciseInputs = await page.locator('input').all();
              console.log('🔍 Total input fields found:', exerciseInputs.length);
              
              for (let i = 0; i < exerciseInputs.length; i++) {
                const placeholder = await exerciseInputs[i].getAttribute('placeholder');
                console.log(`🔍 Input ${i} placeholder:`, placeholder);
              }
              
              const exerciseInput = page.locator('input[placeholder*="exercise"]').or(page.locator('input[placeholder*="Exercise"]'));
              const exerciseInputExists = await exerciseInput.count();
              console.log('🔍 Exercise input found:', exerciseInputExists > 0);
              
              if (exerciseInputExists > 0) {
                console.log('✅ Testing dropdown functionality...');
                
                // Set up console logging before typing
                page.on('console', msg => {
                  if (msg.text().includes('🔍') || msg.text().includes('dropdown') || msg.text().includes('suggestion') || msg.text().includes('exercise')) {
                    console.log('BROWSER:', msg.text());
                  }
                });
                
                // Type in the input
                await exerciseInput.first().fill('pu');
                console.log('✅ Typed "pu" in input field');
                await page.waitForTimeout(2000);
                
                // Check for dropdown immediately
                let dropdown = page.locator('[data-dropdown]');
                let dropdownExists = await dropdown.count();
                let dropdownVisible = dropdownExists > 0 ? await dropdown.first().isVisible() : false;
                
                console.log('🔍 After "pu" - Dropdown elements:', dropdownExists);
                console.log('🔍 After "pu" - Dropdown visible:', dropdownVisible);
                
                // Type more characters
                await exerciseInput.first().fill('push');
                console.log('✅ Typed "push" in input field');
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
                  console.log('🔍 Dropdown content length:', dropdownHTML.length);
                }
                
                // Take final screenshot
                await page.screenshot({ path: 'debug-final-dropdown-state.png' });
                
                // Test API directly in browser
                const apiResponse = await page.evaluate(async () => {
                  try {
                    const response = await fetch('http://localhost:8000/api/v1/health/exercises/search?q=push&limit=5');
                    return {
                      status: response.status,
                      ok: response.ok,
                      data: response.ok ? await response.json() : await response.text()
                    };
                  } catch (error) {
                    return { error: error.message };
                  }
                });
                
                console.log('🔍 Direct API test result:', JSON.stringify(apiResponse, null, 2));
              }
            }
          }
        }
      }
    }
  });
});
