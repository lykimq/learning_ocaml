import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, TextInput, Button, Title } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addEvent, updateEvent } from '../../../services/events/eventService';

const EventForm = ({ eventData, onSubmit }) => {
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [eventTime, setEventTime] = useState(new Date());
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || eventDate;
    setShowDatePicker(Platform.OS === 'ios');
    setEventDate(currentDate);
  };

  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || eventTime;
    setShowTimePicker(Platform.OS === 'ios');
    setEventTime(currentTime);
  };

  useEffect(() => {
    if (eventData) {
      setEventTitle(eventData.event_title || '');
      setEventDate(eventData.event_date ? new Date(eventData.event_date) : new Date());
      setEventTime(eventData.event_time ? new Date(`1970-01-01T${eventData.event_time}`) : new Date());
      setAddress(eventData.address || '');
      setDescription(eventData.description || '');
    }
  }, [eventData]);

  const handleSubmit = async () => {
    const validationErrors = {};
    if (!eventTitle) validationErrors.eventTitle = true;
    if (!eventDate) validationErrors.eventDate = true;
    if (!eventTime) validationErrors.eventTime = true;

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    const formData = {
      event_title: eventTitle,
      event_date: eventDate.toISOString().split('T')[0], // Format: YYYY-MM-DD
      event_time: eventTime.toTimeString().split(' ')[0].slice(0, 5), // Format: HH:MM
      address,
      description,
    };

    // Log the form data to ensure it's correct
    console.log('Submitting form data:', formData);

    // Call the addEvent from eventServices
    try {
      let result;
      if (eventData?.id) {
        result = await updateEvent(eventData.id, formData);
        console.log('Event added successfully:', result)
      } else {
        // If no ID, create new event
        result = await addEvent(formData);
        console.log('Event added successfully:', result)
      }
      if (result) {
        onSubmit(formData);
      }
    } catch (error) {
      console.error('Error adding event:', error)
      Alert.alert('Error', 'Failed to add event');
    }

  };

  const DateTimeSelector = ({ mode, value, onChange, showPicker, setShowPicker }) => {
    if (Platform.OS === 'web') {
      return (
        <input
          type={mode}
          value={
            mode === 'date'
              ? value.toISOString().split('T')[0]
              : value.toTimeString().split(' ')[0].slice(0, 5)
          }
          onChange={(e) => {
            let newDate = new Date(value);
            if (mode === 'date') {
              newDate = new Date(e.target.value);
            } else {
              const [hours, minutes] = e.target.value.split(':');
              newDate.setHours(hours);
              newDate.setMinutes(minutes);
            }
            onChange({ type: 'set', nativeEvent: { timestamp: newDate } }, newDate);
          }}
          style={{
            padding: 10,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: '#ccc',
            marginRight: 10,
            flex: 1,
          }}
        />
      );
    }

    return showPicker && (
      <DateTimePicker
        testID="dateTimePicker"
        value={value}
        mode={mode}
        is24Hour={true}
        display="default"
        onChange={onChange}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Create New Event</Title>

      <TextInput
        label="Event Title"
        value={eventTitle}
        onChangeText={setEventTitle}
        style={styles.input}
        mode="outlined"
      />

      <View style={styles.dateTimeContainer}>
        <TextInput
          label="Event Date"
          value={eventDate.toDateString()}
          style={[styles.input, styles.dateTimeInput]}
          mode="outlined"
          editable={false}
        />
        {Platform.OS === 'web' ? (
          <DateTimeSelector
            mode="date"
            value={eventDate}
            onChange={onDateChange}
            showPicker={showDatePicker}
            setShowPicker={setShowDatePicker}
          />
        ) : (
          <Button
            onPress={() => setShowDatePicker(true)}
            mode="contained"
            style={styles.dateTimeButton}
            compact={Platform.OS !== 'web'}
            labelStyle={Platform.OS === 'web' ? null : { fontSize: 12 }}
          >
            {Platform.OS === 'web' ? 'Choose Date' : 'Select'}
          </Button>
        )}
      </View>

      <View style={styles.dateTimeContainer}>
        <TextInput
          label="Event Time"
          value={eventTime.toLocaleTimeString()}
          style={[styles.input, styles.dateTimeInput]}
          mode="outlined"
          editable={false}
        />
        {Platform.OS === 'web' ? (
          <DateTimeSelector
            mode="time"
            value={eventTime}
            onChange={onTimeChange}
            showPicker={showTimePicker}
            setShowPicker={setShowTimePicker}
          />
        ) : (
          <Button
            onPress={() => setShowTimePicker(true)}
            mode="contained"
            style={styles.dateTimeButton}
            compact={Platform.OS !== 'web'}
            labelStyle={Platform.OS === 'web' ? null : { fontSize: 12 }}
          >
            {Platform.OS === 'web' ? 'Choose Time' : 'Select'}
          </Button>
        )}
      </View>

      <TextInput
        label="Address (optional)"
        value={address}
        onChangeText={setAddress}
        style={styles.input}
        mode="outlined"
      />

      <TextInput
        label="Description (optional)"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
        mode="outlined"
        multiline
        numberOfLines={4}
      />

      <Button mode="contained" onPress={handleSubmit} style={styles.submitButton}>
        Add Event
      </Button>

      {Platform.OS !== 'web' && showDatePicker && (
        <DateTimeSelector
          mode="date"
          value={eventDate}
          onChange={onDateChange}
          showPicker={showDatePicker}
          setShowPicker={setShowDatePicker}
        />
      )}

      {Platform.OS !== 'web' && showTimePicker && (
        <DateTimeSelector
          mode="time"
          value={eventTime}
          onChange={onTimeChange}
          showPicker={showTimePicker}
          setShowPicker={setShowTimePicker}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: Platform.OS === 'web' ? 0 : 1,
    maxWidth: Platform.OS === 'web' ? 600 : '100%',
    width: '100%',
    padding: 20,
    backgroundColor: '#f5f5f5',
    alignSelf: 'center',
    ...(Platform.OS === 'web' && {
      marginHorizontal: 'auto',
      marginVertical: 20,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#3f51b5',
  },
  input: {
    marginBottom: 15,
    height: 48,
    backgroundColor: '#fff',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center',
  },
  dateTimeInput: {
    flex: 0.8,
    marginRight: 10,
    height: 48,
    backgroundColor: '#fff',
  },
  dateTimeButton: {
    backgroundColor: '#3f51b5',
    ...(Platform.OS === 'web' ? {
      height: 48,
      width: 90,
      justifyContent: 'center',
    } : {
      height: 45, // Much smaller height for mobile
      paddingVertical: 2, // Minimal vertical padding
      paddingHorizontal: 8, // Reduced horizontal padding
      minHeight: 0,
      alignSelf: 'center',
    }),
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 8,
    backgroundColor: '#3f51b5',
    alignSelf: 'center',
    paddingHorizontal: 30,
    minWidth: 150,
    maxWidth: 200,
  },
});

export default EventForm;
