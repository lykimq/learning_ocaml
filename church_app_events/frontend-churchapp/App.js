import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { PaperProvider } from 'react-native-paper';
import AuthNavigator from './src/navigation/AuthNavigator';
import AdminNavigator from './src/navigation/AdminNavigator';
import UserNavigator from './src/navigation/UserNavigator';
import { View, Text, Alert, LogBox, AppState, Platform } from 'react-native';

const Stack = createStackNavigator();

function RootNavigator() {
  const { user, isAdmin } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      {user ? (
        // Authenticated stack
        isAdmin ? (
          <Stack.Screen name="AdminNavigator" component={AdminNavigator} />
        ) : (
          <Stack.Screen name="UserNavigator" component={UserNavigator} />
        )
      ) : (
        // Non-authenticated stack
        <Stack.Screen name="AuthNavigator" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console with more details
    console.error('App Error:', {
      error: error,
      componentStack: errorInfo.componentStack,
      time: new Date().toISOString()
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, marginBottom: 10 }}>Something went wrong!</Text>
          <Text style={{ color: 'red' }}>{this.state.error?.toString()}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      console.log('App State:', nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <NavigationContainer
      onStateChange={(state) => {
        console.log('Navigation State Changed:', state?.routes?.[state.routes.length - 1]?.name);
      }}
      onError={(error) => {
        console.error('Navigation Error:', error);
      }}
    >
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  if (__DEV__) {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError(...args);
      if (args[0]?.includes?.('Warning:')) return;

      // Log additional context for debugging
      console.log('Error Context:', {
        time: new Date().toISOString(),
        platform: Platform.OS,
        appState: AppState.currentState
      });
    };
  }

  return (
    <ErrorBoundary>
      <PaperProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </PaperProvider>
    </ErrorBoundary>
  );
}
