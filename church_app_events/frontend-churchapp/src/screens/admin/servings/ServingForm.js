import React, { useState, useEffect } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Title } from 'react-native-paper';
import { createServing, updateServing } from '../../../services/servings/servingService';
import { useAuth } from '../../../contexts/AuthContext';
import { showAlert } from '../../constants/constants';
import formStyles from '../../styles/formStyles';

const ServingForm = ({ servingData, onSubmit }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [createdBy, setCreatedBy] = useState(user?.id || '');
    const [errors, setErrors] = useState({});
    const [dialogMessage, setDialogMessage] = useState(null);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogCallback, setDialogCallback] = useState(null);

    useEffect(() => {
        if (servingData) {
            setTitle(servingData.title || '');
            setDescription(servingData.description || '');
            setLocation(servingData.location || '');
            setCreatedBy(servingData.created_by || user?.id || '');
        }
    }, [servingData]);

    const handleAlert = (title, message, callback = null) => {
        showAlert(title, message, callback, setDialogMessage, setDialogVisible, setDialogCallback);
    };

    const handleSubmit = async () => {
        const validationErrors = {};
        if (!title) validationErrors.title = true;
        if (!description) validationErrors.description = true;
        if (!location) validationErrors.location = true;

        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            handleAlert('Error', 'Please fill in all required fields');
            return;
        }

        const formData = {
            title,
            description,
            location,
            created_by: createdBy,
        };

        try {
            let result;
            if (servingData?.id) {
                result = await updateServing(servingData.id, formData);
                handleAlert('Success', 'Serving updated successfully');
            } else {
                result = await createServing(formData);
                handleAlert('Success', 'Serving created successfully');
            }
            if (result) {
                onSubmit(formData);
            }
        } catch (error) {
            console.error('Error saving serving:', error);
            handleAlert('Error', error.message || 'Failed to save serving');
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
                        {servingData?.id ? 'Edit Serving' : 'Create New Serving'}
                    </Title>

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
                        {servingData?.id ? 'Update Serving' : 'Add Serving'}
                    </Button>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default ServingForm;
