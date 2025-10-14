
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { ActivityIndicator, View } from 'react-native';

import TabNavigator from './TabNavigator';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import EnhancedOnboardingScreen from '../screens/onboarding/EnhancedOnboardingScreen';

import { DebugUtils } from '../utils/debugUtils';

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated, isLoading, user, token } = useAuth();
  const { onboarding } = useUser();
  const needsOnboarding = onboarding.needsOnboarding;

  // Enhanced logging for debugging
  if (__DEV__) {
    DebugUtils.log('🧭 AppNavigator - State:', {
      isAuthenticated,
      isLoading,
      needsOnboarding,
      hasUser: !!user,
      hasToken: !!token,
      userId: user?.id,
      userEmail: user?.email,
      timestamp: new Date().toISOString()
    });
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        needsOnboarding ? (
          <Stack.Screen name="Onboarding" component={EnhancedOnboardingScreen} />
        ) : (
          <Stack.Screen name="Main" component={TabNavigator} />
        )
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
