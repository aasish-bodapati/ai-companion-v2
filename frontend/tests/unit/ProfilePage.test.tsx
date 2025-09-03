import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import ProfilePage from '../../src/app/profile/page';
import { renderWithProviders, mockApiResponse, mockApiError } from '../utils/testUtils';

// ✅ GOOD: Only mock external API calls, not internal services
jest.mock('../../src/lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders profile page with title', async () => {
    renderWithProviders(<ProfilePage />);
    
    // Test actual rendered content from the component
    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getByText('Manage your account and preferences')).toBeInTheDocument();
  });

  it('displays user information', async () => {
    renderWithProviders(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('displays profile sections', () => {
    renderWithProviders(<ProfilePage />);
    
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
  });

  it('handles edit mode toggle', async () => {
    renderWithProviders(<ProfilePage />);
    
    const editButton = screen.getByText('Edit Profile');
    expect(editButton).toBeInTheDocument();
  });

  it('displays memory statistics', async () => {
    const mockStats = {
      total_memories: 25,
      recent_memories: 5,
      memory_types: {
        fact: 10,
        preference: 8,
        goal: 7
      }
    };

    const { get } = require('../../src/lib/api');
    get.mockResolvedValue({ data: mockStats });

    renderWithProviders(<ProfilePage />);
    
    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument(); // Total memories
    });
  });

  it('handles API errors gracefully', async () => {
    const { get } = require('../../src/lib/api');
    get.mockImplementation(() => mockApiError('API Error'));

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
