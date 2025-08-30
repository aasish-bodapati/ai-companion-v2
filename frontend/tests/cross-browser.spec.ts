import { test, expect } from '@playwright/test';
const FREE_TIER = (process.env.FREE_TIER || '').toLowerCase() === '1' || (process.env.FREE_TIER || '').toLowerCase() === 'true' || (process.env.FREE_TIER || '').toLowerCase() === 'yes';
test.skip(FREE_TIER, 'Skipped on FREE_TIER: cross-browser suite relies on timely LLM responses.');

test.describe('AI Companion V2 - Cross Browser Testing', () => {
  const baseURL = 'http://localhost:3000';
  
  // Test data
  const testUser = {
    email: `browser_${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Browser Test User'
  };

  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL);
  });

  // CHROME TESTING
  test('1. Chrome - Complete user journey', async ({ page }) => {
    // Register
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.goto(`${baseURL}/companion`);
    
    // Test chat functionality
    await page.fill('[data-testid="message-input"]', 'Chrome browser test message');
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-testid="assistant-response"]', { timeout: 30000 });
    
    // Test navigation
    await page.click('a[href="/today"]');
    await expect(page).toHaveURL(/.*today/);
    
    await page.click('a[href="/memories"]');
    await expect(page).toHaveURL(/.*memories/);
    
    await page.goto(`${baseURL}/companion`);
    await expect(page).toHaveURL(/.*companion/);
  });

  test('2. Chrome - Responsive design', async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(baseURL);
    await expect(page.locator('nav')).toBeVisible();
    
    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(baseURL);
    await expect(page.locator('nav')).toBeVisible();
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);
    await expect(page.locator('nav')).toBeVisible();
    
    // Test mobile menu
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    }
  });

  // FIREFOX TESTING
  test('3. Firefox - Complete user journey', async ({ page }) => {
    // Register
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `firefox_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.goto(`${baseURL}/companion`);
    
    // Test chat functionality
    await page.fill('[data-testid="message-input"]', 'Firefox browser test message');
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-testid="assistant-response"]', { timeout: 30000 });
    
    // Test navigation
    await page.click('a[href="/today"]');
    await expect(page).toHaveURL(/.*today/);
    
    await page.click('a[href="/memories"]');
    await expect(page).toHaveURL(/.*memories/);
    
    await page.goto(`${baseURL}/companion`);
    await expect(page).toHaveURL(/.*companion/);
  });

  test('4. Firefox - Responsive design', async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(baseURL);
    await expect(page.locator('nav')).toBeVisible();
    
    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(baseURL);
    await expect(page.locator('nav')).toBeVisible();
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);
    await expect(page.locator('nav')).toBeVisible();
  });

  // SAFARI TESTING (WebKit)
  test('5. Safari - Complete user journey', async ({ page }) => {
    // Register
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `safari_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.goto(`${baseURL}/companion`);
    
    // Test chat functionality
    await page.fill('[data-testid="message-input"]', 'Safari browser test message');
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-testid="assistant-response"]', { timeout: 30000 });
    
    // Test navigation
    await page.click('a[href="/today"]');
    await expect(page).toHaveURL(/.*today/);
    
    await page.click('a[href="/memories"]');
    await expect(page).toHaveURL(/.*memories/);
    
    await page.goto(`${baseURL}/companion`);
    await expect(page).toHaveURL(/.*companion/);
  });

  test('6. Safari - Mobile compatibility', async ({ page }) => {
    // Test iPhone layout
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(baseURL);
    await expect(page.locator('nav')).toBeVisible();
    
    // Test iPad layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(baseURL);
    await expect(page.locator('nav')).toBeVisible();
    
    // Test touch interactions
    await page.touchscreen.tap(100, 100); // Test touch events
  });

  // EDGE TESTING
  test('7. Edge - Complete user journey', async ({ page }) => {
    // Register
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `edge_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.goto(`${baseURL}/companion`);
    
    // Test chat functionality
    await page.fill('[data-testid="message-input"]', 'Edge browser test message');
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-testid="assistant-response"]', { timeout: 30000 });
    
    // Test navigation
    await page.click('a[href="/today"]');
    await expect(page).toHaveURL(/.*today/);
    
    await page.click('a[href="/memories"]');
    await expect(page).toHaveURL(/.*memories/);
    
    await page.goto(`${baseURL}/companion`);
    await expect(page).toHaveURL(/.*companion/);
  });

  test('8. Edge - Windows compatibility', async ({ page }) => {
    // Test Windows desktop layout
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(baseURL);
    await expect(page.locator('nav')).toBeVisible();
    
    // Test Windows tablet layout
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(baseURL);
    await expect(page.locator('nav')).toBeVisible();
  });

  // BROWSER-SPECIFIC FEATURES
  test('9. Browser Back/Forward - Cross browser compatibility', async ({ page }) => {
    // Register and login
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `backforward_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.goto(`${baseURL}/companion`);
    
    // Navigate to different pages
    await page.click('a[href="/today"]');
    await page.click('a[href="/memories"]');
    
    // Test browser back button
    await page.goBack();
    await expect(page).toHaveURL(/.*today/);
    
    await page.goBack();
    await expect(page).toHaveURL(/.*companion/);
    
    // Test browser forward button
    await page.goForward();
    await expect(page).toHaveURL(/.*today/);
  });

  test('10. Browser Refresh - Cross browser compatibility', async ({ page }) => {
    // Register and login
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
    await page.waitForSelector('[data-testid="assistant-response"]', { timeout: 30000 });
    
    // Refresh page
    await page.reload();
    
    // Should still be authenticated and on chat page
    await expect(page).toHaveURL(/.*companion/);
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
    
    // Should still have the conversation
    await expect(page.locator('[data-testid="assistant-response"]')).toBeVisible();
  });

  test('11. Browser Storage - Cross browser compatibility', async ({ page }) => {
    // Register and login
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `storage_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.goto(`${baseURL}/companion`);
    
    // Check that token is stored
    const token = await page.evaluate(() => {
      return localStorage.getItem('token');
    });
    expect(token).toBeTruthy();
    
    // Close and reopen browser context
    await page.context().close();
    
    // Create new context and check if token persists
    const browser = page.context().browser();
    if (!browser) throw new Error('Browser not available');
    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();
    
    await newPage.goto(`${baseURL}/companion`);
    
    // Should redirect to login since token is not shared between contexts
    await expect(newPage).toHaveURL(/.*login/);
    
    await newContext.close();
  });

  test('12. Browser Console - Error checking', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Register and login
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `console_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.goto(`${baseURL}/companion`);
    
    // Send a message
    await page.fill('[data-testid="message-input"]', 'Console error test message');
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-testid="assistant-response"]', { timeout: 30000 });
    
    // Navigate to different pages
    await page.click('a[href="/today"]');
    await page.click('a[href="/memories"]');
    await page.goto(`${baseURL}/companion`);
    
    // Check for console errors
    expect(errors.length).toBe(0);
  });

  test('13. Browser Network - Request monitoring', async ({ page }) => {
    // Monitor network requests
    const requests: string[] = [];
    page.on('request', request => {
      requests.push(request.url());
    });
    
    // Register and login
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `network_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.goto(`${baseURL}/companion`);
    
    // Send a message
    await page.fill('[data-testid="message-input"]', 'Network request test message');
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-testid="assistant-response"]', { timeout: 30000 });
    
    // Check that API requests are being made
    const apiRequests = requests.filter(url => url.includes('/api/') || url.includes('localhost:8000'));
    expect(apiRequests.length).toBeGreaterThan(0);
  });

  test('14. Browser Performance - Cross browser metrics', async ({ page }) => {
    // Measure performance metrics
    const startTime = Date.now();
    await page.goto(baseURL);
    const loadTime = Date.now() - startTime;
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      return {
        loadEventEnd: performance.timing.loadEventEnd - performance.timing.navigationStart,
        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
        firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime
      };
    });
    
    // Performance should be reasonable across browsers
    expect(loadTime).toBeLessThan(5000);
    expect(metrics.loadEventEnd).toBeLessThan(5000);
    expect(metrics.domContentLoaded).toBeLessThan(3000);
  });

  test('15. Browser Accessibility - Cross browser a11y', async ({ page }) => {
    await page.goto(baseURL);
    
    // Check for proper heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
    
    // Check for alt text on images
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
    
    // Check for proper form labels
    await page.goto(`${baseURL}/register`);
    const inputs = await page.locator('input').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        await expect(label).toBeVisible();
      }
    }
    
    // Check for keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to navigate with keyboard
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    expect(focusedElement).toBeTruthy();
  });
});
