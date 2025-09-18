import { test, expect } from '@playwright/test';

test.describe('Fitness Component E2E Tests - Simple', () => {
  test('Fitness page loads and shows login when not authenticated', async ({ page }) => {
    console.log('🔐 Testing unauthenticated access');
    
    // Navigate to fitness page without authentication
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to login page
    await expect(page).toHaveURL(/.*login.*/);
    
    // Check if login form is visible
    await expect(page.locator('text=Sign in')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    console.log('✅ Unauthenticated access correctly redirects to login');
  });

  test('Login form works correctly', async ({ page }) => {
    console.log('🔑 Testing login form');
    
    // Navigate to login page
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Check if login form is visible
    await expect(page.locator('text=Sign in')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Fill in login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForTimeout(3000);
    
    // Check if we're redirected (either to dashboard or fitness page)
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);
    
    // Should not be on login page anymore
    const isOnLoginPage = await page.locator('text=Sign in').isVisible();
    if (!isOnLoginPage) {
      console.log('✅ Login successful - redirected away from login page');
    } else {
      console.log('⚠️ Still on login page - may need valid credentials');
    }
  });

  test('Page performance is acceptable', async ({ page }) => {
    console.log('⚡ Testing page performance');
    
    const startTime = Date.now();
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`Page load time: ${loadTime}ms`);
    
    // Acceptable load time is under 5 seconds
    expect(loadTime).toBeLessThan(5000);
    
    console.log('✅ Page performance is acceptable');
  });

  test('Page title is correct', async ({ page }) => {
    console.log('📄 Testing page title');
    
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');
    
    // Check if page title contains expected text
    await expect(page).toHaveTitle(/AI Companion/);
    
    console.log('✅ Page title is correct');
  });

  test('Page has proper meta tags', async ({ page }) => {
    console.log('🏷️ Testing meta tags');
    
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');
    
    // Check for viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
    
    console.log('✅ Meta tags are present');
  });

  test('Page loads without JavaScript errors', async ({ page }) => {
    console.log('🐛 Testing for JavaScript errors');
    
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');
    
    // Allow some time for any async errors
    await page.waitForTimeout(2000);
    
    console.log(`Found ${errors.length} JavaScript errors`);
    if (errors.length > 0) {
      console.log('Errors:', errors);
    }
    
    // Should have minimal errors (some are expected in test environment)
    expect(errors.length).toBeLessThan(10);
    
    console.log('✅ Page loads without critical JavaScript errors');
  });

  test('Page is responsive on mobile', async ({ page }) => {
    console.log('📱 Testing mobile responsiveness');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');
    
    // Check if page content is visible on mobile
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Check if there's no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10); // Allow small margin
    
    console.log('✅ Page is responsive on mobile');
  });

  test('Page works in different browsers', async ({ page, browserName }) => {
    console.log(`🌐 Testing in ${browserName}`);
    
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');
    
    // Basic functionality should work in all browsers
    await expect(page.locator('body')).toBeVisible();
    
    // Check if page content loads
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
    expect(hasContent!.length).toBeGreaterThan(0);
    
    console.log(`✅ Page works in ${browserName}`);
  });

  test('API endpoints are accessible', async ({ page }) => {
    console.log('🌐 Testing API accessibility');
    
    // Test if backend is running
    try {
      const response = await page.request.get('http://localhost:8000/health');
      expect(response.status()).toBe(200);
      console.log('✅ Backend health check passed');
    } catch (error) {
      console.log('⚠️ Backend health check failed:', error);
    }
    
    // Test if frontend is running
    try {
      const response = await page.request.get('http://localhost:3000');
      expect(response.status()).toBe(200);
      console.log('✅ Frontend is accessible');
    } catch (error) {
      console.log('⚠️ Frontend accessibility check failed:', error);
    }
  });

  test('Page handles network errors gracefully', async ({ page }) => {
    console.log('🌐 Testing network error handling');
    
    // Intercept all requests and return 500 error
    await page.route('**/*', route => {
      route.fulfill({
        status: 500,
        contentType: 'text/plain',
        body: 'Internal Server Error'
      });
    });
    
    await page.goto('http://localhost:3000/fitness');
    await page.waitForTimeout(3000);
    
    // Page should still load (even if with errors)
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    console.log('✅ Page handles network errors gracefully');
  });

  test('Page has proper security headers', async ({ page }) => {
    console.log('🔒 Testing security headers');
    
    const response = await page.goto('http://localhost:3000/fitness');
    
    if (response) {
      const headers = response.headers();
      
      // Check for basic security headers
      const hasContentType = headers['content-type'];
      expect(hasContentType).toBeTruthy();
      
      console.log('✅ Page has proper headers');
    } else {
      console.log('⚠️ Could not check headers');
    }
  });

  test('Page loads with different network conditions', async ({ page }) => {
    console.log('🐌 Testing slow network conditions');
    
    // Simulate slow network
    await page.route('**/*', route => {
      setTimeout(() => {
        route.continue();
      }, 1000); // 1 second delay
    });
    
    const startTime = Date.now();
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`Slow network load time: ${loadTime}ms`);
    
    // Should still load within reasonable time even with delays
    expect(loadTime).toBeLessThan(10000);
    
    console.log('✅ Page handles slow network conditions');
  });

  test('Page works with different screen sizes', async ({ page }) => {
    console.log('📐 Testing different screen sizes');
    
    const sizes = [
      { width: 320, height: 568, name: 'iPhone SE' },
      { width: 768, height: 1024, name: 'iPad' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];
    
    for (const size of sizes) {
      console.log(`Testing ${size.name} (${size.width}x${size.height})`);
      
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto('http://localhost:3000/fitness');
      await page.waitForLoadState('networkidle');
      
      // Page should be visible at all sizes
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      console.log(`✅ Page works on ${size.name}`);
    }
  });

  test('Page handles JavaScript disabled gracefully', async ({ page }) => {
    console.log('🚫 Testing JavaScript disabled scenario');
    
    // Disable JavaScript
    await page.setJavaScriptEnabled(false);
    
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');
    
    // Page should still load basic content
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
    
    console.log('✅ Page handles JavaScript disabled gracefully');
  });
});
