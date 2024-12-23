import api from '../apiConfig';

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
            api.get('/admin/media/all').catch(err => {
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
            console.log('Raw YouTube response:', ytData); // Debug log

            // Handle different response structures
            if (Array.isArray(ytData)) {
                youtubeVideos = ytData;
            } else if (ytData.items && Array.isArray(ytData.items)) {
                youtubeVideos = ytData.items;
            } else if (typeof ytData === 'object') {
                // If it's a single video object
                youtubeVideos = [ytData];
            }
        }

        console.log('Processed YouTube videos:', youtubeVideos); // Debug log

        // Transform YouTube videos to match media format
        const formattedYoutubeVideos = youtubeVideos.map(video => ({
            id: video.id?.videoId || video.id,
            title: video.snippet?.title || video.title,
            description: video.snippet?.description || video.description,
            thumbnail_url: video.snippet?.thumbnails?.default?.url || video.thumbnail_url,
            media_type: 'youtube',
            source: 'youtube',
            created_at: video.snippet?.publishedAt || new Date().toISOString()
        }));

        // Mark saved media
        const formattedSavedMedia = savedMedia.map(media => ({
            ...media,
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
        const response = await api.get('/admin/media/all');
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