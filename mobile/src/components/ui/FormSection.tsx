import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../theme/constants';

interface FormSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
  variant?: 'default' | 'card' | 'outlined';
  style?: any;
  testID?: string;
}

export default function FormSection({
  title,
  subtitle,
  children,
  collapsible = false,
  defaultCollapsed = false,
  onToggle,
  variant = 'default',
  style,
  testID,
}: FormSectionProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  const handleToggle = () => {
    if (!collapsible) return;
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    onToggle?.(newCollapsed);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {collapsible && (
        <View style={styles.toggleButton}>
          <Text style={styles.toggleText}>
            {collapsed ? 'Show' : 'Hide'}
          </Text>
        </View>
      )}
    </View>
  );

  const renderContent = () => {
    if (collapsible && collapsed) {
      return null;
    }
    return <View style={styles.content}>{children}</View>;
  };

  const containerStyle = [
    styles.container,
    variant === 'card' && styles.cardVariant,
    variant === 'outlined' && styles.outlinedVariant,
    style,
  ];

  return (
    <View style={containerStyle} testID={testID}>
      {collapsible ? (
        <View style={styles.collapsibleContainer}>
          <View style={styles.headerContainer} onTouchEnd={handleToggle}>
            {renderHeader()}
          </View>
          {renderContent()}
        </View>
      ) : (
        <>
          {renderHeader()}
          {renderContent()}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.large,
  },
  cardVariant: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
    ...SHADOWS.small,
  },
  outlinedVariant: {
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
  },
  collapsibleContainer: {
    // Container for collapsible sections
  },
  headerContainer: {
    // Touchable area for header
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.medium,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZE.large,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  toggleButton: {
    paddingHorizontal: SPACING.small,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.small,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  toggleText: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  content: {
    // Content container
  },
});
