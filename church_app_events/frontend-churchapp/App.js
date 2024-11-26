import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import AuthNavigator from './src/navigation/AuthNavigator'; // Import AuthNavigator
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';

// Optional: Customize theme
const theme = {
  ...DefaultTheme,
  // Add your custom theme options here if needed
  colors: {
    ...DefaultTheme.colors,
    // primary: '#your-primary-color',
    // accent: '#your-accent-color',
  },
};

export default function App() {
  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <AuthNavigator />
        </NavigationContainer>
      </PaperProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
