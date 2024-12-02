import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, ScrollView, KeyboardAvoidingView } from 'react-native';
import { Text, TextInput, Button, Title, Portal, Dialog } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addHomeGroup, updateHomeGroup } from '../../../services/homegroups/homeGroupService';
import { useAuth } from '../../../contexts/AuthContext';
import { onDateChange, onTimeChange, showAlert } from '../../constants/constants';
import { format } from 'date-fns';

const HomeGroupForm = ({ homeGroupData, onSubmit }) => {
    const { isAdmin } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [language, setLanguage] = useState('');
    const [profilePicture, setProfilePicture] = useState('');
    const [maxCapacity, setMaxCapacity] = useState('');
    const [meetingDay, setMeetingDay] = useState(new Date());
    const [meetingTime, setMeetingTime] = useState(new Date());
    const [errors, setErrors] = useState({});
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [dialogMessage, setDialogMessage] = useState(null);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogCallback, setDialogCallback] = useState(null);

    useEffect(() => {
        if (homeGroupData) {
            setName(homeGroupData.name || '');
            setDescription(homeGroupData.description || '');
            setLocation(homeGroupData.location || '');
            setLanguage(homeGroupData.language || '');
            setProfilePicture(homeGroupData.profile_picture || '');
            setMaxCapacity(homeGroupData.max_capacity ? String(homeGroupData.max_capacity) : '');
            setMeetingDay(homeGroupData.meeting_day ? new Date(homeGroupData.meeting_day) : new Date());
            setMeetingTime(homeGroupData.meeting_time ? new Date(`1970-01-01T${homeGroupData.meeting_time}`) : new Date());
        }
    }, [homeGroupData]);

    const RequiredLabel = ({ label }) => (
        <Text>
            {label} <Text style={styles.required}>*</Text>
        </Text>
    );

    const handleAlert = (title, message, callback = null) => {
        showAlert(title, message, callback, setDialogMessage, setDialogVisible, setDialogCallback);
    };


    const handleSubmit = async () => {
        if (!isAdmin) {
            handleAlert('Error', 'Only administrators can create or modify home groups');
            return;
        }

        const validationErrors = {};
        if (!name) validationErrors.name = true;
        if (!location) validationErrors.location = true;
        if (!language) validationErrors.language = true;
        if (!maxCapacity) validationErrors.maxCapacity = true;
        if (!meetingDay) validationErrors.meetingDay = true;
        if (!meetingTime) validationErrors.meetingTime = true;

        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            handleAlert('Error', 'Please fill in all required fields');
            return;
        }

        const formData = {
            name,
            description,
            location,
            language,
            profile_picture: profilePicture,
            max_capacity: maxCapacity ? parseInt(maxCapacity) : null,
            meeting_day: meetingDay.toISOString().split('T')[0],
            meeting_time: meetingTime.toTimeString().split(' ')[0].slice(0, 5),
            created_by: 1,
        };

        try {
            let result;
            if (homeGroupData?.id) {
                result = await updateHomeGroup(homeGroupData.id, formData);
                handleAlert('Success', 'Home Group updated successfully');
            } else {
                result = await addHomeGroup(formData);
                handleAlert('Success', 'Home Group added successfully');
            }
            if (result) {
                onSubmit(formData);
            }
        } catch (error) {
            console.error('Error saving home group:', error);
            handleAlert('Error', 'Failed to save home group');
        }
    };

    const handleMeetingDayChange = (event, selectedDate) => {
        onDateChange(event, selectedDate, meetingDay, setShowDatePicker, setMeetingDay);
    };


    const handleMeetingTimeChange = (event, selectedTime) => {
        onTimeChange(event, selectedTime, meetingTime, setShowTimePicker, setMeetingTime);
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
                        {homeGroupData?.id ? 'Edit Home Group' : 'Create New Home Group'}
                    </Title>

                    <TextInput
                        label="Group Name"
                        value={name}
                        onChangeText={setName}
                        style={styles.input}
                        mode="outlined"
                        error={errors.name}
                    />

                    <View style={styles.dateTimeContainer}>
                        <Text style={styles.dateTimeLabel}>Meeting Day:</Text>
                        <DateTimeSelector
                            mode="date"
                            value={meetingDay}
                            onChange={(_, selectedDate) => setMeetingDay(selectedDate || meetingDay)}
                            showPicker={showDatePicker}
                            setShowPicker={setShowDatePicker}
                        />
                    </View>

                    <View style={styles.dateTimeContainer}>
                        <Text style={styles.dateTimeLabel}>Meeting Time:</Text>
                        <DateTimeSelector
                            mode="time"
                            value={meetingTime}
                            onChange={(_, selectedTime) => setMeetingTime(selectedTime || meetingTime)}
                            showPicker={showTimePicker}
                            setShowPicker={setShowTimePicker}
                        />
                    </View>

                    <TextInput
                        label="Location"
                        value={location}
                        onChangeText={setLocation}
                        style={styles.input}
                        mode="outlined"
                        error={errors.location}
                    />

                    <TextInput
                        label="Language"
                        value={language}
                        onChangeText={setLanguage}
                        style={styles.input}
                        mode="outlined"
                        error={errors.language}
                    />

                    <TextInput
                        label="Max Capacity"
                        value={maxCapacity}
                        onChangeText={setMaxCapacity}
                        style={styles.input}
                        mode="outlined"
                        keyboardType="numeric"
                        error={errors.maxCapacity}
                    />

                    <TextInput
                        label="Description"
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
                        {homeGroupData?.id ? 'Update Home Group' : 'Add Home Group'}
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
        marginBottom: 12,
        alignItems: 'center',
    },
    dateTimeLabel: {
        fontSize: 16,
        marginRight: 8,
        color: '#333',
        width: 100,
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
    submitButton: {
        marginTop: 16,
        paddingVertical: 6,
        backgroundColor: '#4A90E2',
        alignSelf: 'center',
        paddingHorizontal: 30,
    },
    required: {
        color: 'red',
        fontSize: 16,
    },
    textArea: {
        height: 100,
    },
    dialogContainer: {
        maxWidth: 400,
        alignSelf: 'center',
        backgroundColor: 'white',
    },
    dialogButton: {
        marginLeft: 10,
        marginBottom: 10,
    },
});

export default HomeGroupForm;
