import { Platform } from 'react-native';
import axios from 'axios';
import {
    API_RSVP_ANDROID,
    API_RSVP_IOS,
    API_RSVP_WEB
} from '@env';

const getApiUrl = () => {
    switch (Platform.OS) {
        case 'android':
            return API_RSVP_ANDROID;
        case 'ios':
            return API_RSVP_IOS;
        default: // web
            return API_RSVP_WEB;
    }
}

const apiUrl = getApiUrl();

const api = axios.create({
    baseURL: apiUrl,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const getAllRsvps = async () => {
    try {
        const response = await api.get('/list');
        console.log('RSVPs fetched:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching RSVPs:', error);
        throw error;
    }
};

export const getRsvpsByEvent = async (eventId) => {
    try {
        const response = await api.get(`/event/${eventId}`);
        console.log('RSVPs for event fetched:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching RSVPs for event:', error);
        throw error;
    }
};

export const getRsvpsByEmail = async (email) => {
    try {
        const response = await api.get(`/email/${email}`);
        console.log('RSVPs for email fetched:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching RSVPs for email:', error);
        throw error;
    }
};

export const addRsvp = async (rsvpData) => {
    try {
        if (!rsvpData.event_id || !rsvpData.email) {
            throw new Error('Missing required fields: event_id and email are required');
        }

        const response = await api.post('/add', rsvpData);
        console.log('RSVP added:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error adding RSVP:', error);
        throw error;
    }
};

export const updateRsvp = async (id, rsvpData) => {
    try {
        const response = await api.put(`/edit/${id}`, rsvpData);
        console.log('RSVP updated:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error updating RSVP:', error);
        throw error;
    }
};

export const deleteRsvp = async (id) => {
    try {
        const response = await api.delete(`/${id}`);
        console.log('RSVP deleted:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error deleting RSVP:', error);
        throw error;
    }
};
