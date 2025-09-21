import { test, expect } from '@playwright/test';

test.describe('Modal CSS Analysis', () => {
  test('should analyze the modal CSS for scrolling issues', async ({ page }) => {
    // Navigate to a simple page and inject the modal HTML directly
    await page.goto('about:blank');
    
    // Inject the modal HTML structure
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            max-width: 4rem;
            height: 80vh;
            background: white;
            border-radius: 8px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          
          .modal-header {
            flex-shrink: 0;
            padding: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .modal-content {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            min-height: 0;
          }
          
          .modal-inner {
            padding: 1rem;
          }
          
          .day-card {
            margin-bottom: 1rem;
            padding: 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: #f9fafb;
          }
          
          .workout-item {
            margin-bottom: 0.5rem;
            padding: 0.5rem;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            background: white;
          }
        </style>
      </head>
      <body>
        <div class="modal">
          <div class="modal-header">
            <h2>Create Custom Routine</h2>
          </div>
          <div class="modal-content">
            <div class="modal-inner">
              <div class="day-card">
                <h3>Monday</h3>
                <div class="workout-item">Exercise 1</div>
                <div class="workout-item">Exercise 2</div>
                <div class="workout-item">Exercise 3</div>
              </div>
              <div class="day-card">
                <h3>Tuesday</h3>
                <div class="workout-item">Exercise 1</div>
                <div class="workout-item">Exercise 2</div>
                <div class="workout-item">Exercise 3</div>
              </div>
              <div class="day-card">
                <h3>Wednesday</h3>
                <div class="workout-item">Exercise 1</div>
                <div class="workout-item">Exercise 2</div>
                <div class="workout-item">Exercise 3</div>
              </div>
              <div class="day-card">
                <h3>Thursday</h3>
                <div class="workout-item">Exercise 1</div>
                <div class="workout-item">Exercise 2</div>
                <div class="workout-item">Exercise 3</div>
              </div>
              <div class="day-card">
                <h3>Friday</h3>
                <div class="workout-item">Exercise 1</div>
                <div class="workout-item">Exercise 2</div>
                <div class="workout-item">Exercise 3</div>
              </div>
              <div class="day-card">
                <h3>Saturday</h3>
                <div class="workout-item">Exercise 1</div>
                <div class="workout-item">Exercise 2</div>
                <div class="workout-item">Exercise 3</div>
              </div>
              <div class="day-card">
                <h3>Sunday</h3>
                <div class="workout-item">Exercise 1</div>
                <div class="workout-item">Exercise 2</div>
                <div class="workout-item">Exercise 3</div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    
    // Wait for the content to load
    await page.waitForLoadState('networkidle');
    
    // Get the modal
    const modal = page.locator('.modal');
    await expect(modal).toBeVisible();
    
    console.log('Modal is visible');
    
    // Get modal dimensions
    const modalBox = await modal.boundingBox();
    console.log('Modal dimensions:', modalBox);
    
    // Get the scrollable content area
    const scrollableArea = page.locator('.modal-content');
    await expect(scrollableArea).toBeVisible();
    
    console.log('Scrollable area is visible');
    
    // Get scrollable area dimensions
    const scrollableBox = await scrollableArea.boundingBox();
    console.log('Scrollable area dimensions:', scrollableBox);
    
    // Get content dimensions
    const contentBox = await scrollableArea.locator('.modal-inner').boundingBox();
    console.log('Content dimensions:', contentBox);
    
    // Check if content overflows
    const isOverflowing = contentBox && scrollableBox && contentBox.height > scrollableBox.height;
    console.log('Is content overflowing:', isOverflowing);
    
    if (isOverflowing) {
      console.log('Content overflows - testing scroll...');
      
      // Get initial scroll position
      const initialScrollTop = await scrollableArea.evaluate((el) => el.scrollTop);
      console.log('Initial scroll position:', initialScrollTop);
      
      // Scroll to bottom
      await scrollableArea.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      
      await page.waitForTimeout(500);
      
      // Check final scroll position
      const finalScrollTop = await scrollableArea.evaluate((el) => el.scrollTop);
      console.log('Final scroll position:', finalScrollTop);
      console.log('Scroll height:', await scrollableArea.evaluate((el) => el.scrollHeight));
      
      // Check if scroll actually worked
      const scrollWorked = finalScrollTop > initialScrollTop;
      console.log('Scroll worked:', scrollWorked);
      
      if (scrollWorked) {
        console.log('✅ Modal scrolling is working!');
        
        // Test scrolling back to top
        await scrollableArea.evaluate((el) => {
          el.scrollTop = 0;
        });
        
        await page.waitForTimeout(500);
        
        const backToTopScroll = await scrollableArea.evaluate((el) => el.scrollTop);
        console.log('Back to top scroll position:', backToTopScroll);
        
        if (backToTopScroll === 0) {
          console.log('✅ Scrolling back to top works!');
        } else {
          console.log('❌ Scrolling back to top failed');
        }
        
      } else {
        console.log('❌ Modal scroll is not working properly');
      }
      
    } else {
      console.log('Content fits in modal - no scrolling needed');
      console.log('This is normal behavior when content is small');
    }
    
    // Get CSS properties for debugging
    const scrollableStyles = await scrollableArea.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el);
      return {
        height: computedStyle.height,
        maxHeight: computedStyle.maxHeight,
        overflow: computedStyle.overflow,
        overflowY: computedStyle.overflowY,
        flex: computedStyle.flex,
        flexGrow: computedStyle.flexGrow,
        flexShrink: computedStyle.flexShrink,
        minHeight: computedStyle.minHeight,
        position: computedStyle.position,
        display: computedStyle.display
      };
    });
    
    console.log('Scrollable area CSS properties:', scrollableStyles);
    
    // Take a screenshot
    await page.screenshot({ path: 'modal-css-analysis.png' });
  });
});
