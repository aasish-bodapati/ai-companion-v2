// Utility functions and presets for Pagination component

import { PaginationSize, PaginationVariant, PaginationAlignment } from './Pagination';

export const paginationPresets = {
  // Small pagination
  small: {
    size: 'small' as PaginationSize,
    variant: 'default' as PaginationVariant,
    alignment: 'center' as PaginationAlignment,
    showInfo: true,
    showFirstLast: false,
    showPrevNext: true,
    maxVisiblePages: 3,
  },

  // Medium pagination
  medium: {
    size: 'medium' as PaginationSize,
    variant: 'default' as PaginationVariant,
    alignment: 'center' as PaginationAlignment,
    showInfo: true,
    showFirstLast: true,
    showPrevNext: true,
    maxVisiblePages: 5,
  },

  // Large pagination
  large: {
    size: 'large' as PaginationSize,
    variant: 'default' as PaginationVariant,
    alignment: 'center' as PaginationAlignment,
    showInfo: true,
    showFirstLast: true,
    showPrevNext: true,
    maxVisiblePages: 7,
  },

  // Minimal pagination
  minimal: {
    size: 'medium' as PaginationSize,
    variant: 'minimal' as PaginationVariant,
    alignment: 'center' as PaginationAlignment,
    showInfo: false,
    showFirstLast: false,
    showPrevNext: true,
    maxVisiblePages: 5,
  },

  // Bordered pagination
  bordered: {
    size: 'medium' as PaginationSize,
    variant: 'bordered' as PaginationVariant,
    alignment: 'center' as PaginationAlignment,
    showInfo: true,
    showFirstLast: true,
    showPrevNext: true,
    maxVisiblePages: 5,
  },

  // Dots pagination
  dots: {
    size: 'small' as PaginationSize,
    variant: 'dots' as PaginationVariant,
    alignment: 'center' as PaginationAlignment,
    showInfo: false,
    showFirstLast: false,
    showPrevNext: false,
    maxVisiblePages: 5,
  },
};

// Common pagination configurations
export const paginationConfigs = {
  // Mobile pagination
  mobile: {
    ...paginationPresets.small,
    showFirstLast: false,
    maxVisiblePages: 3,
  },

  // Tablet pagination
  tablet: {
    ...paginationPresets.medium,
    maxVisiblePages: 5,
  },

  // Desktop pagination
  desktop: {
    ...paginationPresets.large,
    maxVisiblePages: 7,
  },

  // Modal pagination
  modal: {
    ...paginationPresets.minimal,
    showInfo: true,
    maxVisiblePages: 3,
  },

  // Card pagination
  card: {
    ...paginationPresets.small,
    showInfo: false,
    showFirstLast: false,
    maxVisiblePages: 3,
  },

  // Data table pagination
  dataTable: {
    ...paginationPresets.medium,
    alignment: 'space-between' as PaginationAlignment,
    showInfo: true,
    maxVisiblePages: 5,
  },

  // Gallery pagination
  gallery: {
    ...paginationPresets.dots,
    showInfo: false,
    maxVisiblePages: 5,
  },

  // Search results pagination
  searchResults: {
    ...paginationPresets.medium,
    alignment: 'center' as PaginationAlignment,
    showInfo: true,
    maxVisiblePages: 5,
  },

  // Settings pagination
  settings: {
    ...paginationPresets.minimal,
    showInfo: true,
    maxVisiblePages: 5,
  },
};

// Helper function to get pagination configuration
export const getPaginationConfig = (type: keyof typeof paginationConfigs) => {
  return paginationConfigs[type];
};

// Helper function to create custom pagination configuration
export const createPaginationConfig = (
  baseType: keyof typeof paginationPresets,
  overrides: Partial<typeof paginationPresets[keyof typeof paginationPresets]> = {}
) => {
  return {
    ...paginationPresets[baseType],
    ...overrides,
  };
};

// Pagination utilities
export const paginationUtils = {
  // Get appropriate size based on context
  getSizeForContext: (context: 'mobile' | 'tablet' | 'desktop' | 'modal' | 'card') => {
    const sizeMap: Record<string, PaginationSize> = {
      'mobile': 'small',
      'tablet': 'medium',
      'desktop': 'large',
      'modal': 'small',
      'card': 'small',
    };

    return sizeMap[context] || 'medium';
  },

  // Get appropriate variant based on design system
  getVariantForDesign: (design: 'minimal' | 'material' | 'ios' | 'custom') => {
    const variantMap: Record<string, PaginationVariant> = {
      'minimal': 'minimal',
      'material': 'bordered',
      'ios': 'default',
      'custom': 'dots',
    };

    return variantMap[design] || 'default';
  },

  // Calculate visible page numbers
  calculateVisiblePages: (
    currentPage: number,
    totalPages: number,
    maxVisiblePages: number = 5
  ): number[] => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  },

  // Check if ellipsis should be shown
  shouldShowEllipsis: (
    currentPage: number,
    totalPages: number,
    maxVisiblePages: number
  ): { start: boolean; end: boolean } => {
    if (totalPages <= maxVisiblePages) {
      return { start: false, end: false };
    }

    const half = Math.floor(maxVisiblePages / 2);
    const start = Math.max(1, currentPage - half);
    const end = Math.min(totalPages, start + maxVisiblePages - 1);

    return {
      start: start > 1,
      end: end < totalPages,
    };
  },

  // Get page range info
  getPageRangeInfo: (
    currentPage: number,
    pageSize: number,
    totalItems: number
  ) => {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);
    
    return {
      startItem,
      endItem,
      totalItems,
      hasItems: totalItems > 0,
      isEmpty: totalItems === 0,
    };
  },

  // Generate page info text
  generatePageInfoText: (
    currentPage: number,
    totalPages: number,
    totalItems?: number,
    pageSize?: number
  ): string => {
    if (totalItems && pageSize) {
      const startItem = (currentPage - 1) * pageSize + 1;
      const endItem = Math.min(currentPage * pageSize, totalItems);
      return `Showing ${startItem}-${endItem} of ${totalItems} items`;
    }
    
    return `Page ${currentPage} of ${totalPages}`;
  },

  // Validate pagination props
  validatePaginationProps: (props: any) => {
    const errors: string[] = [];

    if (props.currentPage < 1) {
      errors.push('Current page must be greater than 0');
    }

    if (props.totalPages < 1) {
      errors.push('Total pages must be greater than 0');
    }

    if (props.currentPage > props.totalPages) {
      errors.push('Current page cannot be greater than total pages');
    }

    if (props.maxVisiblePages && props.maxVisiblePages < 1) {
      errors.push('Max visible pages must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // Get navigation button states
  getNavigationStates: (currentPage: number, totalPages: number) => {
    return {
      canGoFirst: currentPage > 1,
      canGoPrevious: currentPage > 1,
      canGoNext: currentPage < totalPages,
      canGoLast: currentPage < totalPages,
      isFirstPage: currentPage === 1,
      isLastPage: currentPage === totalPages,
    };
  },

  // Calculate optimal page size
  calculateOptimalPageSize: (
    totalItems: number,
    context: 'mobile' | 'tablet' | 'desktop' = 'mobile'
  ): number => {
    const pageSizeMap = {
      mobile: 10,
      tablet: 20,
      desktop: 50,
    };

    const basePageSize = pageSizeMap[context];
    const maxPageSize = Math.min(basePageSize * 2, totalItems);
    
    return Math.max(5, Math.min(basePageSize, maxPageSize));
  },

  // Generate page jump options
  generatePageJumpOptions: (
    currentPage: number,
    totalPages: number,
    maxOptions: number = 10
  ): number[] => {
    if (totalPages <= maxOptions) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const options = new Set<number>();
    
    // Always include first and last pages
    options.add(1);
    options.add(totalPages);
    
    // Add current page and surrounding pages
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      options.add(i);
    }
    
    // Add some random pages if we have space
    const remaining = maxOptions - options.size;
    if (remaining > 0) {
      const availablePages = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(page => !options.has(page));
      
      const randomPages = availablePages
        .sort(() => Math.random() - 0.5)
        .slice(0, remaining);
      
      randomPages.forEach(page => options.add(page));
    }
    
    return Array.from(options).sort((a, b) => a - b);
  },
};

// Common pagination text configurations
export const paginationTexts = {
  // English
  en: {
    first: 'First',
    last: 'Last',
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    of: 'of',
    items: 'items',
    showing: 'Showing',
    to: 'to',
  },

  // Spanish
  es: {
    first: 'Primero',
    last: 'Último',
    previous: 'Anterior',
    next: 'Siguiente',
    page: 'Página',
    of: 'de',
    items: 'elementos',
    showing: 'Mostrando',
    to: 'a',
  },

  // French
  fr: {
    first: 'Premier',
    last: 'Dernier',
    previous: 'Précédent',
    next: 'Suivant',
    page: 'Page',
    of: 'de',
    items: 'éléments',
    showing: 'Affichage',
    to: 'à',
  },
};

// Pagination animations
export const paginationAnimations = {
  // Button press animation
  press: {
    scale: 0.95,
    duration: 100,
  },

  // Page change animation
  pageChange: {
    opacity: 0.7,
    duration: 200,
  },

  // Info text animation
  infoUpdate: {
    opacity: 0.8,
    duration: 150,
  },

  // Navigation button animation
  navigation: {
    scale: 0.9,
    duration: 120,
  },
};

// Pagination colors
export const paginationColors = {
  primary: '#6366f1',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  muted: '#9ca3af',
  disabled: '#d1d5db',
  active: '#6366f1',
  inactive: '#9ca3af',
};
