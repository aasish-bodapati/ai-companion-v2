import { test, expect } from '@playwright/test';

test.describe('Real Component Debug', () => {
  
  test('Debug actual dropdown in real component', async ({ page }) => {
    console.log('🔍 Debugging real dropdown component...');
    
    // Navigate directly to fitness page
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');
    
    // Try to find the routines tab by looking at all elements
    console.log('🔍 Looking for tabs...');
    
    // Get all clickable elements that might be tabs
    const allButtons = await page.locator('button').all();
    const allDivs = await page.locator('div[role="tab"], div[data-testid*="tab"]').all();
    const allTabElements = await page.locator('[role="tab"], [role="tablist"] *, button:has-text("Routine")').all();
    
    console.log(`🔍 Found ${allButtons.length} buttons on page`);
    console.log(`🔍 Found ${allDivs.length} tab divs`);
    console.log(`🔍 Found ${allTabElements.length} tab elements`);
    
    // Look for any element containing "routine" text
    const routineElements = await page.locator('*:has-text("Routine")').all();
    console.log(`🔍 Found ${routineElements.length} elements with "Routine" text`);
    
    for (let i = 0; i < Math.min(routineElements.length, 5); i++) {
      const text = await routineElements[i].textContent();
      const tagName = await routineElements[i].evaluate(el => el.tagName);
      console.log(`🔍 Routine element ${i}: ${tagName} - "${text}"`);
    }
    
    // Try to find and click on routines tab
    let routinesClicked = false;
    for (const element of routineElements) {
      const text = await element.textContent();
      if (text?.includes('My Routines') || text?.includes('Routines')) {
        try {
          await element.click();
          console.log('✅ Clicked on routines element');
          routinesClicked = true;
          await page.waitForTimeout(2000);
          break;
        } catch (error) {
          console.log('❌ Failed to click routines element:', error);
        }
      }
    }
    
    if (!routinesClicked) {
      // Try clicking any button that might be a tab
      const tabButtons = await page.locator('button').all();
      for (const button of tabButtons) {
        const text = await button.textContent();
        if (text?.toLowerCase().includes('routine')) {
          await button.click();
          console.log(`✅ Clicked button: "${text}"`);
          await page.waitForTimeout(2000);
          break;
        }
      }
    }
    
    // Look for Create Custom Routine button
    const customButtons = await page.locator('*:has-text("Create Custom Routine")').all();
    console.log(`🔍 Found ${customButtons.length} "Create Custom Routine" elements`);
    
    if (customButtons.length > 0) {
      await customButtons[0].click();
      console.log('✅ Clicked Create Custom Routine');
      await page.waitForTimeout(3000);
      
      // Look for Add Workout button
      const addWorkoutBtns = await page.locator('*:has-text("Add Workout")').all();
      console.log(`🔍 Found ${addWorkoutBtns.length} "Add Workout" elements`);
      
      if (addWorkoutBtns.length > 0) {
        await addWorkoutBtns[0].click();
        console.log('✅ Clicked Add Workout');
        await page.waitForTimeout(1000);
        
        // Find exercise input
        const exerciseInputs = await page.locator('input').all();
        console.log(`🔍 Found ${exerciseInputs.length} input elements`);
        
        let exerciseInput = null;
        for (const input of exerciseInputs) {
          const placeholder = await input.getAttribute('placeholder');
          console.log(`🔍 Input placeholder: "${placeholder}"`);
          if (placeholder?.toLowerCase().includes('exercise')) {
            exerciseInput = input;
            break;
          }
        }
        
        if (exerciseInput) {
          console.log('✅ Found exercise input, testing dropdown...');
          
          // Get input position BEFORE typing
          const initialInputBox = await exerciseInput.boundingBox();
          console.log('🔍 Input position before typing:', initialInputBox);
          
          // Set up console logging to catch React logs
          page.on('console', msg => {
            const text = msg.text();
            if (text.includes('🔍') || text.includes('dropdown') || text.includes('position') || text.includes('rect')) {
              console.log('BROWSER:', text);
            }
          });
          
          // Type to trigger dropdown
          await exerciseInput.fill('push');
          console.log('✅ Typed "push" in exercise input');
          await page.waitForTimeout(3000);
          
          // Get input position AFTER typing
          const afterInputBox = await exerciseInput.boundingBox();
          console.log('🔍 Input position after typing:', afterInputBox);
          
          // Look for dropdown elements
          const dropdowns = await page.locator('[data-dropdown]').all();
          console.log(`🔍 Found ${dropdowns.length} dropdown elements`);
          
          for (let i = 0; i < dropdowns.length; i++) {
            const dropdown = dropdowns[i];
            const isVisible = await dropdown.isVisible();
            console.log(`🔍 Dropdown ${i} visible:`, isVisible);
            
            if (isVisible) {
              const dropdownBox = await dropdown.boundingBox();
              const styles = await dropdown.getAttribute('style');
              const classes = await dropdown.getAttribute('class');
              
              console.log(`🔍 Dropdown ${i} position:`, dropdownBox);
              console.log(`🔍 Dropdown ${i} styles:`, styles);
              console.log(`🔍 Dropdown ${i} classes:`, classes);
              
              if (afterInputBox && dropdownBox) {
                const gap = dropdownBox.y - (afterInputBox.y + afterInputBox.height);
                console.log(`🔍 Gap between input and dropdown ${i}:`, gap, 'pixels');
                
                if (gap > 10) {
                  console.log(`❌ LARGE GAP DETECTED: ${gap}px - This is the bug!`);
                  
                  // Check if it's a portal positioning issue
                  const parent = await dropdown.evaluate(el => {
                    const rect = el.getBoundingClientRect();
                    const computedStyle = window.getComputedStyle(el);
                    return {
                      position: computedStyle.position,
                      top: computedStyle.top,
                      left: computedStyle.left,
                      transform: computedStyle.transform,
                      parentTagName: el.parentElement?.tagName,
                      boundingRect: {
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height
                      }
                    };
                  });
                  
                  console.log('🔍 Dropdown computed styles and parent:', JSON.stringify(parent, null, 2));
                  
                  // Check the input element's position calculation
                  const inputDebugInfo = await exerciseInput.evaluate(el => {
                    const rect = el.getBoundingClientRect();
                    return {
                      boundingRect: {
                        top: rect.top,
                        bottom: rect.bottom,
                        left: rect.left,
                        right: rect.right,
                        width: rect.width,
                        height: rect.height
                      },
                      scrollY: window.scrollY,
                      calculatedDropdownTop: rect.bottom + window.scrollY
                    };
                  });
                  
                  console.log('🔍 Input debug info:', JSON.stringify(inputDebugInfo, null, 2));
                }
              }
            }
          }
          
          // Take screenshot for debugging
          await page.screenshot({ path: 'real-component-dropdown-debug.png' });
          
        } else {
          console.log('❌ No exercise input found');
        }
      } else {
        console.log('❌ No Add Workout button found');
      }
    } else {
      console.log('❌ No Create Custom Routine button found');
    }
  });
});
