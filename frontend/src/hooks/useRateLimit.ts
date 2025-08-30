import { useState, useCallback, useEffect } from 'react';

interface RateLimitInfo {
  remaining?: string;
  limit?: string;
  reset?: string;
}

export const useRateLimit = () => {
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo>({});

  const updateRateLimit = useCallback((response: Response) => {
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const limit = response.headers.get('X-RateLimit-Limit');
    const reset = response.headers.get('X-RateLimit-Reset');

    if (remaining || limit || reset) {
      setRateLimitInfo({
        remaining: remaining || undefined,
        limit: limit || undefined,
        reset: reset || undefined,
      });
    }
  }, []);

  const clearRateLimit = useCallback(() => {
    setRateLimitInfo({});
  }, []);

  // Listen for rate limit events from API responses
  useEffect(() => {
    const handleRateLimitUpdate = (event: CustomEvent) => {
      const { remaining, limit, reset } = event.detail;
      if (remaining || limit || reset) {
        setRateLimitInfo({
          remaining: remaining || undefined,
          limit: limit || undefined,
          reset: reset || undefined,
        });
      }
    };

    window.addEventListener('rateLimitUpdate', handleRateLimitUpdate as EventListener);
    
    return () => {
      window.removeEventListener('rateLimitUpdate', handleRateLimitUpdate as EventListener);
    };
  }, []);

  return {
    rateLimitInfo,
    updateRateLimit,
    clearRateLimit,
  };
};
