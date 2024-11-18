import React, {useEffect, useState} from 'react';
import {View, FlatList, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {getEvents} from '../../services/eventService';
import EventCard from '../../components/EventCard';

// Showing the event. Tap on event card will see the details of the event
const EventScreen = ({navigation}) => {
  const [events, setEvents] = useState ([]);

  useEffect (() => {
    fetchEvents ();
  }, []);

  const fetchEvents = async () => {
    const data = await getEvents (); // Fetch events from the backend
    setEvents (data);
  };

  const renderEventCard = ({item}) => {
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate ('EventDetails', {eventId: item.id})}
      >
        <EventCard event={item} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upcoming Events</Text>
      <FlatList
        data={events}
        keyExtractor={item => item.id.toString ()}
        renderItem={renderEventCard}
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

export default EventScreen;
