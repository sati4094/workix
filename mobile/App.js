import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { MD3LightTheme, MD3DarkTheme, PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';

import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import { cleanupOfflineService, initializeOfflineQueue } from './src/services/offlineService';

// Custom theme colors
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2563eb',
    secondary: '#7c3aed',
    error: '#dc2626',
    success: '#16a34a',
    warning: '#ea580c',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    error: '#ef4444',
    success: '#22c55e',
    warning: '#f97316',
  },
};

export default function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    // Initialize authentication on app start
    initializeAuth();
    
    // Initialize offline queue
    initializeOfflineQueue();
    
    return () => {
      cleanupOfflineService();
    };
  }, [initializeAuth]);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

