import { test, expect } from '@playwright/test';
import { registerAndLogin, navigateToChat, waitForChatReady } from './helpers/test_utils';

test.describe('Simple Chat Interface Test', () => {
  const baseURL = 'http://localhost:3000';

  test.beforeEach(async ({ page }) => {
    // Register and login before each test
    await registerAndLogin(page, baseURL);
  });

  test('should send a message and see it appear', async ({ page }) => {
    // Wait for chat interface to be ready
    await waitForChatReady(page, 60000);
    
    // Send a message
    const testMessage = 'Hello! This is a simple test message.';
    await page.fill('[data-testid="message-input"]', testMessage);
    await page.keyboard.press('Enter');
    
    // Wait for user message to appear (should be immediate)
    await expect(page.locator('[data-testid="user-message"]:has-text("' + testMessage + '")')).toBeVisible({ timeout: 30000 });
    
    // Check that the input is cleared
    await expect(page.locator('[data-testid="message-input"]')).toHaveValue('');
  });

  test('should switch modes and send messages', async ({ page }) => {
    // Wait for chat interface to be ready
    await waitForChatReady(page, 60000);
    
    // Find the mode selector container
    const modeSelector = page.locator('text=Mode:').locator('..');
    
    // Switch to Action mode
    await modeSelector.locator('button:has-text("Action")').click();
    
    // Send a message in Action mode
    const actionMessage = 'I worked out for 30 minutes.';
    await page.fill('[data-testid="message-input"]', actionMessage);
    await page.keyboard.press('Enter');
    
    // Wait for user message to appear
    await expect(page.locator('[data-testid="user-message"]:has-text("' + actionMessage + '")')).toBeVisible({ timeout: 30000 });
    
    // Switch back to Chat mode
    await modeSelector.locator('button:has-text("Chat")').click();
    
    // Send a message in Chat mode
    const chatMessage = 'How are you today?';
    await page.fill('[data-testid="message-input"]', chatMessage);
    await page.keyboard.press('Enter');
    
    // Wait for user message to appear
    await expect(page.locator('[data-testid="user-message"]:has-text("' + chatMessage + '")')).toBeVisible({ timeout: 30000 });
  });

  test('should handle multiple messages', async ({ page }) => {
    // Wait for chat interface to be ready
    await waitForChatReady(page, 60000);
    
    // Clear any existing messages by refreshing the page
    await page.reload();
    await waitForChatReady(page, 60000);
    
    // Send first message
    await page.fill('[data-testid="message-input"]', 'First message');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="user-message"]:has-text("First message")')).toBeVisible({ timeout: 30000 });
    
    // Send second message
    await page.fill('[data-testid="message-input"]', 'Second message');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="user-message"]:has-text("Second message")')).toBeVisible({ timeout: 30000 });
    
    // Send third message
    await page.fill('[data-testid="message-input"]', 'Third message');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="user-message"]:has-text("Third message")')).toBeVisible({ timeout: 30000 });
    
    // Check that we have 3 user messages
    const userMessages = await page.locator('[data-testid="user-message"]').count();
    expect(userMessages).toBe(3);
  });
});
