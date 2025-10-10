import { useState, useCallback, useMemo, useRef } from 'react';
import { SearchState } from '../types/CommonTypes';
import { SearchParams } from '../types/BaseLog';
import { SearchResult } from '../types/BaseLog';

/**
 * Custom hook for search functionality
 * Reduces code duplication across search components
 */
export function useSearch<T>(
  searchFunction: (query: string, params?: SearchParams) => Promise<T[]>,
  options: {
    debounceMs?: number;
    minQueryLength?: number;
    initialQuery?: string;
    searchParams?: SearchParams;
  } = {}
) {
  const {
    debounceMs = 300,
    minQueryLength = 1,
    initialQuery = '',
    searchParams = {},
  } = options;

  const [searchState, setSearchState] = useState<SearchState<T>>({
    query: initialQuery,
    results: [],
    isSearching: false,
    hasSearched: false,
    error: undefined,
  });

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    (query: string) => {
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new timeout
      debounceTimeoutRef.current = setTimeout(async () => {
        if (query.length < minQueryLength) {
          setSearchState(prev => ({
            ...prev,
            query,
            results: [],
            isSearching: false,
            hasSearched: false,
            error: undefined,
          }));
          return;
        }

        // Cancel previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        setSearchState(prev => ({
          ...prev,
          query,
          isSearching: true,
          error: undefined,
        }));

        try {
          const results = await searchFunction(query, {
            ...searchParams,
            signal: abortControllerRef.current.signal,
          } as SearchParams);

          setSearchState(prev => ({
            ...prev,
            results,
            isSearching: false,
            hasSearched: true,
            error: undefined,
          }));
        } catch (error: unknown) {
          if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
            // Request was cancelled, ignore
            return;
          }

          setSearchState(prev => ({
            ...prev,
            results: [],
            isSearching: false,
            hasSearched: true,
            error: error.message || 'Search failed',
          }));
        }
      }, debounceMs);
    },
    [searchFunction, debounceMs, minQueryLength, searchParams]
  );

  // Update search query
  const setQuery = useCallback((query: string) => {
    setSearchState(prev => ({ ...prev, query }));
    debouncedSearch(query);
  }, [debouncedSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    // Clear timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Cancel request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setSearchState({
      query: '',
      results: [],
      isSearching: false,
      hasSearched: false,
      error: undefined,
    });
  }, []);

  // Perform immediate search (without debounce)
  const searchImmediate = useCallback(async (query: string) => {
    if (query.length < minQueryLength) {
      setSearchState(prev => ({
        ...prev,
        query,
        results: [],
        isSearching: false,
        hasSearched: false,
        error: undefined,
      }));
      return [];
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setSearchState(prev => ({
      ...prev,
      query,
      isSearching: true,
      error: undefined,
    }));

    try {
      const results = await searchFunction(query, {
        ...searchParams,
        signal: abortControllerRef.current.signal,
      } as SearchParams);

      setSearchState(prev => ({
        ...prev,
        results,
        isSearching: false,
        hasSearched: true,
        error: undefined,
      }));

      return results;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
        return [];
      }

      const errorMessage = error && typeof error === 'object' && 'message' in error ? 
        (error as Error).message : 'Search failed';
      setSearchState(prev => ({
        ...prev,
        results: [],
        isSearching: false,
        hasSearched: true,
        error: errorMessage,
      }));

      throw error;
    }
  }, [searchFunction, minQueryLength, searchParams]);

  // Update search parameters
  const updateSearchParams = useCallback((newParams: Partial<SearchParams>) => {
    const updatedParams = { ...searchParams, ...newParams };
    
    // If there's a current query, re-search with new params
    if (searchState.query) {
      debouncedSearch(searchState.query);
    }
  }, [searchParams, searchState.query, debouncedSearch]);

  // Get search results as SearchResult format
  const getSearchResults = useCallback((): SearchResult<T> => {
    return {
      items: searchState.results,
      total: searchState.results.length,
      query: searchState.query,
      has_more: false, // This would need to be determined by the search function
    };
  }, [searchState.results, searchState.query]);

  // Check if search is active
  const isSearchActive = useMemo(() => {
    return searchState.isSearching || (searchState.query.length >= minQueryLength && searchState.hasSearched);
  }, [searchState.isSearching, searchState.query.length, searchState.hasSearched, minQueryLength]);

  // Check if search has results
  const hasResults = useMemo(() => {
    return searchState.results.length > 0;
  }, [searchState.results.length]);

  // Check if search is empty
  const isEmpty = useMemo(() => {
    return searchState.hasSearched && searchState.results.length === 0 && !searchState.isSearching;
  }, [searchState.hasSearched, searchState.results.length, searchState.isSearching]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    // Search state
    query: searchState.query,
    results: searchState.results,
    isSearching: searchState.isSearching,
    hasSearched: searchState.hasSearched,
    error: searchState.error,
    
    // Actions
    setQuery,
    clearSearch,
    searchImmediate,
    updateSearchParams,
    
    // Computed values
    getSearchResults,
    isSearchActive,
    hasResults,
    isEmpty,
    
    // Cleanup
    cleanup,
  };
}
