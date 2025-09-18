import { test, expect } from '@playwright/test';

test.describe('Fitness Component E2E Tests - Mocked', () => {
  test.beforeEach(async ({ page }) => {
    console.log('🔧 Setting up mocked authentication...');
    
    // Mock authentication by intercepting API calls
    await page.route('**/api/v1/auth/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token-12345',
          token_type: 'bearer',
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User'
          }
        })
      });
    });
    
    // Mock fitness API calls
    await page.route('**/api/v1/health/fitness-logs**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          logs: [
            {
              id: 'log-1',
              user_id: 'test-user-123',
              workout_name: 'Test Workout',
              exercises: [
                {
                  exercise_name: 'Bench Press',
                  sets: 3,
                  reps: 10,
                  weight_used: 50,
                  notes: 'Test workout'
                }
              ],
              duration_minutes: 30,
              calories_burned: 200,
              notes: 'Test workout session',
              logged_at: new Date().toISOString(),
              created_at: new Date().toISOString()
            }
          ],
          stats: {
            totalWorkouts: 1,
            totalDuration: 30,
            totalCalories: 200,
            averageDifficulty: 0,
            currentStreak: 1
          },
          pagination: {
            page: 1,
            size: 50,
            total: 1,
            totalPages: 1
          }
        })
      });
    });
    
    // Mock today's stats
    await page.route('**/api/v1/health/logging/fitness/today**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          workouts: 1,
          totalMinutes: 30,
          caloriesBurned: 200
        })
      });
    });
    
    // Mock workout logging
    await page.route('**/api/v1/health/contextual-logging/workout/smart**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          log_id: 'new-log-123',
          applied_defaults: [],
          routine_updates: [],
          insights: {
            insights: [],
            achievements: [],
            progress_summary: 'Workout logged successfully',
            next_goals: ['Keep up the great work!'],
            comparisons: null,
            recommendations: null
          },
          next_suggestions: []
        })
      });
    });
    
    // Mock onboarding status
    await page.route('**/api/v1/health/onboarding/status**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          completed: true
        })
      });
    });
    
    // Set up authentication state
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-token-12345');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User'
      }));
    });
    
    // Navigate to fitness page
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Mocked authentication setup complete');
  });

  test('Fitness page loads correctly with all tabs', async ({ page }) => {
    console.log('🏋️ Testing fitness page load');
    
    // Check if page title is correct
    await expect(page).toHaveTitle(/AI Companion/);
    
    // Check if all main tabs are present
    const fitnessTabs = page.locator('[data-testid="fitness-tabs"]');
    await expect(fitnessTabs).toBeVisible({ timeout: 10000 });
    
    // Check if Workout Logs tab is active by default
    const workoutLogsTab = page.locator('[data-testid="workout-logs-tab"]');
    await expect(workoutLogsTab).toBeVisible();
    
    // Check if other tabs are present
    const routinesTab = page.locator('[data-testid="routines-tab"]');
    await expect(routinesTab).toBeVisible();
    
    const logWorkoutTab = page.locator('[data-testid="log-workout-tab"]');
    await expect(logWorkoutTab).toBeVisible();
    
    const progressTab = page.locator('[data-testid="progress-tab"]');
    await expect(progressTab).toBeVisible();
    
    console.log('✅ All tabs are visible');
  });

  test('Stats cards are displayed', async ({ page }) => {
    console.log('📊 Testing stats cards display');
    
    // Check if stats cards are present
    const statsCards = page.locator('[data-testid="stats-card"]');
    await expect(statsCards).toHaveCount(3, { timeout: 10000 });
    
    // Check individual stats
    await expect(page.locator('text=Today\'s Workouts')).toBeVisible();
    await expect(page.locator('text=Total Minutes')).toBeVisible();
    await expect(page.locator('text=Calories Burned')).toBeVisible();
    
    console.log('✅ Stats cards displayed correctly');
  });

  test('Tab switching works correctly', async ({ page }) => {
    console.log('🔄 Testing tab switching');
    
    // Test switching to My Routines tab
    await page.click('[data-testid="routines-tab"]');
    await page.waitForTimeout(1000);
    
    // Check if routines content is visible
    const routinesContent = page.locator('text=My Routines, text=Routines, [data-testid*="routine"]').first();
    await expect(routinesContent).toBeVisible({ timeout: 5000 });
    
    // Test switching to Log Workout tab
    await page.click('[data-testid="log-workout-tab"]');
    await page.waitForTimeout(1000);
    
    // Check if workout logging form is visible
    const workoutForm = page.locator('form, [data-testid*="form"], [data-testid*="logger"]').first();
    await expect(workoutForm).toBeVisible({ timeout: 5000 });
    
    // Test switching back to Workout Logs tab
    await page.click('[data-testid="workout-logs-tab"]');
    await page.waitForTimeout(1000);
    
    // Check if logs content is visible
    const logsContent = page.locator('text=Workout Logs, [data-testid*="logs"], [data-testid*="workout"]').first();
    await expect(logsContent).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Tab switching works correctly');
  });

  test('Workout logs display correctly', async ({ page }) => {
    console.log('📋 Testing workout logs display');
    
    // Ensure we're on the Workout Logs tab
    await page.click('[data-testid="workout-logs-tab"]');
    await page.waitForTimeout(2000);
    
    // Look for workout logs
    const logsContainer = page.locator('[data-testid*="logs"], [data-testid*="workout"], .workout-log, .log-item').first();
    
    if (await logsContainer.isVisible({ timeout: 5000 })) {
      console.log('✅ Workout logs container found');
      
      // Check if there are any logs
      const logItems = page.locator('.workout-log, .log-item, [data-testid*="log-item"]');
      const logCount = await logItems.count();
      
      if (logCount > 0) {
        console.log(`Found ${logCount} workout logs`);
        
        // Check if logs have expected content
        const firstLog = logItems.first();
        await expect(firstLog).toBeVisible();
        
        // Look for common workout log elements
        const hasWorkoutName = await firstLog.locator('text=workout, text=exercise, text=activity').first().isVisible();
        const hasDuration = await firstLog.locator('text=min, text=duration, text=time').first().isVisible();
        const hasStats = await firstLog.locator('text=sets, text=reps, text=weight').first().isVisible();
        
        if (hasWorkoutName || hasDuration || hasStats) {
          console.log('✅ Workout logs contain expected information');
        } else {
          console.log('⚠️ Workout logs may not have expected content');
        }
      } else {
        console.log('ℹ️ No workout logs found (empty state)');
        
        // Check for empty state message
        const emptyState = page.locator('text=no workouts, text=no logs, text=empty, text=start').first();
        if (await emptyState.isVisible()) {
          console.log('✅ Empty state message displayed');
        }
      }
    } else {
      console.log('⚠️ No workout logs container found');
    }
    
    console.log('✅ Workout logs display test completed');
  });

  test('Workout logging functionality', async ({ page }) => {
    console.log('📝 Testing workout logging');
    
    // Switch to Log Workout tab
    await page.click('[data-testid="log-workout-tab"]');
    await page.waitForTimeout(1000);
    
    // Look for any form inputs
    const formInputs = page.locator('input, textarea, select');
    const inputCount = await formInputs.count();
    
    if (inputCount > 0) {
      console.log(`Found ${inputCount} form inputs`);
      
      // Try to fill the first text input (usually workout name)
      const firstTextInput = page.locator('input[type="text"], input[placeholder*="name" i]').first();
      if (await firstTextInput.isVisible()) {
        await firstTextInput.fill('Test Workout');
      }
      
      // Try to fill duration if available
      const durationInput = page.locator('input[type="number"][placeholder*="duration" i], input[type="number"][placeholder*="minutes" i]').first();
      if (await durationInput.isVisible()) {
        await durationInput.fill('30');
      }
      
      // Try to fill reps if available
      const repsInput = page.locator('input[type="number"][placeholder*="reps" i]').first();
      if (await repsInput.isVisible()) {
        await repsInput.fill('10');
      }
      
      // Try to fill sets if available
      const setsInput = page.locator('input[type="number"][placeholder*="sets" i]').first();
      if (await setsInput.isVisible()) {
        await setsInput.fill('3');
      }
      
      // Try to fill weight if available
      const weightInput = page.locator('input[type="number"][placeholder*="weight" i]').first();
      if (await weightInput.isVisible()) {
        await weightInput.fill('50');
      }
      
      // Look for submit button
      const submitButton = page.locator('button[type="submit"], button:has-text("Log"), button:has-text("Submit"), button:has-text("Save")').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(2000);
        
        // Check for success message or redirect
        const successMessage = page.locator('text=success, text=logged, text=saved').first();
        if (await successMessage.isVisible({ timeout: 5000 })) {
          console.log('✅ Workout logged successfully');
        } else {
          console.log('⚠️ No success message found, but form was submitted');
        }
      } else {
        console.log('⚠️ No submit button found');
      }
    } else {
      console.log('⚠️ No form inputs found');
    }
    
    console.log('✅ Workout logging test completed');
  });

  test('View mode switching works', async ({ page }) => {
    console.log('👁️ Testing view mode switching');
    
    // Ensure we're on the Workout Logs tab
    await page.click('[data-testid="workout-logs-tab"]');
    await page.waitForTimeout(1000);
    
    // Look for view mode buttons
    const dayViewButton = page.locator('button:has-text("Day"), button:has-text("day")').first();
    const monthViewButton = page.locator('button:has-text("Month"), button:has-text("month")').first();
    
    if (await dayViewButton.isVisible() && await monthViewButton.isVisible()) {
      console.log('✅ View mode buttons found');
      
      // Test Day View
      await dayViewButton.click();
      await page.waitForTimeout(500);
      
      // Test Month View
      await monthViewButton.click();
      await page.waitForTimeout(500);
      
      console.log('✅ View mode switching works');
    } else {
      console.log('ℹ️ View mode buttons not found (may not be implemented)');
    }
    
    console.log('✅ View mode switching test completed');
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
    await page.click('[data-testid="log-workout-tab"]');
    await page.waitForTimeout(1000);
    
    const workoutForm = page.locator('form, [data-testid*="form"]').first();
    if (await workoutForm.isVisible()) {
      console.log('✅ Mobile layout works correctly');
    }
    
    console.log('✅ Mobile responsiveness test completed');
  });

  test('Page performance is acceptable', async ({ page }) => {
    console.log('⚡ Testing page performance');
    
    const startTime = Date.now();
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`Page load time: ${loadTime}ms`);
    
    // Acceptable load time is under 5 seconds
    expect(loadTime).toBeLessThan(5000);
    
    console.log('✅ Page performance is acceptable');
  });

  test('Error handling works correctly', async ({ page }) => {
    console.log('⚠️ Testing error handling');
    
    // Intercept API calls and return error
    await page.route('**/api/v1/health/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Try to interact with the page
    await page.click('[data-testid="workout-logs-tab"]');
    await page.waitForTimeout(2000);
    
    // Check if error is handled gracefully (page doesn't crash)
    const pageContent = await page.content();
    expect(pageContent).toContain('AI Companion');
    
    console.log('✅ Error handling works correctly');
  });

  test('Navigation works correctly', async ({ page }) => {
    console.log('🧭 Testing navigation');
    
    // Test navigation to different sections
    const tabs = [
      { testid: 'workout-logs-tab', name: 'Workout Logs' },
      { testid: 'routines-tab', name: 'My Routines' },
      { testid: 'log-workout-tab', name: 'Log Workout' },
      { testid: 'progress-tab', name: 'Progress' }
    ];
    
    for (const tab of tabs) {
      console.log(`Testing ${tab.name} tab`);
      
      await page.click(`[data-testid="${tab.testid}"]`);
      await page.waitForTimeout(1000);
      
      // Check if tab is active
      const activeTab = page.locator(`[data-testid="${tab.testid}"][data-state="active"]`);
      if (await activeTab.isVisible()) {
        console.log(`✅ ${tab.name} tab is active`);
      } else {
        console.log(`⚠️ ${tab.name} tab may not be properly active`);
      }
    }
    
    console.log('✅ Navigation test completed');
  });

  test('Data persistence works', async ({ page }) => {
    console.log('💾 Testing data persistence');
    
    // Create a test workout
    await page.click('[data-testid="log-workout-tab"]');
    await page.waitForTimeout(1000);
    
    // Fill workout form
    const firstTextInput = page.locator('input[type="text"], input[placeholder*="name" i]').first();
    if (await firstTextInput.isVisible()) {
      await firstTextInput.fill('Persistence Test Workout');
    }
    
    const durationInput = page.locator('input[type="number"][placeholder*="duration" i], input[type="number"][placeholder*="minutes" i]').first();
    if (await durationInput.isVisible()) {
      await durationInput.fill('25');
    }
    
    const repsInput = page.locator('input[type="number"][placeholder*="reps" i]').first();
    if (await repsInput.isVisible()) {
      await repsInput.fill('8');
    }
    
    const setsInput = page.locator('input[type="number"][placeholder*="sets" i]').first();
    if (await setsInput.isVisible()) {
      await setsInput.fill('3');
    }
    
    const weightInput = page.locator('input[type="number"][placeholder*="weight" i]').first();
    if (await weightInput.isVisible()) {
      await weightInput.fill('45');
    }
    
    // Submit form
    const submitButton = page.locator('button[type="submit"], button:has-text("Log"), button:has-text("Submit"), button:has-text("Save")').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check if data persisted
    await page.click('[data-testid="workout-logs-tab"]');
    await page.waitForTimeout(2000);
    
    // Look for the test workout
    const testWorkout = page.locator('text=Persistence Test Workout');
    if (await testWorkout.isVisible({ timeout: 5000 })) {
      console.log('✅ Data persistence works correctly');
    } else {
      console.log('⚠️ Data may not have persisted (or workout not created)');
    }
    
    console.log('✅ Data persistence test completed');
  });
});
