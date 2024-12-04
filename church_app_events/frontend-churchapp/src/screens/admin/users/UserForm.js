import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Title, HelperText } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { addUser, updateUser } from '../../../services/userService';
import formStyles from '../../styles/formStyles';

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
            ...(trimmedPassword && { password: trimmedPassword }),
            ...(profilePicture.trim() && { profile_picture: profilePicture.trim() }),
        };

        // Only include role for new users
        if (!userData) {
            formData.role = trimmedRole;
        }

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
        <ScrollView style={formStyles.scrollContainer}>
            <View style={formStyles.container}>
                <Title style={formStyles.title}>
                    {userData ? 'Edit User' : 'Create New User'}
                </Title>
                {submitError && (
                    <View style={formStyles.errorContainer}>
                        <Text style={formStyles.errorText}>
                            {submitError}
                        </Text>
                    </View>
                )}

                <TextInput
                    label="Email *"
                    value={email}
                    onChangeText={setEmail}
                    style={formStyles.input}
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
                    label={userData ? "New Password (leave blank to keep current)" : "Password *"}
                    value={password}
                    onChangeText={setPassword}
                    style={[formStyles.input, formStyles.passwordInput]}
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
                    label="Username *"
                    value={username}
                    onChangeText={setUsername}
                    style={formStyles.input}
                    mode="outlined"
                    error={!!errors.username}
                />
                {errors.username && (
                    <HelperText type="error" visible={true}>
                        {errors.username}
                    </HelperText>
                )}

                {/* Only show role picker for new users */}
                {!userData && (
                    <View style={formStyles.input}>
                        <Text style={formStyles.label}>Role *</Text>
                        <Picker
                            selectedValue={role}
                            onValueChange={(itemValue) => setRole(itemValue)}
                            mode="dropdown"
                        >
                            <Picker.Item label="Admin" value="admin" />
                            <Picker.Item label="User" value="user" />
                            <Picker.Item label="Guest" value="guest" />
                        </Picker>
                        {errors.role && (
                            <HelperText type="error" visible={true}>
                                {errors.role}
                            </HelperText>
                        )}
                    </View>
                )}

                <TextInput
                    label="Profile Picture URL (optional)"
                    value={profilePicture}
                    onChangeText={setProfilePicture}
                    style={formStyles.input}
                    mode="outlined"
                />

                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    style={formStyles.submitButton}
                >
                    {userData ? 'Update User' : 'Add User'}
                </Button>
            </View>
        </ScrollView>
    );
};


export default UserForm;