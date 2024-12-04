import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { Platform } from 'react-native';

// Screens and Navigators
import LoginScreen from '../screens/shared/LoginScreen';
import AdminNavigator from './AdminNavigator';
import UserNavigator from './UserNavigator';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Stack = createStackNavigator();

export default function AuthNavigator() {
  const { user, isAdmin } = useAuth();
  const [isWeb] = React.useState(Platform.OS === 'web');

  console.log('AuthNavigator Render:', {
    platform: Platform.OS,
    isWeb,
    isUserAuthenticated: !!user,
    isAdmin,
    navigationState: 'initial render',
    stackConfig: {
      presentation: isWeb ? 'transparentModal' : 'modal',
      animationEnabled: !isWeb
    }
  });

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        presentation: isWeb ? 'transparentModal' : 'modal',
      }}
    >
      <Stack.Screen
        name="UserNavigator"
        component={UserNavigator}
        options={{
          animationEnabled: false,
        }}
      />

      <Stack.Screen
        name="LoginScreen"
        component={LoginScreen}
        options={{
          presentation: isWeb ? 'transparentModal' : 'modal',
          animationEnabled: true,
          cardStyle: {
            backgroundColor: isWeb ? 'rgba(0, 0, 0, 0.5)' : 'white',
          },
        }}
      />

      {isAdmin && (
        <Stack.Screen
          name="AdminNavigator"
          component={AdminNavigator}
          options={{
            animationEnabled: false,
          }}
        />
      )}
    </Stack.Navigator>
  );
}
