import axios from 'axios'

// Adjust for the android/iOS/web as needed
const apiUrl = "http://10.0.2.2:8080/admin/events"

const api = axios.create({
    baseURL: apiUrl,
    headers: {
        'Content-Type': 'application/json'
    }
})

export const getEvents = async () => {
    try {
        const response = await api.get('/list');
        return response.data

    } catch (error) {
        console.error('Error fetching events:', error);
        throw error;
    }
}

export const addEvent = async (eventData) => {
    try {
        const response = await api.post('/add', eventData);
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