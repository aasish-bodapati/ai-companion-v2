import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { getJwt, initTokenInLocalStorage, completeOnboarding, waitForChatReady } from './helpers/test_utils';

// Shared fixtures for authenticated chat-ready pages
export const test = base.extend<{
  token: string;
  authedPage: Page;
}>({
  token: async ({ request }, use) => {
    const token = await getJwt(request);
    await use(token);
  },
  authedPage: async ({ context, request, token }, use) => {
    // Initialize auth in localStorage and ensure onboarding is complete
    await initTokenInLocalStorage(context, token);
    await completeOnboarding(request, token);

    const page = await context.newPage();
    await page.goto('/companion');
    
    // Wait for redirect to chat page
    await page.waitForURL(/.*\/chat\/[^\/]+/, { timeout: 30000 });
    
    // Now wait for chat to be ready
    await waitForChatReady(page);

    await use(page);

    await page.close();
  },
});

export { expect } from '@playwright/test';
