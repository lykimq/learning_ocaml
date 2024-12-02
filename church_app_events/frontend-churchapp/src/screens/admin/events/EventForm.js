import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, KeyboardAvoidingView, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Title, useTheme } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addEvent, updateEvent } from '../../../services/events/eventService';
import { format } from 'date-fns';

const EventForm = ({ eventData, onSubmit }) => {
  const theme = useTheme();
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [eventTime, setEventTime] = useState(new Date());
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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
      // TODO call showAlert here
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
          style={styles.webDateTimeInput}
        />
      );
    }

    const handleButtonPress = () => {
      setShowPicker(true);
    };

    return (
      <>
        <Button
          onPress={handleButtonPress}
          mode="outlined"
          style={styles.dateTimeButton}
        >
          {format(value, mode === 'date' ? 'MMM dd, yyyy' : 'hh:mm a')}
        </Button>
        {showPicker && (
          <DateTimePicker
            testID={`${mode}Picker`}
            value={value}
            mode={mode}
            is24Hour={true}
            display="default"
            onChange={(event, selectedValue) => {
              setShowPicker(false);
              if (event.type === 'set' && selectedValue) {
                onChange(event, selectedValue);
              }
            }}
          />
        )}
      </>
    );
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Title style={styles.title}>
            {eventData?.id ? 'Edit Event' : 'Create New Event'}
          </Title>

          <TextInput
            label="Event Title"
            value={eventTitle}
            onChangeText={setEventTitle}
            style={styles.input}
            mode="outlined"
            error={errors.eventTitle}
          />

          <View style={styles.dateTimeContainer}>
            <Text style={styles.dateTimeLabel}>Date:</Text>
            <DateTimeSelector
              mode="date"
              value={eventDate}
              onChange={(_, selectedDate) => setEventDate(selectedDate || eventDate)}
              showPicker={showDatePicker}
              setShowPicker={setShowDatePicker}
            />
          </View>

          <View style={styles.dateTimeContainer}>
            <Text style={styles.dateTimeLabel}>Time:</Text>
            <DateTimeSelector
              mode="time"
              value={eventTime}
              onChange={(_, selectedTime) => setEventTime(selectedTime || eventTime)}
              showPicker={showTimePicker}
              setShowPicker={setShowTimePicker}
            />
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
            style={[styles.input, styles.textArea]}
            mode="outlined"
            multiline
            numberOfLines={4}
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            labelStyle={styles.submitButtonLabel}
          >
            {eventData?.id ? 'Update Event' : 'Add Event'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: Platform.OS === 'web' ? 0 : 1,
    maxWidth: Platform.OS === 'web' ? 600 : '100%',
    width: '100%',
    padding: 24,
    backgroundColor: '#fff',
    alignSelf: 'center',
    borderRadius: 16,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#f7f7f7',
    borderRadius: 4,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  dateTimeLabel: {
    fontSize: 16,
    marginRight: 8,
    color: '#333',
    width: 50
  },
  dateTimeButton: {
    flex: 1,
    borderRadius: 8,
    borderColor: '#6200ee',
  },
  webDateTimeInput: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6200ee',
    fontSize: 16,
  },
  textArea: {
    height: 100,
  },
  submitButton: {
    marginTop: 16,
    paddingVertical: 6,
    backgroundColor: '#4A90E2',
  },
  submitButtonLabel: {
    fontSize: 16,
  },
});
export default EventForm;
