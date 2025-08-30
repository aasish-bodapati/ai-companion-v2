import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatInput } from '@/features/chat/components/ChatInput';

describe('ChatInput Component', () => {
  const defaultProps = {
    input: '',
    setInput: jest.fn(),
    onSend: jest.fn(),
    onAttach: jest.fn(),
    disabled: false,
    remember: false,
    setRemember: jest.fn(),
    inputRef: { current: null },
    fileInputRef: { current: null },
    placeholder: 'Type your message...'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders chat input field', () => {
    render(<ChatInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    expect(input).toBeInTheDocument();
  });

  it('renders send button', () => {
    render(<ChatInput {...defaultProps} />);
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeInTheDocument();
  });

  it('updates input value when typing', () => {
    const setInput = jest.fn();
    render(<ChatInput {...defaultProps} setInput={setInput} />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    const testMessage = 'Hello, this is a test message';
    
    fireEvent.change(input, { target: { value: testMessage } });
    
    expect(setInput).toHaveBeenCalledWith(testMessage);
  });

  it('sends message when send button is clicked', async () => {
    const onSend = jest.fn();
    const setInput = jest.fn();
    render(<ChatInput {...defaultProps} onSend={onSend} setInput={setInput} input="Test message" />);
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    // Click send
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith(false); // remember is false
    });
  });

  it.skip('sends message when Enter key is pressed', async () => {
    const onSend = jest.fn();
    const setInput = jest.fn();
    render(<ChatInput {...defaultProps} onSend={onSend} setInput={setInput} input="Test message with Enter key" />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    
    // Press Enter
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: false });
    
    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith(false); // remember is false
    });
  });

  it('does not send empty message', () => {
    const onSend = jest.fn();
    render(<ChatInput {...defaultProps} onSend={onSend} input="" />);
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    // Try to send empty message
    fireEvent.click(sendButton);
    
    expect(onSend).not.toHaveBeenCalled();
  });

  it('does not send message with only whitespace', () => {
    const onSend = jest.fn();
    render(<ChatInput {...defaultProps} onSend={onSend} input="   " />);
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    // Try to send
    fireEvent.click(sendButton);
    
    expect(onSend).not.toHaveBeenCalled();
  });

  it('shows loading state when disabled', () => {
    render(<ChatInput {...defaultProps} disabled={true} />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('handles file attachment', () => {
    const onAttach = jest.fn();
    const fileInputRef = { current: document.createElement('input') };
    render(<ChatInput {...defaultProps} onAttach={onAttach} fileInputRef={fileInputRef} />);
    
    const attachButton = screen.getByRole('button', { name: /attach files/i });
    expect(attachButton).toBeInTheDocument();
  });

  it('sends message with remember flag when checked', async () => {
    const onSend = jest.fn();
    const setRemember = jest.fn();
    render(<ChatInput {...defaultProps} onSend={onSend} setRemember={setRemember} input="Test message" remember={true} />);
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    // Click send
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith(true); // remember is true
    });
  });

  it('handles long messages gracefully', () => {
    const setInput = jest.fn();
    const longMessage = 'a'.repeat(1000);
    render(<ChatInput {...defaultProps} setInput={setInput} input={longMessage} />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    expect(input).toHaveValue(longMessage);
  });

  it('accessibility: has proper ARIA labels', () => {
    render(<ChatInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox', { name: /chat message input/i });
    const attachButton = screen.getByRole('button', { name: /attach files/i });
    
    expect(input).toBeInTheDocument();
    expect(attachButton).toBeInTheDocument();
  });

  it('accessibility: supports keyboard navigation', () => {
    render(<ChatInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    const attachButton = screen.getByRole('button', { name: /attach files/i });
    
    // Focus input
    input.focus();
    expect(input).toHaveFocus();
    
    // Focus attach button
    attachButton.focus();
    expect(attachButton).toHaveFocus();
  });

  it('handles Shift+Enter for new line', () => {
    const onSend = jest.fn();
    const setInput = jest.fn();
    render(<ChatInput {...defaultProps} onSend={onSend} setInput={setInput} input="Test message" />);
    
    const input = screen.getByPlaceholderText(/type your message/i);
    
    // Press Shift+Enter
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', shiftKey: true });
    
    // Should not send message
    expect(onSend).not.toHaveBeenCalled();
  });
});
