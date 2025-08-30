import { useCallback } from 'react';

// Utility functions for chat functionality
export const useChatUtilities = () => {
  const normalizeUtcToLocal = useCallback((ts: string | number | Date): Date => {
    return new Date(ts);
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, []);

  return {
    normalizeUtcToLocal,
    copyToClipboard,
  };
};
