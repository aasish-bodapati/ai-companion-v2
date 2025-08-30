import { test, expect } from '@playwright/test';
const FREE_TIER = (process.env.FREE_TIER || '').toLowerCase() === '1' || (process.env.FREE_TIER || '').toLowerCase() === 'true' || (process.env.FREE_TIER || '').toLowerCase() === 'yes';

test.describe('AI Companion V2 - Edge Case Testing', () => {
  const baseURL = 'http://localhost:3000';
  
  // Test data
  const testUser = {
    email: `edgecase_${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Edge Case Test User'
  };

  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL);
  });

  // NETWORK FAILURES
  test('1. Network Interruption - Handle connection loss during chat', async ({ page }) => {
    if (FREE_TIER) test.skip(true, 'Skipped on FREE_TIER: can be flaky with slow LLM responses.');
    // Register and login
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.goto(`${baseURL}/companion`);
    
    // Send a message
    await page.fill('[data-testid="message-input"]', 'Test message during network interruption');
    await page.keyboard.press('Enter');
    
    // Simulate network interruption by going offline
    await page.context().setOffline(true);
    
    // Try to send another message
    await page.fill('[data-testid="message-input"]', 'This should fail');
    await page.keyboard.press('Enter');
    
    // Check for error handling
    await expect(page.locator('text=Network error')).toBeVisible({ timeout: 5000 });
    
    // Go back online
    await page.context().setOffline(false);
    
    // Should be able to send messages again
    await page.fill('[data-testid="message-input"]', 'Back online test');
    await page.keyboard.press('Enter');
    
    await page.waitForSelector('[data-testid="assistant-response"]', { timeout: 30000 });
  });

  // DATA EDGE CASES
  test('2. Very Long Messages - Handle extremely long input', async ({ page }) => {
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `longmsg_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.goto(`${baseURL}/companion`);
    
    // Create a very long message (10,000 characters)
    const longMessage = 'A'.repeat(10000);
    await page.fill('[data-testid="message-input"]', longMessage);
    await page.keyboard.press('Enter');
    
    // Should handle gracefully (either truncate or show error)
    await expect(page.locator('[data-testid="assistant-response"], text=too long, text=limit')).toBeVisible({ timeout: 30000 });
  });

  test('3. Special Characters - Handle Unicode and special chars', async ({ page }) => {
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `unicode_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.goto(`${baseURL}/companion`);
    
    // Test with special characters
    const specialMessage = '🚀 Hello 世界! @#$%^&*()_+{}|:"<>?[]\\;\',./~`-=';
    await page.fill('[data-testid="message-input"]', specialMessage);
    await page.keyboard.press('Enter');
    
    await page.waitForSelector('[data-testid="assistant-response"]', { timeout: 30000 });
    const response = await page.locator('[data-testid="assistant-response"]').textContent();
    expect(response).toBeTruthy();
  });

  test('4. Empty Input - Handle empty messages', async ({ page }) => {
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `empty_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.goto(`${baseURL}/companion`);
    
    // Try to send empty message
    await page.fill('[data-testid="message-input"]', '');
    await page.keyboard.press('Enter');
    
    // Should either prevent sending or show appropriate message
    await expect(page.locator('text=Please enter a message, text=empty, text=required')).toBeVisible({ timeout: 5000 });
  });

  // USER BEHAVIOR EDGE CASES
  test('5. Rapid Clicking - Handle multiple rapid clicks', async ({ page }) => {
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `rapid_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.goto(`${baseURL}/companion`);
    
    // Rapidly click send button multiple times
    await page.fill('[data-testid="message-input"]', 'Rapid clicking test');
    
    // Click multiple times rapidly
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);
    }
    
    // Should handle gracefully (prevent duplicate messages)
    const messages = await page.locator('[data-testid="user-message"]').count();
    expect(messages).toBeLessThanOrEqual(2); // Should not create more than 2 messages
  });

  test('6. Multiple Tabs - Handle concurrent sessions', async ({ page, context }) => {
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `tabs_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    // Open multiple tabs
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    await page1.goto(`${baseURL}/companion`);
    await page2.goto(`${baseURL}/companion`);
    
    // Send messages from both tabs
    await page1.fill('[data-testid="message-input"]', 'Message from tab 1');
    await page1.keyboard.press('Enter');
    
    await page2.fill('[data-testid="message-input"]', 'Message from tab 2');
    await page2.keyboard.press('Enter');
    
    // Both should work
    await page1.waitForSelector('[data-testid="assistant-response"]', { timeout: 30000 });
    await page2.waitForSelector('[data-testid="assistant-response"]', { timeout: 30000 });
    
    await page1.close();
    await page2.close();
  });

  test('7. Browser Back/Forward - Handle navigation during operations', async ({ page }) => {
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `nav_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.goto(`${baseURL}/companion`);
    
    // Start typing a message
    await page.fill('[data-testid="message-input"]', 'Partial message');
    
    // Navigate away
    await page.goto(`${baseURL}/today`);
    
    // Navigate back
    await page.goBack();
    
    // Should still be on chat page
    await expect(page).toHaveURL(/.*companion|.*chat/);
  });

  test('8. Page Refresh - Handle refresh during operations', async ({ page }) => {
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `refresh_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.goto(`${baseURL}/companion`);
    
    // Send a message
    await page.fill('[data-testid="message-input"]', 'Message before refresh');
    await page.keyboard.press('Enter');
    
    // Refresh page during processing
    await page.reload();
    
    // Should still be authenticated and on chat page
    await expect(page).toHaveURL(/.*companion|.*chat/);
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
  });

  // AUTHENTICATION EDGE CASES
  test('9. Expired Token - Handle token expiration', async ({ page }) => {
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `expired_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.goto(`${baseURL}/companion`);
    
    // Manually remove token to simulate expiration
    await page.evaluate(() => {
      localStorage.removeItem('token');
    });
    
    // Try to send a message
    await page.fill('[data-testid="message-input"]', 'Test with expired token');
    await page.keyboard.press('Enter');
    
    // Should redirect to login or show auth error
    await expect(page.locator('text=login, text=sign in, text=unauthorized')).toBeVisible({ timeout: 10000 });
  });

  test('10. Concurrent Logins - Handle multiple login attempts', async ({ page, context }) => {
    // Create two browser contexts
    const browser = context.browser();
    if (!browser) throw new Error('Browser not available');
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Login on both contexts
    await page1.goto(`${baseURL}/register`);
    await page1.fill('input[name="email"]', `concurrent_${Date.now()}@example.com`);
    await page1.fill('input[name="password"]', testUser.password);
    await page1.fill('input[name="name"]', testUser.fullName);
    await page1.fill('input[name="confirm-password"]', testUser.password);
    await page1.check('input[name="terms"]');
    await page1.click('button[type="submit"]');
    
    await page2.goto(`${baseURL}/login`);
    await page2.fill('input[name="email"]', `concurrent_${Date.now()}@example.com`);
    await page2.fill('input[name="password"]', testUser.password);
    await page2.click('button[type="submit"]');
    
    // Both should work
    await page1.waitForURL(/.*companion|.*chat/, { timeout: 10000 });
    await page2.waitForURL(/.*companion|.*chat/, { timeout: 10000 });
    
    await context1.close();
    await context2.close();
  });

  // PERFORMANCE EDGE CASES
  test('11. Large Conversation History - Handle many messages', async ({ page }) => {
    if (FREE_TIER) test.skip(true, 'Skipped on FREE_TIER: message volume causes long waits.');
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `history_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.goto(`${baseURL}/companion`);
    
    // Send multiple messages to create conversation history
    for (let i = 1; i <= 10; i++) {
      await page.fill('[data-testid="message-input"]', `Message ${i} in conversation history`);
      await page.keyboard.press('Enter');
      await page.waitForSelector('[data-testid="assistant-response"]', { timeout: 30000 });
      await page.waitForTimeout(1000); // Wait between messages
    }
    
    // Should still be responsive
    await expect(page.locator('[data-testid="message-input"]')).toBeEnabled();
    
    // Send one more message
    await page.fill('[data-testid="message-input"]', 'Final message in long conversation');
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-testid="assistant-response"]', { timeout: 30000 });
  });

  test('12. Slow Network - Handle high latency conditions', async ({ page }) => {
    if (FREE_TIER) test.skip(true, 'Skipped on FREE_TIER: intentionally simulates latency.');
    // Simulate slow network
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      await route.continue();
    });
    
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `slow_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(5000); // Longer wait for slow network
    await page.goto(`${baseURL}/companion`);
    
    // Send message with slow network
    await page.fill('[data-testid="message-input"]', 'Test with slow network');
    await page.keyboard.press('Enter');
    
    // Should show loading state
    await expect(page.locator('text=loading, text=thinking, text=processing')).toBeVisible({ timeout: 10000 });
    
    // Should eventually get response
    await page.waitForSelector('[data-testid="assistant-response"]', { timeout: 60000 });
  });

  // SECURITY EDGE CASES
  test('13. XSS Prevention - Handle malicious input', async ({ page }) => {
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `xss_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.goto(`${baseURL}/companion`);
    
    // Try to inject XSS
    const xssMessage = '<script>alert("XSS")</script><img src="x" onerror="alert(\'XSS\')">';
    await page.fill('[data-testid="message-input"]', xssMessage);
    await page.keyboard.press('Enter');
    
    await page.waitForSelector('[data-testid="assistant-response"]', { timeout: 30000 });
    
    // Check that script tags are escaped
    const response = await page.locator('[data-testid="assistant-response"]').innerHTML();
    expect(response).not.toContain('<script>');
    expect(response).not.toContain('onerror=');
  });

  test('14. SQL Injection Prevention - Handle malicious database input', async ({ page }) => {
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `sql_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.goto(`${baseURL}/companion`);
    
    // Try SQL injection
    const sqlMessage = "'; DROP TABLE users; --";
    await page.fill('[data-testid="message-input"]', sqlMessage);
    await page.keyboard.press('Enter');
    
    await page.waitForSelector('[data-testid="assistant-response"]', { timeout: 30000 });
    
    // Should handle gracefully without database errors
    const response = await page.locator('[data-testid="assistant-response"]').textContent();
    expect(response).toBeTruthy();
  });

  test('15. Rate Limiting - Handle rapid requests', async ({ page }) => {
    if (FREE_TIER) test.skip(true, 'Skipped on FREE_TIER: rate-limit behavior differs on free tier.');
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `rate_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.goto(`${baseURL}/companion`);
    
    // Send messages rapidly
    for (let i = 0; i < 10; i++) {
      await page.fill('[data-testid="message-input"]', `Rapid message ${i}`);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100); // Very short delay
    }
    
    // Should handle rate limiting gracefully
    await expect(page.locator('text=rate limit, text=too many requests, text=slow down')).toBeVisible({ timeout: 10000 });
  });
});
