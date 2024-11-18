import React, {useEffect, useState} from 'react';
import {View, Button, FlatList} from 'react-native';
import {
  getServingOpportunities,
  deleteServing,
} from '../../services/servingService';
import ServingCard from '../../components/ServingCard';

// Allows admin to manage serving (view, delete)
const ManageServingScreen = () => {
  const [serving, setServing] = useState ([]);

  useEffect (() => {
    fetchServing ();
  }, []);

  const fetchServing = async () => {
    const data = await getServingOpportunities ();
    setServing (data);
  };

  const handleDelete = servingId => {
    deleteServing (servingId);
    fetchServing ();
  };

  return (
    <View>
      <Button
        title="Create Serving Opportunity"
        onPress={() => navigate ('CreateServing')}
      />
      <FlatList
        data={serving}
        keyExtractor={item => item.id.toString ()}
        renderItem={({item}) => (
          <ServingCard serving={item} onDelete={() => handleDelete (item.id)} />
        )}
      />
    </View>
  );
};

export default ManageServingScreen;
