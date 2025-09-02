import { test, expect } from '@playwright/test';
import { registerAndLogin, navigateToChat, waitForChatReady, waitForPersistedAssistant } from './helpers/test_utils';

test.describe('Two-Mode Chat Interface', () => {
  const baseURL = 'http://localhost:3000';

  test.beforeEach(async ({ page }) => {
    // Register and login before each test
    await registerAndLogin(page, baseURL);
  });

  test('should display mode selector and chat interface', async ({ page }) => {
    // Wait for chat interface to be ready
    await waitForChatReady(page);
    
    // Check that mode selector is visible
    await expect(page.locator('text=Mode:')).toBeVisible();
    
    // Find the mode selector container and check buttons within it
    const modeSelector = page.locator('text=Mode:').locator('..');
    await expect(modeSelector.locator('button:has-text("Action")')).toBeVisible();
    await expect(modeSelector.locator('button:has-text("Chat")')).toBeVisible();
    
    // Check that message input is visible
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
    
    // Check that send button is visible
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should switch between Action and Chat modes', async ({ page }) => {
    // Wait for chat interface to be ready
    await waitForChatReady(page);
    
    // Find the mode selector container
    const modeSelector = page.locator('text=Mode:').locator('..');
    
    // Initially Chat mode should be selected (default)
    await expect(modeSelector.locator('button:has-text("Chat")')).toHaveClass(/bg-purple-600/);
    await expect(modeSelector.locator('button:has-text("Action")')).not.toHaveClass(/bg-blue-600/);
    
    // Click Action mode
    await modeSelector.locator('button:has-text("Action")').click();
    
    // Action mode should now be selected
    await expect(modeSelector.locator('button:has-text("Action")')).toHaveClass(/bg-blue-600/);
    await expect(modeSelector.locator('button:has-text("Chat")')).not.toHaveClass(/bg-purple-600/);
    
    // Click Chat mode
    await modeSelector.locator('button:has-text("Chat")').click();
    
    // Chat mode should be selected again
    await expect(modeSelector.locator('button:has-text("Chat")')).toHaveClass(/bg-purple-600/);
    await expect(modeSelector.locator('button:has-text("Action")')).not.toHaveClass(/bg-blue-600/);
  });

  test('should send message in Chat mode and receive response', async ({ page }) => {
    // Wait for chat interface to be ready
    await waitForChatReady(page);
    
    // Ensure we're in Chat mode
    const modeSelector = page.locator('text=Mode:').locator('..');
    await modeSelector.locator('button:has-text("Chat")').click();
    
    // Send a message
    const testMessage = 'Hello! This is a test message in Chat mode.';
    await page.fill('[data-testid="message-input"]', testMessage);
    await page.keyboard.press('Enter');
    
    // Wait for user message to appear
    await expect(page.locator('[data-testid="user-message"]:has-text("' + testMessage + '")')).toBeVisible();
    
    // Wait for assistant response
    await waitForPersistedAssistant(page);
    
    // Check that assistant response is visible
    await expect(page.locator('[data-testid="assistant-response"]')).toBeVisible();
  });

  test('should send message in Action mode and receive response', async ({ page }) => {
    // Wait for chat interface to be ready
    await waitForChatReady(page);
    
    // Switch to Action mode
    const modeSelector = page.locator('text=Mode:').locator('..');
    await modeSelector.locator('button:has-text("Action")').click();
    
    // Send a message
    const testMessage = 'I worked out for 30 minutes today.';
    await page.fill('[data-testid="message-input"]', testMessage);
    await page.keyboard.press('Enter');
    
    // Wait for user message to appear
    await expect(page.locator('[data-testid="user-message"]:has-text("' + testMessage + '")')).toBeVisible();
    
    // Wait for assistant response
    await waitForPersistedAssistant(page);
    
    // Check that assistant response is visible
    await expect(page.locator('[data-testid="assistant-response"]')).toBeVisible();
  });

  test('should handle multiple messages in conversation', async ({ page }) => {
    // Wait for chat interface to be ready
    await waitForChatReady(page);
    
    // Send first message
    await page.fill('[data-testid="message-input"]', 'Hello, how are you?');
    await page.keyboard.press('Enter');
    
    // Wait for first response
    await waitForPersistedAssistant(page);
    
    // Send second message
    await page.fill('[data-testid="message-input"]', 'Can you help me with productivity?');
    await page.keyboard.press('Enter');
    
    // Wait for second response
    await waitForPersistedAssistant(page);
    
    // Check that we have multiple messages
    const userMessages = await page.locator('[data-testid="user-message"]').count();
    const assistantMessages = await page.locator('[data-testid="assistant-response"]').count();
    
    expect(userMessages).toBeGreaterThanOrEqual(2);
    expect(assistantMessages).toBeGreaterThanOrEqual(2);
  });

  test('should show welcome message when no messages exist', async ({ page }) => {
    // Wait for chat interface to be ready
    await waitForChatReady(page);
    
    // Check that welcome message is visible
    await expect(page.locator('text=Welcome to Your AI Companion')).toBeVisible();
    await expect(page.locator('text=Choose your mode above to get started')).toBeVisible();
  });

  test('should handle mode switching during conversation', async ({ page }) => {
    // Wait for chat interface to be ready
    await waitForChatReady(page);
    
    // Send a message in Chat mode
    await page.fill('[data-testid="message-input"]', 'Hello in Chat mode!');
    await page.keyboard.press('Enter');
    await waitForPersistedAssistant(page);
    
    // Switch to Action mode
    const modeSelector = page.locator('text=Mode:').locator('..');
    await modeSelector.locator('button:has-text("Action")').click();
    
    // Send a message in Action mode
    await page.fill('[data-testid="message-input"]', 'I completed my workout!');
    await page.keyboard.press('Enter');
    await waitForPersistedAssistant(page);
    
    // Switch back to Chat mode
    await modeSelector.locator('button:has-text("Chat")').click();
    
    // Send another message
    await page.fill('[data-testid="message-input"]', 'Back to Chat mode!');
    await page.keyboard.press('Enter');
    await waitForPersistedAssistant(page);
    
    // Verify all messages are present
    const userMessages = await page.locator('[data-testid="user-message"]').count();
    const assistantMessages = await page.locator('[data-testid="assistant-response"]').count();
    
    expect(userMessages).toBeGreaterThanOrEqual(3);
    expect(assistantMessages).toBeGreaterThanOrEqual(3);
  });

  test('should handle input validation and empty messages', async ({ page }) => {
    // Wait for chat interface to be ready
    await waitForChatReady(page);
    
    // Try to send empty message
    await page.fill('[data-testid="message-input"]', '   '); // Just whitespace
    await page.keyboard.press('Enter');
    
    // Message should not be sent (input should remain empty)
    await expect(page.locator('[data-testid="user-message"]')).toHaveCount(0);
    
    // Send valid message
    await page.fill('[data-testid="message-input"]', 'Valid message');
    await page.keyboard.press('Enter');
    
    // Message should be sent
    await expect(page.locator('[data-testid="user-message"]:has-text("Valid message")')).toBeVisible();
  });

  test('should handle keyboard shortcuts correctly', async ({ page }) => {
    // Wait for chat interface to be ready
    await waitForChatReady(page);
    
    // Test Enter to send
    await page.fill('[data-testid="message-input"]', 'Message with Enter');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="user-message"]:has-text("Message with Enter")')).toBeVisible();
    
    // Test Shift+Enter for new line
    await page.fill('[data-testid="message-input"]', 'Line 1');
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.type('Line 2');
    await page.keyboard.press('Enter');
    
    // Should send multi-line message
    await expect(page.locator('[data-testid="user-message"]:has-text("Line 1")')).toBeVisible();
    await expect(page.locator('[data-testid="user-message"]:has-text("Line 2")')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for chat interface to be ready
    await waitForChatReady(page);
    
    // Check that interface is usable on mobile
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
    const modeSelector = page.locator('text=Mode:').locator('..');
    await expect(modeSelector.locator('button:has-text("Action")')).toBeVisible();
    await expect(modeSelector.locator('button:has-text("Chat")')).toBeVisible();
    
    // Send a message on mobile
    await page.fill('[data-testid="message-input"]', 'Mobile test message');
    await page.keyboard.press('Enter');
    
    // Should work the same as desktop
    await expect(page.locator('[data-testid="user-message"]:has-text("Mobile test message")')).toBeVisible();
  });
});
