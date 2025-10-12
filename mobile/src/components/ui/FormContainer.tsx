
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, ViewStyle } from 'react-native';
import React from 'react';

import { COMMON_STYLES, COLORS, SPACING, FONT_SIZE } from '../../theme/constants';

interface FormAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  testID?: string;
}

interface FormContainerProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: FormAction[];
  variant?: 'default' | 'modal' | 'fullscreen';
  scrollable?: boolean;
  keyboardAvoidingView?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  headerStyle?: ViewStyle;
  footerStyle?: ViewStyle;
  testID?: string;
}

/**
 * Generic form container component that handles common form patterns
 * Provides consistent layout, actions, and keyboard handling
 */
export const FormContainer: React.FC<FormContainerProps> = ({
  title,
  subtitle,
  children,
  actions = [],
  variant = 'default',
  scrollable = true,
  keyboardAvoidingView = true,
  style,
  contentStyle,
  headerStyle,
  footerStyle,
  testID,
}) => {
  const renderHeader = () => {
    if (!title && !subtitle) return null;

    return (
      <View style={[styles.header, headerStyle]}>
        {title && <Text style={styles.title}>{title}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    );
  };

  const renderActions = () => {
    if (actions.length === 0) return null;

    return (
      <View style={[styles.footer, footerStyle]}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.actionButton,
              styles[`actionButton${action.variant || 'primary'}`],
              action.disabled && styles.actionButtonDisabled,
            ]}
            onPress={action.onPress}
            disabled={action.disabled || action.loading}
            testID={action.testID}
          >
            <Text
              style={[
                styles.actionButtonText,
                styles[`actionButtonText${action.variant || 'primary'}`],
                action.disabled && styles.actionButtonTextDisabled,
              ]}
            >
              {action.loading ? 'Loading...' : action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    const content = (
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    );

    if (scrollable) {
      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      );
    }

    return content;
  };

  const containerStyle = [
    styles.container,
    variant === 'modal' ? styles.containerModal :
    variant === 'fullscreen' ? styles.containerFullscreen :
    styles.container,
    style,
  ];

  if (keyboardAvoidingView) {
    return (
      <KeyboardAvoidingView
        style={containerStyle}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        testID={testID}
      >
        {renderHeader()}
        {renderContent()}
        {renderActions()}
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={containerStyle} testID={testID}>
      {renderHeader()}
      {renderContent()}
      {renderActions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  containerModal: {
    backgroundColor: COMMON_STYLES.cardBackground,
    borderRadius: COMMON_STYLES.standardRadius,
    ...COMMON_STYLES.standardShadow,
  },
  containerFullscreen: {
    backgroundColor: COLORS.background.primary,
  },
  header: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    gap: SPACING.md,
  },
  actionButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: COMMON_STYLES.smallRadius,
    minWidth: 80,
    alignItems: 'center',
  },
  actionButtonprimary: {
    backgroundColor: COLORS.primary.main,
  },
  actionButtonsecondary: {
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.medium,
  },
  actionButtonoutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary.main,
  },
  actionButtonghost: {
    backgroundColor: 'transparent',
  },
  actionButtondanger: {
    backgroundColor: COLORS.error.main,
  },
  actionButtonDisabled: {
    backgroundColor: COLORS.background.disabled,
    borderColor: COLORS.border.disabled,
  },
  actionButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  actionButtonTextprimary: {
    color: 'white',
  },
  actionButtonTextsecondary: {
    color: COLORS.text.primary,
  },
  actionButtonTextoutline: {
    color: COLORS.primary.main,
  },
  actionButtonTextghost: {
    color: COLORS.text.secondary,
  },
  actionButtonTextdanger: {
    color: 'white',
  },
  actionButtonTextDisabled: {
    color: COLORS.text.disabled,
  },
});

export default FormContainer;
