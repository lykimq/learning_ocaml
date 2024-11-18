import React, {useEffect, useState} from 'react';
import {View, Button, FlatList} from 'react-native';
import {getHomeGroups, deleteHomeGroup} from '../../services/homeGroupService';
import HomeGroupCard from '../../components/HomeGroupCard';

// Allow admin to manage HomeGroups (view, delete)
const ManageHomeGroupScreen = () => {
  const [homeGroups, setHomeGroups] = useState ([]);

  useEffect (() => {
    fetchHomeGroups ();
  }, []);

  const fetchHomeGroups = async () => {
    const data = await getHomeGroups ();
    setHomeGroups (data);
  };

  const handleDelete = groupId => {
    deleteHomeGroup (groupId);
    fetchHomeGroups ();
  };

  return (
    <View>
      <Button
        title="Create HomeGroup"
        onPress={() => navigate ('CreateHomeGroup')}
      />
      <FlatList
        data={homeGroups}
        keyExtractor={item => item.id.toString ()}
        renderItem={({item}) => (
          <HomeGroupCard
            homeGroup={item}
            onDelete={() => handleDelete (item.id)}
          />
        )}
      />
    </View>
  );
};

export default ManageHomeGroupScreen;
