import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation, CommonActions } from '@react-navigation/native';
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
  const { user, isLoading } = useAuth();
  const navigation = useNavigation();
  const [isWeb] = React.useState(Platform.OS === 'web');

  const handleLoginPress = React.useCallback(() => {
    console.log('Login button pressed', {
      platform: Platform.OS,
      timestamp: new Date().toISOString()
    });

    navigation.navigate('LoginScreen');
  }, [navigation]);

  const LoginButton = React.useCallback(() => (
    <TouchableOpacity
      onPress={handleLoginPress}
      style={styles.headerLoginButton}
      testID="loginButton"
    >
      <Text style={styles.headerLoginText}>Login</Text>
    </TouchableOpacity>
  ), [handleLoginPress]);

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
        options={{ title: 'Media' }}
      />,
      <Tab.Screen
        key="Events"
        name="Events"
        component={EventsScreen}
        options={{ title: 'Events' }}
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
                onPress={handleLoginPress}
                testID="loginTabButton"
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
                {isWeb && (
                  <Text style={styles.tabBarLabel}>
                    Login
                  </Text>
                )}
              </TouchableOpacity>
            ),
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
        headerRight: () => !user && <LoginButton />,
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
  headerLoginButton: {
    marginRight: 15,
    padding: 8,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerLoginText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  customButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
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
