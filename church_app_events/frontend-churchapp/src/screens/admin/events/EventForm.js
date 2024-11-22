import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput as RNTextInput, TouchableOpacity } from 'react-native';
import { Text, Button, TextInput,HelperText } from 'react-native-paper';
import {
  DatePickerModal,
  TimePickerModal,
  registerTranslation,
} from 'react-native-paper-dates';
import { en } from 'react-native-paper-dates';

// Register English locale for the date picker
registerTranslation('en', en);

const EventForm = ({ eventData, onSubmit }) => {
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(null);
  const [eventTime, setEventTime] = useState(null);
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (eventData) {
      setEventTitle(eventData.event_title || '');
      setEventDate(eventData.event_date ? new Date(eventData.event_date) : null);
      setEventTime(eventData.event_time || null);
      setAddress(eventData.address || '');
      setDescription(eventData.description || '');
    }
  }, [eventData]);

  const handleSubmit = () => {
    const validationErrors = {};
    if (!eventTitle) validationErrors.eventTitle = true;
    if (!eventDate) validationErrors.eventDate = true;
    if (!eventTime) validationErrors.eventTime = true;

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    const formData = {
      event_title: eventTitle,
      event_date: eventDate.toISOString().split('T')[0], // Format: YYYY-MM-DD
      event_time: eventTime, // Keep as HH:MM
      address,
      description,
    };

    onSubmit(formData);
  };

  return (
    <View style={styles.form}>
      <TextInput
        label="Event Title *"
        value={eventTitle}
        onChangeText={setEventTitle}
        style={styles.input}
        error={!!errors.eventTitle}
      />
      <HelperText type="error" visible={!!errors.eventTitle}>
        Event title is required.
      </HelperText>

      <View style={styles.inputGroup}>
        <RNTextInput
          style={styles.input}
          placeholder="Event Date"
          value={eventDate ? eventDate.toDateString() : ''}
          editable={false}
        />
        <Button
          mode="outlined"
          onPress={() => setShowDatePicker(true)}
          style={styles.dateButton}>
          Select Date
        </Button>
      </View>
      <DatePickerModal
        mode="single"
        visible={showDatePicker}
        onDismiss={() => setShowDatePicker(false)}
        date={eventDate}
        onConfirm={(params) => {
          setEventDate(params.date);
          setShowDatePicker(false);
        }}
        locale="en"
      />
      <HelperText type="error" visible={!!errors.eventDate}>
        Event date is required.
      </HelperText>

      <View style={styles.inputGroup}>
        <RNTextInput
          style={styles.input}
          placeholder="Event Time"
          value={eventTime || ''}
          editable={false}
        />
        <Button
          mode="outlined"
          onPress={() => setShowTimePicker(true)}
          style={styles.timeButton}>
          Select Time
        </Button>
      </View>
      <TimePickerModal
        visible={showTimePicker}
        onDismiss={() => setShowTimePicker(false)}
        onConfirm={(params) => {
          setEventTime(`${params.hours}:${params.minutes}`);
          setShowTimePicker(false);
        }}
        locale="en"
      />
      <HelperText type="error" visible={!!errors.eventTime}>
        Event time is required.
      </HelperText>

      <TextInput
        label="Address"
        value={address}
        onChangeText={setAddress}
        style={styles.input}
      />

      <TextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
        multiline
      />

      <Button mode="contained" onPress={handleSubmit} style={styles.submitButton}>
        {eventData ? 'Update Event' : 'Add Event'}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  form: {
    padding: 20,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    marginBottom: 10,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateButton: {
    marginLeft: 10,
    height: 40,
  },
  timeButton: {
    marginLeft: 10,
    height: 40,
  },
  submitButton: {
    marginTop: 20,
  },
});

export default EventForm;
