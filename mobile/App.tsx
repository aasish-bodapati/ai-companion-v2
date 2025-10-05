import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { GlobalStateProvider } from './src/contexts/GlobalStateContext';
import { timezoneDetectionService } from './src/services/timezoneDetectionService';

import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  // Start background timezone detection when app starts
  useEffect(() => {
    timezoneDetectionService.startBackgroundDetection();
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <GlobalStateProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <AppNavigator />
          </NavigationContainer>
        </GlobalStateProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
