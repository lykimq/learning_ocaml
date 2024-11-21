import React from 'react';
import {View, Text, Button} from 'react-native';

// Displays user profile
const ProfileScreen = ({navigation}) => {
  return (
    <View>
      <Text>Profile Information</Text>
      <Button title="Logout" onPress={() => navigation.navigate ('Login')} />
    </View>
  );
};

export default ProfileScreen;
