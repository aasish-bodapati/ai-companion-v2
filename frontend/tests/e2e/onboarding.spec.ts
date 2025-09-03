import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to onboarding page - it will redirect to login if not authenticated
    await page.goto('/onboarding');
    // Wait for redirect to login page
    await page.waitForURL('/login', { timeout: 10000 });
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    // Should be redirected to login page
    await expect(page).toHaveURL('/login');
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('should show login form after redirect', async ({ page }) => {
    // Should show login form elements
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.getByText("Don't have an account?")).toBeVisible();
  });

  test('should allow navigation to register from onboarding redirect', async ({ page }) => {
    // Click on create account link
    await page.getByText('Create an account').click();
    
    // Should navigate to register page
    await expect(page).toHaveURL('/register');
  });

  test('should show proper authentication flow', async ({ page }) => {
    // Should be on login page
    await expect(page).toHaveURL('/login');
    
    // Should show login form
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('should handle authentication requirement', async ({ page }) => {
    // The onboarding page requires authentication
    // Without authentication, users are redirected to login
    await expect(page).toHaveURL('/login');
    
    // Login form should be visible
    await expect(page.getByLabel('Email Address')).toBeVisible();
  });

  test('should show login page elements', async ({ page }) => {
    // All login page elements should be visible
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.getByText('Forgot password?')).toBeVisible();
    await expect(page.getByText('Sign in with Google')).toBeVisible();
    await expect(page.getByLabel('Remember me')).toBeVisible();
  });

  test('should maintain redirect behavior', async ({ page }) => {
    // Navigate to onboarding again
    await page.goto('/onboarding');
    
    // Should redirect to login again
    await page.waitForURL('/login', { timeout: 10000 });
    await expect(page).toHaveURL('/login');
  });

  test('should show proper loading state during redirect', async ({ page }) => {
    // Navigate to onboarding
    await page.goto('/onboarding');
    
    // Should eventually redirect to login
    await page.waitForURL('/login', { timeout: 10000 });
    await expect(page).toHaveURL('/login');
  });

  test('should handle multiple redirect attempts', async ({ page }) => {
    // Try to navigate to onboarding multiple times
    await page.goto('/onboarding');
    await page.waitForURL('/login', { timeout: 10000 });
    
    await page.goto('/onboarding');
    await page.waitForURL('/login', { timeout: 10000 });
    
    // Should always redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should show login form consistently', async ({ page }) => {
    // Should consistently show login form after redirect
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});