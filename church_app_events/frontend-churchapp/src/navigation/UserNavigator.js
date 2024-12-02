import React, { useEffect } from 'react';
import { Alert, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

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
  const { user } = useAuth();
  const navigation = useNavigation();

  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      // Update to use 'LoginScreen' instead of 'Login'
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }],
      });
    }
  }, [user, navigation]);

  // Don't render anything while checking auth status
  if (!user) {
    return null;
  }

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
            case 'Profile':
              iconName = 'person';
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
        // Add header options
        headerStyle: {
          backgroundColor: '#4A90E2',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          headerLeft: () => (
            <Text style={styles.headerText}>
              Welcome, {user.username}
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="Media"
        component={MediaScreen}
        options={{ title: 'Media' }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          title: 'Events',
          // Reset search when navigating to Events
          listeners: ({ navigation }) => ({
            tabPress: () => {
              navigation.reset({
                index: 0,
                routes: [{
                  name: 'Events',
                  params: { reset: Date.now() }
                }],
              });
            },
          }),
        }}
      />
      <Tab.Screen
        name="HomeGroups"
        component={HomeGroupScreen}
        options={{ title: 'Home Groups' }}
      />
      <Tab.Screen
        name="Serving"
        component={ServingScreen}
        options={{ title: 'Serving' }}
      />
      <Tab.Screen
        name="Giving"
        component={GivingScreen}
        options={{ title: 'Giving' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Tab.Screen
        name="Logout"
        component={LogoutScreen}
        options={{
          title: 'Logout',
          tabBarButton: (props) => (
            <TabBarCustomButton
              {...props}
              onPress={() => {
                Alert.alert(
                  'Logout',
                  'Are you sure you want to logout?',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel'
                    },
                    {
                      text: 'Logout',
                      style: 'destructive',
                      onPress: () => navigation.navigate('Logout')
                    }
                  ]
                );
              }}
            />
          )
        }}
      />
    </Tab.Navigator>
  );
}

// Custom TabBar button component for logout
const TabBarCustomButton = ({ onPress, accessibilityState }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.customButton,
      accessibilityState?.selected && styles.customButtonActive
    ]}
  >
    <MaterialIcons
      name="logout"
      size={24}
      color={accessibilityState?.selected ? '#4A90E2' : 'gray'}
    />
  </TouchableOpacity>
);

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
  },
  customButtonActive: {
    borderTopWidth: 2,
    borderTopColor: '#4A90E2',
  },
});
