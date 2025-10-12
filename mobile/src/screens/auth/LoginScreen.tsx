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
import { DebugUtils } from '../../utils/debugUtils';

import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../../theme/constants';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (__DEV__) {
      DebugUtils.log('🔐 [LOGIN SCREEN] Starting login for:', email);
    }

    if (!email || !password) {
      if (__DEV__) {
        DebugUtils.log('🔐 [LOGIN SCREEN] Validation failed - missing email or password');
      }
      showToast('Error: Please fill in all fields', 'error', 5000);
      return;
    }

    setLoginError(''); // Clear previous errors
    setIsLoading(true);
    
    // Calling login function

    try {
      const result = await login(email, password);
      
      if (!result.success) {
        setLoginError(result.error || 'Invalid email or password');
        // Toast notification is now handled in AuthContext
      }
    } catch (error) {
      if (__DEV__) {
        DebugUtils.log('🔐 [LOGIN SCREEN] Login threw exception:', error);
      }
      const errorMessage = 'Login failed. Please try again.';
      setLoginError(errorMessage);
      // Toast notification is now handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register' as never);
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your AI Companion account</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, loginError && styles.inputError]}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (loginError) setLoginError(''); // Clear error when user starts typing
                }}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, loginError && styles.inputError]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (loginError) setLoginError(''); // Clear error when user starts typing
                }}
                placeholder="Enter your password"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {loginError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{loginError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={navigateToRegister}>
              <Text style={styles.linkText}>Sign Up</Text>
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
  inputError: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  errorContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#6366f1',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  loginButtonText: {
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

