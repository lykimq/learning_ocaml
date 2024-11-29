import React from 'react';
import DashboardScreen from '../screens/admin/DashboardScreen';
import ManageEventsScreen from '../screens/admin/events/ManageEventsScreen';
import ManageHomeGroupScreen from '../screens/admin/homegroups/ManageHomeGroupScreen';
import ManageMediaScreen from '../screens/admin/ManageMediaScreen';
import ManageServingScreen from '../screens/admin/ManageServingScreen';
import ManageUsersScreen from '../screens/admin/users/ManageUsersScreen';
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
      <Tab.Screen name="Home" component={DashboardScreen}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Home', { reset: Date.now() });
          },
        })}
      />
      <Tab.Screen name="Media" component={ManageMediaScreen}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Media', { reset: Date.now() });
          },
        })}
      />
      <Tab.Screen
        name="Events"
        component={ManageEventsScreen}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Events', { reset: Date.now() });
          },
        })}
      />
      <Tab.Screen name="HomeGroups" component={ManageHomeGroupScreen}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('HomeGroups', { reset: Date.now() });
          },
        })}
      />
      <Tab.Screen name="Serving" component={ManageServingScreen}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Serving', { reset: Date.now() });
          },
        })}
      />
      <Tab.Screen name="Giving" component={ManageGivingScreen}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Giving', { reset: Date.now() });
          },
        })}
      />
      <Tab.Screen name="Users" component={ManageUsersScreen}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Users', { reset: Date.now() });
          },
        })}
      />
      <Tab.Screen
        name="Logout"
        component={LogoutScreen}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Logout', { reset: Date.now() });
          },
        })}
      />
    </Tab.Navigator>
  );
}
