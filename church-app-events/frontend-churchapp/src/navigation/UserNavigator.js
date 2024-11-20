import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import GivingScreen from '../screens/user/GivingScreen';
import MediaScreen from '../screens/user/MediaScreen';
import HomeScreen from '../screens/user/HomeScreen';
import HomeGroupScreen from '../screens/user/HomeGroupScreen';
import ServingScreen from '../screens/user/ServingScreen';
import EventsScreen from '../screens/user/EventsScreen';
import UsersScreen from '../screens/user/UsersScreen';
import LoginScreen from '../screens/shared/LoginScreen';

const Tab = createBottomTabNavigator ();

export default function UserNavigator () {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({color, size}) => {
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
            case 'Login':
              iconName = 'login';
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
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Media" component={MediaScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="HomeGroups" component={HomeGroupScreen} />
      <Tab.Screen name="Serving" component={ServingScreen} />
      <Tab.Screen name="Giving" component={GivingScreen} />
      <Tab.Screen name="Users" component={UsersScreen} />
      <Tab.Screen name="Login" component={LoginScreen} />

    </Tab.Navigator>
  );
}
