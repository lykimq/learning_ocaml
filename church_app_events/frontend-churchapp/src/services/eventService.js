import { Platform } from 'react-native';
import axios from 'axios';
import { API_URL_ANDROID, API_URL_IOS, API_URL_WEB } from '@env';

const getApiUrl = () => {
    switch (Platform.OS) {
        case 'android':
            return API_URL_ANDROID;
        case 'ios':
            return API_URL_IOS;
        default: // web
            return API_URL_WEB;
    }
}

const apiUrl = getApiUrl();

const api = axios.create({
    baseURL: apiUrl,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const getEvents = async () => {
    try {
        const response = await api.get('/list');
        console.log('Events fetched:', response.data);  // Log response
        return response.data;
    } catch (error) {
        console.error('Error fetching events:', error);
        throw error;
    }
};

export const addEvent = async (eventData) => {
    try {
        // Validate the data format before sending
        if (!eventData.event_title || !eventData.event_date || !eventData.event_time) {
            throw new Error('Missing required fields');
        }

        const response = await api.post('/add', eventData);
        console.log('Event added:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error adding event:', error);
        // Throw a more specific error
        throw new Error(error.response?.data?.message || 'Failed to add event');
    }
};

export const updateEvent = async (id, eventData) => {
    try {
        const response = await api.put(`/edit/${id}`, eventData);
        console.log('Event updated:', response.data);  // Add logging
        return response.data;
    } catch (error) {
        console.error('Error updating event:', error);
        throw error;
    }
};

export const deleteEvent = async (id) => {
    try {
        const response = await api.delete(`/${id}`);
        console.log('Event deleted:', response.data);  // Add logging
        return response.data;
    } catch (error) {
        console.error('Error deleting event:', error);
        throw error;
    }
};

// During development, verify the variables are loaded
console.log('Android URL:', API_URL_ANDROID);
console.log('iOS URL:', API_URL_IOS);
console.log('Web URL:', API_URL_WEB);