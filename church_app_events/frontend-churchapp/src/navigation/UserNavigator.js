import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator } from 'react-native-paper';
import * as userService from '../services/userService';

// Screens
import HomeScreen from '../screens/user/HomeScreen';
import MediaScreen from '../screens/user/MediaScreen';
import EventsScreen from '../screens/user/events/EventsScreen';
import HomeGroupScreen from '../screens/user/HomeGroupScreen';
import ServingScreen from '../screens/user/ServingScreen';
import GivingScreen from '../screens/user/GivingScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import LogoutScreen from '../screens/shared/LogoutScreen';


const Tab = createBottomTabNavigator();

export default function UserNavigator() {
  const { user, isLoading, setUser } = useAuth();
  const navigation = useNavigation();

  console.log('UserNavigator - Current user state:', user);


  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('UserNavigator - Logout error:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  const getTabScreens = () => {
    // Base screens available to all users
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
        options={{ title: 'Media' }}
      />,
      <Tab.Screen
        key="Events"
        name="Events"
        component={EventsScreen}
        options={{
          title: 'Events',
          listeners: ({ navigation }) => ({
            tabPress: () => {
              navigation.setParams({ reset: Date.now() });
            },
          }),
        }}
      />,
      <Tab.Screen
        key="HomeGroups"
        name="HomeGroups"
        component={HomeGroupScreen}
        options={{ title: 'Home Groups' }}
      />
    ];

    if (user) {
      screens.push(
        <Tab.Screen
          key="Serving"
          name="Serving"
          component={ServingScreen}
          options={{ title: 'Serving' }}
        />,
        <Tab.Screen
          key="Giving"
          name="Giving"
          component={GivingScreen}
          options={{ title: 'Giving' }}
        />,
        <Tab.Screen
          key="Profile"
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'Profile' }}
        />,
        <Tab.Screen
          key="Logout"
          name="Logout"
          component={LogoutScreen}
          options={{
            title: 'Logout',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="logout" size={size} color={color} />
            ),
            tabBarButton: (props) => (
              <TouchableOpacity
                {...props}
                onPress={handleLogout}
                style={[
                  styles.customButton,
                  props.accessibilityState?.selected && styles.customButtonActive
                ]}
              >
                <MaterialIcons
                  name="logout"
                  size={24}
                  color={props.accessibilityState?.selected ? '#4A90E2' : 'gray'}
                />
              </TouchableOpacity>
            )
          }}
        />
      );
    } else {
      screens.push(
        <Tab.Screen
          key="Login"
          name="Login"
          component={HomeScreen}
          options={{
            title: 'Login',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="login" size={size} color={color} />
            ),
            tabBarButton: (props) => (
              <TouchableOpacity
                {...props}
                onPress={() => navigation.navigate('LoginScreen')}
                style={[
                  styles.customButton,
                  props.accessibilityState?.selected && styles.customButtonActive
                ]}
              >
                <MaterialIcons
                  name="login"
                  size={24}
                  color={props.accessibilityState?.selected ? '#4A90E2' : 'gray'}
                />
              </TouchableOpacity>
            )
          }}
        />
      );
    }

    return screens;
  };

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
            case 'Logout': iconName = 'logout'; break;
            case 'Login': iconName = 'login'; break;
            default: iconName = 'circle';
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
  loginButton: {
    marginRight: 15,
    padding: 8,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  customButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});
