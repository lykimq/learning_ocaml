import React from 'react';
import {View, Text, Button} from 'react-native';

// Admin dashboard to view analytics, quick action:
const DashboardScreen = ({navigation}) => (
  <View>
    <Text>Welcome to the Admin Dashboard</Text>
    <Button
      title="Manage Events"
      onPress={() => navigation.navigate ('ManageEventsScreen')}
    />
    <Button
      title="Manage Home Groups"
      onPress={() => navigation.navigate ('ManageHomeGroupsScreen')}
    />
    <Button
      title="Manage Serving"
      onPress={() => navigation.navigate ('ManageServingScreen')}
    />
    <Button
      title="Manage Users"
      onPress={() => navigation.navigate ('ManageUsersScreen')}
    />
    <Button
      title="Manage Media"
      onPress={() => navigation.navigate ('ManageMediaScreen')}
    />
  </View>
);

export default DashboardScreen;
