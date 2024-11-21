import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const EventCard = ({ event, onDelete, onEdit }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{event.event_title}</Text>
      <Text>{event.event_date} at {event.event_time}</Text>
      <Text>{event.address}</Text>
      <Text>{event.description}</Text>
      {onEdit && <Button title="Edit" onPress={onEdit} />}
      {onDelete && <Button title="Delete" onPress={onDelete} />}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default EventCard;
