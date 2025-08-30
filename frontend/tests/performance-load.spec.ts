import { test, expect } from '@playwright/test';

// Skip this suite on FREE_TIER to avoid latency-related flakes
const FREE_TIER = (process.env.FREE_TIER || '').toLowerCase() === '1' || (process.env.FREE_TIER || '').toLowerCase() === 'true' || (process.env.FREE_TIER || '').toLowerCase() === 'yes';
test.skip(FREE_TIER, 'Skipped on FREE_TIER: performance/load tests are unstable with free-tier LLM latency.');

test.describe('AI Companion V2 - Performance & Load Testing', () => {
  const baseURL = 'http://localhost:3000';
  
  // Test data
  const testUser = {
    email: `perf_${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Performance Test User'
  };

  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL);
  });

  // PERFORMANCE TESTING
  test('1. Page Load Performance - Measure load times', async ({ page }) => {
    // Measure home page load time
    const startTime = Date.now();
    await page.goto(baseURL);
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000); // Should load in under 3 seconds
    
    // Measure registration page load time
    const regStartTime = Date.now();
    await page.goto(`${baseURL}/register`);
    const regLoadTime = Date.now() - regStartTime;
    
    expect(regLoadTime).toBeLessThan(2000); // Should load in under 2 seconds
    
    // Measure login page load time
    const loginStartTime = Date.now();
    await page.goto(`${baseURL}/login`);
    const loginLoadTime = Date.now() - loginStartTime;
    
    expect(loginLoadTime).toBeLessThan(2000); // Should load in under 2 seconds
  });

  test('2. Chat Interface Performance - Measure response times', async ({ page }) => {
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
    
    // Measure chat page load time
    const chatStartTime = Date.now();
    await page.waitForSelector('[data-testid="message-input"]');
    const chatLoadTime = Date.now() - chatStartTime;
    
    expect(chatLoadTime).toBeLessThan(2000); // Should load in under 2 seconds
    
    // Measure message response time
    const messageStartTime = Date.now();
    await page.fill('[data-testid="message-input"]', 'Performance test message');
    await page.keyboard.press('Enter');
    
    await page.waitForSelector('[data-testid="assistant-response"]', { timeout: 30000 });
    const messageResponseTime = Date.now() - messageStartTime;
    
    expect(messageResponseTime).toBeLessThan(15000); // Should respond in under 15 seconds
  });

  test('3. Memory Usage - Monitor memory consumption', async ({ page }) => {
    // Register and login
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `memory_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.goto(`${baseURL}/companion`);
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Send multiple messages to test memory growth
    for (let i = 1; i <= 5; i++) {
      await page.fill('[data-testid="message-input"]', `Memory test message ${i}`);
      await page.keyboard.press('Enter');
      await page.waitForSelector('[data-testid="assistant-response"]', { timeout: 30000 });
      await page.waitForTimeout(1000);
    }
    
    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Memory growth should be reasonable (less than 50MB)
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryGrowth = finalMemory - initialMemory;
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // 50MB
    }
  });

  test('4. API Response Times - Measure backend performance', async ({ page }) => {
    // Test API health endpoint
    const healthStartTime = Date.now();
    const healthResponse = await page.request.get(`${baseURL.replace('3000', '8000')}/health`);
    const healthTime = Date.now() - healthStartTime;
    
    expect(healthResponse.status()).toBe(200);
    expect(healthTime).toBeLessThan(1000); // Should respond in under 1 second
    
    // Test registration API
    const regStartTime = Date.now();
    const regResponse = await page.request.post(`${baseURL.replace('3000', '8000')}/register`, {
      data: {
        email: `api_${Date.now()}@example.com`,
        password: 'testpassword123',
        full_name: 'API Test User'
      }
    });
    const regTime = Date.now() - regStartTime;
    
    expect(regResponse.status()).toBe(200);
    expect(regTime).toBeLessThan(3000); // Should complete in under 3 seconds
  });

  // LOAD TESTING
  test('5. Concurrent Users - Simulate multiple users', async ({ browser }) => {
    const numUsers = 5;
    const pages = [];
    
    // Create multiple browser contexts
    for (let i = 0; i < numUsers; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      pages.push({ page, context });
    }
    
    // Register users concurrently
    const registrationPromises = pages.map(async ({ page }, index) => {
      await page.goto(`${baseURL}/register`);
      await page.fill('input[name="email"]', `concurrent_${Date.now()}_${index}@example.com`);
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="name"]', testUser.fullName);
      await page.fill('input[name="confirm-password"]', testUser.password);
      await page.check('input[name="terms"]');
      await page.click('button[type="submit"]');
      
      await page.waitForTimeout(3000);
      await page.goto(`${baseURL}/companion`);
    });
    
    await Promise.all(registrationPromises);
    
    // Send messages concurrently
    const messagePromises = pages.map(async ({ page }, index) => {
      await page.fill('[data-testid="message-input"]', `Concurrent message from user ${index}`);
      await page.keyboard.press('Enter');
      await page.waitForSelector('[data-testid="assistant-response"]', { timeout: 30000 });
    });
    
    await Promise.all(messagePromises);
    
    // Clean up
    for (const { context } of pages) {
      await context.close();
    }
  });

  test('6. Large Data Sets - Test with many conversations', async ({ page }) => {
    // Register and login
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `large_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.goto(`${baseURL}/companion`);
    
    // Create many conversations
    for (let i = 1; i <= 20; i++) {
      await page.fill('[data-testid="message-input"]', `Large dataset message ${i}`);
      await page.keyboard.press('Enter');
      await page.waitForSelector('[data-testid="assistant-response"]', { timeout: 30000 });
      await page.waitForTimeout(500); // Short delay between messages
    }
    
    // Should still be responsive
    await expect(page.locator('[data-testid="message-input"]')).toBeEnabled();
    
    // Navigate to other pages to test performance
    await page.click('a[href="/today"]');
    await expect(page).toHaveURL(/.*today/);
    
    await page.click('a[href="/memories"]');
    await expect(page).toHaveURL(/.*memories/);
  });

  test('7. Stress Test - Continuous operation', async ({ page }) => {
    // Register and login
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `stress_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.goto(`${baseURL}/companion`);
    
    // Continuous operation for 2 minutes
    const startTime = Date.now();
    const duration = 2 * 60 * 1000; // 2 minutes
    
    while (Date.now() - startTime < duration) {
      // Send message
      await page.fill('[data-testid="message-input"]', `Stress test message at ${Date.now()}`);
      await page.keyboard.press('Enter');
      
      // Wait for response
      await page.waitForSelector('[data-testid="assistant-response"]', { timeout: 30000 });
      
      // Navigate between pages
      await page.click('a[href="/today"]');
      await page.waitForTimeout(1000);
      
      await page.click('a[href="/memories"]');
      await page.waitForTimeout(1000);
      
      await page.goto(`${baseURL}/companion`);
      await page.waitForTimeout(1000);
    }
    
    // Should still be functional
    await expect(page.locator('[data-testid="message-input"]')).toBeEnabled();
  });

  test('8. Network Latency - Test with high latency', async ({ page }) => {
    // Simulate high latency network
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
      await route.continue();
    });
    
    // Register and login
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `latency_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(10000); // Longer wait for high latency
    await page.goto(`${baseURL}/companion`);
    
    // Send message with high latency
    await page.fill('[data-testid="message-input"]', 'High latency test message');
    await page.keyboard.press('Enter');
    
    // Should show loading state
    await expect(page.locator('text=loading, text=thinking, text=processing')).toBeVisible({ timeout: 15000 });
    
    // Should eventually get response
    await page.waitForSelector('[data-testid="assistant-response"]', { timeout: 90000 });
  });

  test('9. Memory Leak Detection - Long running session', async ({ page }) => {
    // Register and login
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `leak_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.goto(`${baseURL}/companion`);
    
    // Get initial memory
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Perform many operations
    for (let i = 1; i <= 50; i++) {
      // Send message
      await page.fill('[data-testid="message-input"]', `Memory leak test ${i}`);
      await page.keyboard.press('Enter');
      await page.waitForSelector('[data-testid="assistant-response"]', { timeout: 30000 });
      
      // Navigate between pages
      await page.click('a[href="/today"]');
      await page.waitForTimeout(500);
      
      await page.goto(`${baseURL}/companion`);
      await page.waitForTimeout(500);
    }
    
    // Get final memory
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Memory should not grow excessively
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryGrowth = finalMemory - initialMemory;
      const growthPercentage = (memoryGrowth / initialMemory) * 100;
      
      // Memory should not grow more than 100%
      expect(growthPercentage).toBeLessThan(100);
    }
  });

  test('10. Database Performance - Large memory datasets', async ({ page }) => {
    // Register and login
    await page.goto(`${baseURL}/register`);
    await page.fill('input[name="email"]', `db_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.fullName);
    await page.fill('input[name="confirm-password"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    await page.goto(`${baseURL}/companion`);
    
    // Create many memories through conversation
    const memoryTopics = [
      'I work as a software engineer at Google',
      'I live in San Francisco, California',
      'I have a dog named Max who is 3 years old',
      'I enjoy hiking and photography',
      'I am allergic to peanuts and shellfish',
      'My favorite color is blue',
      'I graduated from Stanford University in 2020',
      'I speak English, Spanish, and French',
      'I have a sister named Sarah who is a doctor',
      'I drive a Tesla Model 3',
      'I enjoy cooking Italian food',
      'I have been to 15 different countries',
      'I play guitar and piano',
      'I am a morning person and wake up at 6 AM',
      'I have a gym membership at Planet Fitness'
    ];
    
    for (const topic of memoryTopics) {
      await page.fill('[data-testid="message-input"]', topic);
      await page.keyboard.press('Enter');
      await page.waitForSelector('[data-testid="assistant-response"]', { timeout: 30000 });
      await page.waitForTimeout(1000);
    }
    
    // Navigate to memories page to test database performance
    await page.click('a[href="/memories"]');
    await expect(page).toHaveURL(/.*memories/);
    
    // Should load memories quickly
    const loadStartTime = Date.now();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - loadStartTime;
    
    expect(loadTime).toBeLessThan(5000); // Should load in under 5 seconds
  });
});
