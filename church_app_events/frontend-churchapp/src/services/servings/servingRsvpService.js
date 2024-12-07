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
};

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

// Create a new serving signup
export const createServingSignup = async (signupData) => {
    try {
        const response = await api.post("/servings/rsvp/add", signupData);
        console.log("Serving signup created:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error creating serving signup:", error);
        throw new Error(error.response?.data || 'Failed to create serving signup');
    }
};

// Update a serving signup
export const updateServingSignup = async (id, status) => {
    try {
        const response = await api.put(`/servings/rsvp/edit/${id}`, { signup_status: status });
        console.log("Serving signup updated:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error updating serving signup:", error);
        throw new Error(error.response?.data || 'Failed to update serving signup');
    }
};

// Delete a serving signup
export const deleteServingSignup = async (id) => {
    try {
        const response = await api.delete(`/servings/rsvp/${id}`);
        console.log("Serving signup deleted:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error deleting serving signup:", error);
        throw new Error(error.response?.data || 'Failed to delete serving signup');
    }
};

// Get all serving signups
export const getAllServingSignups = async () => {
    try {
        const response = await api.get("/servings/rsvp/list");
        console.log("Serving signups fetched:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching serving signups:", error);
        throw new Error(error.response?.data || 'Failed to fetch serving signups');
    }
};

// Search serving signups
export const searchServingSignups = async (searchParams) => {
    try {
        const response = await api.get("/servings/rsvp/search", { params: searchParams });
        console.log("Serving signups searched:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error searching serving signups:", error);
        throw new Error(error.response?.data || 'Failed to search serving signups');
    }
};

// Confirm a serving signup
export const confirmServingSignup = async (id) => {
    try {
        const response = await api.post(`/servings/rsvp/confirm/${id}`);
        console.log("Serving signup confirmed:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error confirming serving signup:", error);
        throw new Error(error.response?.data || 'Failed to confirm serving signup');
    }
};

// Decline a serving signup
export const declineServingSignup = async (id) => {
    try {
        const response = await api.post(`/servings/rsvp/decline/${id}`);
        console.log("Serving signup declined:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error declining serving signup:", error);
        throw new Error(error.response?.data || 'Failed to decline serving signup');
    }
};

// Send confirmation email
export const sendConfirmationEmail = async (rsvpData) => {
    try {
        console.log('Sending confirmation email with data:', rsvpData);
        const response = await api.post("/admin/servings/rsvp/email/send-confirmation", {
            email: rsvpData.email,
            name: rsvpData.name,
            serving_id: rsvpData.serving_id,
            signup_id: rsvpData.signup_id
        });

        console.log("Confirmation email sent:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error sending confirmation email:", error);
        throw new Error(error.response?.data || 'Failed to send confirmation email');
    }
};

// Send decline email
export const sendDeclineEmail = async (rsvpData) => {
    try {
        console.log('Sending decline email with data:', rsvpData);
        const emailData = {
            signup_id: rsvpData.id,
            email: rsvpData.email,
            name: rsvpData.name,
            serving_id: rsvpData.serving_id
        };
        console.log('Formatted email data:', emailData);

        const response = await api.post("/admin/servings/rsvp/email/send-decline", emailData);
        console.log("Decline email sent:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error sending decline email:", error);
        throw new Error(error.response?.data || 'Failed to send decline email');
    }
};
