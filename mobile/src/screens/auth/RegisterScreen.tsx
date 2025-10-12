import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../../contexts/ToastContext';

import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../../theme/constants';
import { STYLE_PRESETS } from '../../theme/duplicateStyles';

import { DebugUtils } from '../../utils/debugUtils';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigation = useNavigation();

  const handleRegister = async () => {
    DebugUtils.log('🔍 [REGISTER] handleRegister called');
    DebugUtils.log('🔍 [REGISTER] Form data:', { email, password: password ? '***' : '', confirmPassword: confirmPassword ? '***' : '', fullName });

    if (!email || !password || !confirmPassword || !fullName) {
      DebugUtils.log('🔍 [REGISTER] Validation failed: missing fields');
      showToast('Error: Please fill in all fields', 'error', 5000);
      return;
    }

    if (password !== confirmPassword) {
      DebugUtils.log('🔍 [REGISTER] Validation failed: passwords do not match');
      showToast('Error: Passwords do not match', 'error', 5000);
      return;
    }

    if (password.length < 8) {
      DebugUtils.log('🔍 [REGISTER] Validation failed: password too short');
      showToast('Error: Password must be at least 8 characters', 'error', 5000);
      return;
    }

    DebugUtils.log('🔍 [REGISTER] All validations passed, calling register function');
    setIsLoading(true);
    try {
      const result = await register(email, password, fullName);
      DebugUtils.log('🔍 [REGISTER] Register result:', result);
      if (result.success) {
        DebugUtils.log('🔍 [REGISTER] Registration successful, navigating to login');
        showToast('Success! Account created successfully! Please sign in.', 'success', 4000);
        navigation.navigate('Login' as never);
      } else {
        DebugUtils.log('🔍 [REGISTER] Registration failed:', result.error);
        showToast(`Registration Failed: ${result.error || 'Registration failed. Please try again.'}`, 'error', 5000);
      }
    } catch (error) {
      DebugUtils.log('🔍 [REGISTER] Registration error:', error);
      showToast('Error: Registration failed. Please try again.', 'error', 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login' as never);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join AI Companion and start your health journey</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={() => {
                DebugUtils.log('🔍 [REGISTER] Button pressed!');
                handleRegister();
              }}
              disabled={isLoading}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text.primary,
  },
  registerButton: {
    backgroundColor: '#6366f1',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: 20,
  },
  registerButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  registerButtonText: {
    color: COLORS.text.inverse,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.text.secondary,
  },
  linkText: {
    fontSize: FONT_SIZE.lg,
    color: '#6366f1',
    fontWeight: '600',
  },
});

