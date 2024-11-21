import React from 'react';
import {View, Text, Button} from 'react-native';

// Display a single home group

const HomeGroupCard = ({homeGroup, onPress}) => {
  return (
    <View style={{margin: 10, padding: 15, borderWidth: 1, borderRadius: 5}}>
      <Text style={{fontSize: 18}}>{homeGroup.name}</Text>
      <Text>{homeGroup.description}</Text>
      <Button title="Join" onPress={() => onPress (homeGroup)} />
    </View>
  );
};

export default HomeGroupCard;
