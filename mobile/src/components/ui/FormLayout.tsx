import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TouchOptimizedButton from './TouchOptimizedButton';
import { hapticFeedback } from '../../utils/haptics';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme/constants';

interface FormAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  testID?: string;
}

interface FormLayoutProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: FormAction[];
  primaryAction?: FormAction;
  secondaryAction?: FormAction;
  showBackButton?: boolean;
  onBack?: () => void;
  loading?: boolean;
  error?: string;
  success?: string;
  variant?: 'default' | 'modal' | 'fullscreen';
  scrollable?: boolean;
  keyboardAvoidingView?: boolean;
  style?: Record<string, unknown>;
  contentStyle?: Record<string, unknown>;
  testID?: string;
}

export default function FormLayout({
  title,
  subtitle,
  children,
  actions = [],
  primaryAction,
  secondaryAction,
  showBackButton = false,
  onBack,
  loading = false,
  error,
  success,
  variant = 'default',
  scrollable = true,
  keyboardAvoidingView = true,
  style,
  contentStyle,
  testID,
}: FormLayoutProps) {
  const renderHeader = () => {
    if (!title && !subtitle && !showBackButton) return null;

    return (
      <View style={styles.header}>
        {showBackButton && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              hapticFeedback.light();
              onBack?.();
            }}
            testID={`${testID}-back-button`}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
        )}
        
        <View style={styles.titleContainer}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
    );
  };

  const renderStatus = () => {
    if (!error && !success) return null;

    return (
      <View style={[
        styles.statusContainer,
        error && styles.errorContainer,
        success && styles.successContainer,
      ]}>
        <Ionicons
          name={error ? 'alert-circle' : 'checkmark-circle'}
          size={20}
          color={error ? COLORS.error.main : COLORS.success}
        />
        <Text style={[
          styles.statusText,
          error && styles.errorText,
          success && styles.successText,
        ]}>
          {error || success}
        </Text>
      </View>
    );
  };

  const renderActions = () => {
    const allActions = [...actions];
    if (secondaryAction) allActions.unshift(secondaryAction);
    if (primaryAction) allActions.push(primaryAction);

    if (allActions.length === 0) return null;

    return (
      <View style={styles.actionsContainer}>
        {allActions.map((action, index) => (
          <TouchOptimizedButton
            key={index}
            title={action.label}
            onPress={action.onPress}
            variant={action.variant || 'primary'}
            loading={action.loading || loading}
            disabled={action.disabled}
            icon={action.icon}
            fullWidth={allActions.length === 1}
            testID={action.testID || `${testID}-action-${index}`}
          />
        ))}
      </View>
    );
  };

  const renderContent = () => {
    const content = (
      <View style={[styles.content, contentStyle]}>
        {renderHeader()}
        {renderStatus()}
        <View style={styles.fieldsContainer}>
          {children}
        </View>
        {renderActions()}
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
    variant === 'modal' && styles.modalVariant,
    variant === 'fullscreen' && styles.fullscreenVariant,
    style,
  ];

  if (keyboardAvoidingView) {
    return (
      <KeyboardAvoidingView
        style={containerStyle}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        testID={testID}
      >
        {renderContent()}
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={containerStyle} testID={testID}>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  modalVariant: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.large,
    margin: SPACING.medium,
    maxHeight: '90%',
  },
  fullscreenVariant: {
    backgroundColor: COLORS.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.large,
  },
  backButton: {
    marginRight: SPACING.medium,
    padding: SPACING.xs,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.medium,
    color: COLORS.text.secondary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.medium,
    borderRadius: BORDER_RADIUS.medium,
    marginBottom: SPACING.large,
  },
  errorContainer: {
    backgroundColor: COLORS.error + '20',
    borderWidth: 1,
    borderColor: COLORS.error + '40',
  },
  successContainer: {
    backgroundColor: COLORS.success + '20',
    borderWidth: 1,
    borderColor: COLORS.success + '40',
  },
  statusText: {
    flex: 1,
    fontSize: FONT_SIZE.medium,
    marginLeft: SPACING.small,
  },
  errorText: {
    color: COLORS.error.main,
  },
  successText: {
    color: COLORS.success,
  },
  fieldsContainer: {
    flex: 1,
    marginBottom: SPACING.large,
  },
  actionsContainer: {
    gap: SPACING.medium,
  },
});
