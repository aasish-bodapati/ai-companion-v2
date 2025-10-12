import React, { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../../theme/constants';
import { STYLE_PRESETS } from '../../theme/duplicateStyles';
import { useUnifiedForm } from '../../hooks/useUnifiedForm';
import { ValidationRule } from '../../hooks/useUnifiedForm';

import { DebugUtils } from '../../utils/debugUtils';

export type FormVariant = 'default' | 'modal' | 'fullscreen' | 'bottomSheet';
export type FormSize = 'small' | 'medium' | 'large';
export type FormFieldType = 'text' | 'email' | 'password' | 'numeric' | 'phone' | 'multiline' | 'select' | 'toggle' | 'date' | 'time';

interface FormAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  testID?: string;
}

interface FormFieldConfig {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  validation?: ValidationRule;
  options?: { label: string; value: any; icon?: string }[];
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  icon?: string;
  onIconPress?: () => void;
  containerStyle?: ViewStyle;
  testID?: string;
}

interface UnifiedFormProps<T extends Record<string, any>> {
  // Form configuration
  initialValues: T;
  validationRules?: Partial<Record<keyof T, ValidationRule>>;
  onSubmit: (values: T) => Promise<void> | void;
  onReset?: () => void;

  // Form fields
  fields: FormFieldConfig[];

  // Layout
  title?: string;
  subtitle?: string;
  variant?: FormVariant;
  size?: FormSize;

  // Actions
  primaryAction?: FormAction;
  secondaryAction?: FormAction;
  actions?: FormAction[];

  // Navigation
  showBackButton?: boolean;
  onBack?: () => void;

  // State
  loading?: boolean;
  error?: string;
  success?: string;

  // Behavior
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnSubmit?: boolean;

  // Styling
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  headerStyle?: ViewStyle;
  footerStyle?: ViewStyle;

  // Custom content
  children?: ReactNode;

  testID?: string;
}

export default function UnifiedForm<T extends Record<string, any>>({
  initialValues,
  validationRules = {},
  onSubmit,
  onReset,
  fields,
  title,
  subtitle,
  variant = 'default',
  size = 'medium',
  primaryAction,
  secondaryAction,
  actions = [],
  showBackButton = false,
  onBack,
  loading = false,
  error,
  success,
  scrollable = true,
  keyboardAvoiding = true,
  validateOnChange = true,
  validateOnBlur = true,
  validateOnSubmit = true,
  style,
  contentStyle,
  headerStyle,
  footerStyle,
  children,
  testID,
}: UnifiedFormProps<T>) {
  const form = useUnifiedForm({
    initialValues,
    validationRules,
    onSubmit,
    onReset,
    validateOnChange,
    validateOnBlur,
    validateOnSubmit,
  });

  const handleSubmit = async () => {
    try {
      await form.submit();
    } catch (err) {
      DebugUtils.error('Form submission error:', err);
    }
  };

  const handleReset = () => {
    form.reset();
    onReset?.();
  };

  const renderHeader = () => {
    if (!title && !subtitle && !showBackButton) return null;

    return (
      <View style={[styles.header, headerStyle]}>
        {showBackButton && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            testID={`${testID}-back-button`}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
        )}

        <View style={styles.headerContent}>
          {title && (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderField = (field: FormFieldConfig) => {
    const fieldProps = form.getFieldProps(field.name as keyof T);

    return (
      <View key={field.name} style={[styles.fieldContainer, field.containerStyle]}>
        <Text style={styles.fieldLabel}>
          {field.label}
          {field.required && <Text style={styles.required}> *</Text>}
        </Text>

        {renderFieldInput(field, fieldProps)}

        {(field.helperText || fieldProps.error) && (
          <Text style={[
            styles.fieldHelper,
            fieldProps.error && styles.fieldError
          ]}>
            {fieldProps.error || field.helperText}
          </Text>
        )}
      </View>
    );
  };

  const renderFieldInput = (field: FormFieldConfig, fieldProps: any) => {
    const { value, onChange, onBlur, onFocus } = fieldProps;

    switch (field.type) {
      case 'select':
        return renderSelectField(field, value, onChange);
      case 'toggle':
        return renderToggleField(field, value, onChange);
      case 'multiline':
        return renderMultilineField(field, value, onChange, onBlur, onFocus);
      default:
        return renderTextInput(field, value, onChange, onBlur, onFocus);
    }
  };

  const renderTextInput = (field: FormFieldConfig, value: any, onChange: any, onBlur: any, onFocus: any) => {
    return (
      <View style={styles.inputContainer}>
        {field.icon && (
          <Ionicons
            name={field.icon as keyof typeof Ionicons.glyphMap}
            size={20}
            color={field.disabled ? COLORS.text.disabled : COLORS.text.secondary}
            style={styles.inputIcon}
          />
        )}

        <TextInput
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={field.placeholder}
          placeholderTextColor={COLORS.text.disabled}
          editable={!field.disabled}
          multiline={field.multiline}
          numberOfLines={field.numberOfLines}
          maxLength={field.maxLength}
          secureTextEntry={field.type === 'password'}
          keyboardType={getKeyboardType(field.type)}
          style={[
            styles.input,
            field.multiline && styles.multilineInput,
            field.disabled && styles.inputDisabled,
          ]}
          testID={field.testID}
        />

        {field.onIconPress && (
          <TouchableOpacity
            onPress={field.onIconPress}
            style={styles.inputActionIcon}
            disabled={field.disabled}
          >
            <Ionicons
              name="chevron-down"
              size={20}
              color={field.disabled ? COLORS.text.disabled : COLORS.text.secondary}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderSelectField = (field: FormFieldConfig, value: any, onChange: any) => {
    return (
      <TouchableOpacity
        style={[styles.selectContainer, field.disabled && styles.selectDisabled]}
        onPress={() => field.onIconPress?.()}
        disabled={field.disabled}
        testID={field.testID}
      >
        <Text style={[
          styles.selectText,
          !value && styles.selectPlaceholder,
          field.disabled && styles.selectTextDisabled
        ]}>
          {value ? field.options?.find(opt => opt.value === value)?.label : field.placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={field.disabled ? COLORS.text.disabled : COLORS.text.secondary}
        />
      </TouchableOpacity>
    );
  };

  const renderToggleField = (field: FormFieldConfig, value: any, onChange: any) => {
    return (
      <TouchableOpacity
        style={[
          styles.toggleContainer,
          value && styles.toggleActive,
          field.disabled && styles.toggleDisabled
        ]}
        onPress={() => onChange(!value)}
        disabled={field.disabled}
        testID={field.testID}
      >
        <View style={[
          styles.toggleThumb,
          value && styles.toggleThumbActive
        ]} />
      </TouchableOpacity>
    );
  };

  const renderMultilineField = (field: FormFieldConfig, value: any, onChange: any, onBlur: any, onFocus: any) => {
    return (
      <TextInput
        value={value}
        onChangeText={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        placeholder={field.placeholder}
        placeholderTextColor={COLORS.text.disabled}
        editable={!field.disabled}
        multiline
        numberOfLines={field.numberOfLines || 4}
        maxLength={field.maxLength}
        style={[
          styles.multilineInput,
          field.disabled && styles.inputDisabled,
        ]}
        testID={field.testID}
      />
    );
  };

  const renderActions = () => {
    const allActions = [
      ...(primaryAction ? [primaryAction] : []),
      ...(secondaryAction ? [secondaryAction] : []),
      ...actions,
    ];

    if (allActions.length === 0) return null;

    return (
      <View style={[styles.actions, footerStyle]}>
        {allActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.actionButton,
              styles[`action${action.variant?.charAt(0).toUpperCase()}${action.variant?.slice(1)}` || 'actionPrimary'],
              action.disabled && styles.actionDisabled,
            ]}
            onPress={action.onPress}
            disabled={action.disabled || loading}
            testID={action.testID}
          >
            {action.loading ? (
              <ActivityIndicator
                size="small"
                color={action.variant === 'outline' || action.variant === 'ghost' ? COLORS.primary.main : COLORS.text.inverse}
              />
            ) : (
              <>
                {action.icon && (
                  <Ionicons
                    name={action.icon as keyof typeof Ionicons.glyphMap}
                    size={16}
                    color={action.variant === 'outline' || action.variant === 'ghost' ? COLORS.primary.main : COLORS.text.inverse}
                    style={styles.actionIcon}
                  />
                )}
                <Text style={[
                  styles.actionText,
                  styles[`actionText${action.variant?.charAt(0).toUpperCase()}${action.variant?.slice(1)}` || 'actionTextPrimary'],
                  action.disabled && styles.actionTextDisabled,
                ]}>
                  {action.label}
                </Text>
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    return (
      <View style={[styles.content, contentStyle]}>
        {renderHeader()}

        <View style={styles.fields}>
          {fields.map(renderField)}
          {children}
        </View>

        {(error || success) && (
          <View style={[styles.message, error && styles.errorMessage, success && styles.successMessage]}>
            <Ionicons
              name={error ? 'alert-circle' : 'checkmark-circle'}
              size={20}
              color={error ? COLORS.error : COLORS.success}
            />
            <Text style={[styles.messageText, error && styles.errorText, success && styles.successText]}>
              {error || success}
            </Text>
          </View>
        )}

        {renderActions()}
      </View>
    );
  };

  const getKeyboardType = (type: FormFieldType) => {
    switch (type) {
      case 'email': return 'email-address';
      case 'numeric': return 'numeric';
      case 'phone': return 'phone-pad';
      default: return 'default';
    }
  };

  const getContainerStyle = (): ViewStyle[] => {
    const baseStyles = [styles.container];

    // Variant styles
    switch (variant) {
      case 'modal':
        baseStyles.push(styles.modal);
        break;
      case 'fullscreen':
        baseStyles.push(styles.fullscreen);
        break;
      case 'bottomSheet':
        baseStyles.push(styles.bottomSheet);
        break;
      default:
        baseStyles.push(styles.default);
        break;
    }

    // Size styles
    switch (size) {
      case 'small':
        baseStyles.push(styles.small);
        break;
      case 'medium':
        baseStyles.push(styles.medium);
        break;
      case 'large':
        baseStyles.push(styles.large);
        break;
    }

    if (style) baseStyles.push(style);

    return baseStyles;
  };

  if (scrollable) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={getContainerStyle()}
        enabled={keyboardAvoiding}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderContent()}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={getContainerStyle()}
      enabled={keyboardAvoiding}
    >
      {renderContent()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  default: {
    // Default form styles
  },
  modal: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
  },
  fullscreen: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: COLORS.background.primary,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
  },
  small: {
    padding: SPACING.md,
  },
  medium: {
    padding: SPACING.lg,
  },
  large: {
    padding: SPACING.xl,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    ...STYLE_PRESETS.row,
    marginBottom: SPACING.lg,
  },
  backButton: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...STYLE_PRESETS.textHeading,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...STYLE_PRESETS.textSecondary,
  },
  fields: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: SPACING.lg,
  },
  fieldLabel: {
    ...STYLE_PRESETS.textSecondary,
    marginBottom: SPACING.sm,
  },
  required: {
    color: COLORS.error,
  },
  fieldHelper: {
    ...STYLE_PRESETS.textCaption,
    marginTop: SPACING.xs,
  },
  fieldError: {
    color: COLORS.error,
  },
  inputContainer: {
    ...STYLE_PRESETS.row,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background.primary,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    ...STYLE_PRESETS.textPrimary,
    flex: 1,
    paddingVertical: 0,
  },
  multilineInput: {
    ...STYLE_PRESETS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background.primary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    backgroundColor: COLORS.background.disabled,
    color: COLORS.text.disabled,
  },
  inputActionIcon: {
    marginLeft: SPACING.sm,
  },
  selectContainer: {
    ...STYLE_PRESETS.rowSpaceBetween,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background.primary,
  },
  selectText: {
    ...STYLE_PRESETS.textPrimary,
  },
  selectPlaceholder: {
    color: COLORS.text.disabled,
  },
  selectTextDisabled: {
    color: COLORS.text.disabled,
  },
  selectDisabled: {
    backgroundColor: COLORS.background.disabled,
  },
  toggleContainer: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.border.primary,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: COLORS.primary.main,
  },
  toggleDisabled: {
    opacity: 0.5,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.background.primary,
    ...SHADOWS.small,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  message: {
    ...STYLE_PRESETS.row,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  errorMessage: {
    backgroundColor: COLORS.error + '20',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  successMessage: {
    backgroundColor: COLORS.success + '20',
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  messageText: {
    ...STYLE_PRESETS.textSecondary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  errorText: {
    color: COLORS.error,
  },
  successText: {
    color: COLORS.success,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  actionButton: {
    ...STYLE_PRESETS.row,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    minHeight: 44,
  },
  actionPrimary: {
    backgroundColor: COLORS.primary.main,
  },
  actionSecondary: {
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  actionOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary.main,
  },
  actionGhost: {
    backgroundColor: 'transparent',
  },
  actionDanger: {
    backgroundColor: COLORS.error,
  },
  actionSuccess: {
    backgroundColor: COLORS.success,
  },
  actionDisabled: {
    opacity: 0.5,
  },
  actionIcon: {
    marginRight: SPACING.xs,
  },
  actionText: {
    ...STYLE_PRESETS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  actionTextPrimary: {
    color: COLORS.text.inverse,
  },
  actionTextSecondary: {
    color: COLORS.text.primary,
  },
  actionTextOutline: {
    color: COLORS.primary.main,
  },
  actionTextGhost: {
    color: COLORS.primary.main,
  },
  actionTextDanger: {
    color: COLORS.text.inverse,
  },
  actionTextSuccess: {
    color: COLORS.text.inverse,
  },
  actionTextDisabled: {
    opacity: 0.5,
  },
});

// Export presets for common form configurations
export const formPresets = {
  auth: {
    variant: 'modal' as const,
    size: 'medium' as const,
    validateOnChange: false,
    validateOnBlur: true,
    validateOnSubmit: true,
  },
  profile: {
    variant: 'default' as const,
    size: 'large' as const,
    validateOnChange: true,
    validateOnBlur: true,
    validateOnSubmit: true,
  },
  settings: {
    variant: 'default' as const,
    size: 'medium' as const,
    validateOnChange: false,
    validateOnBlur: true,
    validateOnSubmit: true,
  },
  quick: {
    variant: 'bottomSheet' as const,
    size: 'small' as const,
    validateOnChange: false,
    validateOnBlur: false,
    validateOnSubmit: true,
  },
};
