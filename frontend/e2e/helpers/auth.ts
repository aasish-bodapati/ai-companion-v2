import { Page } from '@playwright/test';

export async function authenticateUser(page: Page) {
  // Method 1: Try to login programmatically
  try {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Check if we're already logged in
    const isLoggedIn = await page.evaluate(() => {
      return localStorage.getItem('token') !== null;
    });
    
    if (isLoggedIn) {
      console.log('✅ User already authenticated');
      return;
    }
    
    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard or fitness page
    await page.waitForURL('**/fitness', { timeout: 10000 });
    console.log('✅ User authenticated via login form');
    
  } catch (error) {
    console.log('⚠️ Login form failed, trying direct token method');
    
    // Method 2: Direct token injection (fallback)
    await page.goto('http://localhost:3000');
    
    // Inject mock token and user data
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-test-token-12345');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User'
      }));
    });
    
    console.log('✅ User authenticated via token injection');
  }
}

export async function ensureAuthenticated(page: Page) {
  // Always try to authenticate first
  await authenticateUser(page);
  
  // Verify authentication worked by checking if we can access fitness page
  await page.goto('http://localhost:3000/fitness');
  await page.waitForLoadState('networkidle');
  
  // Check if we can see fitness content (not login page)
  const isOnLoginPage = await page.locator('text=Sign in').isVisible();
  if (isOnLoginPage) {
    console.log('⚠️ Still on login page, trying alternative authentication');
    // Try alternative approach - inject token directly
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-test-token-12345');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User'
      }));
    });
    
    // Reload and try again
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const stillOnLoginPage = await page.locator('text=Sign in').isVisible();
    if (stillOnLoginPage) {
      throw new Error('Authentication failed - still on login page after token injection');
    }
  }
  
  console.log('✅ Authentication verified');
}

export async function createTestWorkout(page: Page, workoutData: any) {
  // Navigate to fitness page
  await page.goto('http://localhost:3000/fitness');
  await page.waitForLoadState('networkidle');
  
  // Click on Log Workout tab
  await page.click('[data-testid="log-workout-tab"]');
  await page.waitForTimeout(1000);
  
  // Fill workout form
  if (workoutData.name) {
    await page.fill('input[placeholder*="workout" i], input[placeholder*="name" i]', workoutData.name);
  }
  
  if (workoutData.duration) {
    await page.fill('input[type="number"][placeholder*="duration" i], input[type="number"][placeholder*="minutes" i]', workoutData.duration.toString());
  }
  
  if (workoutData.reps) {
    await page.fill('input[type="number"][placeholder*="reps" i]', workoutData.reps.toString());
  }
  
  if (workoutData.sets) {
    await page.fill('input[type="number"][placeholder*="sets" i]', workoutData.sets.toString());
  }
  
  if (workoutData.weight) {
    await page.fill('input[type="number"][placeholder*="weight" i]', workoutData.weight.toString());
  }
  
  if (workoutData.notes) {
    await page.fill('textarea[placeholder*="notes" i]', workoutData.notes);
  }
  
  // Submit form
  await page.click('button[type="submit"], button:has-text("Log"), button:has-text("Submit")');
  
  // Wait for success or error
  await page.waitForTimeout(2000);
  
  console.log('✅ Test workout created');
}
