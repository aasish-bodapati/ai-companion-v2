/**
 * Accessibility utilities for React Native
 */

import { Platform } from 'react-native';

export interface AccessibilityConfig {
  role?: string;
  label?: string;
  hint?: string;
  state?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
    expanded?: boolean;
  };
  value?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
  actions?: string[];
}

/**
 * Accessibility utilities
 */
export const accessibilityUtils = {
  /**
   * Create accessibility props for buttons
   */
  button: (label: string, hint?: string, disabled = false): AccessibilityConfig => ({
    role: 'button',
    label,
    hint,
    state: { disabled },
  }),

  /**
   * Create accessibility props for text inputs
   */
  textInput: (label: string, hint?: string, value?: string): AccessibilityConfig => ({
    role: 'text',
    label,
    hint,
    value: value ? { text: value } : undefined,
  }),

  /**
   * Create accessibility props for images
   */
  image: (label: string, hint?: string): AccessibilityConfig => ({
    role: 'image',
    label,
    hint,
  }),

  /**
   * Create accessibility props for progress bars
   */
  progressBar: (label: string, value: number, max = 100): AccessibilityConfig => ({
    role: 'progressbar',
    label,
    value: { min: 0, max, now: value, text: `${Math.round(value)}%` },
  }),

  /**
   * Create accessibility props for switches/toggles
   */
  switch: (label: string, checked: boolean, hint?: string): AccessibilityConfig => ({
    role: 'switch',
    label,
    hint,
    state: { checked },
  }),

  /**
   * Create accessibility props for checkboxes
   */
  checkbox: (label: string, checked: boolean, hint?: string): AccessibilityConfig => ({
    role: 'checkbox',
    label,
    hint,
    state: { checked },
  }),

  /**
   * Create accessibility props for radio buttons
   */
  radio: (label: string, selected: boolean, hint?: string): AccessibilityConfig => ({
    role: 'radio',
    label,
    hint,
    state: { selected },
  }),

  /**
   * Create accessibility props for headers
   */
  header: (level: 1 | 2 | 3 | 4 | 5 | 6, text: string): AccessibilityConfig => ({
    role: `header${level}`,
    label: text,
  }),

  /**
   * Create accessibility props for lists
   */
  list: (label: string, itemCount: number): AccessibilityConfig => ({
    role: 'list',
    label,
    hint: `${itemCount} items`,
  }),

  /**
   * Create accessibility props for list items
   */
  listItem: (label: string, position: number, total: number, hint?: string): AccessibilityConfig => ({
    role: 'listitem',
    label,
    hint: hint ? `${hint}, ${position} of ${total}` : `${position} of ${total}`,
  }),

  /**
   * Create accessibility props for links
   */
  link: (label: string, url?: string, hint?: string): AccessibilityConfig => ({
    role: 'link',
    label,
    hint: hint || (url ? `Opens ${url}` : undefined),
  }),

  /**
   * Create accessibility props for tabs
   */
  tab: (label: string, selected: boolean, hint?: string): AccessibilityConfig => ({
    role: 'tab',
    label,
    hint,
    state: { selected },
  }),

  /**
   * Create accessibility props for tab panels
   */
  tabPanel: (label: string, selected: boolean): AccessibilityConfig => ({
    role: 'tabpanel',
    label,
    state: { selected },
  }),

  /**
   * Create accessibility props for menus
   */
  menu: (label: string, itemCount: number): AccessibilityConfig => ({
    role: 'menu',
    label,
    hint: `${itemCount} menu items`,
  }),

  /**
   * Create accessibility props for menu items
   */
  menuItem: (label: string, hint?: string): AccessibilityConfig => ({
    role: 'menuitem',
    label,
    hint,
  }),

  /**
   * Create accessibility props for dialogs/modals
   */
  dialog: (label: string, hint?: string): AccessibilityConfig => ({
    role: 'dialog',
    label,
    hint,
  }),

  /**
   * Create accessibility props for alerts
   */
  alert: (label: string, hint?: string): AccessibilityConfig => ({
    role: 'alert',
    label,
    hint,
  }),

  /**
   * Create accessibility props for status messages
   */
  status: (label: string, hint?: string): AccessibilityConfig => ({
    role: 'status',
    label,
    hint,
  }),

  /**
   * Create accessibility props for live regions
   */
  liveRegion: (label: string, polite = false): AccessibilityConfig => ({
    role: polite ? 'polite' : 'assertive',
    label,
  }),

  /**
   * Create accessibility props for sliders
   */
  slider: (label: string, value: number, min = 0, max = 100, hint?: string): AccessibilityConfig => ({
    role: 'slider',
    label,
    hint,
    value: { min, max, now: value, text: `${value}` },
  }),

  /**
   * Create accessibility props for search fields
   */
  search: (label: string, hint?: string, value?: string): AccessibilityConfig => ({
    role: 'search',
    label,
    hint: hint || 'Search',
    value: value ? { text: value } : undefined,
  }),

  /**
   * Create accessibility props for form fields
   */
  formField: (label: string, required = false, hint?: string, error?: string): AccessibilityConfig => ({
    role: 'text',
    label: required ? `${label} (required)` : label,
    hint: error ? `${hint || ''} Error: ${error}` : hint,
    state: { disabled: false },
  }),

  /**
   * Create accessibility props for cards
   */
  card: (label: string, hint?: string, interactive = false): AccessibilityConfig => ({
    role: interactive ? 'button' : 'article',
    label,
    hint,
  }),

  /**
   * Create accessibility props for badges
   */
  badge: (label: string, value?: string | number): AccessibilityConfig => ({
    role: 'text',
    label: value ? `${label}: ${value}` : label,
  }),

  /**
   * Create accessibility props for loading states
   */
  loading: (label: string, hint?: string): AccessibilityConfig => ({
    role: 'progressbar',
    label,
    hint: hint || 'Loading content',
  }),

  /**
   * Create accessibility props for empty states
   */
  emptyState: (label: string, hint?: string): AccessibilityConfig => ({
    role: 'text',
    label,
    hint: hint || 'No content available',
  }),
};

/**
 * Screen reader utilities
 */
export const screenReaderUtils = {
  /**
   * Check if screen reader is enabled
   */
  isEnabled: (): boolean => {
    // This would typically use a library like react-native-accessibility-info
    // For now, return false as a placeholder
    return false;
  },

  /**
   * Announce text to screen reader
   */
  announce: (text: string, priority: 'polite' | 'assertive' = 'polite') => {
    // This would typically use a library like react-native-accessibility-info
    // For now, just log in development
    if (__DEV__) {
      console.log(`[Screen Reader ${priority.toUpperCase()}]: ${text}`);
    }
  },

  /**
   * Set focus to element
   */
  setFocus: (ref: { focus?: () => void }) => {
    if (ref && ref.focus) {
      ref.focus();
    }
  },
};

/**
 * Keyboard navigation utilities
 */
export const keyboardNavigationUtils = {
  /**
   * Get next focusable element
   */
  getNextFocusable: (currentIndex: number, totalElements: number): number => {
    return (currentIndex + 1) % totalElements;
  },

  /**
   * Get previous focusable element
   */
  getPreviousFocusable: (currentIndex: number, totalElements: number): number => {
    return currentIndex === 0 ? totalElements - 1 : currentIndex - 1;
  },

  /**
   * Handle keyboard navigation
   */
  handleKeyPress: (
    key: string,
    currentIndex: number,
    totalElements: number,
    onFocusChange: (index: number) => void
  ) => {
    switch (key) {
      case 'ArrowDown':
      case 'ArrowRight':
        onFocusChange(keyboardNavigationUtils.getNextFocusable(currentIndex, totalElements));
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        onFocusChange(keyboardNavigationUtils.getPreviousFocusable(currentIndex, totalElements));
        break;
      case 'Home':
        onFocusChange(0);
        break;
      case 'End':
        onFocusChange(totalElements - 1);
        break;
    }
  },
};

/**
 * Color contrast utilities
 */
export const colorContrastUtils = {
  /**
   * Calculate relative luminance
   */
  getLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  /**
   * Calculate contrast ratio
   */
  getContrastRatio: (color1: string, color2: string): number => {
    // This is a simplified implementation
    // In a real app, you'd parse the color strings and calculate properly
    return 4.5; // Placeholder
  },

  /**
   * Check if color combination meets WCAG standards
   */
  meetsWCAG: (color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
    const ratio = colorContrastUtils.getContrastRatio(color1, color2);
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
  },
};

/**
 * Platform-specific accessibility features
 */
export const platformAccessibility = {
  /**
   * Get platform-specific accessibility props
   */
  getPlatformProps: (baseProps: AccessibilityConfig): AccessibilityConfig => {
    if (Platform.OS === 'ios') {
      return {
        ...baseProps,
        accessibilityTraits: baseProps.role,
        accessibilityLabel: baseProps.label,
        accessibilityHint: baseProps.hint,
        accessibilityState: baseProps.state,
        accessibilityValue: baseProps.value,
      };
    } else {
      return {
        ...baseProps,
        accessibilityRole: baseProps.role,
        accessibilityLabel: baseProps.label,
        accessibilityHint: baseProps.hint,
        accessibilityState: baseProps.state,
        accessibilityValue: baseProps.value,
      };
    }
  },
};

export default accessibilityUtils;
