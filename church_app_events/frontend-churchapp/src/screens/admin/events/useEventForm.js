import { useState, useEffect } from 'react';
import { addEvent, updateEvent } from '../../../services/events/eventService';
import { showAlert } from '../../constants/constants';

const useEventForm = (eventData, onSubmit) => {

    // Event Form State
    const [eventTitle, setEventTitle] = useState(eventData?.title ?? '');
    const [eventDate, setEventDate] = useState(eventData?.date ? new Date(eventData.date) : new Date());
    const [eventTime, setEventTime] = useState(eventData?.time ? new Date(eventData.time) : new Date());
    const [address, setAddress] = useState(eventData?.address ?? '');
    const [description, setDescription] = useState(eventData?.description ?? '');

    // UI State
    const [errors, setErrors] = useState({});
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Dialog State
    const [dialogMessage, setDialogMessage] = useState(null);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogCallback, setDialogCallback] = useState(null);

    const handleAlert = (title, message, callback = null) => {
        showAlert(title, message, callback, setDialogMessage, setDialogVisible, setDialogCallback);
    };

    useEffect(() => {
        if (eventData) {
            setEventTitle(eventData.event_title || '');
            setEventDate(eventData.event_date ? new Date(eventData.event_date) : new Date());
            setEventTime(eventData.event_time ? new Date(`1970-01-01T${eventData.event_time}`) : new Date());
            setAddress(eventData.address || '');
            setDescription(eventData.description || '');
        }
    }, [eventData]);

    const handleSubmit = async () => {
        const validationErrors = {};
        if (!eventTitle) validationErrors.eventTitle = true;
        if (!eventDate) validationErrors.eventDate = true;
        if (!eventTime) validationErrors.eventTime = true;

        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) return;

        const formData = {
            event_title: eventTitle,
            event_date: eventDate.toISOString().split('T')[0], // Format: YYYY-MM-DD
            event_time: eventTime.toTimeString().split(' ')[0].slice(0, 5), // Format: HH:MM
            address,
            description,
        };

        // Log the form data to ensure it's correct
        console.log('Submitting form data:', formData);

        // Call the addEvent from eventServices
        try {
            let result;
            if (eventData?.id) {
                result = await updateEvent(eventData.id, formData);
                console.log('Event added successfully:', result)
            } else {
                // If no ID, create new event
                result = await addEvent(formData);
                console.log('Event added successfully:', result)
            }
            if (result) {
                onSubmit(formData);
            }
        } catch (error) {
            console.error('Error adding event:', error)
            handleAlert('Error', 'Failed to add event');
        }

    };

    return {
        eventTitle, setEventTitle,
        eventDate, setEventDate,
        eventTime, setEventTime,
        address, setAddress,
        description, setDescription,
        // UI State
        errors, setErrors,
        showDatePicker, setShowDatePicker,
        showTimePicker, setShowTimePicker,
        // Event Handlers
        handleSubmit,
        handleAlert,
        // Dialog Handlers
        dialogMessage, setDialogMessage,
        dialogVisible, setDialogVisible,
        dialogCallback, setDialogCallback,
    };
};

export default useEventForm;