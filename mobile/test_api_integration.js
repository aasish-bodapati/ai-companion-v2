/**
 * Test script to verify API integration
 * Run this with: node test_api_integration.js
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'test123'
};

const testWorkout = {
  activity_type: 'running',
  activity_name: 'Morning Run',
  duration_minutes: 30,
  intensity: 'medium',
  calories_burned: 300,
  distance_km: 5.0,
  activity_date: new Date().toISOString()
};

const testMeal = {
  meal_type: 'breakfast',
  meal_name: 'Oatmeal with Berries',
  total_calories: 350,
  protein_g: 12,
  carbs_g: 65,
  fat_g: 8,
  food_items: JSON.stringify([
    { name: 'Oatmeal', quantity: '1 cup', calories: 300 },
    { name: 'Blueberries', quantity: '1/2 cup', calories: 50 }
  ]),
  meal_date: new Date().toISOString()
};

async function testAPI() {
  console.log('🧪 Starting API Integration Tests...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);

    // Test 2: Login
    console.log('\n2. Testing login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/login/access-token`, 
      new URLSearchParams({
        username: testUser.email,
        password: testUser.password
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const token = loginResponse.data.access_token;
    console.log('✅ Login successful, token received');

    // Set up authenticated requests
    const authHeaders = { Authorization: `Bearer ${token}` };

    // Test 3: Dashboard Summary
    console.log('\n3. Testing dashboard summary...');
    try {
      const dashboardResponse = await axios.get(`${API_BASE_URL}/health/dashboard/summary`, {
        headers: authHeaders
      });
      console.log('✅ Dashboard summary API working:', {
        today_stats: dashboardResponse.data.today_stats,
        weekly_progress: dashboardResponse.data.weekly_progress,
        streak: dashboardResponse.data.streak
      });
    } catch (error) {
      console.log('⚠️ Dashboard summary API not available, using fallback');
    }

    // Test 4: Quick Stats
    console.log('\n4. Testing quick stats...');
    try {
      const quickStatsResponse = await axios.get(`${API_BASE_URL}/health/dashboard/quick-stats`, {
        headers: authHeaders
      });
      console.log('✅ Quick stats API working:', quickStatsResponse.data);
    } catch (error) {
      console.log('⚠️ Quick stats API not available, using fallback');
    }

    // Test 5: Fitness Logs
    console.log('\n5. Testing fitness logs...');
    try {
      const fitnessResponse = await axios.get(`${API_BASE_URL}/health/logging/fitness`, {
        headers: authHeaders,
        params: { size: 5 }
      });
      console.log('✅ Fitness logs API working, found', fitnessResponse.data.length, 'logs');
    } catch (error) {
      console.log('❌ Fitness logs API failed:', error.response?.data || error.message);
    }

    // Test 6: Nutrition Logs
    console.log('\n6. Testing nutrition logs...');
    try {
      const nutritionResponse = await axios.get(`${API_BASE_URL}/health/logging/nutrition`, {
        headers: authHeaders,
        params: { size: 5 }
      });
      console.log('✅ Nutrition logs API working, found', nutritionResponse.data.length, 'logs');
    } catch (error) {
      console.log('❌ Nutrition logs API failed:', error.response?.data || error.message);
    }

    // Test 7: Log a workout
    console.log('\n7. Testing workout logging...');
    try {
      const workoutResponse = await axios.post(`${API_BASE_URL}/health/logging/fitness`, testWorkout, {
        headers: authHeaders
      });
      console.log('✅ Workout logged successfully:', workoutResponse.data.id);
    } catch (error) {
      console.log('❌ Workout logging failed:', error.response?.data || error.message);
    }

    // Test 8: Log a meal
    console.log('\n8. Testing meal logging...');
    try {
      const mealResponse = await axios.post(`${API_BASE_URL}/health/logging/nutrition`, testMeal, {
        headers: authHeaders
      });
      console.log('✅ Meal logged successfully:', mealResponse.data.id);
    } catch (error) {
      console.log('❌ Meal logging failed:', error.response?.data || error.message);
    }

    console.log('\n🎉 API Integration Tests Complete!');
    console.log('\n📱 Next Steps:');
    console.log('1. Start the mobile app: cd mobile && npm start');
    console.log('2. Check the dashboard for real data');
    console.log('3. Test logging workouts and meals');
    console.log('4. Verify data appears in the app');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the backend is running: cd backend && uvicorn app.main:app --reload');
    console.log('2. Check if the database is accessible');
    console.log('3. Verify the API endpoints are correct');
  }
}

// Run the test
testAPI();
