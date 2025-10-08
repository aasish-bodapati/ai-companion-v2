/**
 * Duplicate style constants to replace hardcoded values
 * These match existing hardcoded values exactly to avoid breaking changes
 */

export const DUPLICATE_STYLES = {
  // Background colors (found 89+ times)
  BACKGROUND_F8FAFC: '#f8fafc',
  BACKGROUND_WHITE: '#ffffff',
  BACKGROUND_GRAY: '#f3f4f6',
  
  // Border radius (found 94+ times)
  BORDER_RADIUS_16: 16,
  BORDER_RADIUS_12: 12,
  BORDER_RADIUS_8: 8,
  
  // Padding (found 58+ times)
  PADDING_HORIZONTAL_20: 20,
  PADDING_HORIZONTAL_16: 16,
  PADDING_VERTICAL_16: 16,
  
  // Font sizes (found 110+ times)
  FONT_SIZE_18: 18,
  FONT_SIZE_16: 16,
  FONT_SIZE_14: 14,
  FONT_SIZE_12: 12,
  
  // Common color combinations
  COLORS: {
    PRIMARY: '#3b82f6',
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
    TEXT_PRIMARY: '#1f2937',
    TEXT_SECONDARY: '#6b7280',
  },
  
  // Common style combinations
  CARD_STYLE: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  
  SCREEN_STYLE: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  SECTION_TITLE_STYLE: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1f2937',
  },
  
  BUTTON_STYLE: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  
  INPUT_STYLE: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
};

// Helper function to safely replace hardcoded values
export const replaceHardcodedStyle = (oldStyle: Record<string, unknown>, newStyle: Record<string, unknown>) => {
  // Return new style, but keep old as fallback
  return { ...oldStyle, ...newStyle };
};

// Helper function to get common style combinations
export const getCommonStyle = (styleName: keyof typeof DUPLICATE_STYLES) => {
  return DUPLICATE_STYLES[styleName];
};
