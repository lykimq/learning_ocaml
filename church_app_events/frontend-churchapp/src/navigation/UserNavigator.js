import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

// Screens
import HomeScreen from '../screens/user/HomeScreen';
import MediaScreenUser from '../screens/user/media/MediaScreenUser';
import MediaDetailsUser from '../screens/user/media/MediaDetailsUser';
import MediaScreen from '../screens/user/media/MediaScreen';
import MediaDetailsNonLogin from '../screens/user/media/MediaDetailsNonLogin';
import EventsScreen from '../screens/user/events/EventsScreen';
import HomeGroupScreen from '../screens/user/homegroups/HomeGroupScreen';
import ServingScreen from '../screens/user/servings/ServingScreen';
import GivingScreen from '../screens/user/GivingScreen';
import LogoutScreen from '../screens/shared/LogoutScreen';
import LoginScreen from '../screens/shared/LoginScreen';
import CustomTabButton from './CustomTabButton';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const UserNavigator = () => {
  const { user, isLoading } = useAuth();
  const navigation = useNavigation();

  // Media for user logged in
  const MediaStackUser = () => {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MediaScreenUser" component={MediaScreenUser} />
        <Stack.Screen name="MediaDetailsUser" component={MediaDetailsUser} />
      </Stack.Navigator>
    );
  };

  // Media for non user logged in
  const MediaStack = () => {
    console.log('Rendering MediaStack');
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MediaScreen" component={MediaScreen} />
        <Stack.Screen name="MediaDetailsNonLogin" component={MediaDetailsNonLogin} />
      </Stack.Navigator>
    );
  };

  const getTabScreens = () => {
    const screens = [
      <Tab.Screen
        key="Home"
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarButton: (props) => (
            <CustomTabButton {...props} routeName="Home" >
              <MaterialIcons name="home" size={24} color={props.color} />
            </CustomTabButton>
          ),
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
        // conditionally render MediaScreenUser or MediaScreen
        component={user ? MediaStackUser : MediaStack}
        options={{
          title: 'Media',
          tabBarButton: (props) => (
            <CustomTabButton {...props} routeName="Media" >
              <MaterialIcons name="play-circle-outline" size={24} color={props.color} />
            </CustomTabButton>
          )
        }}
      />,
      <Tab.Screen
        key="Events"
        name="Events"
        component={EventsScreen}
        options={{
          title: 'Events',
          tabBarButton: (props) => (
            <CustomTabButton {...props} routeName="Events" >
              <MaterialIcons name="event" size={24} color={props.color} />
            </CustomTabButton>
          )
        }}
      />,
      <Tab.Screen
        key="HomeGroups"
        name="HomeGroups"
        component={HomeGroupScreen}
        options={{
          title: 'Home Groups',
          tabBarButton: (props) => (
            <CustomTabButton {...props} routeName="HomeGroups" >
              <MaterialIcons name="handshake" size={24} color={props.color} />
            </CustomTabButton>
          )
        }}
      />,
      <Tab.Screen
        key="Serving"
        name="Serving"
        component={ServingScreen}
        options={{
          title: 'Serving',
          tabBarButton: (props) => (
            <CustomTabButton {...props} routeName="Serving" >
              <MaterialIcons name="volunteer-activism" size={24} color={props.color} />
            </CustomTabButton>
          )
        }}
      />,
      <Tab.Screen
        key="Giving"
        name="Giving"
        component={GivingScreen}
        options={{
          title: 'Giving',
          tabBarButton: (props) => (
            <CustomTabButton {...props} routeName="Giving" >
              <MaterialIcons name="attach-money" size={24} color={props.color} />
            </CustomTabButton>
          )
        }}
      />,
    ];

    if (user) {
      screens.push(
        <Tab.Screen
          key="Logout"
          name="Logout"
          component={LogoutScreen}
          options={{
            title: 'Logout',
            tabBarButton: (props) => (
              <CustomTabButton {...props} routeName="Logout" >
                <MaterialIcons name="logout" size={24} color={props.color} />
              </CustomTabButton>
            )
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
            tabBarButton: (props) => (
              <CustomTabButton {...props} routeName="Login" >
                <MaterialIcons name="login" size={24} color={props.color} />
              </CustomTabButton>
            )
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