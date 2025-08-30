import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SimplifiedMemoryView from '@/components/memories/SimplifiedMemoryView';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));

jest.mock('@/features/conversations/api/deduplication', () => ({
  consolidateMemories: jest.fn(),
  getDeduplicationMetrics: jest.fn().mockResolvedValue({
    total_memories: 10,
    duplicate_count: 1,
    consolidation_opportunities: 2,
    storage_efficiency: 0.85,
  }),
}));

jest.mock('@/features/memory/api', () => ({
  listMyMemories: jest.fn().mockResolvedValue([
    {
      id: 'm1',
      content: 'foo',
      content_type: 'message',
      user_id: 'u1',
      timestamp: new Date().toISOString(),
      importance_score: 75,
      memory_metadata: { source: 'chat:remember' },
    },
  ]),
}));

jest.mock('@/features/utils/api', () => ({
  getRetrievalSummary: jest.fn().mockResolvedValue({
    window_hours: 1,
    metrics: {},
    rollups: {
      avg_retrieval_ms: 42.3,
      avg_mmr_ms: 12.5,
      avg_selected: 5,
      avg_diversity: 0.67,
    },
  }),
}));

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue([]), // used by daily learnings helper
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('SimplifiedMemoryView - Retrieval Summary', () => {
  it('renders retrieval summary stats from utils API', async () => {
    render(<SimplifiedMemoryView />);

    await waitFor(() => {
      expect(screen.getByText(/Memory Center/)).toBeInTheDocument();
    });

    // Summary cards
    expect(screen.getByText(/Retrieval Health/)).toBeInTheDocument();
    expect(screen.getByText(/Avg Retrieval/)).toBeInTheDocument();
    expect(screen.getByText(/Avg MMR/)).toBeInTheDocument();
    expect(screen.getByText(/Avg Selected/)).toBeInTheDocument();
    expect(screen.getByText(/Avg Diversity/)).toBeInTheDocument();
  });
});
