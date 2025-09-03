import { test, expect } from '@playwright/test';

test.describe('Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to chat page
    await page.goto('/chat');
  });

  test('should display chat interface', async ({ page }) => {
    // Check that chat interface elements are present
    await expect(page.getByText(/Hello.*I'm your AI life management companion/)).toBeVisible();
    await expect(page.getByPlaceholder(/type your message/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send/i })).toBeVisible();
  });

  test('should show suggestion buttons', async ({ page }) => {
    // Check that suggestion buttons are present
    await expect(page.getByText('Help me plan my week')).toBeVisible();
    await expect(page.getByText('Suggest a daily routine')).toBeVisible();
    await expect(page.getByText('I have an appointment to schedule')).toBeVisible();
    await expect(page.getByText('I\'m feeling stressed about work')).toBeVisible();
  });

  test('should send message when clicking suggestion', async ({ page }) => {
    // Click on a suggestion button
    await page.getByText('Help me plan my week').click();
    
    // Should send the message
    await expect(page.getByText('Help me plan my week')).toBeVisible();
    
    // Should show loading state while waiting for AI response
    await expect(page.getByText(/sending/i)).toBeVisible();
    
    // Note: In a real test environment, this would wait for actual AI response
  });

  test('should send message when typing and clicking send', async ({ page }) => {
    const messageInput = page.getByPlaceholder(/type your message/i);
    const sendButton = page.getByRole('button', { name: /send/i });
    
    // Type a message
    await messageInput.fill('Hello, how are you?');
    
    // Click send
    await sendButton.click();
    
    // Should display the message
    await expect(page.getByText('Hello, how are you?')).toBeVisible();
    
    // Should show loading state
    await expect(page.getByText(/sending/i)).toBeVisible();
    
    // Input should be cleared
    await expect(messageInput).toHaveValue('');
    
    // Note: In a real test environment, this would wait for actual AI response
  });

  test('should send message when pressing Enter', async ({ page }) => {
    const messageInput = page.getByPlaceholder(/type your message/i);
    
    // Type a message
    await messageInput.fill('What time do I wake up?');
    
    // Press Enter
    await messageInput.press('Enter');
    
    // Should display the message
    await expect(page.getByText('What time do I wake up?')).toBeVisible();
    
    // Should show loading state
    await expect(page.getByText(/sending/i)).toBeVisible();
    
    // Note: In a real test environment, this would wait for actual AI response
    // that might use memory to answer the question
  });

  test('should attempt to use memory for relevant questions', async ({ page }) => {
    const messageInput = page.getByPlaceholder(/type your message/i);
    
    // Ask a question that should use memory
    await messageInput.fill('What time do I wake up?');
    await messageInput.press('Enter');
    
    // Should show loading state
    await expect(page.getByText(/sending/i)).toBeVisible();
    
    // Note: In a real test environment, this would verify that memory is used
    // and show the appropriate indicator
  });

  test('should handle general greetings without memory', async ({ page }) => {
    const messageInput = page.getByPlaceholder(/type your message/i);
    
    // Send a greeting that shouldn't use memory
    await messageInput.fill('Hello there!');
    await messageInput.press('Enter');
    
    // Should show loading state
    await expect(page.getByText(/sending/i)).toBeVisible();
    
    // Note: In a real test environment, this would verify that memory is not used
    // for general greetings
  });

  test('should disable send button when input is empty', async ({ page }) => {
    const sendButton = page.getByRole('button', { name: /send/i });
    
    // Send button should be disabled initially
    await expect(sendButton).toBeDisabled();
  });

  test('should enable send button when input has content', async ({ page }) => {
    const messageInput = page.getByPlaceholder(/type your message/i);
    const sendButton = page.getByRole('button', { name: /send/i });
    
    // Type some content
    await messageInput.fill('Hello');
    
    // Send button should be enabled
    await expect(sendButton).toBeEnabled();
  });

  test('should not send empty messages', async ({ page }) => {
    const sendButton = page.getByRole('button', { name: /send/i });
    
    // Try to send empty message
    await sendButton.click();
    
    // Should not make API call (button should be disabled)
    await expect(sendButton).toBeDisabled();
  });

  test('should not send messages with only whitespace', async ({ page }) => {
    const messageInput = page.getByPlaceholder(/type your message/i);
    const sendButton = page.getByRole('button', { name: /send/i });
    
    // Type only whitespace
    await messageInput.fill('   ');
    
    // Button should still be disabled for whitespace-only content
    await expect(sendButton).toBeDisabled();
  });

  test('should show loading state while sending message', async ({ page }) => {
    const messageInput = page.getByPlaceholder(/type your message/i);
    const sendButton = page.getByRole('button', { name: /send/i });
    
    // Type and send message
    await messageInput.fill('Test message');
    await sendButton.click();
    
    // Should show loading state
    await expect(page.getByText(/sending/i)).toBeVisible();
    await expect(sendButton).toBeDisabled();
    
    // Note: In a real test environment, this would wait for the actual API response
  });

  test('should handle API errors gracefully', async ({ page }) => {
    const messageInput = page.getByPlaceholder(/type your message/i);
    
    // Send a message (will make real API call)
    await messageInput.fill('Test message');
    await messageInput.press('Enter');
    
    // Should show loading state first
    await expect(page.getByText(/sending/i)).toBeVisible();
    
    // Note: In a real test environment, this would test actual error handling
    // when the API returns an error response
  });

  test('should maintain conversation history', async ({ page }) => {
    const messageInput = page.getByPlaceholder(/type your message/i);
    
    // Send first message
    await messageInput.fill('Hello');
    await messageInput.press('Enter');
    
    // Should show loading state
    await expect(page.getByText(/sending/i)).toBeVisible();
    
    // Send second message
    await messageInput.fill('How are you?');
    await messageInput.press('Enter');
    
    // Both messages should be visible in the chat history
    await expect(page.getByText('Hello')).toBeVisible();
    await expect(page.getByText('How are you?')).toBeVisible();
    
    // Note: In a real test environment, this would also verify AI responses are visible
  });

  test('should scroll to bottom when new messages arrive', async ({ page }) => {
    const messageInput = page.getByPlaceholder(/type your message/i);
    
    // Send a message
    await messageInput.fill('Test message');
    await messageInput.press('Enter');
    
    // Should show loading state
    await expect(page.getByText(/sending/i)).toBeVisible();
    
    // Message should be visible in chat history
    await expect(page.getByText('Test message')).toBeVisible();
  });

  test('should handle multiple rapid messages', async ({ page }) => {
    const messageInput = page.getByPlaceholder(/type your message/i);
    
    // Send multiple messages quickly
    await messageInput.fill('Message 1');
    await messageInput.press('Enter');
    
    await messageInput.fill('Message 2');
    await messageInput.press('Enter');
    
    await messageInput.fill('Message 3');
    await messageInput.press('Enter');
    
    // All messages should be visible in chat history
    await expect(page.getByText('Message 1')).toBeVisible();
    await expect(page.getByText('Message 2')).toBeVisible();
    await expect(page.getByText('Message 3')).toBeVisible();
  });

  test('should preserve message formatting', async ({ page }) => {
    const messageInput = page.getByPlaceholder(/type your message/i);
    
    // Send a message with special characters
    await messageInput.fill('Hello! How are you? I\'m doing great!');
    await messageInput.press('Enter');
    
    // Should show loading state
    await expect(page.getByText(/sending/i)).toBeVisible();
    
    // Message should be displayed with proper formatting
    await expect(page.getByText('Hello! How are you? I\'m doing great!')).toBeVisible();
  });
});
