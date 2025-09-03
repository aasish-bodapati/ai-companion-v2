import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip } from 'lucide-react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (rememberNow?: boolean) => void;
  disabled?: boolean;
  onAttachment?: () => void;
}

export function MessageInput({ 
  value, 
  onChange, 
  onSend, 
  disabled = false,
  onAttachment 
}: MessageInputProps) {
  const [rememberNow, setRememberNow] = useState(false);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSend(rememberNow);
      setRememberNow(false);
    }
  }, [value, disabled, onSend, rememberNow]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  return (
    <div className="border-t bg-background p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={disabled}
              className="min-h-[60px] max-h-[120px] resize-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            {onAttachment && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAttachment}
                disabled={disabled}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={!value.trim() || disabled}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberNow}
              onChange={(e) => setRememberNow(e.target.checked)}
              className="rounded"
            />
            Remember this conversation
          </label>
        </div>
      </form>
    </div>
  );
}
