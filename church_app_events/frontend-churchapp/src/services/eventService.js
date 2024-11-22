import axios from 'axios'
import { Platform } from 'react-native';

// Adjust for the android/iOS/web as needed
//const apiUrl = "http://10.0.2.2:8080/admin/events"
//const apiUrl = "http://localhost:8080/admin/events";  // Correct URL
const apiUrl = Platform.OS ===
    'android' ? 'http://10.0.2.2:8080/admin/events' : 'http://localhost:8080/admin/events'

const api = axios.create({
    baseURL: apiUrl,
    headers: {
        'Content-Type': 'application/json'
    }
})

export const getEvents = async () => {
    try {
        const response = await api.get('/list');
        console.log('Events fetched:', response.data);  // Log response
        return response.data
    } catch (error) {
        console.error('Error fetching events:', error);
        throw error;
    }
}

export const addEvent = async (eventData) => {
    try {
        const response = await api.post('/add', eventData);
        console.log('Event added:', response.data);  // Log response
        return response.data
    } catch (error) {
        console.error('Error adding event:', error);
        throw error
    }
}

export const updateEvent = async (id, eventData) => {
    try {
        const response = await api.put('/edit/${id}', eventData);
        return response.data

    }
    catch (error) {
        console.error('Error updating event:', error);
        throw error
    }
}

export const deleteEvent = async (id) => {
    try {
        const response = await api.delete('/${id}');
        return response.data

    } catch (error) {
        console.error('Error deleting event:', error);
        throw error
    }
}