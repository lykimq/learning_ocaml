import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

const EventForm = ({ eventData, onSubmit }) => {
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (eventData) {
      setEventTitle(eventData.event_title);
      setEventDate(eventData.event_date);
      setEventTime(eventData.event_time);
      setAddress(eventData.address);
      setDescription(eventData.description);
    }
  }, [eventData]);

  const handleSubmit = () => {
    const formData = { event_title: eventTitle, event_date: eventDate, event_time: eventTime, address, description };
    onSubmit(formData);
  };

  return (
    <View style={styles.form}>
      <TextInput
        style={styles.input}
        placeholder="Event Title"
        value={eventTitle}
        onChangeText={setEventTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Event Date (YYYY-MM-DD)"
        value={eventDate}
        onChangeText={setEventDate}
      />
      <TextInput
        style={styles.input}
        placeholder="Event Time (HH:MM)"
        value={eventTime}
        onChangeText={setEventTime}
      />
      <TextInput
        style={styles.input}
        placeholder="Address"
        value={address}
        onChangeText={setAddress}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />
      <Button title={eventData ? 'Update Event' : 'Add Event'} onPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  form: {
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 15,
    paddingLeft: 8,
  },
});

export default EventForm;
