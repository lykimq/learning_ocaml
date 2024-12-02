import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';

// Screens and Navigators
import LoginScreen from '../screens/shared/LoginScreen';
import AdminNavigator from './AdminNavigator';
import UserNavigator from './UserNavigator';
import LogoutScreen from '../screens/shared/LogoutScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Stack = createStackNavigator();

export default function AuthNavigator() {
  const { user, isAdmin } = useAuth();

  console.log('AuthNavigator - Current user:', user);
  console.log('AuthNavigator - Is admin:', isAdmin);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false
      }}
    >
      {/* Always available screens */}
      <Stack.Screen
        name="UserNavigator"
        component={UserNavigator}
      />

      <Stack.Screen
        name="LoginScreen"
        component={LoginScreen}
      />

      <Stack.Screen
        name="AdminNavigator"
        component={AdminNavigator}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="Logout"
        component={LogoutScreen}
      />
    </Stack.Navigator>
  );
}
