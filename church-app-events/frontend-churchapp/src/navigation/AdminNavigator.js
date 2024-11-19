import React from 'react';
import DashboardScreen from '../screens/admin/DashboardScreen';
import ManageEventsScreen from '../screens/admin/ManageEventsScreen';
import ManageHomeGroupScreen from '../screens/admin/ManageHomeGroupScreen';
import ManageMediaScreen from '../screens/admin/ManageMediaScreen';
import ManageServingScreen from '../screens/admin/ManageServingScreen';
import ManageUsersScreen from '../screens/admin/ManageUsersScreen';
import ManageGivingScreen from '../screens/admin/ManageGivingScreen';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {NavigationContainer} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Stack Navigator for the DashBoardScreen
function DashBoardStack () {
  return (
    <Stack.Navigator initialRouteName="DashboardScreen">
      <Stack.Screen name="DashboardScreen" component={DashboardScreen} />
      <Stack.Screen name="ManageMediaScreen" component={ManageMediaScreen} />
      <Stack.Screen name="ManageEventsScreen" component={ManageEventsScreen} />
      <Stack.Screen
        name="ManageHomeGroupScreen"
        component={ManageHomeGroupScreen}
      />
      <Stack.Screen
        name="ManageServingScreen"
        component={ManageServingScreen}
      />
      <Stack.Screen name="ManageGivingScreen" component={ManageGivingScreen} />
      <Stack.Screen name="ManageUsersScreen" component={ManageUsersScreen} />
    </Stack.Navigator>
  );
}

// Stack Navigator for Media
function MediaStack () {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ManageMediaScreen" component={ManageMediaScreen} />
    </Stack.Navigator>
  );
}

// Stack Navigator for Events
function EventsStack () {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ManageEventsScreen" component={ManageEventsScreen} />
    </Stack.Navigator>
  );
}

// Stack Navigator for Home Groups
function HomeGroupStack () {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ManageHomeGroupScreen"
        component={ManageHomeGroupScreen}
      />
    </Stack.Navigator>
  );
}

// Stack Navigator for Serving
function ServingStack () {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ManageServingScreen"
        component={ManageServingScreen}
      />
    </Stack.Navigator>
  );
}

// Stack Navigator for Giving
function GivingStack () {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ManageGivingScreen" component={ManageGivingScreen} />
    </Stack.Navigator>
  );
}

// Stack Navigator for Users
function UsersStack () {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ManageUsersScreen" component={ManageUsersScreen} />
    </Stack.Navigator>
  );
}

const Tab = createBottomTabNavigator ();
const Stack = createStackNavigator ();

export default function AdminNavigator () {
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
      <Tab.Screen name="Home" component={DashBoardStack} />
      <Tab.Screen name="Media" component={MediaStack} />
      <Tab.Screen name="Events" component={EventsStack} />
      <Tab.Screen name="HomeGroups" component={HomeGroupStack} />
      <Tab.Screen name="Serving" component={ServingStack} />
      <Tab.Screen name="Giving" component={GivingStack} />
      <Tab.Screen name="Users" component={UsersStack} />
    </Tab.Navigator>
  );
}
