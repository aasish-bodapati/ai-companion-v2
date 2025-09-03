import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to onboarding page
    await page.goto('/onboarding');
  });

  test('should display onboarding form with all fields', async ({ page }) => {
    await expect(page.getByText('Onboarding Profile')).toBeVisible();
    await expect(page.getByText('Tell us about yourself to personalize your experience')).toBeVisible();
    
    // Basic Information
    await expect(page.getByLabel('Nickname')).toBeVisible();
    await expect(page.getByLabel('Pronouns')).toBeVisible();
    await expect(page.getByLabel('Location')).toBeVisible();
    await expect(page.getByLabel('Topics of Interest')).toBeVisible();
    
    // Communication Preferences
    await expect(page.getByLabel('Response Style')).toBeVisible();
    await expect(page.getByLabel('Memory Policy')).toBeVisible();
    
    // Personal Assistant Fields
    await expect(page.getByLabel('Daily Schedule')).toBeVisible();
    await expect(page.getByLabel('Fitness Goals')).toBeVisible();
    await expect(page.getByLabel('Nutrition Goals')).toBeVisible();
    await expect(page.getByLabel('Communication Style')).toBeVisible();
    
    // Additional Fields
    await expect(page.getByLabel('Additional Preferences')).toBeVisible();
    await expect(page.getByLabel('Your Life Blueprint')).toBeVisible();
    
    // Submit button
    await expect(page.getByRole('button', { name: 'Save Profile' })).toBeVisible();
  });

  test('should fill and attempt to save basic information', async ({ page }) => {
    // Fill in basic information
    await page.getByLabel('Nickname').fill('TestUser');
    await page.getByLabel('Pronouns').fill('they/them');
    await page.getByLabel('Location').fill('San Francisco, CA');
    await page.getByLabel('Topics of Interest').fill('AI, fitness, cooking');
    
    // Submit the form (will make real API call)
    await page.getByRole('button', { name: 'Save Profile' }).click();
    
    // Should show loading state
    await expect(page.getByText('Saving...')).toBeVisible();
    
    // Note: In a real test environment, this would save to the actual database
  });

  test('should handle communication preferences', async ({ page }) => {
    // Select response style
    await page.getByLabel('Response Style').selectOption('Concise');
    await expect(page.getByLabel('Response Style')).toHaveValue('Concise');
    
    // Select memory policy
    await page.getByLabel('Memory Policy').selectOption('ImportantOnly');
    await expect(page.getByLabel('Memory Policy')).toHaveValue('ImportantOnly');
  });

  test('should fill personal assistant fields', async ({ page }) => {
    // Fill in personal assistant fields
    await page.getByLabel('Daily Schedule').fill('9-5 work, evening workouts');
    await page.getByLabel('Fitness Goals').fill('Build strength and endurance');
    await page.getByLabel('Nutrition Goals').fill('Eat more protein');
    await page.getByLabel('Communication Style').fill('Direct and encouraging');
    
    // Verify values
    await expect(page.getByLabel('Daily Schedule')).toHaveValue('9-5 work, evening workouts');
    await expect(page.getByLabel('Fitness Goals')).toHaveValue('Build strength and endurance');
    await expect(page.getByLabel('Nutrition Goals')).toHaveValue('Eat more protein');
    await expect(page.getByLabel('Communication Style')).toHaveValue('Direct and encouraging');
  });

  test('should handle user blueprint with character count', async ({ page }) => {
    const blueprintTextarea = page.getByLabel('Your Life Blueprint');
    
    // Initial character count should be 0
    await expect(page.getByText('0 characters')).toBeVisible();
    
    // Type some content
    await blueprintTextarea.fill('I wake up at 7 AM and work out for 30 minutes.');
    
    // Character count should update
    await expect(page.getByText('47 characters')).toBeVisible();
    
    // Add more content
    await blueprintTextarea.fill('I wake up at 7 AM and work out for 30 minutes. I eat a healthy breakfast and work from 9-5.');
    
    // Character count should update again
    await expect(page.getByText('95 characters')).toBeVisible();
  });

  test('should show blueprint guidance', async ({ page }) => {
    // Check that guidance elements are present
    await expect(page.getByText('Your Life Blueprint')).toBeVisible();
    await expect(page.getByText('The foundation of your AI companion\'s understanding')).toBeVisible();
    await expect(page.getByText('Think of this as briefing your new personal assistant')).toBeVisible();
    await expect(page.getByText('✅ Include:')).toBeVisible();
    await expect(page.getByText('💭 Consider:')).toBeVisible();
  });

  test('should handle topics of interest as comma-separated', async ({ page }) => {
    const topicsInput = page.getByLabel('Topics of Interest');
    
    // Enter comma-separated topics
    await topicsInput.fill('AI, fitness, cooking, technology');
    
    // Value should be preserved as entered
    await expect(topicsInput).toHaveValue('AI, fitness, cooking, technology');
  });

  test('should attempt to save complete profile', async ({ page }) => {
    // Fill in all fields
    await page.getByLabel('Nickname').fill('TestUser');
    await page.getByLabel('Pronouns').fill('they/them');
    await page.getByLabel('Location').fill('San Francisco, CA');
    await page.getByLabel('Topics of Interest').fill('AI, fitness, cooking');
    await page.getByLabel('Response Style').selectOption('Concise');
    await page.getByLabel('Memory Policy').selectOption('ImportantOnly');
    await page.getByLabel('Daily Schedule').fill('9-5 work, evening workouts');
    await page.getByLabel('Fitness Goals').fill('Build strength and endurance');
    await page.getByLabel('Nutrition Goals').fill('Eat more protein');
    await page.getByLabel('Communication Style').fill('Direct and encouraging');
    await page.getByLabel('Additional Preferences').fill('Prefer morning check-ins');
    await page.getByLabel('Your Life Blueprint').fill('I wake up at 7 AM and work out for 30 minutes.');
    
    // Submit the form (will make real API call)
    await page.getByRole('button', { name: 'Save Profile' }).click();
    
    // Should show loading state
    await expect(page.getByText('Saving...')).toBeVisible();
    
    // Note: In a real test environment, this would save all the data to the actual database
  });

  test('should handle save attempts gracefully', async ({ page }) => {
    // Fill in some data
    await page.getByLabel('Nickname').fill('TestUser');
    
    // Submit the form (will make real API call)
    await page.getByRole('button', { name: 'Save Profile' }).click();
    
    // Should show loading state
    await expect(page.getByText('Saving...')).toBeVisible();
    
    // Note: In a real test environment, this would test actual error handling
    // when the API returns an error response
  });

  test('should attempt to load existing profile data', async ({ page }) => {
    // Reload the page to attempt fetching existing profile
    await page.reload();
    
    // Wait for the form to load
    await expect(page.getByText('Onboarding Profile')).toBeVisible();
    
    // Note: In a real test environment with existing data,
    // this would verify that fields are populated with existing values
    // For now, we just verify the form loads correctly
  });

  test('should render in preferences mode', async ({ page }) => {
    // Navigate to preferences mode
    await page.goto('/onboarding?mode=preferences');
    
    // Should show different title and description
    await expect(page.getByText('Profile Preferences')).toBeVisible();
    await expect(page.getByText('Customize your profile and preferences')).toBeVisible();
  });
});
