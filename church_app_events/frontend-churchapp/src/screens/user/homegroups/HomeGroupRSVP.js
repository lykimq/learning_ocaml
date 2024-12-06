import React, { useState } from 'react';
import { View, Alert, StyleSheet, Platform } from 'react-native';
import { Button, Text, TextInput, Title, Paragraph, Portal, Dialog, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { createRegistration } from '../../../services/homegroups/homeGroupRsvpService';
import { format } from 'date-fns';

const HomeGroupRSVP = ({ homeGroup, onClose }) => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogMessage, setDialogMessage] = useState({ title: '', message: '' });

    // Cross-platform alert function
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

        if (!name.trim()) {
            showAlert('Error', 'Please enter your name');
            return;
        }

        setLoading(true);

        try {
            const registrationData = {
                home_group_id: homeGroup.id,
                email: email,
                name: name.trim(),
                user_id: null,
                registration_status: "pending"
            };

            await createRegistration(registrationData);
            setLoading(false);

            showAlert(
                'Success',
                'You have been registered for this home group.',
                () => {
                    navigation.navigate('HomeGroups', {
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
                    'You are already registered for this home group.'
                );
            } else {
                showAlert(
                    'Error',
                    error.message || 'Failed to register for the home group. Please try again.'
                );
            }
        }
    };

    const handleBack = () => {
        if (onClose) {
            onClose();
        }
        navigation.navigate('HomeGroups');
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
                <Title style={styles.title}>{homeGroup.name}</Title>
            </View>

            <View style={styles.groupInfo}>
                <Paragraph style={styles.paragraph}>
                    Meeting Day: {format(new Date(homeGroup.meeting_day), 'MMM dd, yyyy')}
                </Paragraph>
                <Paragraph style={styles.paragraph}>Time: {homeGroup.meeting_time}</Paragraph>
                <Paragraph style={styles.paragraph}>Location: {homeGroup.location}</Paragraph>
                <Paragraph style={styles.paragraph}>Language: {homeGroup.language}</Paragraph>
                {homeGroup.description && (
                    <Paragraph style={styles.paragraph}>Description: {homeGroup.description}</Paragraph>
                )}
            </View>

            <View style={styles.form}>
                <TextInput
                    label="Name *"
                    value={name}
                    onChangeText={setName}
                    mode="outlined"
                    autoCapitalize="words"
                    style={styles.input}
                />

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
                    labelStyle={styles.submitButtonLabel}
                >
                    {loading ? 'Registering...' : 'Register for Home Group'}
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

const COLORS = {
    white: '#fff',
    background: '#f5f5f5',
    border: '#e0e0e0',
    shadow: '#000',
    blue: '#3f51b5',
    text: '#333',
    textLight: '#666',
    error: '#c62828',
    errorBorder: '#F44336',
};

const LAYOUT = {
    padding: 16,
    borderRadius: 8,
    maxWidth: 600,
};

const TYPOGRAPHY = {
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    label: {
        fontSize: 16,
    },
    button: {
        fontSize: 16,
    },
    note: {
        fontSize: 12,
    },
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: LAYOUT.padding,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        padding: LAYOUT.padding,
        backgroundColor: COLORS.white,
        borderRadius: LAYOUT.borderRadius,
        elevation: 2,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    backButton: {
        marginRight: 10,
    },
    title: {
        fontSize: TYPOGRAPHY.title.fontSize,
        fontWeight: TYPOGRAPHY.title.fontWeight,
        color: COLORS.text,
        flex: 1,
    },
    groupInfo: {
        marginBottom: 20,
        padding: LAYOUT.padding,
        backgroundColor: COLORS.white,
        borderRadius: LAYOUT.borderRadius,
        elevation: 2,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    form: {
        gap: 15,
        padding: LAYOUT.padding,
        backgroundColor: COLORS.white,
        borderRadius: LAYOUT.borderRadius,
        elevation: 2,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    input: {
        marginBottom: 10,
        backgroundColor: COLORS.white,
    },
    note: {
        fontSize: TYPOGRAPHY.note.fontSize,
        color: COLORS.textLight,
        fontStyle: 'italic',
        marginBottom: 10,
    },
    submitButton: {
        marginTop: 10,
        paddingVertical: 8,
        backgroundColor: COLORS.blue,
        borderRadius: LAYOUT.borderRadius,
    },
    submitButtonLabel: {
        color: COLORS.white,
        fontSize: TYPOGRAPHY.button.fontSize,
    },
    paragraph: {
        fontSize: TYPOGRAPHY.label.fontSize,
        color: COLORS.text,
        marginBottom: 8,
    }
});

export default HomeGroupRSVP;
