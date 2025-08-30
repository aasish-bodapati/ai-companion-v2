import { test, expect } from '@playwright/test';
const FREE_TIER = (process.env.FREE_TIER || '').toLowerCase() === '1' || (process.env.FREE_TIER || '').toLowerCase() === 'true' || (process.env.FREE_TIER || '').toLowerCase() === 'yes';
test.skip(FREE_TIER, 'Skipped on FREE_TIER: E2E suite relies on timely LLM responses.');
import { registerAndLogin, navigateToChat, waitForChatReady, waitForPersistedAssistant } from './helpers/test_utils';

test.describe('AI Companion V2 - Comprehensive E2E Tests', () => {
  const baseURL = 'http://localhost:3000'; // Updated to use port 3000

  test('1. User Registration - Complete registration flow', async ({ page }) => {
    // Create a unique user for this test
    const registrationTestUser = {
      email: `registration_${Date.now()}@example.com`,
      password: 'testpassword123',
      fullName: 'Registration Test User'
    };
    
    // Register new user
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', registrationTestUser.email);
    await page.fill('input[name="password"]', registrationTestUser.password);
    await page.fill('input[name="name"]', registrationTestUser.fullName);
    await page.fill('input[name="confirm-password"]', registrationTestUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    // Should redirect to onboarding or main app
    await expect(page).toHaveURL(/.*onboarding|.*chat|.*today/, { timeout: 10000 });
  });

  test('2. User Login - Complete login flow', async ({ page }) => {
    // Create a user for this test
    const loginTestUser = {
      email: `login_${Date.now()}@example.com`,
      password: 'testpassword123',
      fullName: 'Login Test User'
    };
    
    // Register first
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', loginTestUser.email);
    await page.fill('input[name="password"]', loginTestUser.password);
    await page.fill('input[name="name"]', loginTestUser.fullName);
    await page.fill('input[name="confirm-password"]', loginTestUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    // Wait for redirect and complete onboarding if needed
    await page.waitForURL(/.*onboarding|.*chat|.*today/, { timeout: 10000 });
    if (page.url().includes('/onboarding')) {
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*chat|.*today/, { timeout: 10000 });
    }
    
    // Logout
    await page.goto(`${baseURL}/logout`);
    await expect(page).toHaveURL(/.*login/);
    
    // Login again
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', loginTestUser.email);
    await page.fill('input[name="password"]', loginTestUser.password);
    await page.click('button[type="submit"]');
    
    // Should redirect to main app
    await expect(page).toHaveURL(/.*chat|.*today|.*onboarding/);
  });

  test('3. Navigation - Test main navigation elements', async ({ page }) => {
    // Register and login
    await registerAndLogin(page, baseURL);
    
    // Test navigation to different pages
    await page.click('a[href="/today"]');
    await expect(page).toHaveURL(/.*today/);
    
    await page.click('a[href="/memories"]');
    await expect(page).toHaveURL(/.*memories/);
    
    await page.click('a[href="/companion"]');
    await expect(page).toHaveURL(/.*\/chat\/[^\/]+/);
  });

  test('4. Onboarding Flow - Complete onboarding process', async ({ page }) => {
    // Create a unique user for this test
    const onboardingTestUser = {
      email: `onboarding_${Date.now()}@example.com`,
      password: 'testpassword123',
      fullName: 'Onboarding Test User'
    };
    
    // Register and check if redirected to onboarding
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', onboardingTestUser.email);
    await page.fill('input[name="password"]', onboardingTestUser.password);
    await page.fill('input[name="name"]', onboardingTestUser.fullName);
    await page.fill('input[name="confirm-password"]', onboardingTestUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    // Should redirect to onboarding
    await expect(page).toHaveURL(/.*onboarding/);
    
    // Complete onboarding
    await page.click('button[type="submit"]');
    
    // Should redirect to main app
    await expect(page).toHaveURL(/.*chat|.*today|.*dashboard/);
  });

  test('5. Chat Interface - Basic chat functionality', async ({ page }) => {
    // Register and navigate to chat
    await registerAndLogin(page, baseURL);
    
    // Wait for chat interface to be ready
    await waitForChatReady(page);
    
    // Check chat interface elements
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
    
    // Send a message
    await page.fill('[data-testid="message-input"]', 'Hello, this is a test message!');
    await page.keyboard.press('Enter');
    
    // Wait for response
    await waitForPersistedAssistant(page);
    
    // Check that we got a response
    const assistantMessage = page.locator('[data-testid="assistant-response"]');
    await expect(assistantMessage).toBeVisible();
  });

  test('6. Memory Functionality - Test memory capture', async ({ page }) => {
    // Register and navigate to chat
    await registerAndLogin(page, baseURL);
    
    // Wait for chat interface to be ready
    await waitForChatReady(page);
    
    // Send a message that should trigger memory capture
    await page.fill('[data-testid="message-input"]', 'I like pizza and my favorite color is blue');
    await page.keyboard.press('Enter');
    
    // Wait for response
    await waitForPersistedAssistant(page);
    
    // Navigate to memories page
    await page.click('a[href="/memories"]');
    await expect(page).toHaveURL(/.*memories/);
    
    // Check if memories are displayed
    await expect(page.locator('[data-testid="memories-list"]')).toBeVisible();
  });

  test('7. Today Page - Dashboard functionality', async ({ page }) => {
    // Register and navigate to today page
    await registerAndLogin(page, baseURL);
    
    await page.click('a[href="/today"]');
    await expect(page).toHaveURL(/.*today/);
    
    // Check dashboard elements
    await expect(page.locator('[data-testid="today-dashboard"]')).toBeVisible();
  });

  test('8. Memory Center - View captured memories', async ({ page }) => {
    // Register and navigate to memories
    await registerAndLogin(page, baseURL);
    
    await page.click('a[href="/memories"]');
    await expect(page).toHaveURL(/.*memories/);
    
    // Check memory center elements
    await expect(page.locator('[data-testid="memories-page"]')).toBeVisible();
  });

  test('9. Settings - User preferences', async ({ page }) => {
    // Register and navigate to settings
    await registerAndLogin(page, baseURL);
    
    await page.click('a[href="/settings"]');
    await expect(page).toHaveURL(/.*settings/);
    
    // Check settings elements
    await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();
  });

  test('10. Responsive Design - Mobile compatibility', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Register and navigate to chat
    await registerAndLogin(page, baseURL);
    
    // Wait for chat interface to be ready
    await waitForChatReady(page);
    
    // Check that interface is usable on mobile
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
  });

  test('11. Error Handling - Network errors', async ({ page }) => {
    // Register and navigate to chat
    await registerAndLogin(page, baseURL);
    
    // Wait for chat interface to be ready
    await waitForChatReady(page);
    
    // Send a message
    await page.fill('[data-testid="message-input"]', 'Test error handling');
    await page.keyboard.press('Enter');
    
    // Should handle gracefully (either show error or response)
    await expect(page.locator('[data-testid="assistant-response"], [data-testid="error-message"]')).toBeVisible({ timeout: 30000 });
  });

  test('12. Performance - Page load times', async ({ page }) => {
    // Register and navigate to chat
    await registerAndLogin(page, baseURL);
    
    // Measure page load time
    const startTime = Date.now();
    await waitForChatReady(page);
    const loadTime = Date.now() - startTime;
    
    // Should load in reasonable time
    expect(loadTime).toBeLessThan(10000);
  });

  test('13. Accessibility - Basic a11y checks', async ({ page }) => {
    // Register and navigate to chat
    await registerAndLogin(page, baseURL);
    
    // Wait for chat interface to be ready
    await waitForChatReady(page);
    
    // Check for proper heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
    
    // Check for alt text on images
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('14. Security - Authentication checks', async ({ page }) => {
    // Try to access protected page without authentication
    await page.goto(`${baseURL}/companion`);
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('15. End-to-End User Journey - Complete workflow', async ({ page }) => {
    console.log('Starting simplified end-to-end journey test...');
    
    // 1. Register new user
    const journeyTestUser = {
      email: `journey_${Date.now()}@example.com`,
      password: 'testpassword123',
      fullName: 'Journey Test User'
    };
    
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', journeyTestUser.email);
    await page.fill('input[name="password"]', journeyTestUser.password);
    await page.fill('input[name="name"]', journeyTestUser.fullName);
    await page.fill('input[name="confirm-password"]', journeyTestUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    // 2. Complete onboarding if needed
    await page.waitForURL(/.*onboarding|.*chat|.*today/, { timeout: 10000 });
    if (page.url().includes('/onboarding')) {
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*chat|.*today/, { timeout: 10000 });
    }
    
    // 3. Navigate to chat
    await navigateToChat(page, baseURL);
    
    // 4. Send a message
    await page.fill('[data-testid="message-input"]', 'Hello! Can you help me with my productivity?');
    await page.keyboard.press('Enter');
    
    // 5. Wait for AI response
    await waitForPersistedAssistant(page);
    
    // 6. Check response quality
    const assistantMessage = page.locator('[data-testid="assistant-response"]');
    await expect(assistantMessage).toBeVisible();
    
    // 7. Navigate to memories
    await page.click('a[href="/memories"]');
    await expect(page).toHaveURL(/.*memories/);
    
    // 8. Navigate to today page
    await page.click('a[href="/today"]');
    await expect(page).toHaveURL(/.*today/);
    
    // 9. Return to chat
    await navigateToChat(page, baseURL);
    
    // 10. Send another message
    await page.fill('[data-testid="message-input"]', 'Thank you for your help!');
    await page.keyboard.press('Enter');
    
    // 11. Wait for final response
    await waitForPersistedAssistant(page);
    
    console.log('✅ End-to-end journey completed successfully!');
  });
});
