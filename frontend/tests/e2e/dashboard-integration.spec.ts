import { test, expect } from '@playwright/test';

test.describe('Dashboard Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/today');
  });

  test.describe('Today Dashboard', () => {
    test('should display user routine with dynamic status', async ({ page }) => {
      await page.goto('/today');
      
      // Check that routine activities are displayed
      await expect(page.locator('text=Today\'s Routine')).toBeVisible();
      await expect(page.locator('text=Wake up')).toBeVisible();
      await expect(page.locator('text=Workout')).toBeVisible();
      await expect(page.locator('text=Breakfast')).toBeVisible();
      
      // Check status indicators
      const statusBadges = page.locator('[class*="px-2 py-1 rounded-full"]');
      await expect(statusBadges.first()).toBeVisible();
    });

    test('should allow marking activities as completed', async ({ page }) => {
      await page.goto('/today');
      
      // Find an upcoming activity and mark it complete
      const completeButton = page.locator('button[title="Mark as completed"]').first();
      if (await completeButton.isVisible()) {
        await completeButton.click();
        
        // Check that the activity status changed
        await expect(page.locator('text=✓ Done')).toBeVisible();
      }
    });

    test('should display smart suggestions with real data', async ({ page }) => {
      await page.goto('/today');
      
      await expect(page.locator('text=Smart Suggestions')).toBeVisible();
      
      // Check for data-driven suggestions
      const suggestions = page.locator('[class*="border-l-4"]');
      await expect(suggestions).toHaveCount(3);
      
      // Check for nutrition and fitness links
      await expect(page.locator('text=View nutrition')).toBeVisible();
      await expect(page.locator('text=Log workout')).toBeVisible();
    });

    test('should show progress ring with completion percentage', async ({ page }) => {
      await page.goto('/today');
      
      // Check for progress visualization
      const progressRing = page.locator('svg').filter({ hasText: /%/ });
      await expect(progressRing).toBeVisible();
      
      await expect(page.locator('text=Daily Routine')).toBeVisible();
      await expect(page.locator('text=completed today')).toBeVisible();
    });

    test('should display habit tracking with checkboxes', async ({ page }) => {
      await page.goto('/today');
      
      await expect(page.locator('text=Today\'s Life Habits')).toBeVisible();
      
      // Check for habit checkboxes
      const habitCheckboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await habitCheckboxes.count();
      expect(checkboxCount).toBeGreaterThan(0);
      
      // Test checking a habit
      if (checkboxCount > 0) {
        await habitCheckboxes.first().check();
        await expect(habitCheckboxes.first()).toBeChecked();
      }
    });

    test('should have navigation links to fitness and nutrition', async ({ page }) => {
      await page.goto('/today');
      
      // Check for dashboard navigation
      await expect(page.locator('a[href="/fitness"]')).toBeVisible();
      await expect(page.locator('a[href="/nutrition"]')).toBeVisible();
    });
  });

  test.describe('Fitness Dashboard', () => {
    test('should display workout summary and recent workouts', async ({ page }) => {
      await page.goto('/fitness');
      
      await expect(page.locator('text=Fitness Dashboard')).toBeVisible();
      await expect(page.locator('text=Workout Summary')).toBeVisible();
      await expect(page.locator('text=Recent Workouts')).toBeVisible();
      
      // Check for workout metrics
      await expect(page.locator('text=This Week')).toBeVisible();
      await expect(page.locator('text=This Month')).toBeVisible();
      await expect(page.locator('text=Consistency')).toBeVisible();
    });

    test('should display personal records', async ({ page }) => {
      await page.goto('/fitness');
      
      await expect(page.locator('text=Personal Records')).toBeVisible();
      
      // Check for PR entries
      const prEntries = page.locator('[class*="bg-gray-50 dark:bg-gray-800 rounded-lg"]');
      const prCount = await prEntries.count();
      expect(prCount).toBeGreaterThan(0);
    });

    test('should have workout plan section', async ({ page }) => {
      await page.goto('/fitness');
      
      await expect(page.locator('text=Current Plan')).toBeVisible();
      await expect(page.locator('text=Next Workout')).toBeVisible();
      
      // Check for plan progress
      const progressBar = page.locator('[class*="bg-blue-600 h-2 rounded-full"]');
      await expect(progressBar).toBeVisible();
    });

    test('should display AI fitness insights', async ({ page }) => {
      await page.goto('/fitness');
      
      await expect(page.locator('text=AI Fitness Insights')).toBeVisible();
      await expect(page.locator('text=Strength Progress')).toBeVisible();
      await expect(page.locator('text=Optimal Timing')).toBeVisible();
      await expect(page.locator('text=Next Goal')).toBeVisible();
    });

    test('should have quick action buttons', async ({ page }) => {
      await page.goto('/fitness');
      
      await expect(page.locator('text=Quick Actions')).toBeVisible();
      await expect(page.locator('button:has-text("Log Today\'s Workout")')).toBeVisible();
      await expect(page.locator('button:has-text("Update Last Workout")')).toBeVisible();
      await expect(page.locator('button:has-text("Set New Goals")')).toBeVisible();
    });

    test('should navigate back to Today dashboard', async ({ page }) => {
      await page.goto('/fitness');
      
      const backButton = page.locator('a:has-text("← Back to Today")');
      await expect(backButton).toBeVisible();
      
      await backButton.click();
      await page.waitForURL('/today');
      await expect(page.locator('text=Your Daily Companion')).toBeVisible();
    });
  });

  test.describe('Nutrition Dashboard', () => {
    test('should display nutrition overview with macro tracking', async ({ page }) => {
      await page.goto('/nutrition');
      
      await expect(page.locator('text=Nutrition Dashboard')).toBeVisible();
      await expect(page.locator('text=Today\'s Nutrition')).toBeVisible();
      
      // Check for macro nutrients
      await expect(page.locator('text=Calories')).toBeVisible();
      await expect(page.locator('text=Protein')).toBeVisible();
      await expect(page.locator('text=Carbs')).toBeVisible();
      await expect(page.locator('text=Fat')).toBeVisible();
      await expect(page.locator('text=Fiber')).toBeVisible();
      
      // Check for progress bars
      const progressBars = page.locator('[role="progressbar"]');
      const progressCount = await progressBars.count();
      expect(progressCount).toBeGreaterThan(0);
    });

    test('should have navigation back to Today', async ({ page }) => {
      await page.goto('/nutrition');
      
      const backButton = page.locator('a:has-text("← Back to Today")');
      await expect(backButton).toBeVisible();
      
      await backButton.click();
      await page.waitForURL('/today');
    });
  });

  test.describe('Cross-Dashboard Integration', () => {
    test('should maintain consistent navigation between dashboards', async ({ page }) => {
      // Start from Today
      await page.goto('/today');
      await expect(page.locator('text=Your Daily Companion')).toBeVisible();
      
      // Navigate to Fitness
      await page.locator('a[href="/fitness"]').click();
      await page.waitForURL('/fitness');
      await expect(page.locator('text=Fitness Dashboard')).toBeVisible();
      
      // Navigate to Nutrition via navbar
      await page.locator('a[href="/nutrition"]:visible').first().click();
      await page.waitForURL('/nutrition');
      await expect(page.locator('text=Nutrition Dashboard')).toBeVisible();
      
      // Back to Today
      await page.locator('a[href="/today"]:visible').first().click();
      await page.waitForURL('/today');
      await expect(page.locator('text=Your Daily Companion')).toBeVisible();
    });

    test('should show consistent user data across dashboards', async ({ page }) => {
      // Check Today dashboard for routine completion
      await page.goto('/today');
      const todayCompletion = await page.locator('text=/\\d+% completed today/').textContent();
      
      // Navigate to other dashboards and verify data consistency
      await page.goto('/fitness');
      await expect(page.locator('text=4')).toBeVisible(); // This week workouts
      
      await page.goto('/nutrition');
      await expect(page.locator('text=2500')).toBeVisible(); // Calorie goal
      
      // Return to Today and verify completion is still there
      await page.goto('/today');
      if (todayCompletion) {
        await expect(page.locator(`text=${todayCompletion}`)).toBeVisible();
      }
    });

    test('should handle responsive design on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      
      // Test Today dashboard mobile layout
      await page.goto('/today');
      await expect(page.locator('text=Your Daily Companion')).toBeVisible();
      
      // Check that mobile navigation works
      const mobileMenuButton = page.locator('button[aria-expanded]');
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();
        await expect(page.locator('text=Fitness')).toBeVisible();
        await expect(page.locator('text=Nutrition')).toBeVisible();
      }
      
      // Test Fitness dashboard mobile layout
      await page.goto('/fitness');
      await expect(page.locator('text=Fitness Dashboard')).toBeVisible();
      
      // Test Nutrition dashboard mobile layout  
      await page.goto('/nutrition');
      await expect(page.locator('text=Nutrition Dashboard')).toBeVisible();
    });
  });

  test.describe('Data Persistence', () => {
    test('should persist routine completion across page reloads', async ({ page }) => {
      await page.goto('/today');
      
      // Mark an activity as completed
      const completeButton = page.locator('button[title="Mark as completed"]').first();
      if (await completeButton.isVisible()) {
        await completeButton.click();
        await expect(page.locator('text=✓ Done')).toBeVisible();
        
        // Reload page and check persistence
        await page.reload();
        await expect(page.locator('text=✓ Done')).toBeVisible();
      }
    });

    test('should persist habit completion across sessions', async ({ page }) => {
      await page.goto('/today');
      
      // Check a habit
      const habitCheckbox = page.locator('input[type="checkbox"]').first();
      if (await habitCheckbox.isVisible()) {
        await habitCheckbox.check();
        await expect(habitCheckbox).toBeChecked();
        
        // Navigate away and back
        await page.goto('/fitness');
        await page.goto('/today');
        
        // Check if habit is still checked
        await expect(habitCheckbox).toBeChecked();
      }
    });
  });
});
