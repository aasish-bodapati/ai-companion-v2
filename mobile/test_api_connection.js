/**
 * Test script to verify mobile app API connection to backend
 * Run with: node test_api_connection.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:8000';
const API_BASE_URL = `${API_URL}/api/v1`;

async function testAPIConnection() {
  console.log('🧪 Testing Mobile App API Connection...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check endpoint...');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log(`   ✅ Health check: ${healthResponse.status} - ${JSON.stringify(healthResponse.data)}`);

    // Test 2: API version check
    console.log('\n2. Testing API version endpoint...');
    const rootResponse = await axios.get(`${API_URL}/`);
    console.log(`   ✅ Root endpoint: ${rootResponse.status} - ${JSON.stringify(rootResponse.data)}`);

    // Test 3: Dashboard endpoint (should require auth)
    console.log('\n3. Testing dashboard endpoint (should require auth)...');
    try {
      const dashboardResponse = await axios.get(`${API_BASE_URL}/health/dashboard/summary`);
      console.log(`   ⚠️  Dashboard (no auth): ${dashboardResponse.status} - Unexpected success!`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(`   ✅ Dashboard (no auth): ${error.response.status} - Correctly requires authentication`);
      } else {
        console.log(`   ❌ Dashboard (no auth): Unexpected error - ${error.message}`);
      }
    }

    // Test 4: Test user registration
    console.log('\n4. Testing user registration...');
    try {
      const testUser = {
        email: 'test@example.com',
        password: 'testpassword123',
        full_name: 'Test User'
      };
      
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
      console.log(`   ✅ User registration: ${registerResponse.status} - User created successfully`);
      
      // Test 5: Test user login
      console.log('\n5. Testing user login...');
      const loginData = {
        username: testUser.email,
        password: testUser.password
      };
      
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login/access-token`, loginData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      if (loginResponse.data.access_token) {
        console.log(`   ✅ User login: ${loginResponse.status} - Token received`);
        
        // Test 6: Test dashboard with authentication
        console.log('\n6. Testing dashboard with authentication...');
        const token = loginResponse.data.access_token;
        const authHeaders = { Authorization: `Bearer ${token}` };
        
        const dashboardAuthResponse = await axios.get(`${API_BASE_URL}/health/dashboard/summary`, {
          headers: authHeaders
        });
        
        console.log(`   ✅ Dashboard (with auth): ${dashboardAuthResponse.status} - Data received`);
        console.log(`   📊 Dashboard data preview:`, JSON.stringify(dashboardAuthResponse.data, null, 2).substring(0, 200) + '...');
        
      } else {
        console.log(`   ❌ User login: No access token received`);
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`   ❌ Registration/Login error: ${error.response.status} - ${error.response.data.detail || error.response.data.message || 'Unknown error'}`);
      } else {
        console.log(`   ❌ Registration/Login error: ${error.message}`);
      }
    }

    console.log('\n🎉 API connection test completed!');
    console.log('\n📱 Mobile app should be able to connect to the backend successfully.');
    console.log('   Make sure to update the API_URL in mobile/app.config.js if needed.');

  } catch (error) {
    console.error('\n❌ API connection test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the backend is running: cd backend && uvicorn app.main:app --reload');
    console.log('   2. Check if the API URL is correct in mobile/app.config.js');
    console.log('   3. Verify the backend is accessible from your mobile device/emulator');
  }
}

// Run the test
testAPIConnection();
