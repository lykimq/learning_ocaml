import React from 'react';
import {createDrawerNavigator} from '@react-navigation/drawer';
import DashboardScreen from '../screens/admin/DashboardScreen';
import ManageEventsScreen from '../screens/admin/ManageEventsScreen';
import ManageHomeGroupScreen from '../screens/admin/ManageHomeGroupScreen';
import ManageMediaScreen from '../screens/admin/ManageMediaScreen';
import ManageServingScreen from '../screens/admin/ManageServingScreen';
import ManageUsersScreen from '../screens/admin/ManageUsersScreen';

const Drawer = createDrawerNavigator ();

// Handles navigation for admin users
const AdminNavigator = () => (
  <Drawer.Navigator initialRouteName="Dashboard">
    <Drawer.Screen name="Dashboard" component={DashboardScreen} />
    <Drawer.Screen name="Manage Events" component={ManageEventsScreen} />
    <Drawer.Screen name="Manage HomeGroups" component={ManageHomeGroupScreen} />
    <Drawer.Screen name="Manage Media" component={ManageMediaScreen} />
    <Drawer.Screen name="Manage Serving" component={ManageServingScreen} />
    <Drawer.Screen name="Manage Users" component={ManageUsersScreen} />
  </Drawer.Navigator>
);

export default AdminNavigator;
