/**
 * Style Migration Utilities
 * Automated tools for replacing hardcoded values with theme constants
 */

import { ViewStyle, TextStyle } from 'react-native';

import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from './constants';
import { STYLE_PRESETS, mapHardcodedValue, replaceHardcodedValues } from './duplicateStyles';

// ============================================================================
// MIGRATION PATTERNS
// ============================================================================

export const MIGRATION_PATTERNS = {
  // Common hardcoded background colors
  BACKGROUND_COLORS: {
    '#ffffff': 'COLORS.background.primary',
    '#f8fafc': 'COLORS.background.secondary',
    '#f3f4f6': 'COLORS.background.tertiary',
    '#e5e7eb': 'COLORS.gray[200]',
    '#d1d5db': 'COLORS.gray[300]',
    '#3b82f6': 'COLORS.primary.main',
    '#10b981': 'COLORS.success',
    '#f59e0b': 'COLORS.warning',
    '#ef4444': 'COLORS.danger',
  },

  // Common hardcoded border radius
  BORDER_RADIUS: {
    '50': 'BORDER_RADIUS.round',
    '20': 'BORDER_RADIUS.xxl',
    '16': 'BORDER_RADIUS.lg',
    '12': 'BORDER_RADIUS.md',
    '8': 'BORDER_RADIUS.sm',
    '4': 'BORDER_RADIUS.xs',
  },

  // Common hardcoded padding
  PADDING: {
    '24': 'SPACING.xl',
    '20': 'SPACING.lg',
    '16': 'SPACING.md',
    '12': 'SPACING.sm',
    '8': 'SPACING.xs',
    '4': 'SPACING.xxs',
  },

  // Common hardcoded font sizes
  FONT_SIZES: {
    '28': 'FONT_SIZE.xxxxl',
    '20': 'FONT_SIZE.xxl',
    '18': 'FONT_SIZE.xl',
    '16': 'FONT_SIZE.lg',
    '14': 'FONT_SIZE.md',
    '12': 'FONT_SIZE.sm',
    '10': 'FONT_SIZE.xs',
  },

  // Common hardcoded text colors
  TEXT_COLORS: {
    '#1f2937': 'COLORS.text.primary',
    '#6b7280': 'COLORS.text.secondary',
    '#9ca3af': 'COLORS.text.tertiary',
    '#ffffff': 'COLORS.text.inverse',
  },
};

// ============================================================================
// COMPONENT-SPECIFIC MIGRATION HELPERS
// ============================================================================

export const COMPONENT_MIGRATIONS = {
  // Card components
  card: (style: ViewStyle) => ({
    ...STYLE_PRESETS.card,
    ...style,
  }),

  cardSmall: (style: ViewStyle) => ({
    ...STYLE_PRESETS.cardSmall,
    ...style,
  }),

  cardLarge: (style: ViewStyle) => ({
    ...STYLE_PRESETS.cardLarge,
    ...style,
  }),

  // Button components
  buttonPrimary: (style: ViewStyle) => ({
    ...STYLE_PRESETS.buttonPrimary,
    ...style,
  }),

  buttonSecondary: (style: ViewStyle) => ({
    ...STYLE_PRESETS.buttonSecondary,
    ...style,
  }),

  // Input components
  input: (style: ViewStyle) => ({
    ...STYLE_PRESETS.input,
    ...style,
  }),

  // Text components
  textTitle: (style: TextStyle) => ({
    ...STYLE_PRESETS.textTitle,
    ...style,
  }),

  textHeading: (style: TextStyle) => ({
    ...STYLE_PRESETS.textHeading,
    ...style,
  }),

  textBody: (style: TextStyle) => ({
    ...STYLE_PRESETS.textBody,
    ...style,
  }),

  // Layout components
  row: (style: ViewStyle) => ({
    ...STYLE_PRESETS.row,
    ...style,
  }),

  rowSpaceBetween: (style: ViewStyle) => ({
    ...STYLE_PRESETS.rowSpaceBetween,
    ...style,
  }),

  centerContent: (style: ViewStyle) => ({
    ...STYLE_PRESETS.centerContent,
    ...style,
  }),

  // Modal components
  modalOverlay: (style: ViewStyle) => ({
    ...STYLE_PRESETS.modalOverlay,
    ...style,
  }),

  modalContent: (style: ViewStyle) => ({
    ...STYLE_PRESETS.modalContent,
    ...style,
  }),
};

// ============================================================================
// AUTOMATED MIGRATION FUNCTIONS
// ============================================================================

/**
 * Migrate a style object to use theme constants
 */
export const migrateStyle = (style: Record<string, any>): Record<string, any> => {
  return replaceHardcodedValues(style);
};

/**
 * Migrate a StyleSheet.create call to use presets
 */
export const migrateStyleSheet = (styles: Record<string, any>): Record<string, any> => {
  const migratedStyles: Record<string, any> = {};

  Object.keys(styles).forEach(key => {
    migratedStyles[key] = migrateStyle(styles[key]);
  });

  return migratedStyles;
};

/**
 * Get the best preset for a given style object
 */
export const getBestPreset = (style: ViewStyle | TextStyle): string | null => {
  // Check for exact matches with presets
  const styleString = JSON.stringify(style);

  for (const [presetName, presetStyle] of Object.entries(STYLE_PRESETS)) {
    if (JSON.stringify(presetStyle) === styleString) {
      return presetName;
    }
  }

  // Check for partial matches
  for (const [presetName, presetStyle] of Object.entries(STYLE_PRESETS)) {
    const matchCount = Object.keys(style).filter(key =>
      style[key] === presetStyle[key]
    ).length;

    const totalKeys = Math.max(Object.keys(style).length, Object.keys(presetStyle).length);
    const matchRatio = matchCount / totalKeys;

    if (matchRatio > 0.7) { // 70% match threshold
      return presetName;
    }
  }

  return null;
};

/**
 * Generate migration suggestions for a component
 */
export const generateMigrationSuggestions = (componentName: string, styles: Record<string, any>) => {
  const suggestions: string[] = [];

  Object.keys(styles).forEach(styleName => {
    const style = styles[styleName];
    const bestPreset = getBestPreset(style);

    if (bestPreset) {
      suggestions.push(
        `// Replace ${styleName} with preset:\n` +
        `// ${styleName}: STYLE_PRESETS.${bestPreset}`
      );
    } else {
      // Check for individual hardcoded values
      const hardcodedValues = findHardcodedValues(style);
      if (hardcodedValues.length > 0) {
        suggestions.push(
          `// ${styleName} has hardcoded values: ${hardcodedValues.join(', ')}`
        );
      }
    }
  });

  return suggestions;
};

/**
 * Find hardcoded values in a style object
 */
export const findHardcodedValues = (style: Record<string, any>): string[] => {
  const hardcoded: string[] = [];

  Object.entries(style).forEach(([key, value]) => {
    if (typeof value === 'string' && value.startsWith('#')) {
      hardcoded.push(`${key}: ${value}`);
    } else if (typeof value === 'number' && [4, 8, 12, 16, 20, 24, 50].includes(value)) {
      hardcoded.push(`${key}: ${value}`);
    }
  });

  return hardcoded;
};

// ============================================================================
// MIGRATION VALIDATION
// ============================================================================

/**
 * Validate that a migrated style is equivalent to the original
 */
export const validateMigration = (
  original: Record<string, any>,
  migrated: Record<string, any>
): { isValid: boolean; differences: string[] } => {
  const differences: string[] = [];

  // Check if all original properties are preserved
  Object.keys(original).forEach(key => {
    if (migrated[key] !== original[key]) {
      differences.push(`${key}: ${original[key]} -> ${migrated[key]}`);
    }
  });

  // Check if any new properties were added
  Object.keys(migrated).forEach(key => {
    if (!(key in original)) {
      differences.push(`Added: ${key}: ${migrated[key]}`);
    }
  });

  return {
    isValid: differences.length === 0,
    differences,
  };
};

// ============================================================================
// BULK MIGRATION HELPERS
// ============================================================================

/**
 * Get all files that need style migration
 */
export const getFilesNeedingMigration = (): string[] => {
  // This would typically scan the filesystem
  // For now, return common component directories
  return [
    'mobile/src/components/ui',
    'mobile/src/components/dashboard',
    'mobile/src/components/fitness',
    'mobile/src/components/nutrition',
    'mobile/src/components/profile',
    'mobile/src/components/onboarding',
  ];
};

/**
 * Generate a migration report for a file
 */
export const generateMigrationReport = (filePath: string, styles: Record<string, any>) => {
  const report = {
    filePath,
    totalStyles: Object.keys(styles).length,
    hardcodedValues: 0,
    suggestedPresets: 0,
    migrationSuggestions: [] as string[],
  };

  Object.entries(styles).forEach(([styleName, style]) => {
    const hardcoded = findHardcodedValues(style);
    if (hardcoded.length > 0) {
      report.hardcodedValues += hardcoded.length;
    }

    const bestPreset = getBestPreset(style);
    if (bestPreset) {
      report.suggestedPresets++;
      report.migrationSuggestions.push(
        `${styleName} -> STYLE_PRESETS.${bestPreset}`
      );
    }
  });

  return report;
};

export default {
  MIGRATION_PATTERNS,
  COMPONENT_MIGRATIONS,
  migrateStyle,
  migrateStyleSheet,
  getBestPreset,
  generateMigrationSuggestions,
  findHardcodedValues,
  validateMigration,
  getFilesNeedingMigration,
  generateMigrationReport,
};
