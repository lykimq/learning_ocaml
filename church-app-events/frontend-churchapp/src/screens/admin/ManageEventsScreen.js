import React, {useEffect, useState} from 'react';
import {View, Button, FlatList} from 'react-native';
import {getEvents, deleteEvent} from '../../services/eventService';
import EventCard from '../../components/EventCard';

// Admin manages events (view, delete)
const ManageEventsScreen = () => {
  const [events, setEvents] = useState ([]);

  useEffect (() => {
    fetchEvents ();
  }, []);

  const fetchEvents = async () => {
    const data = await getEvents ();
    setEvents (data);
  };

  const handleDelete = eventId => {
    deleteEvent (eventId);
    fetchEvents ();
  };

  return (
    <View>
      <Button title="Create Event" onPress={() => navigate ('CreateEvent')} />
      <FlatList
        data={events}
        keyExtractor={item => item.id.toString ()}
        renderItem={({item}) => (
          <EventCard event={item} onDelete={() => handleDelete (item.id)} />
        )}
      />
    </View>
  );
};

export default ManageEventsScreen;
