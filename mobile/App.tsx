import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { UserProvider } from './src/contexts/UserContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { AppErrorBoundary, ContextErrorHandler } from './src/components/ErrorBoundary';

import AppNavigator from './src/navigation/AppNavigator';

export default function App() {

  return (
    <AppErrorBoundary>
      <ContextErrorHandler contextName="Auth">
        <AuthProvider>
          <ContextErrorHandler contextName="User">
            <UserProvider>
              <ContextErrorHandler contextName="Toast">
                <ToastProvider>
                  <NavigationContainer>
                    <StatusBar style="auto" />
                    <AppNavigator />
                  </NavigationContainer>
                </ToastProvider>
              </ContextErrorHandler>
            </UserProvider>
          </ContextErrorHandler>
        </AuthProvider>
      </ContextErrorHandler>
    </AppErrorBoundary>
  );
}
