import React, {useEffect, useState} from 'react';
import {View, FlatList, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {getHomeGroups} from '../../services/homeGroupService';
import HomeGroupCard from '../../components/HomeGroupCard';

// Display a list of home groups. Each group represented as a card
// User can tap on a card to view more details
const HomeGroupScreen = ({navigation}) => {
  const [homeGroups, setHomeGroups] = useState ([]);

  useEffect (() => {
    fetchHomeGroups ();
  }, []);

  const fetchHomeGroups = async () => {
    const data = await getHomeGroups (); // Fetch home groups from the backend
    setHomeGroups (data);
  };

  const renderHomeGroupCard = ({item}) => {
    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate ('HomeGroupDetails', {homeGroupId: item.id})}
      >
        <HomeGroupCard homeGroup={item} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a Home Group</Text>
      <FlatList
        data={homeGroups}
        keyExtractor={item => item.id.toString ()}
        renderItem={renderHomeGroupCard}
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

export default HomeGroupScreen;
