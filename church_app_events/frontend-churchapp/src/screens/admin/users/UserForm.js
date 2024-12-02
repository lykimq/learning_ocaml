import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Title, HelperText } from 'react-native-paper';
import { addUser, updateUser } from '../../../services/userService';

const UserForm = ({ userData, onSubmit }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('user');
    const [profilePicture, setProfilePicture] = useState('');
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        if (userData) {
            setEmail(userData.email || '');
            setUsername(userData.username || '');
            setRole(userData.role || 'user');
            setProfilePicture(userData.profile_picture || '');
            // Don't set password as it should be entered new for security
        }
    }, [userData]);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const renderRequiredLabel = (label) => (
        <Text>
            {label} <Text style={styles.required}>*</Text>
        </Text>
    );

    const handleSubmit = async () => {
        setSubmitError('');
        const validationErrors = {};

        // Stricter validation
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();
        const trimmedUsername = username.trim();
        const trimmedRole = role.trim();

        // Validate all required fields
        if (!trimmedEmail) {
            validationErrors.email = 'Email is required';
        } else if (!validateEmail(trimmedEmail)) {
            validationErrors.email = 'Invalid email format';
        }

        // Only require password for new users
        if (!userData && !trimmedPassword) {
            validationErrors.password = 'Password is required for new users';
        }

        if (!trimmedUsername) {
            validationErrors.username = 'Username is required';
        }

        if (!trimmedRole) {
            validationErrors.role = 'Role is required';
        }

        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            setSubmitError('Please fill in all required fields');
            return;
        }

        const formData = {
            email: trimmedEmail,
            username: trimmedUsername,
            role: trimmedRole,
            ...(trimmedPassword && { password: trimmedPassword }),
            ...(profilePicture.trim() && { profile_picture: profilePicture.trim() }),
        };

        console.log('Submitting user data:', formData);

        try {
            let result;
            if (userData?.id) {
                result = await updateUser(userData.id, formData);
            } else {
                // Make sure password is included for new users
                if (!trimmedPassword) {
                    setSubmitError('Password is required for new users');
                    return;
                }
                result = await addUser(formData);
            }
            if (result) {
                onSubmit(result);
            }
        } catch (error) {
            console.error('Error managing user:', error);
            setSubmitError(error.message || 'Failed to manage user');
        }
    };

    return (
        <ScrollView style={styles.scrollContainer}>
            <View style={styles.container}>
                <Title style={styles.title}>
                    {userData ? 'Edit User' : 'Create New User'}
                </Title>
                {submitError && (
                    <View style={styles.submitError}>
                        <Text style={styles.errorText}>
                            {submitError}
                        </Text>
                    </View>
                )}

                <TextInput
                    label={renderRequiredLabel("Email")}
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={!!errors.email}
                />
                {errors.email && (
                    <HelperText type="error" visible={true}>
                        {errors.email}
                    </HelperText>
                )}

                <TextInput
                    label={userData ? "New Password (leave blank to keep current)" : renderRequiredLabel("Password")}
                    value={password}
                    onChangeText={setPassword}
                    style={[styles.input, styles.passwordInput]}
                    mode="outlined"
                    secureTextEntry={!showPassword}
                    error={!!errors.password}
                    right={<TextInput.Icon
                        icon={showPassword ? "eye-off" : "eye"}
                        onPress={() => setShowPassword(!showPassword)}
                        forceTextInputFocus={false}
                    />}
                />
                {errors.password && (
                    <HelperText type="error" visible={true}>
                        {errors.password}
                    </HelperText>
                )}

                <TextInput
                    label={renderRequiredLabel("Username")}
                    value={username}
                    onChangeText={setUsername}
                    style={styles.input}
                    mode="outlined"
                    error={!!errors.username}
                />
                {errors.username && (
                    <HelperText type="error" visible={true}>
                        {errors.username}
                    </HelperText>
                )}

                <TextInput
                    label={renderRequiredLabel("Role")}
                    value={role}
                    onChangeText={setRole}
                    style={styles.input}
                    mode="outlined"
                    error={!!errors.role}
                />
                {errors.role && (
                    <HelperText type="error" visible={true}>
                        {errors.role}
                    </HelperText>
                )}

                <TextInput
                    label="Profile Picture URL (optional)"
                    value={profilePicture}
                    onChangeText={setProfilePicture}
                    style={styles.input}
                    mode="outlined"
                />

                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    style={styles.submitButton}
                >
                    {userData ? 'Update User' : 'Add User'}
                </Button>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
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
        marginBottom: 8,
        backgroundColor: '#fff',
    },
    required: {
        color: 'red',
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
    errorContainer: {
        backgroundColor: '#ffebee',
        padding: 10,
        borderRadius: 4,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ffcdd2',
    },
    errorText: {
        color: '#c62828',
        textAlign: 'center',
    },
});

export default UserForm;