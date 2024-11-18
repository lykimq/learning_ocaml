import React from 'react';
import {createDrawerNavigator} from '@react-navigation/drawer';
import HomeScreen from '../screens/user/HomeScreen';
import EventScreen from '../screens/user/EventScreen';
import HomeGroupScreen from '../screens/user/HomeGroupScreen';
import MediaScreen from '../screens/user/MediaScreen';
import ServingScreen from '../screens/user/ServingScreen';

const Drawer = createDrawerNavigator ();

// Handles navigation for regulars users
const UserNavigator = () => (
  <Drawer.Navigator initialRouteName="Home">
    <Drawer.Screen name="Home" component={HomeScreen} />
    <Drawer.Screen name="Events" component={EventScreen} />
    <Drawer.Screen name="HomeGroups" component={HomeGroupScreen} />
    <Drawer.Screen name="Media" component={MediaScreen} />
    <Drawer.Screen name="Serving" component={ServingScreen} />
  </Drawer.Navigator>
);

export default UserNavigator;
