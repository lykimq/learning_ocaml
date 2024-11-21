import React from 'react';
import {View, Text, Button} from 'react-native';

// Display a serving opportunity

const ServingCard = ({serving, onPress}) => {
  return (
    <View style={{margin: 10, padding: 15, borderWidth: 1, borderRadius: 5}}>
      <Text style={{fontSize: 18}}>{serving.title}</Text>
      <Text>{serving.description}</Text>
      <Button title="Sign Up" onPress={() => onPress (serving)} />
    </View>
  );
};

export default ServingCard;
