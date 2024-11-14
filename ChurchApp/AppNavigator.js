import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
import React from 'react';
import HomeScreen from './screens/HomeScreen';
import MediaScreen from './screens/MediaScreen';
import HomeGroupScreen from './screens/HomeGroupScreen';
import EventsScreen from './screens/EventsScreen';
import ServingScreen from './screens/ServingScreen';
import GivingScreen from './screens/GivingScreen';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Tab = createBottomTabNavigator ();

export default function AppNavigator () {
  return (
    <NavigationContainer>
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
              case 'HomeGroup':
                iconName = 'group';
                break;
              case 'Serving':
                iconName = 'volunteer-activism';
                break;
              case 'Giving':
                iconName = 'attach-money';
                break;
            }
            return <MaterialIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#4A90E2',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Media" component={MediaScreen} />
        <Tab.Screen name="Events" component={EventsScreen} />
        <Tab.Screen name="HomeGroup" component={HomeGroupScreen} />
        <Tab.Screen name="Serving" component={ServingScreen} />
        <Tab.Screen name="Giving" component={GivingScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
