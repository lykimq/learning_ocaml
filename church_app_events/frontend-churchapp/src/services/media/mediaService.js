import { Platform } from "react-native";
import axios from "axios";
import { API_URL_ANDROID, API_URL_IOS, API_URL_WEB } from "@env";


const getApiUrl = () => {
    switch (Platform.OS) {
        case "android":
            return API_URL_ANDROID;
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
        console.log('Response:', {
            url: response.config.url,
            status: response.status,
            data: response.data
        });
        return response;
    },
    error => {
        console.error('Request Error:', {
            message: error.message,
            response: error.response,
            status: error.response?.status,
            data: error.response?.data,
            config: error.config
        });
        return Promise.reject(error);
    }
);


// Create a new media
export const createMedia = async (mediaData) => {
    try {
        const response = await api.post('/admin/media/add', mediaData);
        console.log("Media created successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error creating media:', error);
        throw new Error(error.response?.data?.message || 'Failed to create media');
    }
}

// Update an existing media
export const updateMedia = async (mediaId, mediaData) => {
    try {
        const response = await api.put(`/admin/media/edit/${mediaId}`, mediaData);
        console.log("Media updated successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error updating media:', error);
        throw new Error(error.response?.data?.message || 'Failed to update media');
    }
}

// Get all media
export const getAllMedia = async () => {
    try {
        const response = await api.get('/admin/media/list');
        console.log("Media fetched successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching media:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch media');
    }
}

// Delete a media
export const deleteMedia = async (mediaId) => {
    try {
        const response = await api.delete(`/admin/media/${mediaId}`);
        console.log("Media deleted successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error deleting media:', error);
        throw new Error(error.response?.data?.message || 'Failed to delete media');
    }
}

// Search media
export const searchMedia = async (searchParams) => {
    try {
        const response = await api.get('/admin/media/search', { params: searchParams });
        console.log("Media fetched successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching media:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch media');
    }
}

// Get a media
export const getMedia = async (mediaId) => {
    try {
        const response = await api.get(`/admin/media/${mediaId}`);
        console.log("Media fetched successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching media:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch media');
    }
}

// Add watch history
export const addWatchHistory = async (watchHistoryData) => {
    try {
        const response = await api.post('/admin/media/watch_history/add', watchHistoryData);
        console.log("Watch history added successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error adding watch history:', error);
        throw new Error(error.response?.data?.message || 'Failed to add watch history');
    }
}

// Update watch history
export const updateWatchHistory = async (watchHistoryId, watchHistoryData) => {
    try {
        const response = await api.put(`/admin/media/watch_history/edit/${watchHistoryId}`, watchHistoryData);
        console.log("Watch history updated successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error updating watch history:', error);
        throw new Error(error.response?.data?.message || 'Failed to update watch history');
    }
}

// Delete watch history
export const deleteWatchHistory = async (watchHistoryId) => {
    try {
        const response = await api.delete(`/admin/media/watch_history/${watchHistoryId}`);
        console.log("Watch history deleted successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error deleting watch history:', error);
        throw new Error(error.response?.data?.message || 'Failed to delete watch history');
    }
}