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


// Create a new serving RSVP
export const createServingRsvp = async (rsvpData) => {
    try {
        const response = await api.post("/servings/rsvp/add", rsvpData);
        console.log("Serving RSVP created:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error creating serving RSVP:", error);
        throw new Error(error.response?.data || 'Failed to create serving RSVP');
    }
};

// Update a serving RSVP
export const updateServingRsvp = async (id, status) => {
    try {
        const response = await api.put(`/servings/rsvp/edit/${id}`, status);
        console.log("Serving RSVP updated:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error updating serving RSVP:", error);
        throw new Error(error.response?.data || 'Failed to update serving RSVP');
    }
};

// Delete a serving RSVP
export const deleteServingRsvp = async (id) => {
    try {
        const response = await api.delete(`/servings/rsvp/${id}`);
        console.log("Serving RSVP deleted:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error deleting serving RSVP:", error);
        throw new Error(error.response?.data || 'Failed to delete serving RSVP');
    }
};

// Get all serving RSVPs
export const getAllServingRsvps = async () => {
    try {
        const response = await api.get("/servings/rsvp/list");
        console.log("Serving RSVPs fetched:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching serving RSVPs:", error);
        throw new Error(error.response?.data || 'Failed to fetch serving RSVPs');
    }
};

// Search serving RSVPs
export const searchServingRsvps = async (searchParams) => {
    try {
        // Log the request parameters for debugging
        console.log("Searching serving RSVPs with params:", searchParams);

        // Add timeout and retry logic
        const response = await api.get("/servings/rsvp/search", {
            params: searchParams,
            timeout: 5000, // 5 second timeout
            retry: 3,      // Retry 3 times
            retryDelay: 1000 // Wait 1 second between retries
        });

        console.log("Serving RSVPs search response:", response.data);
        return response.data;
    } catch (error) {
        // Enhanced error logging
        console.error("Error searching serving RSVPs:", {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            config: {
                url: error.config?.url,
                method: error.config?.method,
                params: error.config?.params,
                baseURL: error.config?.baseURL
            }
        });

        // Provide more specific error messages
        if (error.code === 'ERR_NETWORK') {
            throw new Error('Network connection error. Please check your internet connection and try again.');
        } else if (error.response?.status === 404) {
            throw new Error('Search endpoint not found. Please contact support.');
        } else if (error.response?.status === 401) {
            throw new Error('Unauthorized access. Please log in again.');
        } else {
            throw new Error(error.response?.data?.message || 'Failed to search serving RSVPs');
        }
    }
};

// Admin confirm a serving rsvp
export const confirmServingRsvp = async (id) => {
    try {
        const response = await api.post(`/admin/servings/rsvp/confirm/${id}`);
        console.log("Serving rsvp confirmed:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error confirming serving rsvp:", error);
        throw new Error(error.response?.data || 'Failed to confirm serving rsvp');
    }
};

// Admin decline a serving rsvp
export const declineServingRsvp = async (id) => {
    try {
        const response = await api.post(`/admin/servings/rsvp/decline/${id}`);
        console.log("Serving rsvp declined:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error declining serving rsvp:", error);
        throw new Error(error.response?.data || 'Failed to decline serving rsvp');
    }
};

// Admin send confirmation email
export const sendConfirmationEmail = async (rsvpData, currentUser = null) => {
    try {
        const emailData = {
            rsvp_id: rsvpData.rsvp_id,
            email: rsvpData.email,
            name: rsvpData.name || rsvpData.email?.split('@')[0],
            serving_id: rsvpData.serving_id,
            user_id: rsvpData.user_id || currentUser?.id || null,
            logged_in_user: rsvpData.logged_in_user || currentUser?.email || null
        };

        console.log('Sending confirmation email with data:', emailData);
        const response = await api.post("/admin/servings/rsvp/email/send-confirmation", emailData);
        console.log("Confirmation email sent:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error sending confirmation email:", error);
        throw new Error(error.response?.data || 'Failed to send confirmation email');
    }
};

// Admin send decline email
export const sendDeclineEmail = async (rsvpData, currentUser = null) => {
    try {
        const emailData = {
            rsvp_id: rsvpData.rsvp_id,
            email: rsvpData.email,
            name: rsvpData.name || rsvpData.email?.split('@')[0],
            serving_id: rsvpData.serving_id,
            user_id: rsvpData.user_id || currentUser?.id || null,
            logged_in_user: rsvpData.logged_in_user || currentUser?.email || null
        };

        console.log('Sending decline email with data:', emailData);
        const response = await api.post("/admin/servings/rsvp/email/send-decline", emailData);
        console.log("Decline email sent:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error sending decline email:", error);
        throw new Error(error.response?.data || 'Failed to send decline email');
    }
};
