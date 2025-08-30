import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testIgnore: [
    // Ignore agentic plan tests (feature removed)
    '**/plan_*.spec.ts',
    /plan_.*\.spec\.ts$/,
    // Ignore Jest test files
    '**/unit/**',
    '**/integration/**',
    '**/*.test.ts',
    '**/*.test.tsx',
  ],
  // Increase global timeout for development
  timeout: 60000,
  // Add retry logic for flaky tests
  retries: process.env.CI ? 2 : 1,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000', // Frontend is running on 3000
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Increase action timeout for slow operations
    actionTimeout: 30000,
    // Increase navigation timeout
    navigationTimeout: 30000,
  },
  // Auto-start only the Next.js dev server for e2e; backend is expected to be running externally (e.g., venv)
  // Temporarily disabled for manual testing
  // webServer: {
  //   command: 'npm run dev',
  //   url: process.env.BASE_URL || 'http://localhost:3001', // Updated to use port 3001
  //   reuseExistingServer: true,
  //   timeout: 120_000,
  //   env: {
  //     ...process.env,
  //     // Ensure full UI for E2E
  //     NEXT_PUBLIC_MINIMAL_CHAT: 'false',
  //     // Disable agentic plan preview UI
  //     NEXT_PUBLIC_FEATURE_PLAN_PREVIEW: 'false',
  //     NEXT_PUBLIC_FEATURE_TIMELINE: 'true',
  //     BASE_URL: process.env.BASE_URL || 'http://localhost:3001', // Updated to use port 3001
  //     // Force IPv4 loopback for backend API calls made from Playwright helpers
  //     API_BASE: process.env.API_BASE || 'http://127.0.0.1:8000/api/v1',
  //   },
  // },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Add global setup to ensure servers are ready
  // Temporarily disabled for manual testing
  // globalSetup: require.resolve('./tests/helpers/global-setup.ts'),
});
