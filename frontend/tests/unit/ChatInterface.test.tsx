import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatInterface from '@/components/chat/ChatInterface';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

// Mock the dependencies
jest.mock('@/contexts/AuthContext');
jest.mock('@/lib/api');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockApi = api as jest.Mocked<typeof api>;

describe('ChatInterface', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    full_name: 'Test User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      loading: false,
    } as any);

    mockApi.post.mockResolvedValue({
      reply: 'Test response',
      used_memory: true,
      conversation_id: 'conv-1',
    });
  });

  it('renders welcome message for authenticated user', () => {
    render(<ChatInterface />);
    
    expect(screen.getByText(/hello test@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/i'm your ai life management companion/i)).toBeInTheDocument();
  });

  it('shows suggestion buttons', () => {
    render(<ChatInterface />);
    
    expect(screen.getByText(/help me plan my week/i)).toBeInTheDocument();
    expect(screen.getByText(/suggest a daily routine/i)).toBeInTheDocument();
    expect(screen.getByText(/i have an appointment to schedule/i)).toBeInTheDocument();
    expect(screen.getByText(/i'm feeling stressed about work/i)).toBeInTheDocument();
  });

  it('renders chat input and send button', () => {
    render(<ChatInterface />);
    
    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('sends message when form is submitted', async () => {
    render(<ChatInterface />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Hello, how are you?' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/onboarding-chat/chat', {
        message: 'Hello, how are you?',
      });
    });
  });

  it('sends message when Enter key is pressed', async () => {
    render(<ChatInterface />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    
    fireEvent.change(input, { target: { value: 'Hello, how are you?' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/onboarding-chat/chat', {
        message: 'Hello, how are you?',
      });
    });
  });

  it('displays user message in chat', async () => {
    render(<ChatInterface />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Hello, how are you?' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    });
  });

  it('displays AI response in chat', async () => {
    render(<ChatInterface />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Hello, how are you?' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test response')).toBeInTheDocument();
    });
  });

  it('shows loading state while sending message', async () => {
    mockApi.post.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
      reply: 'Test response',
      used_memory: true,
      conversation_id: 'conv-1',
    }), 100)));
    
    render(<ChatInterface />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Hello, how are you?' } });
    fireEvent.click(sendButton);
    
    expect(screen.getByText(/sending/i)).toBeInTheDocument();
    expect(sendButton).toBeDisabled();
  });

  it('clears input after sending message', async () => {
    render(<ChatInterface />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Hello, how are you?' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('does not send empty messages', () => {
    render(<ChatInterface />);
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);
    
    expect(mockApi.post).not.toHaveBeenCalled();
  });

  it('does not send messages with only whitespace', () => {
    render(<ChatInterface />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(sendButton);
    
    expect(mockApi.post).not.toHaveBeenCalled();
  });

  it('handles suggestion button clicks', async () => {
    render(<ChatInterface />);
    
    const suggestionButton = screen.getByText(/help me plan my week/i);
    fireEvent.click(suggestionButton);
    
    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/onboarding-chat/chat', {
        message: 'Help me plan my week',
      });
    });
  });

  it('shows error message when API call fails', async () => {
    mockApi.post.mockRejectedValue(new Error('API Error'));
    
    render(<ChatInterface />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Hello, how are you?' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText(/error sending message/i)).toBeInTheDocument();
    });
  });

  it('disables send button when input is empty', () => {
    render(<ChatInterface />);
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when input has content', () => {
    render(<ChatInterface />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Hello' } });
    expect(sendButton).not.toBeDisabled();
  });

  it('shows memory usage indicator when memory is used', async () => {
    render(<ChatInterface />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'What time do I wake up?' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText(/memory used/i)).toBeInTheDocument();
    });
  });

  it('does not show memory usage indicator when memory is not used', async () => {
    mockApi.post.mockResolvedValue({
      reply: 'Test response',
      used_memory: false,
      conversation_id: 'conv-1',
    });
    
    render(<ChatInterface />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.queryByText(/memory used/i)).not.toBeInTheDocument();
    });
  });
});
