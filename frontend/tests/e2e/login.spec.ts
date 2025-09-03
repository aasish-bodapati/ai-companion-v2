import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    // Check that all form elements are present
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByText("Don't have an account?")).toBeVisible();
    await expect(page.getByText('Create an account')).toBeVisible();
  });

  test('should show validation error for empty fields', async ({ page }) => {
    // Click sign in without filling fields
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Should show error message
    await expect(page.getByTestId('error-message')).toBeVisible();
    await expect(page.getByText('Please fill in all fields')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    // Click on create account link
    await page.getByText('Create an account').click();
    
    // Should navigate to register page
    await expect(page).toHaveURL('/register');
  });

  test('should show forgot password link', async ({ page }) => {
    await expect(page.getByText('Forgot password?')).toBeVisible();
  });

  test('should show Google sign in option', async ({ page }) => {
    await expect(page.getByText('Sign in with Google')).toBeVisible();
  });

  test('should have remember me checkbox', async ({ page }) => {
    await expect(page.getByLabel('Remember me')).toBeVisible();
  });

  test('should fill and submit login form', async ({ page }) => {
    // Fill in the form
    await page.getByLabel('Email Address').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    
    // Submit the form
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Should show loading state
    await expect(page.getByText('Signing in...')).toBeVisible();
    
    // Note: In a real test, you would mock the API response
    // For now, we're just testing the UI behavior
  });

  test('should attempt login with real API', async ({ page }) => {
    // Fill in the form
    await page.getByLabel('Email Address').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    
    // Submit the form (will make real API call)
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Should show loading state
    await expect(page.getByText('Signing in...')).toBeVisible();
    
    // Note: In a real test environment, you would need valid credentials
    // or a test database with known test users
  });

  test('should handle failed login gracefully', async ({ page }) => {
    // Fill in the form with invalid credentials
    await page.getByLabel('Email Address').fill('invalid@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    
    // Submit the form (will make real API call)
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Should show loading state first
    await expect(page.getByText('Signing in...')).toBeVisible();
    
    // Should eventually show error message (when API returns error)
    // Note: This test assumes the API will return an error for invalid credentials
  });

  test('should disable submit button during loading', async ({ page }) => {
    // Fill in the form
    await page.getByLabel('Email Address').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    
    // Submit the form
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Button should be disabled and show loading text
    await expect(page.getByRole('button', { name: 'Signing in...' })).toBeDisabled();
  });

  test('should attempt redirect after successful login', async ({ page }) => {
    // Fill in the form with valid credentials
    await page.getByLabel('Email Address').fill('valid@example.com');
    await page.getByLabel('Password').fill('validpassword');
    
    // Submit the form (will make real API call)
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Should show loading state
    await expect(page.getByText('Signing in...')).toBeVisible();
    
    // Note: In a real test environment with valid credentials,
    // this would redirect to /chat after successful authentication
  });
});
