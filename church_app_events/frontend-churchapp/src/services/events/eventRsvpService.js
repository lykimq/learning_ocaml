import { Platform, Alert } from 'react-native';
import axios from 'axios';
import {
    API_URL_ANDROID,
    API_URL_IOS,
    API_URL_WEB
} from '@env';

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

export const getAllRsvps = async () => {
    try {
        const response = await api.get('/events/rsvp/list');
        console.log('RSVPs fetched:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching RSVPs:', error);
        throw error;
    }
};

export const getRsvpsByEvent = async (eventId) => {
    try {
        const response = await api.get(`/events/rsvp/event/${eventId}`);
        console.log('RSVPs for event fetched:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching RSVPs for event:', error);
        throw error;
    }
};

export const getRsvpsByEmail = async (email) => {
    try {
        const response = await api.get(`/events/rsvp/email/${encodeURIComponent(email)}`);
        console.log('RSVPs for email fetched:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching RSVPs for email:', error);
        throw error;
    }
};

export const addRsvp = async (rsvpData) => {
    try {
        if (!rsvpData.event_id || !rsvpData.email || !rsvpData.rsvp_status) {
            throw new Error('Missing required fields');
        }

        console.log('Sending RSVP data:', rsvpData); // Debug log

        const response = await api.post('/events/rsvp/add', {
            event_id: rsvpData.event_id,
            email: rsvpData.email,
            user_id: rsvpData.user_id,
            rsvp_status: rsvpData.rsvp_status
        });

        console.log('RSVP response:', response.data); // Debug log
        return response.data;
    } catch (error) {
        console.error('Error adding RSVP:', error);
        if (error.response?.data) {
            throw new Error(error.response.data);
        }
        throw new Error('Failed to register for the event');
    }
};

export const updateRsvp = async (id, rsvpData) => {
    try {
        const response = await api.put(`/events/rsvp/edit/${id}`, rsvpData);
        console.log('RSVP updated:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error updating RSVP:', error);
        throw error;
    }
};

export const deleteRsvp = async (id) => {
    try {
        const response = await api.delete(`/events/rsvp/${id}`);
        console.log('RSVP deleted:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error deleting RSVP:', error);
        throw error;
    }
};

export const confirmRsvp = async (rsvpId) => {
    try {
        const response = await api.post(`/admin/events/rsvp/confirm/${rsvpId}`);
        console.log('RSVP confirmed:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error confirming RSVP:', error);
        throw error;
    }
};
