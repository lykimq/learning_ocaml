import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import LoginScreen from '../screens/shared/LoginScreen';
import {NavigationContainer} from '@react-navigation/native';
import AdminNavigator from './AdminNavigator';
import UserNavigator from './UserNavigator';
const Stack = createStackNavigator ();

export default function AuthNavigator () {
  return (
    <Stack.Navigator initialRouteName="LoginScreen">
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="AdminNavigator" component={AdminNavigator} />
      <Stack.Screen name="UserNavigator" component={UserNavigator} />
    </Stack.Navigator>
  );
}
