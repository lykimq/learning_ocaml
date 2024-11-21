import React from 'react';
import {View, Text, Button, Image} from 'react-native';

const MediaCard = ({media, onPress}) => {
  // Display Media Content
  return (
    <View style={{margin: 10, padding: 15, borderWidth: 1, borderRadius: 5}}>
      <Image source={{uri: media.file_url}} style={{width: 100, height: 100}} />
      <Text>{media.title}</Text>
      <Button title="View" onPress={() => onPress (media)} />
    </View>
  );
};

export default MediaCard;
