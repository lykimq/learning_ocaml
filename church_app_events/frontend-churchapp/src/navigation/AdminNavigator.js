import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Alert, TouchableOpacity, StyleSheet, Text, View } from 'react-native';

// Screens
import DashboardScreen from '../screens/admin/DashboardScreen';
import ManageEventsScreen from '../screens/admin/events/ManageEventsScreen';
import ManageHomeGroupScreen from '../screens/admin/homegroups/ManageHomeGroupScreen';
import ManageMediaScreen from '../screens/admin/ManageMediaScreen';
import ManageServingScreen from '../screens/admin/ManageServingScreen';
import ManageUsersScreen from '../screens/admin/users/ManageUsersScreen';
import ManageGivingScreen from '../screens/admin/ManageGivingScreen';
import LogoutScreen from '../screens/shared/LogoutScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function AdminTabNavigator() {
  const { user, isAdmin } = useAuth();
  const navigation = useNavigation();

  // Don't render anything if not authorized
  if (!user || !isAdmin) {
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
        // Update header options
        headerStyle: {
          backgroundColor: '#4A90E2',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        // Remove headerRight if not needed or update it
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={{ marginRight: 15 }}
          >
            <MaterialIcons
              name="account-circle"
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          // Update headerLeft to use proper View and Text components
          headerLeft: () => (
            <View style={{ marginLeft: 15 }}>
              <Text style={[styles.headerText, { fontWeight: 'bold' }]}>
                Welcome, {user?.username || 'Guest'}
              </Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Media"
        component={ManageMediaScreen}
        options={{ title: 'Manage Media' }}
      />
      <Tab.Screen
        name="Events"
        component={ManageEventsScreen}
        options={{ title: 'Manage Events' }}
      />
      <Tab.Screen
        name="HomeGroups"
        component={ManageHomeGroupScreen}
        options={{ title: 'Manage Home Groups' }}
      />
      <Tab.Screen
        name="Serving"
        component={ManageServingScreen}
        options={{ title: 'Manage Serving' }}
      />
      <Tab.Screen
        name="Giving"
        component={ManageGivingScreen}
        options={{ title: 'Manage Giving' }}
      />
      <Tab.Screen
        name="Users"
        component={ManageUsersScreen}
        options={{ title: 'Manage Users' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
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
                // Show confirmation dialog
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
                      onPress: () =>
                        navigation.getParent()?.reset({
                          index: 0,
                          routes: [{ name: 'Logout' }]
                        })
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
