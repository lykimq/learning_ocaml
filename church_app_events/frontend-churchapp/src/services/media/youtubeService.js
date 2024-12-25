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


// Get all videos from channel
export const getChannelVideos = async (channelId) => {
    try {
        const response = await api.get('/admin/media/youtube/videos', {
            params: { channel_id: channelId }
        });
        console.log("Videos fetched successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching channel videos:', error);
        throw error;
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
        console.log('Validating channel ID:', channelId);
        console.log('API URL:', apiUrl);

        const url = `${apiUrl}/admin/media/youtube/validate`;
        console.log('Full request URL:', url);

        const config = {
            params: { channel_id: channelId },
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };

        console.log('Request config:', config);

        const response = await axios.get(url, config);

        console.log('Validation response:', response.data);
        return response.data;
    } catch (error) {
        console.error('YouTube validation error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            config: error.config
        });

        if (error.response) {
            // The server responded with a status code outside of 2xx
            throw new Error(`Server error: ${error.response.data?.error || error.response.statusText}`);
        } else if (error.request) {
            // The request was made but no response received
            throw new Error('No response received from server');
        } else {
            // Something happened in setting up the request
            throw new Error(`Request setup error: ${error.message}`);
        }
    }
};

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
