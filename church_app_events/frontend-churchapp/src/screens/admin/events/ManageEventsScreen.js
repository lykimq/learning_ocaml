import React, { useState, useEffect } from 'react';
import { View, Button, FlatList, Text, Alert, StyleSheet } from 'react-native';
import { getEvents, deleteEvent } from '../../../services/eventService';
import EventCard from '../../../components/EventCard';
import EventForm from './EventForm';

const ManageEventsScreen = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  // List of events
  const fetchEvents = async () => {
    try {
      const eventsData = await getEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };


  // Delete event
  const handleDelete = (id) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel' },
        { text: 'OK', onPress: async () => await deleteEvent(id).then(fetchEvents) },
      ],
      { cancelable: true }
    );
  };

  // Handle form submission
  const handleFormSumbit = () => {
    setShowForm(false); //hide form
    fetchEvents(); // refresh events
    setSelectedEvent(null); // clear selected event
  }

  return (
    <View style={styles.container}>
      {showForm ? (
        <EventForm eventData={selectedEvent} onSubmit={(data) => console.log('Submit data', data)} />
      ) : (
        <>
          <Button title="Add Event" onPress={() => setShowForm(true)} />
          <FlatList
            data={events}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <EventCard
                event={item}
                onDelete={() => handleDelete(item.id)}
                onEdit={() => {
                  setSelectedEvent(item);
                  setShowForm(true);
                }}
              />
            )}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default ManageEventsScreen;
