import { test, expect } from '@playwright/test';

test.describe('Mock Auth Exercise Test', () => {
  test('should test exercise selection with mocked authentication', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log(`[${msg.type()}] ${msg.text()}`);
    });

    // Step 1: Mock authentication before navigating
    console.log('Step 1: Setting up mock authentication...');
    await page.addInitScript(() => {
      // Mock the authentication context
      window.localStorage.setItem('auth-token', 'mock-token-123');
      window.localStorage.setItem('user', JSON.stringify({ 
        id: 1, 
        email: 'test@example.com',
        name: 'Test User'
      }));
      
      // Mock the API responses
      window.fetch = async (url: string) => {
        if (url.includes('/api/v1/health/exercises/all')) {
          return {
            ok: true,
            json: async () => ({
              exercises: [
                {
                  id: 33,
                  name: "Push-ups",
                  logging_category: "bodyweight",
                  logging_category_info: {
                    id: 1,
                    name: "bodyweight",
                    display_name: "Bodyweight Exercises",
                    description: "Exercises using only your body weight",
                    logging_attributes: {
                      required: [
                        { name: "sets", type: "number", label: "Sets", min: 1, max: 50 },
                        { name: "reps", type: "number", label: "Reps", min: 1, max: 1000 }
                      ],
                      optional: [
                        { name: "notes", type: "text", label: "Notes", max_length: 500 }
                      ]
                    },
                    icon: "user",
                    color: "blue"
                  },
                  difficulty: "beginner",
                  calories_per_minute: 5,
                  description: "Exercise from wger.de database"
                },
                {
                  id: 34,
                  name: "Plank Jacks",
                  logging_category: "hold_static",
                  logging_category_info: {
                    id: 4,
                    name: "hold_static",
                    display_name: "Hold & Static",
                    description: "Static holds and isometric exercises",
                    logging_attributes: {
                      required: [
                        { name: "duration", type: "number", label: "Hold Time (seconds)", min: 1, max: 3600 }
                      ],
                      optional: [
                        { name: "difficulty", type: "select", label: "Difficulty", options: ["beginner", "intermediate", "advanced"] },
                        { name: "notes", type: "text", label: "Notes", max_length: 500 }
                      ]
                    },
                    icon: "clock",
                    color: "purple"
                  },
                  difficulty: "beginner",
                  calories_per_minute: 5,
                  description: "Exercise from wger.de database"
                }
              ]
            })
          };
        }
        return { ok: false, status: 404 };
      };
    });

    // Step 2: Navigate to fitness page
    console.log('Step 2: Navigating to fitness page...');
    await page.goto('/fitness');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'debug-mock-auth-fitness.png' });

    // Check if we can see the fitness content
    const fitnessText = await page.textContent('body');
    console.log('Fitness page contains "My Routines":', fitnessText?.includes('My Routines'));
    console.log('Fitness page contains "Routines":', fitnessText?.includes('Routines'));

    // Look for tabs
    const tabs = await page.locator('[role="tab"]').all();
    console.log(`Found ${tabs.length} tabs`);
    for (let i = 0; i < tabs.length; i++) {
      const text = await tabs[i].textContent();
      const isVisible = await tabs[i].isVisible();
      console.log(`Tab ${i}: "${text}" (visible: ${isVisible})`);
    }

    if (tabs.length === 0) {
      console.log('❌ No tabs found - authentication mock failed');
      return;
    }

    // Step 3: Click on routines tab
    console.log('Step 3: Clicking on routines tab...');
    const routinesTab = page.locator('*:has-text("My Routines")').first();
    if (await routinesTab.isVisible()) {
      await routinesTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'debug-mock-auth-routines.png' });
    } else {
      console.log('❌ Routines tab not found');
      return;
    }

    // Step 4: Look for Create Custom Routine button
    console.log('Step 4: Looking for Create Custom Routine button...');
    const createButton = page.locator('button:has-text("Create Custom Routine")');
    if (await createButton.isVisible()) {
      console.log('Found Create Custom Routine button, clicking...');
      await createButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'debug-mock-auth-create-dialog.png' });
      
      // Check if dialog opened
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible()) {
        console.log('✅ Dialog opened successfully!');
        
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
            await page.screenshot({ path: 'debug-mock-auth-add-workout.png' });
            
            // Look for exercise input
            const exerciseInput = page.locator('input[placeholder*="exercise" i]');
            if (await exerciseInput.isVisible()) {
              console.log('Found exercise input, typing "push"...');
              await exerciseInput.click();
              await exerciseInput.fill('push');
              await page.waitForTimeout(1000);
              
              // Look for suggestions
              const suggestions = page.locator('[class*="fixed z-[9999]"]');
              if (await suggestions.isVisible()) {
                console.log('✅ Found suggestions!');
                const suggestionItems = suggestions.locator('div[class*="cursor-pointer"]');
                const count = await suggestionItems.count();
                console.log(`Found ${count} suggestion items`);
                
                if (count > 0) {
                  console.log('Clicking first suggestion...');
                  await suggestionItems.first().click();
                  await page.waitForTimeout(2000);
                  await page.screenshot({ path: 'debug-mock-auth-after-suggestion.png' });
                  
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
                    console.log('🎉 EXERCISE SELECTION IS WORKING!');
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
