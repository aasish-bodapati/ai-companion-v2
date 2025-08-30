import React, { KeyboardEvent, useCallback } from 'react';
import { PaperAirplaneIcon, PaperClipIcon } from '@heroicons/react/24/outline';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: (rememberNow?: boolean) => Promise<void>;
  onAttach: (file: File) => Promise<void>;
  disabled: boolean;
  remember: boolean;
  setRemember: (value: boolean) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  placeholder?: string;
}

export function ChatInput({
  input,
  setInput,
  onSend,
  onAttach,
  disabled,
  remember,
  setRemember,
  inputRef,
  fileInputRef,
  placeholder = "Type your message..."
}: ChatInputProps) {
  const handleKeyPress = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && input.trim()) {
        onSend(remember);
      }
    }
  }, [disabled, input, remember, onSend]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => onAttach(file));
    }
    // Reset input to allow selecting the same file again
    e.target.value = '';
  }, [onAttach]);

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  const handleSendClick = useCallback(() => {
    if (!disabled && input.trim()) {
      onSend(remember);
    }
  }, [disabled, input, remember, onSend]);

  return (
    <div className="sticky bottom-0 z-10 border-t border-gray-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75 p-3 md:p-4">
      <div className="flex items-end gap-2">
        {/* File attachment button */}
        <button
          type="button"
          onClick={handleAttachClick}
          disabled={disabled}
          className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 rounded-md hover:bg-gray-50"
          title="Attach file"
          aria-label="Attach files"
        >
          <PaperClipIcon className="h-5 w-5" />
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt,.md,.csv"
        />

        {/* Text input */}
        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 min-h-[40px] max-h-[160px] overflow-y-auto"
            aria-label="Chat message input"
          />
          
          {/* Remember checkbox */}
          <div className="mt-2 flex items-center">
            <input
              type="checkbox"
              id="remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
              Remember this conversation
            </label>
          </div>
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSendClick}
          disabled={disabled || !input.trim()}
          className="flex-shrink-0 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95 transition"
          title="Send message"
          aria-label="Send message"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
