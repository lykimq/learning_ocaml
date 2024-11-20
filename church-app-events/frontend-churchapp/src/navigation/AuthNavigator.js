import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import LoginScreen from '../screens/shared/LoginScreen';
import AdminNavigator from './AdminNavigator';
import UserNavigator from './UserNavigator';

const Stack = createStackNavigator ();

export default function AuthNavigator () {
  return (
    <Stack.Navigator initialRouteName="LoginScreen">
      <Stack.Screen
        name="LoginScreen"
        component={LoginScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="AdminNavigator"
        component={AdminNavigator}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="UserNavigator"
        component={UserNavigator}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
}
