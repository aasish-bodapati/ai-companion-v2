import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EnhancedChatInterface } from '@/components/chat/EnhancedChatInterface';

// Mocks
jest.mock('@/features/memory/api', () => ({
  createMemory: jest.fn(),
}));

jest.mock('@/features/conversations/api', () => ({
  useMessages: () => ({
    data: [
      {
        id: 'a1',
        content: 'Assistant reply to remember',
        role: 'assistant',
        created_at: new Date().toISOString(),
      },
    ],
  }),
}));

jest.mock('@/features/conversations/hooks/useSendMessage', () => ({
  useSendMessage: () => ({ mutateStream: jest.fn(), isPending: false }),
}));

jest.mock('@/components/Toast', () => ({
  Toast: () => null,
  useToast: () => ({ toast: null, show: jest.fn(), hide: jest.fn() }),
}));

jest.mock('@/hooks/useRateLimit', () => ({
  useRateLimit: () => ({ rateLimitInfo: { remaining: 10, limit: 100, reset: Date.now() / 1000 } }),
}));

jest.mock('@/features/utils/api', () => ({
  getLLMLatencyLatest: jest.fn().mockResolvedValue({ first_token_ms: 100, llm_total_ms: 500 }),
}));

jest.mock('@/features/conversations/hooks/useContextTracker', () => ({
  useContextTracker: () => ({ trackContent: jest.fn(), isContentRepeated: () => false }),
}));

describe('EnhancedChatInterface - Remember This', () => {
  it('calls createMemory with assistant message and shows saving state', async () => {
    const { createMemory } = jest.requireMock('@/features/memory/api');
    (createMemory as jest.Mock).mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ id: 'm1' }), 10)));

    render(<EnhancedChatInterface conversationId="conv-1" />);

    const btn = await screen.findByTestId('remember-this-button');
    expect(btn).toBeInTheDocument();

    // Click to save memory
    fireEvent.click(btn);

    // Button shows Saving… while pending
    await waitFor(() => expect(btn).toBeDisabled());

    // Verify API called with payload
    await waitFor(() => {
      expect(createMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Assistant reply to remember',
          content_type: 'message',
          conversation_id: 'conv-1',
          source: 'chat:remember',
        })
      );
    });

    // Eventually re-enabled
    await waitFor(() => expect(btn).not.toBeDisabled());
  });
});
