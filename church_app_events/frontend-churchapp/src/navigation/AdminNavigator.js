import React from 'react';
import DashboardScreen from '../screens/admin/DashboardScreen';
import ManageEventsScreen from '../screens/admin/events/ManageEventsScreen';
import ManageHomeGroupScreen from '../screens/admin/ManageHomeGroupScreen';
import ManageMediaScreen from '../screens/admin/ManageMediaScreen';
import ManageServingScreen from '../screens/admin/ManageServingScreen';
import ManageUsersScreen from '../screens/admin/ManageUsersScreen';
import ManageGivingScreen from '../screens/admin/ManageGivingScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import LogoutScreen from '../screens/shared/LogoutScreen';

const Tab = createBottomTabNavigator();

export default function AdminTabNavigator() {

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Media':
              iconName = 'play-circle-outline';
              break;
            case 'Events':
              iconName = 'event';
              break;
            case 'HomeGroups':
              iconName = 'handshake';
              break;
            case 'Serving':
              iconName = 'volunteer-activism';
              break;
            case 'Giving':
              iconName = 'attach-money';
              break;
            case 'Users':
              iconName = 'people';
              break;
            case 'Logout':
              iconName = 'logout';
              break;
          }
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: 'gray',
        tabBarLabel: () => null,
      })}
    >
      {/* Nesting Stack Navigators for each Tab */}
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Media" component={ManageMediaScreen} />
      <Tab.Screen
        name="Events"
        component={ManageEventsScreen}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Events', { reset: Date.now() });
          },
        })}
      />
      <Tab.Screen name="HomeGroups" component={ManageHomeGroupScreen} />
      <Tab.Screen name="Serving" component={ManageServingScreen} />
      <Tab.Screen name="Giving" component={ManageGivingScreen} />
      <Tab.Screen name="Users" component={ManageUsersScreen} />
      <Tab.Screen
        name="Logout"
        component={LogoutScreen}
      />
    </Tab.Navigator>
  );
}