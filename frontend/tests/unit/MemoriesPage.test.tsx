import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import MemoriesPage from '../../src/app/memories/page';
import { renderWithProviders, mockApiResponse, createTestMemories } from '../utils/testUtils';

// ✅ GOOD: Only mock external API calls, not internal services
jest.mock('../../src/lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe('MemoriesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders memories page with title', async () => {
    renderWithProviders(<MemoriesPage />);
    
    // Test actual rendered content from the component
    expect(screen.getByText('My Memories')).toBeInTheDocument();
    expect(screen.getByText('Explore what I remember about you')).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    renderWithProviders(<MemoriesPage />);
    
    expect(screen.getByText('Loading memories...')).toBeInTheDocument();
  });

  it('displays empty state when no memories', async () => {
    const { get } = require('../../src/lib/api');
    get.mockResolvedValue([]);

    renderWithProviders(<MemoriesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('No memories found')).toBeInTheDocument();
    });
  });

  it('displays memories when available', async () => {
    const mockMemories = createTestMemories(2);
    mockMemories[0].content = 'I like to wake up at 7 AM';
    mockMemories[1].content = 'I prefer healthy food';

    const { get } = require('../../src/lib/api');
    get.mockResolvedValue(mockMemories);

    renderWithProviders(<MemoriesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('I like to wake up at 7 AM')).toBeInTheDocument();
      expect(screen.getByText('I prefer healthy food')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    const { get } = require('../../src/lib/api');
    get.mockResolvedValue([]);

    renderWithProviders(<MemoriesPage />);
    
    const searchInput = screen.getByPlaceholderText('Search memories...');
    expect(searchInput).toBeInTheDocument();
  });

  it('handles filter by content type', async () => {
    renderWithProviders(<MemoriesPage />);
    
    const filterSelect = screen.getByRole('combobox');
    expect(filterSelect).toBeInTheDocument();
  });
});
