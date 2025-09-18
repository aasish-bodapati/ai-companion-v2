import { test, expect } from '@playwright/test';

test.describe('Simple API Test', () => {
  test('Test workout logging with direct fetch', async ({ page }) => {
    console.log('🚀 Starting simple API test');

    // Navigate to fitness page
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');

    // Wait for authentication
    await page.waitForTimeout(3000);

    // Test the API call using direct fetch
    const result = await page.evaluate(async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('🔐 Token:', token ? `${token.substring(0, 20)}...` : 'No token');

        if (!token) {
          return { success: false, error: 'No token found' };
        }

        const workoutData = {
          activity_type: 'weightlifting',
          activity_name: 'Bench Press',
          duration_minutes: 30,
          intensity: 'moderate',
          reps: 8,
          sets: 4,
          notes: 'E2E test workout',
          activity_date: new Date().toISOString(),
          use_smart_defaults: true
        };

        console.log('🏋️ Making direct fetch request with data:', workoutData);

        const response = await fetch('http://localhost:8000/api/v1/health/contextual-logging/workout/smart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(workoutData)
        });

        console.log('🌐 Response status:', response.status);
        console.log('🌐 Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Response data:', data);
          return {
            success: true,
            status: response.status,
            data: data
          };
        } else {
          const errorText = await response.text();
          console.log('❌ Error response:', errorText);
          return {
            success: false,
            status: response.status,
            error: errorText
          };
        }
      } catch (error) {
        console.error('❌ Fetch error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    });

    console.log('🔍 API test result:', result);

    if (result.success) {
      console.log('✅ API call successful!');
      expect(result.status).toBe(200);
      expect(result.data.success).toBe(true);
    } else {
      console.log('❌ API call failed:', result.error);
      console.log('❌ Status:', result.status);
      
      // This will help us understand what's going wrong
      expect(result.success).toBe(true);
    }
  });

  test('Test authentication with direct fetch', async ({ page }) => {
    console.log('🔐 Testing authentication with direct fetch');

    // Navigate to fitness page
    await page.goto('http://localhost:3000/fitness');
    await page.waitForLoadState('networkidle');

    // Wait for authentication
    await page.waitForTimeout(3000);

    // Test authentication with a simple API call
    const authTest = await page.evaluate(async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('🔐 Token:', token ? `${token.substring(0, 20)}...` : 'No token');

        if (!token) {
          return { success: false, error: 'No token found' };
        }

        console.log('🔐 Testing with onboarding status endpoint');

        const response = await fetch('http://localhost:8000/api/v1/health/onboarding/status', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('🔐 Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Auth test successful:', data);
          return {
            success: true,
            status: response.status,
            data: data
          };
        } else {
          const errorText = await response.text();
          console.log('❌ Auth test failed:', errorText);
          return {
            success: false,
            status: response.status,
            error: errorText
          };
        }
      } catch (error) {
        console.error('❌ Auth test error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    });

    console.log('🔐 Auth test result:', authTest);

    if (authTest.success) {
      console.log('✅ Authentication working correctly');
      expect(authTest.status).toBe(200);
    } else {
      console.log('❌ Authentication failed:', authTest.error);
      expect(authTest.success).toBe(true);
    }
  });
});
