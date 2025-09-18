import { test, expect } from '@playwright/test';

test.describe('Fitness Component E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to fitness page and wait for authentication
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for authentication
  });

  test('Fitness page loads correctly with all tabs', async ({ page }) => {
    console.log('🏋️ Testing fitness page load');
    
    // Check if page title is correct
    await expect(page).toHaveTitle(/AI Companion/);
    
    // Check if all main tabs are present
    await expect(page.locator('[data-testid="fitness-tabs"]')).toBeVisible();
    
    // Check if Workout Logs tab is active by default
    const workoutLogsTab = page.locator('[data-testid="workout-logs-tab"]');
    await expect(workoutLogsTab).toBeVisible();
    await expect(workoutLogsTab).toHaveClass(/data-state-active/);
    
    // Check if My Routines tab is present
    const routinesTab = page.locator('[data-testid="routines-tab"]');
    await expect(routinesTab).toBeVisible();
    
    // Check if Log Workout tab is present
    const logWorkoutTab = page.locator('[data-testid="log-workout-tab"]');
    await expect(logWorkoutTab).toBeVisible();
    
    // Check if Progress tab is present
    const progressTab = page.locator('[data-testid="progress-tab"]');
    await expect(progressTab).toBeVisible();
  });

  test('Workout Logs tab displays correctly', async ({ page }) => {
    console.log('📊 Testing Workout Logs tab');
    
    // Ensure we're on the Workout Logs tab
    await page.click('[data-testid="workout-logs-tab"]');
    await page.waitForTimeout(1000);
    
    // Check if view mode buttons are present
    const dayViewButton = page.locator('button:has-text("Day View")');
    const monthViewButton = page.locator('button:has-text("Month View")');
    
    await expect(dayViewButton).toBeVisible();
    await expect(monthViewButton).toBeVisible();
    
    // Check if stats cards are present
    const statsCards = page.locator('[data-testid="stats-card"]');
    await expect(statsCards).toHaveCount(3); // Total Workouts, Duration, Calories
    
    // Check if logs container is present
    const logsContainer = page.locator('[data-testid="workout-logs-container"]');
    await expect(logsContainer).toBeVisible();
  });

  test('View mode switching works correctly', async ({ page }) => {
    console.log('👁️ Testing view mode switching');
    
    // Ensure we're on the Workout Logs tab
    await page.click('[data-testid="workout-logs-tab"]');
    await page.waitForTimeout(1000);
    
    // Test Day View
    const dayViewButton = page.locator('button:has-text("Day View")');
    await dayViewButton.click();
    await page.waitForTimeout(500);
    
    // Check if Day View is active
    await expect(dayViewButton).toHaveClass(/bg-blue-600/);
    
    // Test Month View
    const monthViewButton = page.locator('button:has-text("Month View")');
    await monthViewButton.click();
    await page.waitForTimeout(500);
    
    // Check if Month View is active
    await expect(monthViewButton).toHaveClass(/bg-blue-600/);
    await expect(dayViewButton).not.toHaveClass(/bg-blue-600/);
  });

  test('Smart Logger functionality', async ({ page }) => {
    console.log('🧠 Testing Smart Logger');
    
    // Click on Smart Logger tab
    await page.click('[data-testid="smart-logger-tab"]');
    await page.waitForTimeout(1000);
    
    // Check if Smart Logger form is visible
    const smartLoggerForm = page.locator('[data-testid="smart-logger-form"]');
    await expect(smartLoggerForm).toBeVisible();
    
    // Fill in workout details
    await page.fill('[data-testid="workout-name-input"]', 'Test Workout');
    await page.selectOption('[data-testid="activity-type-select"]', 'weightlifting');
    await page.fill('[data-testid="duration-input"]', '30');
    await page.selectOption('[data-testid="intensity-select"]', 'medium');
    await page.fill('[data-testid="reps-input"]', '10');
    await page.fill('[data-testid="sets-input"]', '3');
    await page.fill('[data-testid="weight-input"]', '50');
    await page.fill('[data-testid="notes-input"]', 'E2E test workout');
    
    // Submit the form
    const submitButton = page.locator('[data-testid="submit-workout-button"]');
    await expect(submitButton).toBeVisible();
    await submitButton.click();
    
    // Wait for submission to complete
    await page.waitForTimeout(2000);
    
    // Check if success message appears
    const successMessage = page.locator('text=Workout logged successfully');
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  });

  test('Progressive Logger functionality', async ({ page }) => {
    console.log('📈 Testing Progressive Logger');
    
    // Click on Progressive Logger tab
    await page.click('[data-testid="progressive-logger-tab"]');
    await page.waitForTimeout(1000);
    
    // Check if Progressive Logger form is visible
    const progressiveLoggerForm = page.locator('[data-testid="progressive-logger-form"]');
    await expect(progressiveLoggerForm).toBeVisible();
    
    // Fill in workout details
    await page.fill('[data-testid="progressive-workout-name"]', 'Progressive Test Workout');
    await page.selectOption('[data-testid="progressive-activity-type"]', 'weightlifting');
    await page.fill('[data-testid="progressive-duration"]', '25');
    await page.selectOption('[data-testid="progressive-intensity"]', 'high');
    await page.fill('[data-testid="progressive-reps"]', '12');
    await page.fill('[data-testid="progressive-sets"]', '4');
    await page.fill('[data-testid="progressive-weight"]', '60');
    await page.fill('[data-testid="progressive-notes"]', 'E2E progressive test');
    
    // Submit the form
    const submitButton = page.locator('[data-testid="progressive-submit-button"]');
    await expect(submitButton).toBeVisible();
    await submitButton.click();
    
    // Wait for submission to complete
    await page.waitForTimeout(2000);
    
    // Check if success message appears
    const successMessage = page.locator('text=Workout logged successfully');
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  });

  test('Exercise details display correctly', async ({ page }) => {
    console.log('💪 Testing exercise details display');
    
    // First, log a workout with exercise details
    await page.click('[data-testid="smart-logger-tab"]');
    await page.waitForTimeout(1000);
    
    await page.fill('[data-testid="workout-name-input"]', 'Bench Press Test');
    await page.selectOption('[data-testid="activity-type-select"]', 'weightlifting');
    await page.fill('[data-testid="duration-input"]', '20');
    await page.selectOption('[data-testid="intensity-select"]', 'medium');
    await page.fill('[data-testid="reps-input"]', '8');
    await page.fill('[data-testid="sets-input"]', '3');
    await page.fill('[data-testid="weight-input"]', '75');
    await page.fill('[data-testid="notes-input"]', 'Heavy bench press session');
    
    await page.click('[data-testid="submit-workout-button"]');
    await page.waitForTimeout(3000);
    
    // Switch to Workout Logs tab
    await page.click('[data-testid="workout-logs-tab"]');
    await page.waitForTimeout(2000);
    
    // Check if exercise details are displayed
    const exerciseDetails = page.locator('[data-testid="exercise-details"]');
    await expect(exerciseDetails).toBeVisible();
    
    // Check if sets, reps, and weight are displayed
    await expect(page.locator('text=3')).toBeVisible(); // Sets
    await expect(page.locator('text=8')).toBeVisible(); // Reps
    await expect(page.locator('text=75kg')).toBeVisible(); // Weight
    
    // Check if exercise name is displayed
    await expect(page.locator('text=Bench Press Test')).toBeVisible();
  });

  test('Workout log editing functionality', async ({ page }) => {
    console.log('✏️ Testing workout log editing');
    
    // Ensure we're on Workout Logs tab
    await page.click('[data-testid="workout-logs-tab"]');
    await page.waitForTimeout(1000);
    
    // Look for edit button on any workout log
    const editButton = page.locator('[data-testid="edit-workout-button"]').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(1000);
      
      // Check if edit form appears
      const editForm = page.locator('[data-testid="edit-workout-form"]');
      await expect(editForm).toBeVisible();
      
      // Test canceling edit
      const cancelButton = page.locator('[data-testid="cancel-edit-button"]');
      await cancelButton.click();
      await page.waitForTimeout(500);
      
      // Check if edit form is hidden
      await expect(editForm).not.toBeVisible();
    }
  });

  test('Workout log deletion functionality', async ({ page }) => {
    console.log('🗑️ Testing workout log deletion');
    
    // Ensure we're on Workout Logs tab
    await page.click('[data-testid="workout-logs-tab"]');
    await page.waitForTimeout(1000);
    
    // Look for delete button on any workout log
    const deleteButton = page.locator('[data-testid="delete-workout-button"]').first();
    
    if (await deleteButton.isVisible()) {
      // Click delete button
      await deleteButton.click();
      await page.waitForTimeout(500);
      
      // Check if confirmation dialog appears
      const confirmDialog = page.locator('[data-testid="delete-confirmation-dialog"]');
      await expect(confirmDialog).toBeVisible();
      
      // Test canceling deletion
      const cancelDeleteButton = page.locator('[data-testid="cancel-delete-button"]');
      await cancelDeleteButton.click();
      await page.waitForTimeout(500);
      
      // Check if dialog is hidden
      await expect(confirmDialog).not.toBeVisible();
    }
  });

  test('Responsive design works on mobile', async ({ page }) => {
    console.log('📱 Testing mobile responsiveness');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if tabs are still accessible
    const workoutLogsTab = page.locator('[data-testid="workout-logs-tab"]');
    await expect(workoutLogsTab).toBeVisible();
    
    // Check if content is properly stacked
    const statsCards = page.locator('[data-testid="stats-card"]');
    await expect(statsCards).toHaveCount(3);
    
    // Test tab switching on mobile
    await page.click('[data-testid="smart-logger-tab"]');
    await page.waitForTimeout(1000);
    
    const smartLoggerForm = page.locator('[data-testid="smart-logger-form"]');
    await expect(smartLoggerForm).toBeVisible();
  });

  test('Dark mode compatibility', async ({ page }) => {
    console.log('🌙 Testing dark mode compatibility');
    
    // Toggle dark mode (assuming there's a dark mode toggle)
    const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"]');
    
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      await page.waitForTimeout(500);
      
      // Check if components are still visible in dark mode
      const workoutLogsTab = page.locator('[data-testid="workout-logs-tab"]');
      await expect(workoutLogsTab).toBeVisible();
      
      const statsCards = page.locator('[data-testid="stats-card"]');
      await expect(statsCards).toHaveCount(3);
      
      // Check if view mode buttons are visible
      const dayViewButton = page.locator('button:has-text("Day View")');
      await expect(dayViewButton).toBeVisible();
    }
  });

  test('Error handling for failed API calls', async ({ page }) => {
    console.log('⚠️ Testing error handling');
    
    // Intercept API calls and return error
    await page.route('**/api/v1/health/contextual-logging/workout/smart', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Try to log a workout
    await page.click('[data-testid="smart-logger-tab"]');
    await page.waitForTimeout(1000);
    
    await page.fill('[data-testid="workout-name-input"]', 'Error Test');
    await page.selectOption('[data-testid="activity-type-select"]', 'weightlifting');
    await page.fill('[data-testid="duration-input"]', '10');
    
    await page.click('[data-testid="submit-workout-button"]');
    await page.waitForTimeout(2000);
    
    // Check if error message appears
    const errorMessage = page.locator('text=Failed to log workout');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('Performance and loading states', async ({ page }) => {
    console.log('⚡ Testing performance and loading states');
    
    // Check if loading states are shown
    await page.click('[data-testid="workout-logs-tab"]');
    
    // Look for loading indicators
    const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
    
    // Check if data loads within reasonable time
    const statsCards = page.locator('[data-testid="stats-card"]');
    await expect(statsCards).toHaveCount(3, { timeout: 10000 });
    
    // Check if logs load
    const logsContainer = page.locator('[data-testid="workout-logs-container"]');
    await expect(logsContainer).toBeVisible({ timeout: 10000 });
  });
});
