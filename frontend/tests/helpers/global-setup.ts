import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000';
  
  console.log('🔧 Global setup: Checking server readiness...');
  
  // Wait for servers to be ready
  const maxAttempts = 30;
  const delay = 1000;
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      // Check backend health
      const backendResponse = await fetch('http://localhost:8000/health');
      if (!backendResponse.ok) {
        throw new Error(`Backend health check failed: ${backendResponse.status}`);
      }
      
      // Check frontend
      const frontendResponse = await fetch(baseURL);
      if (!frontendResponse.ok) {
        throw new Error(`Frontend health check failed: ${frontendResponse.status}`);
      }
      
      console.log('✅ Servers are ready!');
      return;
    } catch (error) {
      console.log(`⏳ Attempt ${i + 1}/${maxAttempts}: Servers not ready, retrying... (${error})`);
      
      if (i === maxAttempts - 1) {
        console.error('❌ Servers failed to start within timeout');
        throw new Error('Servers failed to start within timeout');
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export default globalSetup;
