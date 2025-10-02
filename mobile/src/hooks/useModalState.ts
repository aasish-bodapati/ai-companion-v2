import { useState, useCallback } from 'react';

/**
 * Hook for managing modal visibility and loading states
 * Provides a clean API for showing/hiding modals with loading states
 */
export const useModalState = (initialVisible = false) => {
  const [visible, setVisible] = useState(initialVisible);
  const [loading, setLoading] = useState(false);

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);
  const toggle = useCallback(() => setVisible(prev => !prev), []);

  const showWithLoading = useCallback(() => {
    setVisible(true);
    setLoading(true);
  }, []);

  const hideWithLoading = useCallback(() => {
    setLoading(false);
    setVisible(false);
  }, []);

  const setLoadingState = useCallback((isLoading: boolean) => {
    setLoading(isLoading);
  }, []);

  return {
    visible,
    loading,
    setLoading,
    show,
    hide,
    toggle,
    showWithLoading,
    hideWithLoading,
    setLoadingState,
  };
};

export default useModalState;
