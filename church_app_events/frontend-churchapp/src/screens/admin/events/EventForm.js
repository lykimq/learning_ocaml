import React from 'react';
import { View, StyleSheet, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { Text, TextInput, Button, Title } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import formStyles from '../../styles/formStyles';
import useEventForm from './useEventForm';

const EventForm = ({ eventData = null, onSubmit }) => {
  // Event Form Hook
  const {
    errors, setErrors,
    eventTitle, setEventTitle,
    eventDate, setEventDate,
    eventTime, setEventTime,
    address, setAddress,
    description, setDescription,
    showDatePicker, setShowDatePicker,
    showTimePicker, setShowTimePicker,
    handleSubmit
  } = useEventForm(eventData, onSubmit);

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
          style={formStyles.webDateTimeInput}
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
          style={formStyles.dateTimeButton}
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
    <View style={styles.mainContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[formStyles.keyboardAvoidingView, styles.keyboardView]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={[formStyles.container, styles.formContainer]}>
            <Title style={formStyles.title}>
              {eventData?.id ? 'Edit Event' : 'Create New Event'}
            </Title>

            <TextInput
              label="Event Title"
              value={eventTitle}
              onChangeText={setEventTitle}
              style={formStyles.input}
              mode="outlined"
              error={!!errors.eventTitle}
            />

            <View style={formStyles.dateTimeContainer}>
              <Text style={formStyles.dateTimeLabel}>Date:</Text>
              <DateTimeSelector
                mode="date"
                value={eventDate}
                onChange={(_, selectedDate) => setEventDate(selectedDate || eventDate)}
                showPicker={showDatePicker}
                setShowPicker={setShowDatePicker}
              />
            </View>

            <View style={formStyles.dateTimeContainer}>
              <Text style={formStyles.dateTimeLabel}>Time:</Text>
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
              style={formStyles.input}
              mode="outlined"
            />

            <TextInput
              label="Description (optional)"
              value={description}
              onChangeText={setDescription}
              style={[formStyles.input, formStyles.textArea]}
              mode="outlined"
              multiline
              numberOfLines={4}
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              style={formStyles.submitButton}
              labelStyle={formStyles.submitButtonLabel}
            >
              {eventData?.id ? 'Update Event' : 'Add Event'}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
    ...(Platform.OS === 'web' && {
      maxWidth: 800,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    ...(Platform.OS === 'web' && {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    }),
  },
});

export default EventForm;