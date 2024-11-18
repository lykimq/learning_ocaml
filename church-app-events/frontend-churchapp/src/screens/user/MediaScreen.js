import React, {useEffect, useState} from 'react';
import {View, FlatList, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {getMedia} from '../../services/mediaService';
import MediaCard from '../../components/MediaCard';

// Display media resources. Each media item can be viewed by the user by tapping on it.
const MediaScreen = ({navigation}) => {
  const [media, setMedia] = useState ([]);

  useEffect (() => {
    fetchMedia ();
  }, []);

  const fetchMedia = async () => {
    const data = await getMedia (); // Fetch media from the backend
    setMedia (data);
  };

  const renderMediaCard = ({item}) => {
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate ('MediaDetails', {mediaId: item.id})}
      >
        <MediaCard media={item} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Media Resources</Text>
      <FlatList
        data={media}
        keyExtractor={item => item.id.toString ()}
        renderItem={renderMediaCard}
      />
    </View>
  );
};

const styles = StyleSheet.create ({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default MediaScreen;
