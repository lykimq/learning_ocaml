import React, { useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { Button, Text, TextInput, Title, Paragraph } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { addRsvp } from '../../services/eventRsvpService';

const EventRSVP = ({ event, onClose }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    const handleSubmit = async () => {
        if (!email || !email.includes('@')) {
            Alert.alert('Error', 'Please enter a valid email address');
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

            console.log('Submitting RSVP data:', rsvpData);

            await addRsvp(rsvpData);
            setLoading(false);

            Alert.alert(
                'Success',
                'You have been registered for this event.',
                [{
                    text: 'OK',
                    onPress: () => {
                        navigation.navigate('EventsScreen', {
                            reset: true
                        });
                    }
                }]
            );
        } catch (error) {
            console.error('Registration error:', error);
            setLoading(false);

            if (error.message.includes('already')) {
                Alert.alert(
                    'Already Registered',
                    'You are already registered for this event.',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert(
                    'Error',
                    error.message || 'Failed to register for the event. Please try again.',
                    [{ text: 'OK' }]
                );
            }
        }
    };

    return (
        <View style={styles.container}>
            <Title style={styles.title}>{event.event_title}</Title>

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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
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