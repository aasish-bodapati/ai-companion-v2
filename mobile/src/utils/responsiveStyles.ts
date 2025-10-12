import { ViewStyle, TextStyle } from 'react-native';

import { useResponsive } from '../hooks/useResponsive';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '../theme/constants';

export interface ResponsiveStyleSheet {
  [key: string]: ViewStyle | TextStyle;
}

export function createResponsiveStyles(
  styleFactory: (responsive: ReturnType<typeof useResponsive>) => ResponsiveStyleSheet
) {
  return styleFactory;
}

// Common responsive style patterns
export const responsiveStyles = {
  // Card styles that adapt to screen size
  card: (responsive: ReturnType<typeof useResponsive>) => ({
    backgroundColor: COLORS.background.primary,
    borderRadius: responsive.getResponsiveSpacing(BORDER_RADIUS.lg),
    padding: responsive.getResponsivePadding(SPACING.lg),
    marginHorizontal: responsive.getResponsiveMargin(SPACING.sm),
    marginVertical: responsive.getResponsiveMargin(SPACING.xs),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }),

  // Header styles
  header: (responsive: ReturnType<typeof useResponsive>) => ({
    paddingHorizontal: responsive.getResponsivePadding(SPACING.lg),
    paddingTop: responsive.getResponsivePadding(SPACING.lg),
    paddingBottom: responsive.getResponsiveSpacing(SPACING.md),
  }),

  // Title styles
  title: (responsive: ReturnType<typeof useResponsive>) => ({
    fontSize: responsive.getResponsiveFontSize(FONT_SIZE.xxl),
    fontWeight: 'bold' as const,
    color: COLORS.text.primary,
    marginBottom: responsive.getResponsiveSpacing(SPACING.sm),
  }),

  // Subtitle styles
  subtitle: (responsive: ReturnType<typeof useResponsive>) => ({
    fontSize: responsive.getResponsiveFontSize(FONT_SIZE.lg),
    color: COLORS.text.secondary,
  }),

  // Tab container styles
  tabContainer: (responsive: ReturnType<typeof useResponsive>) => ({
    flexDirection: 'row' as const,
    backgroundColor: COLORS.background.primary,
    marginHorizontal: responsive.getResponsiveMargin(SPACING.md),
    borderRadius: responsive.getResponsiveSpacing(BORDER_RADIUS.lg),
    padding: responsive.getResponsiveSpacing(SPACING.xs),
    marginBottom: responsive.getResponsiveMargin(SPACING.md),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  }),

  // Tab styles
  tab: (responsive: ReturnType<typeof useResponsive>) => ({
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: responsive.getResponsiveSpacing(SPACING.md),
    paddingHorizontal: responsive.getResponsivePadding(SPACING.md),
    borderRadius: responsive.getResponsiveSpacing(BORDER_RADIUS.md),
  }),

  // Tab text styles
  tabText: (responsive: ReturnType<typeof useResponsive>) => ({
    fontSize: responsive.getResponsiveFontSize(FONT_SIZE.md),
    fontWeight: '500' as const,
    color: COLORS.text.secondary,
    marginLeft: responsive.getResponsiveSpacing(SPACING.xs),
  }),

  // Grid styles
  grid: (responsive: ReturnType<typeof useResponsive>) => ({
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: responsive.getResponsiveSpacing(SPACING.md),
    paddingHorizontal: responsive.getResponsivePadding(SPACING.sm),
  }),

  // Grid item styles
  gridItem: (responsive: ReturnType<typeof useResponsive>, columns: number = 2) => ({
    width: responsive.getCardWidth(columns),
    marginBottom: responsive.getResponsiveMargin(SPACING.md),
  }),

  // Stat card styles
  statCard: (responsive: ReturnType<typeof useResponsive>) => ({
    backgroundColor: COLORS.background.primary,
    borderRadius: responsive.getResponsiveSpacing(BORDER_RADIUS.lg),
    padding: responsive.getResponsivePadding(SPACING.lg),
    marginHorizontal: responsive.getResponsiveMargin(SPACING.sm),
    marginBottom: responsive.getResponsiveMargin(SPACING.md),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }),

  // Modal styles
  modalOverlay: (responsive: ReturnType<typeof useResponsive>) => ({
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: responsive.getResponsivePadding(SPACING.lg),
  }),

  modalContent: (responsive: ReturnType<typeof useResponsive>) => ({
    backgroundColor: COLORS.background.primary,
    borderRadius: responsive.getResponsiveSpacing(BORDER_RADIUS.xl),
    padding: responsive.getResponsivePadding(SPACING.xl),
    width: responsive.getModalWidth(),
    maxHeight: responsive.getModalHeight(),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  }),

  // Button styles
  button: (responsive: ReturnType<typeof useResponsive>) => ({
    borderRadius: responsive.getResponsiveSpacing(BORDER_RADIUS.md),
    paddingHorizontal: responsive.getResponsivePadding(SPACING.lg),
    paddingVertical: responsive.getResponsiveSpacing(SPACING.md),
    minHeight: responsive.breakpoints.isTablet ? 56 : 44,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  }),

  // Input styles
  input: (responsive: ReturnType<typeof useResponsive>) => ({
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderRadius: responsive.getResponsiveSpacing(BORDER_RADIUS.md),
    paddingHorizontal: responsive.getResponsivePadding(SPACING.md),
    paddingVertical: responsive.getResponsiveSpacing(SPACING.md),
    fontSize: responsive.getResponsiveFontSize(FONT_SIZE.lg),
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.primary,
    minHeight: responsive.breakpoints.isTablet ? 56 : 44,
  }),

  // Text styles
  textPrimary: (responsive: ReturnType<typeof useResponsive>) => ({
    color: COLORS.text.primary,
    fontSize: responsive.getResponsiveFontSize(FONT_SIZE.lg),
    fontWeight: '400' as const,
  }),

  textSecondary: (responsive: ReturnType<typeof useResponsive>) => ({
    color: COLORS.text.secondary,
    fontSize: responsive.getResponsiveFontSize(FONT_SIZE.md),
    fontWeight: '400' as const,
  }),

  textHeading: (responsive: ReturnType<typeof useResponsive>) => ({
    color: COLORS.text.primary,
    fontSize: responsive.getResponsiveFontSize(FONT_SIZE.xl),
    fontWeight: '600' as const,
  }),

  textTitle: (responsive: ReturnType<typeof useResponsive>) => ({
    color: COLORS.text.primary,
    fontSize: responsive.getResponsiveFontSize(FONT_SIZE.xxl),
    fontWeight: '700' as const,
  }),
};

export default responsiveStyles;
