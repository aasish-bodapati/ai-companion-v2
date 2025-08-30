import { Page, expect, APIRequestContext, BrowserContext } from '@playwright/test';

export const testUser = {
  email: `test_${Date.now()}@example.com`,
  password: 'testpassword123',
  fullName: 'Test User'
};

export function unique(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Obtain a JWT by registering (if needed) and logging in via backend API
export async function getJwt(request: APIRequestContext): Promise<string> {
  const email = `e2e_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`;
  const password = 'testpassword123';
  const full_name = 'E2E Test';

  // Try public registration; ignore if already exists or disabled
  try {
    const regRes = await request.post('http://localhost:8000/api/v1/register', {
      data: { email, password, full_name },
    });
    // Accept 201 Created; ignore 400 when already exists
    if (!(regRes.status() === 201 || regRes.status() === 400)) {
      // Non-fatal; continue to login anyway
    }
  } catch (_) {
    // Continue; some environments may have registration disabled
  }

  // Login to obtain access token (OAuth2 password flow form-encoded)
  const form = new URLSearchParams({
    username: email,
    password,
    grant_type: 'password',
    scope: '',
    client_id: '',
    client_secret: '',
  });
  const loginRes = await request.post('http://localhost:8000/api/v1/login/access-token', {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: form.toString(),
  });
  if (loginRes.status() !== 200) {
    throw new Error(`Login failed with status ${loginRes.status()}: ${await loginRes.text()}`);
  }
  const body = await loginRes.json();
  const token = (body && body.access_token) as string | undefined;
  if (!token) throw new Error('No access_token in login response');
  return token;
}

// Initialize JWT in browser localStorage for new pages in this context
export async function initTokenInLocalStorage(context: BrowserContext, token: string): Promise<void> {
  await context.addInitScript(({ t }) => {
    try { localStorage.setItem('token', t); } catch {}
  }, { t: token });
}

// Ensure onboarding is completed for the test user so chat is accessible
export async function completeOnboarding(request: APIRequestContext, token: string): Promise<void> {
  const auth = { Authorization: `Bearer ${token}` } as const;
  // Upsert minimal profile (all fields optional)
  try {
    await request.put('http://localhost:8000/api/v1/users/me/onboarding', {
      headers: { ...auth, 'Content-Type': 'application/json' },
      data: {},
    });
  } catch (_) {
    // ignore
  }
  // Mark as completed
  try {
    await request.post('http://localhost:8000/api/v1/users/me/onboarding/complete', {
      headers: { ...auth },
    });
  } catch (_) {
    // ignore
  }
}

// Waits for ChatArea to be usable by ensuring loading placeholders are gone, then textarea is visible
export async function waitForChatReady(page: Page, timeoutMs = 30_000) {
  // Best-effort hide loading states if present
  try { await expect(page.getByText('Loading conversations...', { exact: false })).toBeHidden({ timeout: timeoutMs }); } catch {}
  try { await expect(page.getByText('Loading messages...', { exact: false })).toBeHidden({ timeout: timeoutMs }); } catch {}
  try { await expect(page.getByText('Loading your companion…', { exact: false })).toBeHidden({ timeout: timeoutMs }); } catch {}
  try { await expect(page.getByText('Creating conversation…', { exact: false })).toBeHidden({ timeout: timeoutMs }); } catch {}
  
  // Finally, wait for the input
  // EnhancedChatInterface uses an <input data-testid="message-input"> field
  const input = page.getByTestId('message-input');
  await expect(input).toBeVisible({ timeout: timeoutMs });
  return input;
}

export async function waitForPersistedAssistant(page: Page, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    // Abort early if page got closed (e.g., due to prior failure)
    if ((page as any).isClosed && (page as any).isClosed()) {
      throw new Error('Page closed while waiting for persisted assistant message');
    }
    // Nudge viewport to latest messages in case content is out of view
    try { await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); } catch {}
    // EnhancedChatInterface renders assistant bubbles with data-testid="assistant-response"
    const lastAssistant = page.getByTestId('assistant-response').last();
    const count = await page.getByTestId('assistant-response').count().catch(() => 0);
    if (count > 0 && await lastAssistant.isVisible().catch(() => false)) return;
    await new Promise(r => setTimeout(r, 300));
  }
  expect(false, 'Expected a persisted assistant message to appear').toBeTruthy();
}

export async function countAssistantIndicators(page: Page) {
  const used = await page.getByRole('button', { name: /Used\s+\d+\s+memories/i }).count();
  return used;
}

// New utility to handle the companion page redirect flow
export async function navigateToChat(page: Page, baseURL: string) {
  // Navigate to companion page which will redirect to chat
  await page.goto(`${baseURL}/companion`);
  
  // Wait for redirect to chat page
  await page.waitForURL(/.*\/chat\/[^\/]+/, { timeout: 30000 });
  
  // Wait for chat interface to be ready
  await waitForChatReady(page);
}

// New utility to register and login a test user
export async function registerAndLogin(page: Page, baseURL: string, user = testUser) {
  // Register new user
  await page.goto(`${baseURL}/register`);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.fill('input[name="name"]', user.fullName);
  await page.fill('input[name="confirm-password"]', user.password);
  await page.check('input[name="terms"]');
  await page.click('button[type="submit"]');
  
  // Wait for redirect after registration/auto-login
  await page.waitForURL(/.*onboarding|.*chat|.*today/, { timeout: 10000 });
  
  // If redirected to onboarding, complete it quickly
  if (page.url().includes('/onboarding')) {
    // Quick onboarding completion for tests
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*chat|.*today/, { timeout: 10000 });
  }
  
  // Navigate to chat
  await navigateToChat(page, baseURL);
}

// New utility to wait for servers to be ready
export async function waitForServers(baseURL: string) {
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
      
      return true;
    } catch (error) {
      console.log(`Attempt ${i + 1}: Servers not ready, retrying...`);
      
      if (i === maxAttempts - 1) {
        throw new Error('Servers failed to start within timeout');
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// New utility to handle test cleanup
export async function cleanupTestUser(page: Page, baseURL: string, user = testUser) {
  try {
    // Navigate to settings or logout
    await page.goto(`${baseURL}/logout`);
  } catch (error) {
    // Ignore cleanup errors
    console.log('Cleanup error (ignored):', error);
  }
}
