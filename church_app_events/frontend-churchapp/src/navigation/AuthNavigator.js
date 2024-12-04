import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';

// Screens and Navigators
import LoginScreen from '../screens/shared/LoginScreen';
import AdminNavigator from './AdminNavigator';
import UserNavigator from './UserNavigator';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Stack = createStackNavigator();

export default function AuthNavigator() {
  const { user, isAdmin } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      {/* UserNavigator is always available */}
      <Stack.Screen
        name="UserNavigator"
        component={UserNavigator}
        options={{
          gestureEnabled: false,
          animationEnabled: false
        }}
      />

      {/* LoginScreen is available when not logged in */}
      {!user && (
        <Stack.Screen
          name="LoginScreen"
          component={LoginScreen}
          options={{
            gestureEnabled: false,
            animationEnabled: true
          }}
        />
      )}

      {/* AdminNavigator is only available when user is admin */}
      {user && isAdmin && (
        <Stack.Screen
          name="AdminNavigator"
          component={AdminNavigator}
          options={{
            gestureEnabled: false,
            animationEnabled: false
          }}
        />
      )}

      {/* ProfileScreen is always available */}
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{
          gestureEnabled: true,
          animationEnabled: true
        }}
      />
    </Stack.Navigator>
  );
}
