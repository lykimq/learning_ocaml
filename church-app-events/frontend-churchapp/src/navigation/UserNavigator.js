import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {NavigationContainer} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import GivingScreen from '../screens/user/GivingScreen';
import MediaScreen from '../screens/user/MediaScreen';
import HomeScreen from '../screens/user/HomeScreen';
import HomeGroupScreen from '../screens/user/HomeGroupScreen';
import ServingScreen from '../screens/user/ServingScreen';
import EventsScreen from '../screens/user/EventsScreen';
import UsersScreen from '../screens/user/UsersScreen';

// Stack Navigator for the DashBoardScreen
function HomeStack () {
  return (
    <Stack.Navigator initialRouteName="HomeScreen">
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="MediaScreen" component={MediaScreen} />
      <Stack.Screen name="EventsScreen" component={EventsScreen} />
      <Stack.Screen name="HomeGroupScreen" component={HomeGroupScreen} />
      <Stack.Screen name="ServingScreen" component={ServingScreen} />
      <Stack.Screen name="GivingScreen" component={GivingScreen} />
      <Stack.Screen name="UsersScreen" component={UsersScreen} />
    </Stack.Navigator>
  );
}

// Stack Navigator for Media
function MediaStack () {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MediaScreen" component={MediaScreen} />
    </Stack.Navigator>
  );
}

// Stack Navigator for Events
function EventsStack () {
  return (
    <Stack.Navigator>
      <Stack.Screen name="EventsScreen" component={EventsScreen} />
    </Stack.Navigator>
  );
}

// Stack Navigator for Home Groups
function HomeGroupStack () {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeGroupScreen" component={HomeGroupScreen} />
    </Stack.Navigator>
  );
}

// Stack Navigator for Serving
function ServingStack () {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ServingScreen" component={ServingScreen} />
    </Stack.Navigator>
  );
}

// Stack Navigator for Giving
function GivingStack () {
  return (
    <Stack.Navigator>
      <Stack.Screen name="GivingScreen" component={GivingScreen} />
    </Stack.Navigator>
  );
}

// Stack Navigator for Users
function UsersStack () {
  return (
    <Stack.Navigator>
      <Stack.Screen name="UsersScreen" component={UsersScreen} />
    </Stack.Navigator>
  );
}

const Tab = createBottomTabNavigator ();
const Stack = createStackNavigator ();

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
          }
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: 'gray',
        tabBarLabel: () => null,
      })}
    >
      {/* Nesting Stack Navigators for each Tab */}
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Media" component={MediaStack} />
      <Tab.Screen name="Events" component={EventsStack} />
      <Tab.Screen name="HomeGroups" component={HomeGroupStack} />
      <Tab.Screen name="Serving" component={ServingStack} />
      <Tab.Screen name="Giving" component={GivingStack} />
      <Tab.Screen name="Users" component={UsersStack} />
    </Tab.Navigator>
  );
}
