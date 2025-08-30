import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChatInterface from '@/components/ChatInterface';
import { ChatProvider } from '@/contexts/ChatContext';

// Mock the API service
vi.mock('@/services/api', () => ({
  sendMessage: vi.fn(),
  getConversationHistory: vi.fn(),
}));

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <ChatProvider>
        {children}
      </ChatProvider>
    </QueryClientProvider>
  );
};

describe('Chat Workflow Integration', () => {
  const mockSendMessage = vi.fn();
  const mockGetConversationHistory = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock implementations
    vi.mocked(vi.importMock('@/services/api')).sendMessage.mockResolvedValue({
      id: 'msg-123',
      content: 'AI response to your message',
      role: 'assistant',
      timestamp: new Date().toISOString(),
    });
    
    vi.mocked(vi.importMock('@/services/api')).getConversationHistory.mockResolvedValue([
      {
        id: 'msg-1',
        content: 'Hello, how can I help you?',
        role: 'assistant',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'msg-2',
        content: 'I need help with a problem',
        role: 'user',
        timestamp: new Date().toISOString(),
      },
    ]);
  });

  it('renders chat interface with conversation history', async () => {
    render(
      <TestWrapper>
        <ChatInterface />
      </TestWrapper>
    );

    // Wait for conversation history to load
    await waitFor(() => {
      expect(screen.getByText('Hello, how can I help you?')).toBeInTheDocument();
      expect(screen.getByText('I need help with a problem')).toBeInTheDocument();
    });

    // Verify API was called
    expect(mockGetConversationHistory).toHaveBeenCalled();
  });

  it('sends message and displays response', async () => {
    render(
      <TestWrapper>
        <ChatInterface />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Hello, how can I help you?')).toBeInTheDocument();
    });

    // Find and interact with chat input
    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    // Type and send message
    const userMessage = 'Can you help me solve this issue?';
    fireEvent.change(input, { target: { value: userMessage } });
    fireEvent.click(sendButton);

    // Verify user message appears
    await waitFor(() => {
      expect(screen.getByText(userMessage)).toBeInTheDocument();
    });

    // Verify API call was made
    expect(mockSendMessage).toHaveBeenCalledWith(userMessage);

    // Wait for AI response
    await waitFor(() => {
      expect(screen.getByText('AI response to your message')).toBeInTheDocument();
    });
  });

  it('handles multiple message exchanges', async () => {
    // Mock multiple responses
    let callCount = 0;
    vi.mocked(vi.importMock('@/services/api')).sendMessage.mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        id: `msg-${callCount}`,
        content: `Response ${callCount} to your message`,
        role: 'assistant',
        timestamp: new Date().toISOString(),
      });
    });

    render(
      <TestWrapper>
        <ChatInterface />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Hello, how can I help you?')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    // Send first message
    const message1 = 'First question';
    fireEvent.change(input, { target: { value: message1 } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Response 1 to your message')).toBeInTheDocument();
    });

    // Send second message
    const message2 = 'Follow-up question';
    fireEvent.change(input, { target: { value: message2 } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Response 2 to your message')).toBeInTheDocument();
    });

    // Verify both messages are displayed
    expect(screen.getByText(message1)).toBeInTheDocument();
    expect(screen.getByText(message2)).toBeInTheDocument();
    expect(screen.getByText('Response 1 to your message')).toBeInTheDocument();
    expect(screen.getByText('Response 2 to your message')).toBeInTheDocument();
  });

  it('handles loading states correctly', async () => {
    // Mock slow response
    vi.mocked(vi.importMock('@/services/api')).sendMessage.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        id: 'msg-123',
        content: 'Delayed response',
        role: 'assistant',
        timestamp: new Date().toISOString(),
      }), 100))
    );

    render(
      <TestWrapper>
        <ChatInterface />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Hello, how can I help you?')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    // Send message
    const userMessage = 'Test message';
    fireEvent.change(input, { target: { value: userMessage } });
    fireEvent.click(sendButton);

    // Verify loading state
    await waitFor(() => {
      expect(sendButton).toBeDisabled();
      expect(sendButton).toHaveTextContent(/sending/i);
    });

    // Wait for response
    await waitFor(() => {
      expect(screen.getByText('Delayed response')).toBeInTheDocument();
    });

    // Verify loading state is cleared
    expect(sendButton).not.toBeDisabled();
    expect(sendButton).toHaveTextContent(/send/i);
  });

  it('handles error states gracefully', async () => {
    // Mock API error
    vi.mocked(vi.importMock('@/services/api')).sendMessage.mockRejectedValue(
      new Error('Failed to send message')
    );

    render(
      <TestWrapper>
        <ChatInterface />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Hello, how can I help you?')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    // Send message
    const userMessage = 'Test message';
    fireEvent.change(input, { target: { value: userMessage } });
    fireEvent.click(sendButton);

    // Wait for error
    await waitFor(() => {
      expect(screen.getByText(/failed to send message/i)).toBeInTheDocument();
    });

    // Verify retry button is available
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();

    // Mock successful response for retry
    vi.mocked(vi.importMock('@/services/api')).sendMessage.mockResolvedValue({
      id: 'msg-123',
      content: 'Successful retry response',
      role: 'assistant',
      timestamp: new Date().toISOString(),
    });

    // Click retry
    fireEvent.click(retryButton);

    // Wait for successful response
    await waitFor(() => {
      expect(screen.getByText('Successful retry response')).toBeInTheDocument();
    });
  });

  it('maintains conversation context across interactions', async () => {
    render(
      <TestWrapper>
        <ChatInterface />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Hello, how can I help you?')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    // Send multiple messages
    const messages = [
      'First message',
      'Second message',
      'Third message'
    ];

    for (const message of messages) {
      fireEvent.change(input, { target: { value: message } });
      fireEvent.click(sendButton);

      // Wait for response
      await waitFor(() => {
        expect(screen.getByText(message)).toBeInTheDocument();
      });
    }

    // Verify all messages are still visible
    for (const message of messages) {
      expect(screen.getByText(message)).toBeInTheDocument();
    }

    // Verify conversation order is maintained
    const messageElements = screen.getAllByText(/^(First|Second|Third) message$/);
    expect(messageElements).toHaveLength(3);
  });

  it('handles rapid message sending', async () => {
    render(
      <TestWrapper>
        <ChatInterface />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Hello, how can I help you?')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    // Send multiple messages rapidly
    const messages = ['Message 1', 'Message 2', 'Message 3'];
    
    for (const message of messages) {
      fireEvent.change(input, { target: { value: message } });
      fireEvent.click(sendButton);
    }

    // Verify all messages are sent
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledTimes(3);
    });

    // Verify all messages appear in UI
    for (const message of messages) {
      expect(screen.getByText(message)).toBeInTheDocument();
    }
  });
});

describe('Chat Accessibility Integration', () => {
  it('supports screen reader navigation', async () => {
    render(
      <TestWrapper>
        <ChatInterface />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Hello, how can I help you?')).toBeInTheDocument();
    });

    // Verify proper ARIA labels
    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    expect(input).toHaveAttribute('aria-label', 'Chat message input');
    expect(sendButton).toHaveAttribute('aria-label', 'Send message');

    // Verify conversation has proper structure
    const conversation = screen.getByRole('log');
    expect(conversation).toBeInTheDocument();
  });

  it('announces new messages to screen readers', async () => {
    render(
      <TestWrapper>
        <ChatInterface />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Hello, how can I help you?')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    // Send message
    const userMessage = 'Accessibility test message';
    fireEvent.change(input, { target: { value: userMessage } });
    fireEvent.click(sendButton);

    // Wait for response
    await waitFor(() => {
      expect(screen.getByText('AI response to your message')).toBeInTheDocument();
    });

    // Verify live region announcements
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toBeInTheDocument();
  });
});
