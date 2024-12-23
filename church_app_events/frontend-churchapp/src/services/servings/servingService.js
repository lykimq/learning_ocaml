import api from '../apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a new serving
export const createServing = async (servingData) => {
    try {
        const response = await api.post("/admin/servings/add", servingData);
        console.log("Serving created:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error creating serving:", error);
        throw new Error(error.response?.data?.message || 'Failed to create serving');
    }
};

// Update a serving
export const updateServing = async (id, servingData) => {
    try {
        const response = await api.put(`/admin/servings/edit/${id}`, servingData);
        console.log("Serving updated:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error updating serving:", error);
        throw new Error(error.response?.data?.message || 'Failed to update serving');
    }
};

// Get all serving signups
export const getAllServing = async () => {
    try {
        const response = await api.get("/admin/servings/list");
        console.log("All serving fetched:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching serving:", error);
        throw new Error(error.response?.data?.message || 'Failed to fetch serving');
    }
};

// Delete a serving signup
export const deleteServing = async (id) => {
    try {
        const response = await api.delete(`/admin/servings/${id}`);
        console.log("Serving deleted:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error deleting serving:", error);
        throw new Error(error.response?.data?.message || 'Failed to delete serving');
    }
};

// Search serving signups
export const searchServings = async (params) => {
    try {
        const searchParams = new URLSearchParams(params);
        const response = await api.get(`/admin/servings/search?${searchParams}`);
        console.log("Serving searched:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error searching serving:", error);
        throw new Error(error.response?.data?.message || 'Failed to search serving');
    }
};

// Get serving signup by ID
export const getServingById = async (id) => {
    try {
        const response = await api.get(`/admin/servings/${id}`);
        console.log("Serving fetched:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching serving:", error);
        throw new Error(error.response?.data?.message || 'Failed to fetch serving signup');
    }
};

