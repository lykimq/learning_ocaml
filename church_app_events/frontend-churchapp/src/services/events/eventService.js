import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from "react-native";
import axios from "axios";
import { API_URL_ANDROID_DEVICE, API_URL_IOS, API_URL_WEB } from "@env"

const getApiUrl = () => {
    switch (Platform.OS) {
        case "android":
            return API_URL_ANDROID_DEVICE;
        case "ios":
            return API_URL_IOS;
        default:
            return API_URL_WEB;
    }
}

const apiUrl = getApiUrl();

const api = axios.create({
    baseURL: apiUrl,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add request interceptor for debugging
api.interceptors.request.use(request => {
    console.log('Starting Request:', {
        url: request.url,
        method: request.method,
        baseURL: request.baseURL,
        data: request.data
    });
    return request;
});

// Add response interceptor for debugging
api.interceptors.response.use(
    response => {
        console.log('Response:', response);
        return response;
    },
    error => {
        console.log('Response Error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            config: error.config
        });
        return Promise.reject(error);
    }
);


export const getEvents = async () => {
    try {
        const response = await api.get('/admin/events/list');
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

        const response = await api.post('/admin/events/add', eventData);
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
        const response = await api.put(`/admin/events/edit/${id}`, eventData);
        console.log('Event updated:', response.data);  // Add logging
        return response.data;
    } catch (error) {
        console.error('Error updating event:', error);
        throw error;
    }
};

export const deleteEvent = async (id) => {
    try {
        const response = await api.delete(`/admin/events/${id}`);
        console.log('Event deleted:', response.data);  // Add logging
        return response.data;
    } catch (error) {
        console.error('Error deleting event:', error);
        throw error;
    }
};

export const searchEvents = async (params) => {
    try {
        // Convert params to a query string
        const searchParams = new URLSearchParams();

        if (searchParams.text) params.append('text', searchParams.text);
        if (searchParams.start_date) params.append('start_date', searchParams.start_date);
        if (searchParams.end_date) params.append('end_date', searchParams.end_date);
        if (searchParams.start_time) params.append('start_time', searchParams.start_time);
        if (searchParams.end_time) params.append('end_time', searchParams.end_time);

        const query = searchParams.toString();

        const response = await api.get(`/admin/events/search?${query}`);
        console.log('Events searched:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error searching events:', error);
        throw error;
    }
};

