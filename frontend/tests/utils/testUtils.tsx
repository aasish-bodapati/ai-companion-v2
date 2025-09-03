import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../src/contexts/AuthContext';

// ✅ GOOD: Centralized test utilities for consistent testing
export interface TestUser {
  id: string;
  email: string;
  full_name: string;
}

export interface TestRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialUser?: TestUser;
  initialEntries?: string[];
}

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

export const renderWithProviders = (
  ui: React.ReactElement,
  options: TestRenderOptions = {}
) => {
  const {
    initialUser = {
      id: '1',
      email: 'test@example.com',
      full_name: 'Test User'
    },
    initialEntries = ['/'],
    ...renderOptions
  } = options;

  const queryClient = createTestQueryClient();

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialUser={initialUser} testMode={true}>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// ✅ GOOD: Mock API utilities for consistent API mocking
export const mockApiResponse = (data: any, delay = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ data }), delay);
  });
};

export const mockApiError = (message = 'API Error', delay = 0) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), delay);
  });
};

// ✅ GOOD: Test data factories for consistent test data
export const createTestUser = (overrides: Partial<TestUser> = {}): TestUser => ({
  id: '1',
  email: 'test@example.com',
  full_name: 'Test User',
  ...overrides,
});

export const createTestMemory = (overrides: any = {}) => ({
  id: '1',
  content: 'Test memory content',
  content_type: 'fact',
  created_at: '2024-01-01T00:00:00Z',
  importance_score: 75,
  ...overrides,
});

export const createTestMemories = (count: number) => {
  return Array.from({ length: count }, (_, i) => 
    createTestMemory({
      id: `${i + 1}`,
      content: `Test memory content ${i + 1}`,
    })
  );
};
