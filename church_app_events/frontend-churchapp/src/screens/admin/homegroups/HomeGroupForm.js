import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, Title, Portal, Dialog } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addHomeGroup, updateHomeGroup } from '../../../services/homegroups/homeGroupService';
import { useAuth } from '../../../contexts/AuthContext';

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
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogMessage, setDialogMessage] = useState({ title: '', message: '' });
    const [dialogCallback, setDialogCallback] = useState(null);

    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || meetingDay;
        setShowDatePicker(Platform.OS === 'ios');
        setMeetingDay(currentDate);
    };

    const onTimeChange = (event, selectedTime) => {
        const currentTime = selectedTime || meetingTime;
        setShowTimePicker(Platform.OS === 'ios');
        setMeetingTime(currentTime);
    };

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

    const showAlert = (title, message, onOk) => {
        if (Platform.OS === 'web') {
            setDialogMessage({ title, message });
            setDialogVisible(true);
            if (onOk) {
                setDialogCallback(() => onOk);
            }
        } else {
            Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
        }
    };

    const RequiredLabel = ({ label }) => (
        <Text>
            {label} <Text style={styles.required}>*</Text>
        </Text>
    );

    const handleSubmit = async () => {
        if (!isAdmin) {
            showAlert('Error', 'Only administrators can create or modify home groups');
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
            showAlert('Error', 'Please fill in all required fields');
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
                showAlert('Success', 'Home Group updated successfully');
            } else {
                result = await addHomeGroup(formData);
                showAlert('Success', 'Home Group added successfully');
            }
            if (result) {
                onSubmit(formData);
            }
        } catch (error) {
            console.error('Error saving home group:', error);
            showAlert('Error', 'Failed to save home group');
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
        <ScrollView style={styles.scrollContainer}>
            <View style={styles.container}>
                <Title style={styles.title}>Create New Home Group</Title>

                <TextInput
                    label={<RequiredLabel label="Group Name" />}
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                    mode="outlined"
                    error={errors.name}
                />

                <TextInput
                    label="Description"
                    value={description}
                    onChangeText={setDescription}
                    style={[styles.input, styles.multilineInput]}
                    mode="outlined"
                    multiline
                    numberOfLines={4}
                />

                <TextInput
                    label={<RequiredLabel label="Location" />}
                    value={location}
                    onChangeText={setLocation}
                    style={styles.input}
                    mode="outlined"
                    error={errors.location}
                />

                <TextInput
                    label={<RequiredLabel label="Language" />}
                    value={language}
                    onChangeText={setLanguage}
                    style={styles.input}
                    mode="outlined"
                    error={errors.language}
                />

                <TextInput
                    label="Profile Picture URL"
                    value={profilePicture}
                    onChangeText={setProfilePicture}
                    style={styles.input}
                    mode="outlined"
                />

                <TextInput
                    label={<RequiredLabel label="Max Capacity" />}
                    value={maxCapacity}
                    onChangeText={setMaxCapacity}
                    style={styles.input}
                    mode="outlined"
                    keyboardType="numeric"
                    error={errors.maxCapacity}
                />

                <View style={styles.dateTimeContainer}>
                    <TextInput
                        label={<RequiredLabel label="Meeting Day" />}
                        value={meetingDay.toDateString()}
                        style={[styles.input, styles.dateTimeInput]}
                        mode="outlined"
                        editable={false}
                        error={errors.meetingDay}
                    />
                    {Platform.OS === 'web' ? (
                        <DateTimeSelector
                            mode="date"
                            value={meetingDay}
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
                            {Platform.OS === 'web' ? 'Choose Day' : 'Select'}
                        </Button>
                    )}
                </View>

                <View style={styles.dateTimeContainer}>
                    <TextInput
                        label={<RequiredLabel label="Meeting Time" />}
                        value={meetingTime.toLocaleTimeString()}
                        style={[styles.input, styles.dateTimeInput]}
                        mode="outlined"
                        editable={false}
                        error={errors.meetingTime}
                    />
                    {Platform.OS === 'web' ? (
                        <DateTimeSelector
                            mode="time"
                            value={meetingTime}
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

                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    style={styles.submitButton}
                >
                    {homeGroupData?.id ? 'Update Home Group' : 'Add Home Group'}
                </Button>

                {Platform.OS !== 'web' && showDatePicker && (
                    <DateTimeSelector
                        mode="date"
                        value={meetingDay}
                        onChange={onDateChange}
                        showPicker={showDatePicker}
                        setShowPicker={setShowDatePicker}
                    />
                )}

                {Platform.OS !== 'web' && showTimePicker && (
                    <DateTimeSelector
                        mode="time"
                        value={meetingTime}
                        onChange={onTimeChange}
                        showPicker={showTimePicker}
                        setShowPicker={setShowTimePicker}
                    />
                )}
            </View>

            <Portal>
                <Dialog
                    visible={dialogVisible}
                    onDismiss={() => {
                        setDialogVisible(false);
                        if (dialogCallback) {
                            dialogCallback();
                            setDialogCallback(null);
                        }
                    }}
                    style={styles.dialogContainer}
                >
                    <Dialog.Title>{dialogMessage.title}</Dialog.Title>
                    <Dialog.Content>
                        <Text>{dialogMessage.message}</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button
                            mode="contained"
                            onPress={() => {
                                setDialogVisible(false);
                                if (dialogCallback) {
                                    dialogCallback();
                                    setDialogCallback(null);
                                }
                            }}
                            style={styles.dialogButton}
                        >
                            OK
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    container: {
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
            height: 45,
            paddingVertical: 2,
            paddingHorizontal: 8,
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
    required: {
        color: 'red',
        fontSize: 16,
    },
    multilineInput: {
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
