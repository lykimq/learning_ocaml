import React, {useState} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import LoginScreen from '../screens/shared/LoginScreen';
import AdminNavigator from './AdminNavigator';
import UserNavigator from './UserNavigator';

const Stack = createStackNavigator ();

export default function AuthNavigator () {
  const [isAdmin, setIsAdmin] = useState (false); // Track if user is logged in as admin

  return (
    <Stack.Navigator
      initialRouteName={isAdmin ? 'AdminNavigator' : 'UserNavigator'}
    >
      <Stack.Screen
        name="UserNavigator"
        component={UserNavigator}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="AdminNavigator"
        component={AdminNavigator}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="LoginScreen"
        component={LoginScreen}
        options={{headerShown: false}}
        initialParams={{setIsAdmin}} // Pass setIsAdmin to LoginScreen to update login state
      />
    </Stack.Navigator>
  );
}
