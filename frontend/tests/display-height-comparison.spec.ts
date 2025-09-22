import { test, expect } from '@playwright/test';

test.describe('Display Height Comparison', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and ensure we're logged in
    await page.goto('http://localhost:3000');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Mock authentication if needed
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'mock-token');
    });
  });

  test('should have similar heights for fitness and nutrition logs displays', async ({ page }) => {
    // Test Fitness Logs Display
    await page.goto('http://localhost:3000/health/fitness');
    await page.waitForLoadState('networkidle');
    
    // Wait for the main content to load
    await page.waitForSelector('[data-testid="fitness-logs-container"]', { timeout: 10000 });
    
    // Get the fitness logs container height
    const fitnessContainer = page.locator('[data-testid="fitness-logs-container"]');
    const fitnessHeight = await fitnessContainer.boundingBox();
    
    console.log('Fitness Logs Container Height:', fitnessHeight?.height);
    
    // Test Nutrition Logs Display
    await page.goto('http://localhost:3000/health/nutrition');
    await page.waitForLoadState('networkidle');
    
    // Wait for the main content to load
    await page.waitForSelector('[data-testid="nutrition-logs-container"]', { timeout: 10000 });
    
    // Get the nutrition logs container height
    const nutritionContainer = page.locator('[data-testid="nutrition-logs-container"]');
    const nutritionHeight = await nutritionContainer.boundingBox();
    
    console.log('Nutrition Logs Container Height:', nutritionHeight?.height);
    
    // Compare heights
    if (fitnessHeight && nutritionHeight) {
      const heightDifference = Math.abs(fitnessHeight.height - nutritionHeight.height);
      const heightRatio = nutritionHeight.height / fitnessHeight.height;
      
      console.log('Height Difference:', heightDifference);
      console.log('Height Ratio (Nutrition/Fitness):', heightRatio.toFixed(2));
      
      // The nutrition logs should not be more than 20% taller than fitness logs
      expect(heightRatio).toBeLessThan(1.2);
      
      // Log individual component heights for debugging
      await debugComponentHeights(page, 'fitness');
      await debugComponentHeights(page, 'nutrition');
    }
  });

  test('should measure individual component heights for debugging', async ({ page }) => {
    // Test both displays and measure individual components
    const displays = ['fitness', 'nutrition'];
    
    for (const display of displays) {
      console.log(`\n=== ${display.toUpperCase()} LOGS DISPLAY ===`);
      
      await page.goto(`http://localhost:3000/health/${display}`);
      await page.waitForLoadState('networkidle');
      
      // Wait for main container
      await page.waitForSelector(`[data-testid="${display}-logs-container"]`, { timeout: 10000 });
      
      // Measure different sections
      const sections = [
        'stats-grid',
        'search-filter',
        'main-content',
        'empty-state',
        'meals-list',
        'workouts-list'
      ];
      
      for (const section of sections) {
        const selector = `[data-testid="${section}"]`;
        const element = page.locator(selector);
        
        if (await element.count() > 0) {
          const box = await element.boundingBox();
          if (box) {
            console.log(`${section}: ${box.height.toFixed(1)}px`);
          }
        }
      }
      
      // Measure the overall container
      const container = page.locator(`[data-testid="${display}-logs-container"]`);
      const containerBox = await container.boundingBox();
      if (containerBox) {
        console.log(`Total Container: ${containerBox.height.toFixed(1)}px`);
      }
    }
  });

  test('should identify oversized components in nutrition logs', async ({ page }) => {
    await page.goto('http://localhost:3000/health/nutrition');
    await page.waitForLoadState('networkidle');
    
    // Wait for nutrition logs to load
    await page.waitForSelector('[data-testid="nutrition-logs-container"]', { timeout: 10000 });
    
    // Get all major elements and their heights
    const elements = [
      { name: 'Stats Grid', selector: '[data-testid="stats-grid"]' },
      { name: 'Search Filter', selector: '[data-testid="search-filter"]' },
      { name: 'Main Content Area', selector: '[data-testid="main-content"]' },
      { name: 'Meals List Container', selector: '[data-testid="meals-list"]' },
      { name: 'Empty State', selector: '[data-testid="empty-state"]' },
      { name: 'Data View Container', selector: '[data-testid="data-view-container"]' }
    ];
    
    console.log('\n=== NUTRITION LOGS COMPONENT HEIGHTS ===');
    
    for (const element of elements) {
      const locator = page.locator(element.selector);
      if (await locator.count() > 0) {
        const box = await locator.boundingBox();
        if (box) {
          console.log(`${element.name}: ${box.height.toFixed(1)}px`);
          
          // Flag components that are unusually tall
          if (box.height > 200) {
            console.log(`⚠️  ${element.name} is unusually tall (${box.height.toFixed(1)}px)`);
          }
        }
      }
    }
    
    // Take a screenshot for visual debugging
    await page.screenshot({ 
      path: `test-results/nutrition-logs-height-${Date.now()}.png`,
      fullPage: true 
    });
  });

  test('should compare fitness vs nutrition layout structure', async ({ page }) => {
    const layouts = [
      { name: 'Fitness', url: '/health/fitness' },
      { name: 'Nutrition', url: '/health/nutrition' }
    ];
    
    for (const layout of layouts) {
      console.log(`\n=== ${layout.name.toUpperCase()} LAYOUT STRUCTURE ===`);
      
      await page.goto(`http://localhost:3000${layout.url}`);
      await page.waitForLoadState('networkidle');
      
      // Wait for main container
      await page.waitForSelector(`[data-testid="${layout.name.toLowerCase()}-logs-container"]`, { timeout: 10000 });
      
      // Get all direct children of the main container
      const container = page.locator(`[data-testid="${layout.name.toLowerCase()}-logs-container"]`);
      const children = container.locator('> *');
      const childCount = await children.count();
      
      console.log(`Number of direct children: ${childCount}`);
      
      for (let i = 0; i < childCount; i++) {
        const child = children.nth(i);
        const tagName = await child.evaluate(el => el.tagName);
        const className = await child.getAttribute('class');
        const box = await child.boundingBox();
        
        console.log(`Child ${i + 1}: ${tagName} - ${box?.height.toFixed(1)}px`);
        console.log(`  Classes: ${className}`);
      }
    }
  });
});

async function debugComponentHeights(page: any, displayType: string) {
  console.log(`\n=== ${displayType.toUpperCase()} COMPONENT DEBUG ===`);
  
  // Common selectors to check
  const selectors = [
    'div[class*="space-y"]',
    'div[class*="DataViewContainer"]',
    'div[class*="StatsGrid"]',
    'div[class*="SearchAndFilter"]',
    'div[class*="EmptyState"]',
    'div[class*="Card"]',
    'div[class*="CardContent"]'
  ];
  
  for (const selector of selectors) {
    const elements = page.locator(selector);
    const count = await elements.count();
    
    if (count > 0) {
      console.log(`\n${selector} (${count} elements):`);
      
      for (let i = 0; i < Math.min(count, 5); i++) { // Limit to first 5 elements
        const element = elements.nth(i);
        const box = await element.boundingBox();
        const className = await element.getAttribute('class');
        
        if (box) {
          console.log(`  Element ${i + 1}: ${box.height.toFixed(1)}px - ${className}`);
        }
      }
    }
  }
}
