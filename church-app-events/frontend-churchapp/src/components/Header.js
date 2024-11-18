import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';

// A simple header component that displays the app's title or user profile
const Header = ({title, onPressProfile}) => {
  return (
    <View style={{padding: 10, backgroundColor: '#6200EE'}}>
      <Text style={{fontSize: 20, color: 'white'}}>{title}</Text>
      <TouchableOpacity onPress={onPressProfile}>
        <Text style={{color: 'white', textDecorationLine: 'underline'}}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Header;
