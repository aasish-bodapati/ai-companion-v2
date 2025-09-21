import { test, expect } from '@playwright/test';

test.describe('Simple Dropdown Debug', () => {
  
  test('Check if servers are running and page loads', async ({ page }) => {
    console.log('🔍 Testing if frontend is accessible...');
    
    try {
      await page.goto('http://localhost:3000', { timeout: 10000 });
      console.log('✅ Frontend server is running');
      
      // Check what's actually on the page
      const title = await page.title();
      console.log('🔍 Page title:', title);
      
      const bodyText = await page.textContent('body');
      console.log('🔍 Page contains "fitness":', bodyText?.includes('fitness') || false);
      console.log('🔍 Page contains "routine":', bodyText?.includes('routine') || false);
      console.log('🔍 Page contains "Create":', bodyText?.includes('Create') || false);
      
    } catch (error) {
      console.log('❌ Frontend server not accessible:', error);
    }
    
    // Test backend API
    try {
      const response = await page.request.get('http://localhost:8000/health');
      console.log('✅ Backend health check:', response.status());
    } catch (error) {
      console.log('❌ Backend server not accessible:', error);
    }
    
    // Test specific API endpoint
    try {
      const response = await page.request.get('http://localhost:8000/api/v1/health/exercises/search?q=push&limit=5');
      console.log('✅ Exercise API:', response.status());
      
      if (response.ok()) {
        const data = await response.json();
        console.log('🔍 Exercise API returned:', data.length, 'results');
      }
    } catch (error) {
      console.log('❌ Exercise API not accessible:', error);
    }
  });

  test('Navigate and find fitness page elements', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    console.log('🔍 Looking for navigation elements...');
    
    // Check if there's a fitness link
    const fitnessLink = page.locator('text=Fitness').or(page.locator('a[href*="fitness"]'));
    const fitnessExists = await fitnessLink.count();
    console.log('🔍 Fitness navigation found:', fitnessExists > 0);
    
    if (fitnessExists > 0) {
      await fitnessLink.first().click();
      await page.waitForLoadState('networkidle');
      
      console.log('🔍 On fitness page, looking for routine elements...');
      
      // Look for any button that might create routines
      const routineButtons = await page.locator('button').all();
      for (const button of routineButtons) {
        const text = await button.textContent();
        if (text?.toLowerCase().includes('routine') || text?.toLowerCase().includes('create')) {
          console.log('🔍 Found button:', text);
        }
      }
      
      // Navigate to My Routines tab first
      console.log('🔍 Navigating to My Routines tab...');
      const routinesTab = page.locator('[data-testid="routines-tab"]').or(page.locator('text=My Routines'));
      const routinesTabExists = await routinesTab.count();
      console.log('🔍 Routines tab found:', routinesTabExists > 0);
      
      if (routinesTabExists > 0) {
        await routinesTab.first().click();
        await page.waitForTimeout(1000);
        
        // Now look for custom routine button
        const customRoutineButton = page.locator('text=Create Custom Routine').or(page.locator('button:has-text("Custom")'));
        const customExists = await customRoutineButton.count();
        console.log('🔍 Custom routine button found:', customExists > 0);
        
        if (customExists > 0) {
          console.log('✅ Found custom routine button, clicking...');
          await customRoutineButton.first().click();
          await page.waitForTimeout(2000);
          
          // Check for dialog
          const dialog = page.locator('[role="dialog"]');
          const dialogExists = await dialog.count();
          console.log('🔍 Dialog opened:', dialogExists > 0);
          
          if (dialogExists > 0) {
            console.log('✅ Dialog is open, looking for input field...');
            
            const inputField = page.locator('input[placeholder*="exercise"]').or(page.locator('input[placeholder*="Exercise"]'));
            const inputExists = await inputField.count();
            console.log('🔍 Exercise input field found:', inputExists > 0);
            
            if (inputExists > 0) {
              console.log('✅ Input field found, testing dropdown...');
              
              // Type in the input
              await inputField.first().fill('push');
              await page.waitForTimeout(2000);
              
              // Check for dropdown
              const dropdown = page.locator('[data-dropdown]');
              const dropdownExists = await dropdown.count();
              const dropdownVisible = dropdownExists > 0 ? await dropdown.first().isVisible() : false;
              
              console.log('🔍 Dropdown elements found:', dropdownExists);
              console.log('🔍 Dropdown visible:', dropdownVisible);
              
              if (dropdownExists > 0 && !dropdownVisible) {
                const dropdownStyles = await dropdown.first().getAttribute('style');
                console.log('🔍 Dropdown styles:', dropdownStyles);
                
                const dropdownClasses = await dropdown.first().getAttribute('class');
                console.log('🔍 Dropdown classes:', dropdownClasses);
              }
              
              // Check console logs
              page.on('console', msg => {
                if (msg.text().includes('🔍') || msg.text().includes('dropdown') || msg.text().includes('suggestion')) {
                  console.log('BROWSER:', msg.text());
                }
              });
              
              // Try typing more
              await inputField.first().fill('pushup');
              await page.waitForTimeout(3000);
              
              const finalDropdownVisible = dropdownExists > 0 ? await dropdown.first().isVisible() : false;
              console.log('🔍 Final dropdown check - visible:', finalDropdownVisible);
            }
          }
        }
      }
    }
  });
});
