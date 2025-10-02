import { useState, useCallback, useMemo } from 'react';
import { LoggingItemData } from '../components/ui/LoggingItem';
import { BaseLog, BaseLogCreate } from '../types/BaseLog';

/**
 * Custom hook for logging modal functionality
 * Reduces code duplication across logging modals
 */
export function useLoggingModal<T extends BaseLog, S>(
  options: {
    initialData?: any;
    onSave: (data: any) => Promise<void>;
    onClose: () => void;
    searchService: {
      search: (query: string) => Promise<S[]>;
      create: (data: any) => Promise<any>;
    };
    transformSearchResult: (item: S) => LoggingItemData;
    getFormData: (items: LoggingItemData[]) => any;
    validateForm: (items: LoggingItemData[]) => boolean;
  }
) {
  const {
    initialData,
    onSave,
    onClose,
    searchService,
    transformSearchResult,
    getFormData,
    validateForm,
  } = options;

  const [items, setItems] = useState<LoggingItemData[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<S[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | undefined>();

  // Reset modal state
  const resetModal = useCallback(() => {
    setItems([]);
    setSaving(false);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setSearchError(undefined);
  }, []);

  // Add item to the list
  const addItem = useCallback((item: LoggingItemData) => {
    setItems(prev => [...prev, item]);
  }, []);

  // Remove item from the list
  const removeItem = useCallback((id: number | string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  // Update item in the list
  const updateItem = useCallback((id: number | string, updates: Partial<LoggingItemData>) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchError(undefined);

    try {
      const results = await searchService.search(query);
      setSearchResults(results);
    } catch (error: any) {
      setSearchError(error.message || 'Search failed');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchService]);

  // Handle item selection from search
  const handleSelectItem = useCallback((item: S) => {
    const transformedItem = transformSearchResult(item);
    addItem(transformedItem);
    setSearchQuery('');
    setSearchResults([]);
  }, [transformSearchResult, addItem]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(undefined);
  }, []);

  // Validate form
  const isFormValid = useCallback(() => {
    return validateForm(items);
  }, [validateForm, items]);

  // Get form data
  const getFormDataForSave = useCallback(() => {
    return getFormData(items);
  }, [getFormData, items]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!isFormValid()) {
      return;
    }

    setSaving(true);
    try {
      const formData = getFormDataForSave();
      await onSave(formData);
      resetModal();
    } catch (error) {
      console.error('Error saving:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [isFormValid, getFormDataForSave, onSave, resetModal]);

  // Handle close
  const handleClose = useCallback(() => {
    resetModal();
    onClose();
  }, [resetModal, onClose]);

  // Computed values
  const hasItems = useMemo(() => items.length > 0, [items.length]);
  const canSave = useMemo(() => isFormValid() && !saving, [isFormValid, saving]);
  const hasSearchResults = useMemo(() => searchResults.length > 0, [searchResults.length]);
  const isSearchEmpty = useMemo(() => 
    searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && !searchError
  , [searchQuery.length, isSearching, searchResults.length, searchError]);

  return {
    // State
    items,
    saving,
    searchQuery,
    searchResults,
    isSearching,
    searchError,
    
    // Actions
    addItem,
    removeItem,
    updateItem,
    handleSearch,
    handleSelectItem,
    clearSearch,
    handleSave,
    handleClose,
    resetModal,
    
    // Computed values
    hasItems,
    canSave,
    hasSearchResults,
    isSearchEmpty,
    isFormValid,
    getFormData: getFormDataForSave,
  };
}
