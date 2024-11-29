import { Platform } from "react-native";
import axios from "axios";
import { API_URL_ANDROID, API_URL_IOS, API_URL_WEB } from "@env"

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
        // Validate the data format before sending
        if (!homeGroupData.name ||
            !homeGroupData.created_by) {
            throw new Error('Missing required fields');
        }

        const response = await api.post("/admin/home_group/add", homeGroupData);
        console.log("Home group added:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error adding home group:", error);
        throw new Error(error.response?.data?.message || 'Failed to add home group');
    }
}


export const updateHomeGroup = async (id, homeGroupData) => {
    try {
        const response = await api.put(`/admin/home_group/edit/${id}`, homeGroupData);
        console.log("Home group updated:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error updating home group:", error);
        throw new Error(error.response?.data?.message || 'Failed to update home group');
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

console.log('Android URL:', API_URL_ANDROID);
console.log('iOS URL:', API_URL_IOS);
console.log('Web URL:', API_URL_WEB);