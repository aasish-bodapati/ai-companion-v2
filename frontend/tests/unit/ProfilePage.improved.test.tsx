import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ProfilePage from '../../src/app/profile/page';

// ✅ GOOD: Only mock external dependencies, not internal services
jest.mock('../../src/lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// ✅ GOOD: Use real auth context with test data
import { AuthProvider } from '../../src/contexts/AuthContext';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  const testUser = {
    id: '1',
    email: 'test@example.com',
    full_name: 'Test User'
  };
  
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialUser={testUser}>
        <MemoryRouter>
          {component}
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('ProfilePage - Improved', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders profile page with real auth context', async () => {
    renderWithProviders(<ProfilePage />);
    
    // Test actual rendered content, not mocked content
    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getByText('Manage your account and preferences')).toBeInTheDocument();
  });

  it('displays user information from real auth context', async () => {
    renderWithProviders(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const { get } = require('../../src/lib/api');
    get.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<ProfilePage />);
    
    // Test error handling, not just happy path
    await waitFor(() => {
      // Should show error state or fallback content
      expect(screen.getByText(/error|failed|unavailable/i)).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching data', () => {
    const { get } = require('../../src/lib/api');
    get.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<ProfilePage />);
    
    // Test loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
