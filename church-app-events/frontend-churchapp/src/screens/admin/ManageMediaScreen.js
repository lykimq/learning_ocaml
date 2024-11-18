import React, {useEffect, useState} from 'react';
import {View, Button, FlatList} from 'react-native';
import {getMedia, deleteMedia} from '../../services/mediaService';
import MediaCard from '../../components/MediaCard';

// Allows admin to manage media (view, delete)
const ManageMediaScreen = () => {
  const [media, setMedia] = useState ([]);

  useEffect (() => {
    fetchMedia ();
  }, []);

  const fetchMedia = async () => {
    const data = await getMedia ();
    setMedia (data);
  };

  const handleDelete = mediaId => {
    deleteMedia (mediaId);
    fetchMedia ();
  };

  return (
    <View>
      <Button title="Upload Media" onPress={() => navigate ('UploadMedia')} />
      <FlatList
        data={media}
        keyExtractor={item => item.id.toString ()}
        renderItem={({item}) => (
          <MediaCard media={item} onDelete={() => handleDelete (item.id)} />
        )}
      />
    </View>
  );
};

export default ManageMediaScreen;
