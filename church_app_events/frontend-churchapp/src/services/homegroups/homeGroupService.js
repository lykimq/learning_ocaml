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

export const getHomeGroups = async () => {
    try {
        const response = await api.get("/admin/home_group/list");
        console.log("Home groups fetched:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching home groups:", error);
        throw error;
    }
}

export const addHomeGroup = async (homeGroupData) => {
    try {
        console.log('Sending home group data:', homeGroupData);

        const formattedData = {
            name: homeGroupData.name,
            description: homeGroupData.description || '',
            location: homeGroupData.location,
            language: homeGroupData.language,
            profile_picture: homeGroupData.profile_picture || '',
            max_capacity: parseInt(homeGroupData.max_capacity),
            meeting_day: homeGroupData.meeting_day,
            meeting_time: homeGroupData.meeting_time,
            created_by: homeGroupData.created_by
        };

        console.log('Formatted data being sent:', formattedData);

        const response = await api.post("/admin/home_group/add", formattedData);
        console.log("Home group added:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            data: error.response?.config?.data
        });
        throw new Error(error.response?.data?.message ||
            error.response?.data ||
            'Failed to add home group');
    }
}


export const updateHomeGroup = async (id, homeGroupData) => {
    try {
        console.log('Updating home group:', { id, data: homeGroupData });
        const response = await api.put(`/admin/home_group/edit/${id}`, homeGroupData);
        console.log("Home group updated:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error updating home group:', error.response?.data);
        throw error;
    }
}

export const deleteHomeGroup = async (id) => {
    try {
        const response = await api.delete(`/admin/home_group/${id}`);
        console.log("Home group deleted:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error deleting home group:", error);
        throw new Error(error.response?.data?.message || 'Failed to delete home group');
    }
}

export const searchHomeGroups = async (params) => {
    try {
        const searchParams = new URLSearchParams(params);

        if (params.name) searchParams.append("name", params.name);
        if (params.language) searchParams.append("language", params.language);
        if (params.location) searchParams.append("location", params.location);

        const response = await api.get(`/admin/home_group/search?${params}`);
        console.log("Home groups searched:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error searching home groups:", error);
        throw new Error(error.response?.data?.message || 'Failed to search home groups');
    }
}

export const getHomeGroupById = async (id) => {
    try {
        const response = await api.get(`/admin/home_group/${id}`);
        console.log("Home group fetched:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching home group:", error);
        throw new Error(error.response?.data?.message || 'Failed to fetch home group');
    }
}

