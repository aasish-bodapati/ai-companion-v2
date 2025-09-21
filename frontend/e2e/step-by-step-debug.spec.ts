import { test, expect } from '@playwright/test';

test.describe('Step by Step Debug', () => {
  test('should debug the complete flow step by step', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log(`[${msg.type()}] ${msg.text()}`);
    });

    // Step 1: Navigate to dashboard
    console.log('Step 1: Navigating to dashboard...');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'debug-step1-dashboard.png' });

    // Check what's on the page
    const allText = await page.textContent('body');
    console.log('Dashboard contains "Sign in":', allText?.includes('Sign in'));
    console.log('Dashboard contains "Routines":', allText?.includes('Routines'));

    // Step 2: Try to login if needed
    const signInButton = page.locator('button:has-text("Sign in")').first();
    if (await signInButton.isVisible()) {
      console.log('Step 2: Logging in...');
      await signInButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'debug-step2-after-login.png' });
    }

    // Step 3: Navigate to fitness page
    console.log('Step 3: Navigating to fitness page...');
    await page.goto('/fitness');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'debug-step3-fitness.png' });

    // Check what's on the fitness page
    const fitnessText = await page.textContent('body');
    console.log('Fitness page contains "My Routines":', fitnessText?.includes('My Routines'));
    console.log('Fitness page contains "Routines":', fitnessText?.includes('Routines'));
    console.log('Fitness page contains "Create":', fitnessText?.includes('Create'));

    // Look for all tabs
    const tabs = await page.locator('[role="tab"]').all();
    console.log(`Found ${tabs.length} tabs`);
    for (let i = 0; i < tabs.length; i++) {
      const text = await tabs[i].textContent();
      const isVisible = await tabs[i].isVisible();
      console.log(`Tab ${i}: "${text}" (visible: ${isVisible})`);
    }

    // Look for all buttons
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons`);
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const text = await buttons[i].textContent();
      const isVisible = await buttons[i].isVisible();
      console.log(`Button ${i}: "${text}" (visible: ${isVisible})`);
    }

    // Step 4: Try to find and click the routines tab
    console.log('Step 4: Looking for routines tab...');
    const routinesTab = page.locator('*:has-text("My Routines")').first();
    if (await routinesTab.isVisible()) {
      console.log('Found "My Routines" tab, clicking...');
      await routinesTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'debug-step4-after-routines-tab.png' });
    } else {
      console.log('"My Routines" tab not found, trying alternative selectors...');
      
      // Try different selectors
      const tabSelectors = [
        '[data-testid="routines-tab"]',
        'button:has-text("Routines")',
        '*:has-text("Routines")',
        '[role="tab"]:has-text("Routines")'
      ];
      
      for (const selector of tabSelectors) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          console.log(`Found element with selector: ${selector}`);
          await element.click();
          await page.waitForTimeout(2000);
          break;
        }
      }
    }

    // Step 5: Look for Create Custom Routine button
    console.log('Step 5: Looking for Create Custom Routine button...');
    const createButtonSelectors = [
      'button:has-text("Create Custom Routine")',
      '*:has-text("Create Custom Routine")',
      'button:has-text("Create")',
      '[data-testid*="create"]'
    ];
    
    let createButton = null;
    for (const selector of createButtonSelectors) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        console.log(`Found create button with selector: ${selector}`);
        createButton = element;
        break;
      }
    }
    
    if (createButton) {
      console.log('Clicking Create Custom Routine button...');
      await createButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'debug-step5-after-create-button.png' });
      
      // Check if dialog opened
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible()) {
        console.log('Dialog opened successfully!');
        
        // Look for routine name input
        const routineNameInput = page.locator('input[placeholder*="routine" i]');
        if (await routineNameInput.isVisible()) {
          console.log('Found routine name input, filling it...');
          await routineNameInput.fill('Test Routine');
        }
        
        // Look for Monday section and Add Workout button
        const mondaySection = page.locator('*:has-text("Monday")').first();
        if (await mondaySection.isVisible()) {
          console.log('Found Monday section');
          const addWorkoutButton = mondaySection.locator('button:has-text("Add Workout")');
          if (await addWorkoutButton.isVisible()) {
            console.log('Found Add Workout button, clicking...');
            await addWorkoutButton.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'debug-step6-after-add-workout.png' });
            
            // Look for exercise input
            const exerciseInput = page.locator('input[placeholder*="exercise" i]');
            if (await exerciseInput.isVisible()) {
              console.log('Found exercise input, typing "push up"...');
              await exerciseInput.click();
              await exerciseInput.fill('push up');
              await page.waitForTimeout(1000);
              
              // Look for suggestions
              const suggestions = page.locator('[class*="fixed z-[9999]"]');
              if (await suggestions.isVisible()) {
                console.log('Found suggestions!');
                const suggestionItems = suggestions.locator('div[class*="cursor-pointer"]');
                const count = await suggestionItems.count();
                console.log(`Found ${count} suggestion items`);
                
                if (count > 0) {
                  console.log('Clicking first suggestion...');
                  await suggestionItems.first().click();
                  await page.waitForTimeout(2000);
                  await page.screenshot({ path: 'debug-step7-after-suggestion-click.png' });
                  
                  // Check if form appeared
                  const formSection = page.locator('h5:has-text("Details")');
                  if (await formSection.isVisible()) {
                    console.log('✅ SUCCESS! Dynamic form appeared!');
                    const formText = await formSection.textContent();
                    console.log(`Form text: ${formText}`);
                  } else {
                    console.log('❌ Dynamic form did not appear');
                  }
                }
              } else {
                console.log('No suggestions found');
              }
            } else {
              console.log('Exercise input not found');
            }
          } else {
            console.log('Add Workout button not found');
          }
        } else {
          console.log('Monday section not found');
        }
      } else {
        console.log('Dialog did not open');
      }
    } else {
      console.log('Create Custom Routine button not found');
    }
  });
});
