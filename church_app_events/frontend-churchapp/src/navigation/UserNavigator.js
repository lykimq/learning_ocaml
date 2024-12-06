import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator } from 'react-native-paper';

// Screens
import HomeScreen from '../screens/user/HomeScreen';
import MediaScreen from '../screens/user/MediaScreen';
import EventsScreen from '../screens/user/events/EventsScreen';
import HomeGroupScreen from '../screens/user/homegroups/HomeGroupScreen';
import ServingScreen from '../screens/user/ServingScreen';
import GivingScreen from '../screens/user/GivingScreen';
import LogoutScreen from '../screens/shared/LogoutScreen';
import LoginScreen from '../screens/shared/LoginScreen';

const Tab = createBottomTabNavigator();

const UserNavigator = () => {
  const { user, isLoading } = useAuth();

  const getTabScreens = () => {
    const screens = [
      <Tab.Screen
        key="Home"
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          headerLeft: () => (
            <Text style={styles.headerText}>
              {user ? `Welcome, ${user.username}` : 'Welcome, Guest'}
            </Text>
          ),
        }}
      />,
      <Tab.Screen
        key="Media"
        name="Media"
        component={MediaScreen}
        options={{
          title: 'Media',
        }}
      />,
      <Tab.Screen
        key="Events"
        name="Events"
        component={EventsScreen}
        options={{
          title: 'Events',
        }}
      />,
      <Tab.Screen
        key="HomeGroups"
        name="HomeGroups"
        component={HomeGroupScreen}
        options={{
          title: 'Home Groups',
        }}
      />,
    ];

    if (user) {
      screens.push(
        <Tab.Screen
          key="Serving"
          name="Serving"
          component={ServingScreen}
          options={{
            title: 'Serving',
          }}
        />,
        <Tab.Screen
          key="Giving"
          name="Giving"
          component={GivingScreen}
          options={{
            title: 'Giving',
          }}
        />,
        <Tab.Screen
          key="Logout"
          name="Logout"
          component={LogoutScreen}
          options={{
            title: 'Logout',
          }}
        />
      );
    } else {
      screens.push(
        <Tab.Screen
          key="Login"
          name="Login"
          component={LoginScreen}
          options={{
            title: 'Login',
          }}
        />
      );
    }

    return screens;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Home': iconName = 'home'; break;
            case 'Media': iconName = 'play-circle-outline'; break;
            case 'Events': iconName = 'event'; break;
            case 'HomeGroups': iconName = 'handshake'; break;
            case 'Serving': iconName = 'volunteer-activism'; break;
            case 'Giving': iconName = 'attach-money'; break;
            case 'Profile': iconName = 'person'; break;
            case 'Login': iconName = 'login'; break;
            default: iconName = 'logout';
          }
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: 'gray',
        tabBarLabel: () => null,
        headerStyle: {
          backgroundColor: '#4A90E2',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => null,
        animationEnabled: false,
      })}
    >
      {getTabScreens()}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  headerText: {
    color: '#fff',
    marginLeft: 15,
    fontSize: 16,
  },
  customButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    pointerEvents: 'auto',
  },
  customButtonActive: {
    borderTopWidth: 2,
    borderTopColor: '#4A90E2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBarLabel: {
    fontSize: 12,
    marginTop: 2,
    color: 'gray',
  },
});

export default UserNavigator;