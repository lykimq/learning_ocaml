import React, { useState, useEffect } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Title, Switch, SegmentedButtons } from 'react-native-paper';
import { createMedia, updateMedia } from '../../../services/media/mediaService';
import { useAuth } from '../../../contexts/AuthContext';
import { showAlert } from '../../constants/constants';
import formStyles from '../../styles/formStyles';

const MediaForm = ({ mediaData, onSubmit }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [mediaType, setMediaType] = useState('youtube');
    const [youtubeId, setYoutubeId] = useState('');
    const [isLive, setIsLive] = useState(false);
    const [duration, setDuration] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [seriesOrder, setSeriesOrder] = useState('');
    const [status, setStatus] = useState('pending');
    const [errors, setErrors] = useState({});
    const [dialogMessage, setDialogMessage] = useState(null);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogCallback, setDialogCallback] = useState(null);

    useEffect(() => {
        if (mediaData) {
            setTitle(mediaData.title || '');
            setDescription(mediaData.description || '');
            setFileUrl(mediaData.file_url || '');
            setMediaType(mediaData.media_type || 'youtube');
            setYoutubeId(mediaData.youtube_id || '');
            setIsLive(mediaData.is_live || false);
            setDuration(mediaData.duration?.toString() || '');
            setThumbnailUrl(mediaData.thumbnail_url || '');
            setSeriesOrder(mediaData.series_order?.toString() || '');
            setStatus(mediaData.status || 'pending');
        }
    }, [mediaData]);

    const handleAlert = (title, message, callback = null) => {
        showAlert(title, message, callback, setDialogMessage, setDialogVisible, setDialogCallback);
    };

    const handleSubmit = async () => {
        const validationErrors = {};
        if (!title) validationErrors.title = true;
        if (!fileUrl) validationErrors.fileUrl = true;
        if (!mediaType) validationErrors.mediaType = true;
        if (mediaType === 'youtube' && !youtubeId) validationErrors.youtubeId = true;

        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            handleAlert('Error', 'Please fill in all required fields');
            return;
        }

        const formData = {
            title,
            description,
            file_url: fileUrl,
            uploaded_by: user.id,
            media_type: mediaType,
            youtube_id: youtubeId,
            is_live: isLive,
            duration: duration ? parseInt(duration) : null,
            thumbnail_url: thumbnailUrl,
            series_order: seriesOrder ? parseInt(seriesOrder) : null,
            status,
        };

        try {
            let result;
            if (mediaData?.id) {
                result = await updateMedia(mediaData.id, formData);
                handleAlert('Success', 'Media updated successfully');
            } else {
                result = await createMedia(formData);
                handleAlert('Success', 'Media created successfully');
            }
            if (result) {
                onSubmit(formData);
            }
        } catch (error) {
            console.error('Error saving media:', error);
            handleAlert('Error', error.message || 'Failed to save media');
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
                        {mediaData?.id ? 'Edit Media' : 'Create New Media'}
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
                        multiline
                    />

                    <SegmentedButtons
                        value={mediaType}
                        onValueChange={setMediaType}
                        buttons={[
                            { value: 'youtube', label: 'YouTube' },
                            { value: 'mp4', label: 'MP4' },
                            { value: 'live_stream', label: 'Live Stream' },
                            { value: 'audio', label: 'Audio' },
                            { value: 'podcast', label: 'Podcast' },
                        ]}
                        style={formStyles.segmentedButtons}
                    />

                    <TextInput
                        label="File URL"
                        value={fileUrl}
                        onChangeText={setFileUrl}
                        style={formStyles.input}
                        mode="outlined"
                        error={errors.fileUrl}
                    />

                    {mediaType === 'youtube' && (
                        <TextInput
                            label="YouTube ID"
                            value={youtubeId}
                            onChangeText={setYoutubeId}
                            style={formStyles.input}
                            mode="outlined"
                            error={errors.youtubeId}
                        />
                    )}

                    <View style={formStyles.switchContainer}>
                        <Switch value={isLive} onValueChange={setIsLive} />
                        <TextInput
                            label="Is Live Stream"
                            value={isLive ? 'Yes' : 'No'}
                            disabled
                            style={formStyles.switchLabel}
                        />
                    </View>

                    <TextInput
                        label="Duration (seconds)"
                        value={duration}
                        onChangeText={setDuration}
                        style={formStyles.input}
                        mode="outlined"
                        keyboardType="numeric"
                    />

                    <TextInput
                        label="Thumbnail URL"
                        value={thumbnailUrl}
                        onChangeText={setThumbnailUrl}
                        style={formStyles.input}
                        mode="outlined"
                    />

                    <TextInput
                        label="Series Order"
                        value={seriesOrder}
                        onChangeText={setSeriesOrder}
                        style={formStyles.input}
                        mode="outlined"
                        keyboardType="numeric"
                    />

                    <SegmentedButtons
                        value={status}
                        onValueChange={setStatus}
                        buttons={[
                            { value: 'pending', label: 'Pending' },
                            { value: 'processing', label: 'Processing' },
                            { value: 'completed', label: 'Completed' },
                            { value: 'failed', label: 'Failed' },
                        ]}
                        style={formStyles.segmentedButtons}
                    />

                    <Button
                        mode="contained"
                        onPress={handleSubmit}
                        style={formStyles.submitButton}
                        labelStyle={formStyles.submitButtonLabel}
                    >
                        {mediaData?.id ? 'Update Media' : 'Add Media'}
                    </Button>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default MediaForm;