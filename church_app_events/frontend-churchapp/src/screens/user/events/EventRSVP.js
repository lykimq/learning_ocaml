import React, { useState } from 'react';
import { View, Alert, StyleSheet, Platform } from 'react-native';
import { Button, Text, TextInput, Title, Paragraph, Portal, Dialog, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { addRsvp } from '../../../services/events/eventRsvpService';

const EventRSVP = ({ event, onClose }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogMessage, setDialogMessage] = useState({ title: '', message: '' });

    // Cross-platform alert function
    const showAlert = (title, message, onOk) => {
        if (Platform.OS === 'web') {
            setDialogMessage({ title, message });
            setDialogVisible(true);
            // Store callback for web dialog
            if (onOk) {
                setDialogCallback(() => onOk);
            }
        } else {
            Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
        }
    };

    const [dialogCallback, setDialogCallback] = useState(() => () => { });

    const handleDialogDismiss = () => {
        setDialogVisible(false);
        dialogCallback();
    };

    const handleSubmit = async () => {
        if (!email || !email.includes('@')) {
            showAlert('Error', 'Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            const rsvpData = {
                event_id: event.id,
                email: email,
                user_id: null,
                rsvp_status: "Pending"
            };

            await addRsvp(rsvpData);
            setLoading(false);

            showAlert(
                'Success',
                'You have been registered for this event.',
                () => {
                    navigation.navigate('Events', {
                        reset: Date.now()
                    });
                }
            );
        } catch (error) {
            console.error('Registration error:', error);
            setLoading(false);

            if (error.message.includes('already')) {
                showAlert(
                    'Already Registered',
                    'You are already registered for this event.'
                );
            } else {
                showAlert(
                    'Error',
                    error.message || 'Failed to register for the event. Please try again.'
                );
            }
        }
    };

    const handleBack = () => {
        if (onClose) {
            onClose(); // Close the modal if it exists
        }
        navigation.navigate('Events'); // Explicitly navigate to Events screen
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <IconButton
                    icon="arrow-left"
                    size={24}
                    onPress={handleBack}
                    style={styles.backButton}
                />
                <Title style={styles.title}>{event.event_title}</Title>
            </View>

            <View style={styles.eventInfo}>
                <Paragraph>Date: {new Date(event.event_date).toLocaleDateString()}</Paragraph>
                <Paragraph>Time: {event.event_time}</Paragraph>
                <Paragraph>Location: {event.address}</Paragraph>
            </View>

            <View style={styles.form}>
                <TextInput
                    label="Email Address *"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                />

                <Text style={styles.note}>
                    * Required information
                </Text>

                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={loading}
                    style={styles.submitButton}
                >
                    {loading ? 'Registering...' : 'Register for Event'}
                </Button>
            </View>

            {/* Web Dialog */}
            <Portal>
                <Dialog
                    visible={dialogVisible}
                    onDismiss={handleDialogDismiss}
                >
                    <Dialog.Title>{dialogMessage.title}</Dialog.Title>
                    <Dialog.Content>
                        <Paragraph>{dialogMessage.message}</Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={handleDialogDismiss}>OK</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        marginRight: 10,
    },
    title: {
        fontSize: 24,
        flex: 1, // This allows the title to take remaining space
    },
    eventInfo: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    form: {
        gap: 15,
    },
    input: {
        marginBottom: 10,
    },
    note: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        marginBottom: 10,
    },
    submitButton: {
        marginTop: 10,
        paddingVertical: 8,
    }
});

export default EventRSVP;