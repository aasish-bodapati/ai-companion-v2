
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import { useAuth } from '../contexts/AuthContext';
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
  const { isAuthenticated, isLoading, needsOnboarding, user, token } = useAuth();

  // Only log significant state changes
  if (__DEV__ && isLoading === false) {
    DebugUtils.log('🧭 AppNavigator - isAuthenticated:', isAuthenticated, 'needsOnboarding:', needsOnboarding);
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
