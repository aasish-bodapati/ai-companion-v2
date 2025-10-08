import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import FormLayout from '../ui/FormLayout';
import FormSection from '../ui/FormSection';
import FormField from '../ui/FormField';
import { FormValidator, LoginRules, RegistrationRules } from '../../utils/formValidation';
import { hapticFeedback } from '../../utils/haptics';
import { COLORS, SPACING, FONT_SIZE } from '../../theme/constants';

interface LoginData {
  email: string;
  password: string;
}

interface RegistrationData {
  full_name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (data: LoginData | RegistrationData) => void;
  onCancel?: () => void;
  loading?: boolean;
  error?: string;
  onModeChange?: (mode: 'login' | 'register') => void;
  testID?: string;
}

export default function AuthForm({
  mode,
  onSubmit,
  onCancel,
  loading = false,
  error,
  onModeChange,
  testID,
}: AuthFormProps) {
  const [loginData, setLoginData] = useState<LoginData>({
    email: '',
    password: '',
  });

  const [registerData, setRegisterData] = useState<RegistrationData>({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isLogin = mode === 'login';
  const currentData = isLogin ? loginData : registerData;
  const validationRules = isLogin ? LoginRules : RegistrationRules;
  const [formValidator] = useState(new FormValidator(validationRules));

  const updateData = (field: string, value: string) => {
    if (isLogin) {
      setLoginData(prev => ({ ...prev, [field]: value }));
    } else {
      setRegisterData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateField = (field: string) => {
    const error = formValidator.validateField(field, currentData[field as keyof typeof currentData] || '');
    setErrors(prev => {
      if (error) {
        return { ...prev, [field]: error };
      } else {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
    });
    return !error;
  };

  const validateForm = () => {
    const newErrors = formValidator.validateForm(currentData);
    setErrors(newErrors);
    return !formValidator.hasErrors(newErrors);
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      hapticFeedback.error();
      return;
    }

    hapticFeedback.success();
    onSubmit(currentData);
  };

  const handleCancel = () => {
    hapticFeedback.light();
    onCancel?.();
  };

  const handleModeChange = () => {
    hapticFeedback.light();
    onModeChange?.(isLogin ? 'register' : 'login');
    setErrors({});
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    hapticFeedback.light();
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
    hapticFeedback.light();
  };

  return (
    <FormLayout
      title={isLogin ? 'Welcome Back' : 'Create Account'}
      subtitle={isLogin ? 'Sign in to your account' : 'Join us to get started'}
      primaryAction={{
        label: loading ? (isLogin ? 'Signing In...' : 'Creating Account...') : (isLogin ? 'Sign In' : 'Create Account'),
        onPress: handleSubmit,
        loading,
        disabled: loading,
        testID: 'submit-button',
      }}
      secondaryAction={onCancel ? {
        label: 'Cancel',
        onPress: handleCancel,
        variant: 'outline',
        testID: 'cancel-button',
      } : undefined}
      error={error}
      testID={testID}
    >
      <FormSection
        title={isLogin ? 'Sign In' : 'Account Details'}
        subtitle={isLogin ? 'Enter your credentials' : 'Tell us about yourself'}
        variant="card"
      >
        {!isLogin && (
          <FormField
            name="full_name"
            label="Full Name"
            value={registerData.full_name}
            onChangeText={(value) => updateData('full_name', value)}
            onBlur={() => validateField('full_name')}
            error={errors.full_name}
            placeholder="Enter your full name"
            required
            testID="fullname-input"
          />
        )}
        
        <FormField
          name="email"
          label="Email Address"
          value={currentData.email}
          onChangeText={(value) => updateData('email', value)}
          onBlur={() => validateField('email')}
          error={errors.email}
          keyboardType="email-address"
          placeholder="Enter your email address"
          required
          testID="email-input"
        />
        
        <FormField
          name="password"
          label="Password"
          value={currentData.password}
          onChangeText={(value) => updateData('password', value)}
          onBlur={() => validateField('password')}
          error={errors.password}
          placeholder="Enter your password"
          secureTextEntry={!showPassword}
          required
          icon={showPassword ? 'eye-off' : 'eye'}
          onIconPress={togglePasswordVisibility}
          testID="password-input"
        />
        
        {!isLogin && (
          <FormField
            name="confirmPassword"
            label="Confirm Password"
            value={registerData.confirmPassword}
            onChangeText={(value) => updateData('confirmPassword', value)}
            onBlur={() => validateField('confirmPassword')}
            error={errors.confirmPassword}
            placeholder="Confirm your password"
            secureTextEntry={!showConfirmPassword}
            required
            icon={showConfirmPassword ? 'eye-off' : 'eye'}
            onIconPress={toggleConfirmPasswordVisibility}
            testID="confirm-password-input"
          />
        )}
      </FormSection>

      {onModeChange && (
        <View style={styles.modeSwitchContainer}>
          <Text style={styles.modeSwitchText}>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
          </Text>
          <TouchableOpacity
            onPress={handleModeChange}
            style={styles.modeSwitchButton}
            testID="mode-switch-button"
          >
            <Text style={styles.modeSwitchButtonText}>
              {isLogin ? 'Sign Up' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </FormLayout>
  );
}

const styles = StyleSheet.create({
  modeSwitchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.large,
    paddingTop: SPACING.medium,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  modeSwitchText: {
    fontSize: FONT_SIZE.medium,
    color: COLORS.text.secondary,
    marginRight: SPACING.small,
  },
  modeSwitchButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.small,
  },
  modeSwitchButtonText: {
    fontSize: FONT_SIZE.medium,
    color: COLORS.primary.main,
    fontWeight: '600',
  },
});
