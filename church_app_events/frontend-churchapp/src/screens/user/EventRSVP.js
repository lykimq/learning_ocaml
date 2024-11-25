import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { addRsvp } from '../../services/eventrsvpService';

const EventRSVP = ({ event, onClose }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }

        setLoading(true);
        try {
            const rsvpData = {
                event_id: event.id,
                email: email,
                status: 'going'
            };

            await addRsvp(rsvpData);
            Alert.alert('Success', 'Your RSVP has been recorded');
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to submit RSVP');
            console.error('RSVP submission error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Button
                    icon="arrow-left"
                    onPress={onClose}
                    style={styles.backButton}
                >
                    Back to Events
                </Button>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>{event.event_title}</Text>
                <Text style={styles.details}>
                    Date: {new Date(event.event_date).toLocaleDateString()}
                </Text>
                <Text style={styles.details}>Time: {event.event_time}</Text>
                <Text style={styles.details}>Location: {event.address}</Text>

                <TextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={loading}
                    style={styles.submitButton}
                >
                    Confirm RSVP
                </Button>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        marginRight: 16,
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    details: {
        fontSize: 16,
        marginBottom: 10,
        color: '#666',
    },
    input: {
        marginVertical: 20,
    },
    submitButton: {
        marginTop: 20,
        paddingVertical: 8,
    },
});

export default EventRSVP;
