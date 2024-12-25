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


export const createRegistration = async (registrationData) => {
    try {
        const formattedData = {
            ...registrationData,
            registration_status: (registrationData.status || 'pending').toLowerCase()
        };

        const response = await api.post("/admin/home_group/rsvp/add", formattedData);
        console.log("Registration created:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error creating registration:", error);
        throw new Error(error.response?.data || 'Failed to create registration');
    }
};

export const updateRegistration = async (id, status) => {
    try {
        const statusData = status.toLowerCase();
        const response = await api.put(`/admin/home_group/rsvp/edit/${id}`, statusData);
        console.log("Registration updated:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error updating registration:", error);
        throw new Error(error.response?.data || 'Failed to update registration');
    }
};

export const deleteRegistration = async (id) => {
    try {
        const response = await api.delete(`/admin/home_group/rsvp/${id}`);
        console.log("Registration deleted:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error deleting registration:", error);
        throw new Error(error.response?.data || 'Failed to delete registration');
    }
};

// Get all registrations by home group
export const getAllRegistrations = async () => {
    try {
        const response = await api.get("/admin/home_group/rsvp/list");
        console.log("Registrations fetched:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching registrations:", error);
        throw new Error(error.response?.data || 'Failed to fetch registrations');
    }
};

export const getRegistrationsByGroup = async (groupId) => {
    try {
        const response = await api.get(`/admin/home_group/rsvp/group/${groupId}`);
        console.log("Registrations by group fetched:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching registrations by group:", error);
        throw new Error(error.response?.data || 'Failed to fetch registrations by group');
    }
};

export const getRegistrationsByEmail = async (email) => {
    try {
        const response = await api.get(`/admin/home_group/rsvp/email/${email}`);
        console.log("Registrations by email fetched:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching registrations by email:", error);
        throw new Error(error.response?.data || 'Failed to fetch registrations by email');
    }
};

export const confirmRegistration = async (id) => {
    try {
        const response = await api.post(`/admin/home_group/rsvp/confirm/${id}`);
        console.log("Registration confirmed:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error confirming registration:", error);
        throw new Error(error.response?.data || 'Failed to confirm registration');
    }
};

export const declineRegistration = async (id) => {
    try {
        const response = await api.post(`/admin/home_group/rsvp/decline/${id}`);
        console.log("Registration declined:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error declining registration:", error);
        throw new Error(error.response?.data || 'Failed to decline registration');
    }
};

export const searchRegistrations = async (searchParams) => {
    try {
        const response = await api.get("/admin/home_group/rsvp/search", { params: searchParams });
        console.log("Registrations searched:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error searching registrations:", error);
        throw new Error(error.response?.data || 'Failed to search registrations');
    }
};

// Admin send confirmation email to user
export const sendConfirmationEmail = async (rsvpData) => {
    try {
        console.log('Sending confirmation email with data:', rsvpData);
        const response = await api.post("/admin/home_group/rsvp/email/send-confirmation", {
            email: rsvpData.email,
            name: rsvpData.name,
            home_group_id: rsvpData.home_group_id,
            rsvp_id: rsvpData.rsvp_id
        });

        console.log("Confirmation email sent:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error sending confirmation email:", error);
        throw new Error(error.response?.data || 'Failed to send confirmation email');
    }
};

// Admin send decline email to user
export const sendDeclineEmail = async (rsvpData) => {
    try {
        console.log('Sending decline email with data:', rsvpData);
        const emailData = {
            rsvp_id: rsvpData.id,
            email: rsvpData.email,
            name: rsvpData.name,
            home_group_id: rsvpData.home_group_id
        };
        console.log('Formatted email data:', emailData);

        const response = await api.post("/admin/home_group/rsvp/email/send-decline", emailData);
        console.log("Decline email sent:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error sending decline email:", error);
        throw new Error(error.response?.data || 'Failed to send decline email');
    }
};
