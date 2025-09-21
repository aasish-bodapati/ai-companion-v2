import { test, expect } from '@playwright/test';

test.describe('Dropdown Selection Test', () => {
  test('Test dropdown selection and dynamic fields', async ({ page }) => {
    // Navigate to the fitness page
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');

    // Click on "Create Custom Routine" button
    await page.click('button:has-text("Create Custom Routine")');
    
    // Wait for the modal to open
    await page.waitForSelector('[role="dialog"]');
    
    // Add a workout to Monday
    await page.click('button:has-text("Add Workout")');
    
    // Type in the exercise input
    const exerciseInput = page.locator('input[placeholder*="Exercise Name"]').first();
    await exerciseInput.fill('pu');
    
    // Wait for dropdown to appear
    await page.waitForSelector('[data-dropdown]', { timeout: 5000 });
    
    // Click on "Push-ups" from the dropdown
    await page.click('[data-dropdown] div:has-text("Push-ups")');
    
    // Verify the input is filled
    await expect(exerciseInput).toHaveValue('Push-ups');
    
    // Verify that sets and reps fields are visible (bodyweight exercise)
    await expect(page.locator('label:has-text("Sets")')).toBeVisible();
    await expect(page.locator('label:has-text("Reps")')).toBeVisible();
    
    // Verify weight fields are NOT visible for bodyweight exercise
    await expect(page.locator('label:has-text("Weight")')).not.toBeVisible();
    
    // Test with a weightlifting exercise
    await exerciseInput.clear();
    await exerciseInput.fill('be');
    
    // Wait for dropdown to appear
    await page.waitForSelector('[data-dropdown]', { timeout: 5000 });
    
    // Click on "Bench Press" from the dropdown
    await page.click('[data-dropdown] div:has-text("Bench Press")');
    
    // Verify the input is filled
    await expect(exerciseInput).toHaveValue('Bench Press');
    
    // Verify that sets, reps, and weight fields are visible (weightlifting exercise)
    await expect(page.locator('label:has-text("Sets")')).toBeVisible();
    await expect(page.locator('label:has-text("Reps")')).toBeVisible();
    await expect(page.locator('label:has-text("Weight")')).toBeVisible();
    await expect(page.locator('label:has-text("Unit")')).toBeVisible();
  });
});
