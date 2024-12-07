import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, ScrollView, KeyboardAvoidingView } from 'react-native';
import { Text, TextInput, Button, Title, Portal, Dialog } from 'react-native-paper';
import { createServingSignup, updateServingSignup } from '../../../services/servings/servingService';
import { useAuth } from '../../../contexts/AuthContext';
import { showAlert } from '../../constants/constants';
import formStyles from '../../styles/formStyles';

const ServingSignupForm = ({ servingSignupData, onSubmit }) => {
    const { user } = useAuth();
    const [userId, setUserId] = useState(user?.id || '');
    const [servingId, setServingId] = useState('');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [signupStatus, setSignupStatus] = useState('pending'); // Default status
    const [errors, setErrors] = useState({});
    const [dialogMessage, setDialogMessage] = useState(null);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogCallback, setDialogCallback] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');

    useEffect(() => {
        if (servingSignupData) {
            setUserId(servingSignupData.user_id || '');
            setServingId(servingSignupData.serving_id || '');
            setEmail(servingSignupData.email || '');
            setName(servingSignupData.name || '');
            setPhone(servingSignupData.phone || '');
            setTitle(servingSignupData.title || '');
            setDescription(servingSignupData.description || '');
            setLocation(servingSignupData.location || '');
            setSignupStatus(servingSignupData.signup_status || 'pending');
        }
    }, [servingSignupData]);

    const handleAlert = (title, message, callback = null) => {
        showAlert(title, message, callback, setDialogMessage, setDialogVisible, setDialogCallback);
    };

    const handleSubmit = async () => {
        const validationErrors = {};
        if (!userId) validationErrors.userId = true;
        if (!servingId) validationErrors.servingId = true;
        if (!email) validationErrors.email = true;
        if (!name) validationErrors.name = true;
        if (!title) validationErrors.title = true;
        if (!description) validationErrors.description = true;
        if (!location) validationErrors.location = true;

        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            handleAlert('Error', 'Please fill in all required fields');
            return;
        }

        const formData = {
            user_id: userId,
            serving_id: servingId,
            email,
            name,
            phone,
            title,
            description,
            location,
            signup_status: signupStatus,
        };

        try {
            let result;
            if (servingSignupData?.id) {
                result = await updateServingSignup(servingSignupData.id, signupStatus);
                handleAlert('Success', 'Serving signup updated successfully');
            } else {
                result = await createServingSignup(formData);
                handleAlert('Success', 'Serving signup created successfully');
            }
            if (result) {
                onSubmit(formData);
            }
        } catch (error) {
            console.error('Error saving serving signup:', error);
            handleAlert('Error', error.message || 'Failed to save serving signup');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={formStyles.keyboardAvoidingView}
        >
            <ScrollView contentContainerStyle={formStyles.scrollContainer}>
                <View style={formStyles.container}>
                    <Title style={formStyles.title}>
                        {servingSignupData?.id ? 'Edit Serving Signup' : 'Create New Serving Signup'}
                    </Title>

                    <TextInput
                        label="User ID"
                        value={userId}
                        onChangeText={setUserId}
                        style={formStyles.input}
                        mode="outlined"
                        error={errors.userId}
                    />

                    <TextInput
                        label="Serving ID"
                        value={servingId}
                        onChangeText={setServingId}
                        style={formStyles.input}
                        mode="outlined"
                        error={errors.servingId}
                    />

                    <TextInput
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        style={formStyles.input}
                        mode="outlined"
                        error={errors.email}
                    />

                    <TextInput
                        label="Name"
                        value={name}
                        onChangeText={setName}
                        style={formStyles.input}
                        mode="outlined"
                        error={errors.name}
                    />

                    <TextInput
                        label="Phone"
                        value={phone}
                        onChangeText={setPhone}
                        style={formStyles.input}
                        mode="outlined"
                    />

                    <TextInput
                        label="Title"
                        value={title}
                        onChangeText={setTitle}
                        style={formStyles.input}
                        mode="outlined"
                        error={errors.title}
                    />

                    <TextInput
                        label="Description"
                        value={description}
                        onChangeText={setDescription}
                        style={formStyles.input}
                        mode="outlined"
                        error={errors.description}
                    />

                    <TextInput
                        label="Location"
                        value={location}
                        onChangeText={setLocation}
                        style={formStyles.input}
                        mode="outlined"
                        error={errors.location}
                    />

                    <Button
                        mode="contained"
                        onPress={handleSubmit}
                        style={formStyles.submitButton}
                        labelStyle={formStyles.submitButtonLabel}
                    >
                        {servingSignupData?.id ? 'Update Serving Signup' : 'Add Serving Signup'}
                    </Button>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default ServingSignupForm;
