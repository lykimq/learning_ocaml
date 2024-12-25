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


// Create a new media
export const createMedia = async (mediaData) => {
    try {
        console.log('Starting Request:', {
            method: 'post',
            url: `${API_BASE_URL}/admin/media/add`,
            data: mediaData
        });

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

// Get all media (combines both saved media and YouTube videos)
export const getAllContent = async () => {
    try {
        // Try to fetch both, but don't let one failure stop the other
        const [mediaResponse, youtubeResponse] = await Promise.allSettled([
            api.get('/admin/media/list').catch(err => {
                console.warn('Failed to fetch saved media:', err);
                return { data: [] };
            }),
            api.get('/admin/media/youtube/videos').catch(err => {
                console.warn('Failed to fetch YouTube videos:', err);
                return { data: [] };
            })
        ]);

        // Safely extract data from responses
        const savedMedia = mediaResponse.status === 'fulfilled' ? mediaResponse.value.data || [] : [];

        // Handle YouTube response data structure
        let youtubeVideos = [];
        if (youtubeResponse.status === 'fulfilled' && youtubeResponse.value.data) {
            const ytData = youtubeResponse.value.data;
            console.log('Raw YouTube response:', ytData);

            // Extract videos array from the response
            if (ytData.videos && Array.isArray(ytData.videos)) {
                youtubeVideos = ytData.videos;
            } else if (Array.isArray(ytData)) {
                youtubeVideos = ytData;
            } else if (ytData.items && Array.isArray(ytData.items)) {
                youtubeVideos = ytData.items;
            }
        }

        // Transform YouTube videos to match media format
        const formattedYoutubeVideos = youtubeVideos.map(video => ({
            id: `youtube-${video.id?.videoId || video.id || Date.now()}`,
            title: video.snippet?.title || video.title,
            description: video.snippet?.description || video.description,
            thumbnail_url: video.snippet?.thumbnails?.default?.url || video.thumbnail_url,
            media_type: 'youtube',
            source: 'youtube',
            created_at: video.snippet?.publishedAt || new Date().toISOString()
        }));

        // Mark saved media and ensure unique IDs
        const formattedSavedMedia = savedMedia.map(media => ({
            ...media,
            id: `saved-${media.id || Date.now()}`,
            source: 'saved'
        }));

        const combinedContent = [...formattedSavedMedia, ...formattedYoutubeVideos];
        console.log('Combined content:', combinedContent);
        return combinedContent;
    } catch (error) {
        console.error('Error in getAllContent:', error);
        return [];
    }
};

// Get YouTube videos only
export const getYoutubeVideos = async () => {
    try {
        const response = await api.get('/admin/media/youtube/videos');
        const videos = response.data;
        console.log("YouTube videos fetched successfully:", videos);
        return Array.isArray(videos) ? videos : videos.items || [];
    } catch (error) {
        console.error('Error fetching YouTube videos:', error);
        return [];
    }
};

// Get saved media only
export const getSavedMedia = async () => {
    try {
        const response = await api.get('/admin/media/list');
        console.log("Saved media fetched successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching saved media:', error);
        return [];
    }
};

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