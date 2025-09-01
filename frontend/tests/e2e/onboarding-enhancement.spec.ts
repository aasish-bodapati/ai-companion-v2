import { test, expect } from '@playwright/test';

test.describe('Enhanced Onboarding System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to registration first
    await page.goto('/register');
    
    // Fill registration form
    await page.fill('input[type="email"]', 'newuser@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should redirect to onboarding
    await page.waitForURL(/\/onboarding|\/profile/);
  });

  test('should display enhanced blueprint section with visual hierarchy', async ({ page }) => {
    // Navigate to profile/onboarding if not already there
    if (!page.url().includes('onboarding')) {
      await page.goto('/profile');
    }
    
    // Check for enhanced blueprint section
    await expect(page.locator('text=Your Life Blueprint')).toBeVisible();
    await expect(page.locator('text=🗿')).toBeVisible();
    
    // Check for guidance sections
    await expect(page.locator('text=Think of this as briefing your new personal assistant')).toBeVisible();
    await expect(page.locator('text=✅ Include:')).toBeVisible();
    await expect(page.locator('text=💭 Consider:')).toBeVisible();
  });

  test('should show comprehensive example in placeholder', async ({ page }) => {
    if (!page.url().includes('onboarding')) {
      await page.goto('/profile');
    }
    
    const blueprintTextarea = page.locator('textarea').filter({ hasText: /I wake up at 4:30 AM/ });
    await expect(blueprintTextarea).toBeVisible();
    
    // Check that placeholder contains specific routine elements
    const placeholder = await blueprintTextarea.getAttribute('placeholder');
    expect(placeholder).toContain('4:30 AM');
    expect(placeholder).toContain('protein shake');
    expect(placeholder).toContain('2500 calories');
    expect(placeholder).toContain('increased squats by 2.5kg');
  });

  test('should show character count as user types', async ({ page }) => {
    if (!page.url().includes('onboarding')) {
      await page.goto('/profile');
    }
    
    const textarea = page.locator('textarea').filter({ hasText: /I wake up at 4:30 AM/ });
    const testText = "I wake up early and work out regularly.";
    
    await textarea.fill(testText);
    
    // Check character count updates
    await expect(page.locator(`text=${testText.length} characters`)).toBeVisible();
  });

  test('should provide helpful guidance sections', async ({ page }) => {
    if (!page.url().includes('onboarding')) {
      await page.goto('/profile');
    }
    
    // Check include section
    await expect(page.locator('text=Daily schedule (wake up, work, meals, sleep)')).toBeVisible();
    await expect(page.locator('text=Fitness routine & goals')).toBeVisible();
    await expect(page.locator('text=Nutrition habits & targets')).toBeVisible();
    
    // Check consider section
    await expect(page.locator('text=What motivates you?')).toBeVisible();
    await expect(page.locator('text=When do you need support?')).toBeVisible();
    await expect(page.locator('text=How do you prefer feedback?')).toBeVisible();
  });

  test('should maintain responsive design on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    if (!page.url().includes('onboarding')) {
      await page.goto('/profile');
    }
    
    // Blueprint section should still be visible and usable
    await expect(page.locator('text=Your Life Blueprint')).toBeVisible();
    
    // Guidance sections should stack properly
    const includeSection = page.locator('text=✅ Include:').locator('..');
    const considerSection = page.locator('text=💭 Consider:').locator('..');
    
    await expect(includeSection).toBeVisible();
    await expect(considerSection).toBeVisible();
    
    // Textarea should be usable
    const textarea = page.locator('textarea').filter({ hasText: /I wake up at 4:30 AM/ });
    await expect(textarea).toBeVisible();
    await textarea.fill('Test input on mobile');
    await expect(textarea).toHaveValue('Test input on mobile');
  });

  test('should save comprehensive blueprint and redirect appropriately', async ({ page }) => {
    if (!page.url().includes('onboarding')) {
      await page.goto('/profile');
    }
    
    // Fill out the blueprint with comprehensive information
    const comprehensiveBlueprint = `
I wake up at 4:30 AM every day and work out from 5:00-6:30 AM Monday through Saturday. 
My breakfast routine is 4 boiled eggs, salad with greens, and a protein shake with 27g protein powder, 250ml milk, 1 banana, and 2 tbsp peanut butter. I take D3+K2 and fish oil supplements.

Work schedule: Leave home at 9:30 AM, reach office by 10:30 AM, work until 6:30 PM. 
Nutrition: Carrot snack at noon, lunch at 2 PM (2 cups rice with curry), fruit salad at 4 PM, dinner at 8 PM (250g air-fried chicken with salad).

Goals: Build muscle, maintain 2500 calories with 150g protein daily, develop my AI companion app.
Challenges: Consistency when routine gets disrupted, staying motivated during busy periods.
Preferences: Direct communication, data-driven insights, celebrate small wins.

I need help with workout progression tracking, meal timing adjustments, and motivation support.
    `.trim();
    
    const textarea = page.locator('textarea').filter({ hasText: /I wake up at 4:30 AM/ });
    await textarea.fill(comprehensiveBlueprint);
    
    // Fill other required fields
    await page.fill('input[placeholder="Optional"]', 'TestUser');
    await page.selectOption('select', { label: 'Balanced' }); // Response style
    await page.selectOption('select[value=""]', { label: 'Remember All' }); // Memory policy
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Should save successfully (check for success indication or redirect)
    // This might redirect to /today or show a success message
    await page.waitForTimeout(2000); // Give time for save operation
    
    // Verify the data was saved by checking if we can navigate away and back
    await page.goto('/today');
    await page.goto('/profile');
    
    // Blueprint should still be there
    await expect(textarea).toHaveValue(comprehensiveBlueprint);
  });

  test('should integrate with the holistic memory system', async ({ page }) => {
    if (!page.url().includes('onboarding')) {
      await page.goto('/profile');
    }
    
    // Fill comprehensive blueprint
    const blueprint = `
I'm a software developer who wakes up at 4:30 AM for early workouts. 
I follow a strict nutrition plan with 2500 calories and 150g protein daily.
My goal is to build muscle while developing my AI companion app.
I prefer direct feedback and data-driven insights.
    `.trim();
    
    const textarea = page.locator('textarea').filter({ hasText: /I wake up at 4:30 AM/ });
    await textarea.fill(blueprint);
    
    // Save the profile
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Navigate to chat to test if blueprint information is available
    await page.goto('/chat');
    
    // Send a message that should trigger memory recall
    const chatInput = page.locator('textarea, input[type="text"]').last();
    await chatInput.fill('What do you know about my daily routine?');
    await page.keyboard.press('Enter');
    
    // Wait for response (this would ideally check if the AI mentions the 4:30 AM routine)
    await page.waitForTimeout(3000);
    
    // The response should reference information from the blueprint
    // This is a basic test - in practice you'd check for specific mentions
    const messages = page.locator('[class*="message"], [class*="chat"]');
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThan(1); // Should have user message + AI response
  });

  test('should handle validation and error states gracefully', async ({ page }) => {
    if (!page.url().includes('onboarding')) {
      await page.goto('/profile');
    }
    
    // Try to submit with minimal information
    await page.click('button[type="submit"]');
    
    // Should handle the submission gracefully (either save with minimal data or show validation)
    await page.waitForTimeout(1000);
    
    // Fill with extremely long text to test limits
    const veryLongText = 'A'.repeat(10000);
    const textarea = page.locator('textarea').filter({ hasText: /I wake up at 4:30 AM/ });
    await textarea.fill(veryLongText);
    
    // Character count should update
    await expect(page.locator('text=10000 characters')).toBeVisible();
    
    // Should still be able to submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  test('should provide clear visual feedback during save operation', async ({ page }) => {
    if (!page.url().includes('onboarding')) {
      await page.goto('/profile');
    }
    
    // Fill some data
    const textarea = page.locator('textarea').filter({ hasText: /I wake up at 4:30 AM/ });
    await textarea.fill('Test blueprint data');
    
    // Click submit and check for loading state
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toHaveText('Save Profile');
    
    await submitButton.click();
    
    // Should show loading state briefly
    await expect(submitButton).toHaveText('Saving...');
    
    // Wait for save to complete
    await page.waitForTimeout(2000);
    
    // Button should return to normal state
    await expect(submitButton).toHaveText('Save Profile');
  });
});
