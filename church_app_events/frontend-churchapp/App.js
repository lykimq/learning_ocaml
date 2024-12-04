import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { PaperProvider } from 'react-native-paper';
import AuthNavigator from './src/navigation/AuthNavigator';
import AdminNavigator from './src/navigation/AdminNavigator';
import UserNavigator from './src/navigation/UserNavigator';

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
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </PaperProvider>
  );
}
