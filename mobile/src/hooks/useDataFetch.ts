import { useState, useEffect, useCallback, useRef } from 'react';


export interface UseDataFetchOptions<T> {
  // Data fetching
  fetchFn: () => Promise<T>;
  dependencies?: any[];
  enabled?: boolean;

  // Caching
  cacheKey?: string;
  cacheTime?: number; // in milliseconds
  staleTime?: number; // in milliseconds

  // Error handling
  retryCount?: number;
  retryDelay?: number;

  // Callbacks
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onSettled?: (data: T | null, error: Error | null) => void;
}

export interface UseDataFetchReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isStale: boolean;
  isError: boolean;
  isSuccess: boolean;
  isIdle: boolean;
}

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number; staleTime: number }>();

export function useDataFetch<T>({
  fetchFn,
  dependencies = [],
  enabled = true,
  cacheKey,
  cacheTime = 5 * 60 * 1000, // 5 minutes
  staleTime = 1 * 60 * 1000, // 1 minute
  retryCount = 3,
  retryDelay = 1000,
  onSuccess,
  onError,
  onSettled,
}: UseDataFetchOptions<T>): UseDataFetchReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);

  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if data is stale
  const checkStaleness = useCallback((cachedData: { data: any; timestamp: number; staleTime: number }) => {
    const now = Date.now();
    const isStale = now - cachedData.timestamp > cachedData.staleTime;
    setIsStale(isStale);
    return isStale;
  }, []);

  // Get cached data
  const getCachedData = useCallback((key: string) => {
    if (!cacheKey) return null;

    const cached = cache.get(key);
    if (!cached) return null;

    // Check if cache is expired
    const now = Date.now();
    if (now - cached.timestamp > cacheTime) {
      cache.delete(key);
      return null;
    }

    // Check if data is stale
    checkStaleness(cached);

    return cached.data;
  }, [cacheKey, cacheTime, checkStaleness]);

  // Set cached data
  const setCachedData = useCallback((key: string, data: T) => {
    if (!cacheKey) return;

    cache.set(key, {
      data,
      timestamp: Date.now(),
      staleTime,
    });
  }, [cacheKey, staleTime]);

  // Fetch data with retry logic
  const fetchData = useCallback(async (isRetry = false) => {
    if (!enabled) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      // Check cache first
      if (cacheKey && !isRetry) {
        const cachedData = getCachedData(cacheKey);
        if (cachedData && !isStale) {
          setData(cachedData);
          setLoading(false);
          onSuccess?.(cachedData);
          onSettled?.(cachedData, null);
          return;
        }
      }

      // Fetch new data
      const result = await fetchFn();

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setData(result);
      setIsStale(false);
      retryCountRef.current = 0;

      // Cache the result
      if (cacheKey) {
        setCachedData(cacheKey, result);
      }

      onSuccess?.(result);
      onSettled?.(result, null);

    } catch (err) {
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);

      // Retry logic
      if (retryCountRef.current < retryCount) {
        retryCountRef.current++;
        setTimeout(() => {
          fetchData(true);
        }, retryDelay * retryCountRef.current);
        return;
      }

      onError?.(error);
      onSettled?.(null, error);

    } finally {
      setLoading(false);
    }
  }, [
    enabled,
    fetchFn,
    cacheKey,
    isStale,
    getCachedData,
    setCachedData,
    retryCount,
    retryDelay,
    onSuccess,
    onError,
    onSettled,
  ]);

  // Refetch function
  const refetch = useCallback(async () => {
    retryCountRef.current = 0;
    await fetchData(true);
  }, [fetchData]);

  // Effect to fetch data when dependencies change
  useEffect(() => {
    fetchData();

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, ...dependencies]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    isStale,
    isError: !!error,
    isSuccess: !!data && !error,
    isIdle: !loading && !data && !error,
  };
}

// Specialized hooks for common patterns
export function useAsyncData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
) {
  return useDataFetch({
    fetchFn,
    dependencies,
    enabled: true,
  });
}

export function useCachedData<T>(
  fetchFn: () => Promise<T>,
  cacheKey: string,
  dependencies: any[] = []
) {
  return useDataFetch({
    fetchFn,
    dependencies,
    enabled: true,
    cacheKey,
    cacheTime: 5 * 60 * 1000, // 5 minutes
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function usePollingData<T>(
  fetchFn: () => Promise<T>,
  interval: number = 30000, // 30 seconds
  dependencies: any[] = []
) {
  const [isPolling, setIsPolling] = useState(true);

  const result = useDataFetch({
    fetchFn,
    dependencies,
    enabled: isPolling,
    cacheKey: undefined, // No caching for polling
  });

  // Set up polling
  useEffect(() => {
    if (!isPolling) return;

    const timer = setInterval(() => {
      result.refetch();
    }, interval);

    return () => clearInterval(timer);
  }, [isPolling, interval, result.refetch]);

  return {
    ...result,
    isPolling,
    startPolling: () => setIsPolling(true),
    stopPolling: () => setIsPolling(false),
  };
}

export function useLazyData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [shouldFetch, setShouldFetch] = useState(false);

  const result = useDataFetch({
    fetchFn,
    dependencies,
    enabled: shouldFetch,
  });

  const trigger = useCallback(() => {
    setShouldFetch(true);
  }, []);

  return {
    ...result,
    trigger,
  };
}
