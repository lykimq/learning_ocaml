import React, {useEffect, useState} from 'react';
import {View, FlatList, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {getServingOpportunities} from '../../services/servingService';
import ServingCard from '../../components/ServingCard';

// Display a list of serving opportunities for the user to get involve
// Each opportunity will be shown in a card format.
const ServingScreen = ({navigation}) => {
  const [servingOpportunities, setServingOpportunities] = useState ([]);

  useEffect (() => {
    fetchServingOpportunities ();
  }, []);

  const fetchServingOpportunities = async () => {
    const data = await getServingOpportunities (); // Fetch serving opportunities from the backend
    setServingOpportunities (data);
  };

  const renderServingCard = ({item}) => {
    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate ('ServingDetails', {servingId: item.id})}
      >
        <ServingCard serving={item} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Serving Opportunities</Text>
      <FlatList
        data={servingOpportunities}
        keyExtractor={item => item.id.toString ()}
        renderItem={renderServingCard}
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

export default ServingScreen;
