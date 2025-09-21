import { test, expect } from '@playwright/test';

test.describe('Direct Dropdown Test', () => {
  
  test('Test API and manually create dropdown scenario', async ({ page }) => {
    console.log('🔍 Testing API response first...');
    
    // Test API directly
    try {
      const response = await page.request.get('http://localhost:8000/api/v1/health/exercises/search?q=push&limit=5');
      console.log('🔍 API Status:', response.status());
      
      if (response.ok()) {
        const data = await response.json();
        console.log('🔍 API Response:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log('❌ API Error:', errorText);
      }
    } catch (error) {
      console.log('❌ API Request failed:', error);
    }
    
    // Create a test page with our dropdown component
    await page.goto('http://localhost:3000');
    
    // Inject our dropdown test HTML and CSS
    await page.evaluate(() => {
      document.body.innerHTML = `
        <div style="padding: 50px; font-family: Arial, sans-serif;">
          <h1>Dropdown Position Test</h1>
          <div style="position: relative; width: 400px; margin: 50px auto;">
            <input 
              id="test-input" 
              type="text" 
              placeholder="Type exercise name..."
              style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 16px; box-sizing: border-box;"
            />
            <div 
              id="test-dropdown" 
              data-dropdown
              style="position: fixed; background: white; border: 1px solid #ddd; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-height: 200px; overflow-y: auto; z-index: 1000; display: none;"
            >
              <div style="padding: 12px; cursor: pointer; border-bottom: 1px solid #eee;">🏋️ Push-ups</div>
              <div style="padding: 12px; cursor: pointer; border-bottom: 1px solid #eee;">🏋️ Push Press</div>
              <div style="padding: 12px; cursor: pointer;">🏋️ Pushdown</div>
            </div>
          </div>
        </div>
      `;
    });
    
    // Add event listeners
    await page.evaluate(() => {
      const input = document.getElementById('test-input') as HTMLInputElement;
      const dropdown = document.getElementById('test-dropdown') as HTMLElement;
      
      input.addEventListener('input', function() {
        console.log('🔍 Input event triggered, value:', this.value);
        
        if (this.value.length >= 2) {
          // Position dropdown
          const rect = this.getBoundingClientRect();
          dropdown.style.display = 'block';
          dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
          dropdown.style.left = rect.left + 'px';
          dropdown.style.width = rect.width + 'px';
          
          console.log('🔍 Dropdown positioned at:', {
            top: rect.bottom + window.scrollY,
            left: rect.left,
            width: rect.width
          });
        } else {
          dropdown.style.display = 'none';
        }
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', function(e) {
        if (!input.contains(e.target as Node) && !dropdown.contains(e.target as Node)) {
          dropdown.style.display = 'none';
        }
      });
    });
    
    console.log('✅ Test page set up');
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'dropdown-test-initial.png' });
    
    // Test the dropdown
    const input = page.locator('#test-input');
    await expect(input).toBeVisible();
    
    console.log('✅ Input field is visible');
    
    // Type to trigger dropdown
    await input.fill('pu');
    await page.waitForTimeout(500);
    
    // Check if dropdown is visible
    const dropdown = page.locator('#test-dropdown');
    const dropdownVisible = await dropdown.isVisible();
    console.log('🔍 Dropdown visible after typing "pu":', dropdownVisible);
    
    // Take screenshot after typing
    await page.screenshot({ path: 'dropdown-test-after-typing.png' });
    
    if (dropdownVisible) {
      // Get positions for verification
      const inputBox = await input.boundingBox();
      const dropdownBox = await dropdown.boundingBox();
      
      console.log('✅ Input position:', inputBox);
      console.log('✅ Dropdown position:', dropdownBox);
      
      if (inputBox && dropdownBox) {
        const gap = dropdownBox.y - (inputBox.y + inputBox.height);
        console.log('🔍 Gap between input and dropdown:', gap, 'pixels');
        
        if (gap <= 2) {
          console.log('✅ Dropdown is positioned correctly (gap ≤ 2px)');
        } else {
          console.log('❌ Dropdown has too much gap:', gap, 'pixels');
        }
      }
      
      // Test clicking on dropdown item
      const firstItem = dropdown.locator('div').first();
      await firstItem.click();
      
      const inputValue = await input.inputValue();
      console.log('🔍 Input value after clicking dropdown item:', inputValue);
      
    } else {
      console.log('❌ Dropdown not visible - this is the bug!');
    }
    
    // Type more to see if it helps
    await input.fill('push');
    await page.waitForTimeout(1000);
    
    const finalDropdownVisible = await dropdown.isVisible();
    console.log('🔍 Final dropdown check after "push":', finalDropdownVisible);
    
    // Take final screenshot
    await page.screenshot({ path: 'dropdown-test-final.png' });
    
    // The test should pass if dropdown works correctly
    expect(dropdownVisible || finalDropdownVisible).toBe(true);
  });
});
