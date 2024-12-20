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

// Get all videos from channel
export const getChannelVideos = async () => {
    try {
        const response = await api.get('/admin/media/youtube/videos');
        console.log("Videos fetched successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching videos:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch videos');
    }
}

// Get live streams
export const getLiveStreams = async () => {
    try {
        const response = await api.get('/admin/media/youtube/live');
        console.log("Live streams fetched successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching live streams:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch live streams');
    }
}

// Get upcoming streams
export const getUpcomingStreams = async () => {
    try {
        const response = await api.get('/admin/media/youtube/upcoming');
        console.log("Upcoming streams fetched successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching upcoming streams:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch upcoming streams');
    }
}

// Validate channel ID
export const validateChannelId = async (channelId) => {
    try {
        const response = await api.get('/admin/media/youtube/validate', { params: { channel_id: channelId } });
        console.log("Channel ID validated successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error validating channel ID:', error);
        throw new Error(error.response?.data?.message || 'Failed to validate channel ID');
    }
}

// Resolve custom URL
export const resolveCustomUrl = async (customUrl) => {
    try {
        const response = await api.get('/admin/media/youtube/resolve', { params: { custom_url: customUrl } });
        console.log("Custom URL resolved successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error resolving custom URL:', error);
        throw new Error(error.response?.data?.message || 'Failed to resolve custom URL');
    }
}

// Start background sync
export const startSync = async () => {
    try {
        const response = await api.post('/admin/media/youtube/sync/start');
        console.log("Sync started successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error starting sync:', error);
        throw new Error(error.response?.data?.message || 'Failed to start sync');
    }
}

// Trigger immediate sync
export const triggerSync = async () => {
    try {
        const response = await api.post('/admin/media/youtube/sync/trigger');
        console.log("Sync triggered successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error triggering sync:', error);
        throw new Error(error.response?.data?.message || 'Failed to trigger sync');
    }
}

// Get sync status
export const getSyncStatus = async () => {
    try {
        const response = await api.get('/admin/media/youtube/sync/status');
        console.log("Sync status fetched successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching sync status:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch sync status');
    }
}
