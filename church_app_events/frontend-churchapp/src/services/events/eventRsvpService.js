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


export const addRsvp = async (rsvpData) => {
    try {
        if (!rsvpData.event_id || !rsvpData.email || !rsvpData.rsvp_status) {
            throw new Error('Missing required fields');
        }

        console.log('Sending RSVP data:', rsvpData); // Debug log

        const response = await api.post('/events/rsvp/add', {
            event_id: rsvpData.event_id,
            email: rsvpData.email,
            user_id: rsvpData.user_id,
            rsvp_status: rsvpData.rsvp_status
        });

        console.log('RSVP response:', response.data); // Debug log
        return response.data;
    } catch (error) {
        console.error('Error adding RSVP:', error);
        if (error.response?.data) {
            throw new Error(error.response.data);
        }
        throw new Error('Failed to register for the event');
    }
};

export const updateRsvp = async (id, rsvpData) => {
    try {
        const response = await api.put(`/events/rsvp/edit/${id}`, rsvpData);
        console.log('RSVP updated:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error updating RSVP:', error);
        throw error;
    }
};

export const deleteRsvp = async (id) => {
    try {
        const response = await api.delete(`/events/rsvp/${id}`);
        console.log('RSVP deleted:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error deleting RSVP:', error);
        throw error;
    }
};


// Get all RSVPs
export const getAllRsvps = async () => {
    try {
        const response = await api.get('/events/rsvp/list');
        console.log('RSVPs fetched:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching RSVPs:', error);
        throw error;
    }
};

export const getRsvpsByEmail = async (email) => {
    try {
        const response = await api.get(`/events/rsvp/email/${encodeURIComponent(email)}`);
        console.log('RSVPs for email fetched:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching RSVPs for email:', error);
        throw error;
    }
};


export const getRsvpsByEvent = async (eventId) => {
    try {
        const response = await api.get(`/events/rsvp/event/${eventId}`);
        console.log('RSVPs for event fetched:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching RSVPs for event:', error);
        throw error;
    }
};

// Admin confirm RSVP
export const confirmRsvp = async (rsvpId) => {
    try {
        const response = await api.post(`/admin/events/rsvp/confirm/${rsvpId}`);
        console.log('RSVP confirmed:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error confirming RSVP:', error);
        throw error;
    }
};

// Admin decline RSVP
export const declineRsvp = async (rsvpId) => {
    try {
        console.log('Declining RSVP with ID:', rsvpId);
        const response = await api.post(`/admin/events/rsvp/decline/${rsvpId}`);
        console.log('Decline response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error in declineRsvp:', error);
        throw error;
    }
};

// Admin send confirmation email to user
export const sendConfirmationEmail = async (rsvpData) => {
    try {
        const response = await api.post('/admin/events/rsvp/email/send-confirmation', {
            rsvp_id: rsvpData.rsvp_id,
            email: rsvpData.email,
            event_id: rsvpData.event_id
        });
        console.log('Confirmation email sent:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        if (error.response?.data) {
            throw new Error(error.response.data);
        }
        throw new Error('Failed to send confirmation email');
    }
};

// Admin send decline email to user
export const sendDeclineEmail = async (emailData) => {
    try {
        console.log('Sending decline email with data:', emailData);
        const response = await api.post('/admin/events/rsvp/email/send-decline', {
            rsvp_id: emailData.rsvp_id,
            email: emailData.email,
            event_id: emailData.event_id
        });
        console.log('Email response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending decline email:', error);
        throw error;
    }
};


// Admin send confirmation email to user-email
export const confirmRsvpWithEmail = async (rsvpId, email, eventId) => {
    try {
        await confirmRsvp(rsvpId);

        await sendConfirmationEmail({
            rsvp_id: rsvpId,
            email: email,
            event_id: eventId
        });

        return { message: 'RSVP confirmed and confirmation email sent' };
    } catch (error) {
        console.error('Error in RSVP confirmation process:', error);
        throw new Error('Failed to complete RSVP confirmation process');
    }
};

// Admin send decline email to user email
export const declineRsvpWithEmail = async (rsvpId, email, eventId) => {
    try {
        // First decline the RSVP
        await declineRsvp(rsvpId);

        // Then send the email
        try {
            await sendDeclineEmail({
                rsvp_id: rsvpId,
                email: email,
                event_id: eventId
            });
            return { status: 'success' };
        } catch (emailError) {
            console.warn('Email sending failed, but RSVP was declined:', emailError);
            return {
                status: 'partial_success',
                message: 'RSVP declined but notification email failed to send'
            };
        }
    } catch (error) {
        console.error('Error in decline process:', error);
        throw new Error(error.response?.data || error.message || 'Failed to decline RSVP');
    }
};

// Search event rsvp
export const searchRsvps = async (searchParams = {}) => {
    try {
        console.log('Search params received:', searchParams);

        const params = new URLSearchParams();

        // Add parameters with proper naming and to match backend
        if (searchParams.status) {
            params.append('status', searchParams.status.toLowerCase());
            console.log('Status param added:', params.toString());
        }
        if (searchParams.email) params.append('email', searchParams.email);
        if (searchParams.eventTitle) params.append('event_title', searchParams.eventTitle);
        if (searchParams.userId) params.append('user_id', searchParams.userId);

        // Convert URLSearchParams to string
        const queryString = params.toString();
        const url = `/admin/events/rsvp/search?${queryString}`;
        console.log('Final URL:', url);

        const response = await api.get(url);
        console.log('RSVPs searched:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error searching RSVPs:', error);
        throw error;
    }
};

// Search by email and status
export const searchRsvpsWithEmail = async (searchCriteria) => {
    try {
        const { query, status } = searchCriteria;

        if (!query) {
            throw new Error('Email is required');
        }

        if (!query.includes('@')) {
            throw new Error('Invalid email format');
        }

        return await searchRsvps({
            email: query.trim(),
            status: status
        });


    } catch (error) {
        console.error('Error searching RSVPs by email:', error);
        throw error;
    }
};

// Search by status
export const searchRsvpsByStatus = async (status) => {
    try {
        console.log('Attempting to search with status:', status);
        const response = await searchRsvps({ status: status });
        console.log('Raw API Response:', response);
        return response;
    } catch (error) {
        console.error('Error searching RSVPs by status:', error);
        throw error;
    }
};

// Search by event title
export const searchRsvpsByEventTitle = async (eventTitle) => {
    try {
        const response = await searchRsvps({ eventTitle });
        console.log('RSVPs searched by event title:', response);
        return response;
    } catch (error) {
        console.error('Error searching RSVPs by event title:', error);
        if (error.response?.data) {
            throw new Error(error.response.data);
        }
        throw new Error('Failed to search RSVPs by event title');
    }
};


