import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';

// Screens and Navigators
import LoginScreen from '../screens/shared/LoginScreen';
import AdminNavigator from './AdminNavigator';
import UserNavigator from './UserNavigator';

const Stack = createStackNavigator();

export default function AuthNavigator() {
  const { isAdmin } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: 'none',
        animationEnabled: false,
        style: {
          pointerEvents: 'auto',
        }
      }}
    >
      {isAdmin ? (
        <Stack.Screen
          name="AdminNavigator"
          component={AdminNavigator}
          options={{
            animationEnabled: false,
          }}
        />
      ) : (
        <Stack.Screen
          name="UserNavigator"
          component={UserNavigator}
          options={{
            animationEnabled: false,
          }}
        />
      )}

      <Stack.Screen
        name="LoginScreen"
        component={LoginScreen}
        options={{
          animationEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}