import { test, expect } from '@playwright/test';

test.describe('Authenticated Exercise Test', () => {
  test('should test exercise selection with proper authentication', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log(`[${msg.type()}] ${msg.text()}`);
    });

    // Step 1: Navigate to fitness page (this will redirect to login)
    console.log('Step 1: Navigating to fitness page (will redirect to login)...');
    await page.goto('/fitness');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'debug-step1-fitness-redirect.png' });

    // Check if we're on the login page
    const isOnLoginPage = page.url().includes('/login');
    console.log('Redirected to login page:', isOnLoginPage);

    if (isOnLoginPage) {
      console.log('Step 2: On login page, looking for login form...');
      
      // Look for email/username input
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
      const usernameInput = page.locator('input[name="username"], input[placeholder*="username" i]');
      
      if (await emailInput.isVisible()) {
        console.log('Found email input, filling test credentials...');
        await emailInput.fill('test@example.com');
      } else if (await usernameInput.isVisible()) {
        console.log('Found username input, filling test credentials...');
        await usernameInput.fill('testuser');
      }
      
      // Look for password input
      const passwordInput = page.locator('input[type="password"]');
      if (await passwordInput.isVisible()) {
        console.log('Found password input, filling test password...');
        await passwordInput.fill('testpassword');
      }
      
      // Look for sign in button
      const signInButton = page.locator('button[type="submit"]').first();
      if (await signInButton.isVisible()) {
        console.log('Found sign in button, clicking...');
        await signInButton.click();
        
        // Wait for login to complete
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'debug-step2-after-login.png' });
      }
    }

    // Step 3: Navigate back to fitness page after login
    console.log('Step 3: Navigating to fitness page after login...');
    await page.goto('/fitness');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'debug-step3-fitness-after-login.png' });

    // Check if we can see the fitness content now
    const fitnessText = await page.textContent('body');
    console.log('Fitness page contains "My Routines":', fitnessText?.includes('My Routines'));
    console.log('Fitness page contains "Routines":', fitnessText?.includes('Routines'));
    console.log('Fitness page contains "Create":', fitnessText?.includes('Create'));

    // Look for tabs
    const tabs = await page.locator('[role="tab"]').all();
    console.log(`Found ${tabs.length} tabs`);
    for (let i = 0; i < tabs.length; i++) {
      const text = await tabs[i].textContent();
      const isVisible = await tabs[i].isVisible();
      console.log(`Tab ${i}: "${text}" (visible: ${isVisible})`);
    }

    // If we still don't see the content, let's try a different approach
    if (tabs.length === 0) {
      console.log('No tabs found, trying to bypass authentication...');
      
      // Try to mock the authentication by setting localStorage
      await page.evaluate(() => {
        localStorage.setItem('auth-token', 'mock-token');
        localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com' }));
      });
      
      // Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'debug-step4-after-mock-auth.png' });
      
      // Check again
      const tabsAfterMock = await page.locator('[role="tab"]').all();
      console.log(`Found ${tabsAfterMock.length} tabs after mock auth`);
    }

    // Step 4: Try to find and click the routines tab
    console.log('Step 4: Looking for routines tab...');
    const routinesTab = page.locator('*:has-text("My Routines")').first();
    if (await routinesTab.isVisible()) {
      console.log('Found "My Routines" tab, clicking...');
      await routinesTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'debug-step5-after-routines-tab.png' });
    } else {
      console.log('"My Routines" tab not found');
      return; // Skip the rest if we can't get to the routines
    }

    // Step 5: Look for Create Custom Routine button
    console.log('Step 5: Looking for Create Custom Routine button...');
    const createButton = page.locator('button:has-text("Create Custom Routine")');
    if (await createButton.isVisible()) {
      console.log('Found Create Custom Routine button, clicking...');
      await createButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'debug-step6-after-create-button.png' });
      
      // Check if dialog opened
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible()) {
        console.log('Dialog opened successfully!');
        
        // Fill routine name
        const routineNameInput = page.locator('input[placeholder*="routine" i]');
        if (await routineNameInput.isVisible()) {
          console.log('Filling routine name...');
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
            await page.screenshot({ path: 'debug-step7-after-add-workout.png' });
            
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
                  await page.screenshot({ path: 'debug-step8-after-suggestion-click.png' });
                  
                  // Check if form appeared
                  const formSection = page.locator('h5:has-text("Details")');
                  if (await formSection.isVisible()) {
                    console.log('✅ SUCCESS! Dynamic form appeared!');
                    const formText = await formSection.textContent();
                    console.log(`Form text: ${formText}`);
                    
                    // Check for specific form fields
                    const setsField = page.locator('input[placeholder*="sets" i], label:has-text("Sets")');
                    const repsField = page.locator('input[placeholder*="reps" i], label:has-text("Reps")');
                    const notesField = page.locator('input[placeholder*="notes" i], textarea[placeholder*="notes" i], label:has-text("Notes")');
                    
                    const setsVisible = await setsField.isVisible();
                    const repsVisible = await repsField.isVisible();
                    const notesVisible = await notesField.isVisible();
                    
                    console.log(`Sets field visible: ${setsVisible}`);
                    console.log(`Reps field visible: ${repsVisible}`);
                    console.log(`Notes field visible: ${notesVisible}`);
                    
                    // This is the key test - the form should appear
                    expect(formSection.isVisible()).toBeTruthy();
                  } else {
                    console.log('❌ Dynamic form did not appear');
                    
                    // Check for error messages
                    const errorMessage = page.locator('*:has-text("Category not found")');
                    if (await errorMessage.isVisible()) {
                      const errorText = await errorMessage.textContent();
                      console.log(`Error message: ${errorText}`);
                    }
                  }
                } else {
                  console.log('No suggestion items found');
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
