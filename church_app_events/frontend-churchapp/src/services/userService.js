import { Platform } from 'react-native';
import axios from 'axios';
import { API_URL_ANDROID, API_URL_IOS, API_URL_WEB } from '@env';

const getApiUrl = () => {
    switch (Platform.OS) {
        case 'android': return API_URL_ANDROID;
        case 'ios': return API_URL_IOS;
        default: return API_URL_WEB;
    }
};

const apiUrl = getApiUrl();

const api = axios.create({
    baseURL: apiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

// get users

export const getUsers = async () => {
    try {
        const response = await api.get('/admin/users/list');
        console.log('Users fetched:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};


// get user by id
export const getUserById = async (id) => {
    try {
        const response = await api.get(`/admin/users/${id}`);
        console.log('User fetched:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching user by id:', error);
        throw error;
    }
};

// get user by email
export const getUserByEmail = async (email) => {
    try {
        const response = await api.get(`/admin/users/email/${email}`);
        console.log('User fetched by email:', response.data);
        return response.data;
    } catch (error) {
        if (error.response?.status === 404) {
            return null;
        }
        throw new Error(error.response?.data?.message || 'Failed to fetch user by email');
    }
};

// get user by username
export const getUserByUsername = async (username) => {
    try {
        const response = await api.get(`/admin/users/username/${username}`);
        console.log('User fetched by username:', response.data);
        return response.data;
    } catch (error) {
        if (error.response?.status === 404) {
            return null;
        }
        throw new Error(error.response?.data?.message || 'Failed to fetch user by username');
    }
};


// Verify password with support for both email and username login
export const verifyPassword = async (loginData) => {
    try {
        const requestData = {
            identifier: loginData.identifier,
            password: loginData.password
        };

        console.log('Attempting to verify password for:', requestData.identifier);

        const response = await api.post('/admin/users/verify-password', requestData);

        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(response.data, null, 2));

        if (response.data.valid && response.data.user) {
            console.log('Successfully authenticated user:', response.data.user.username);
            return response.data.user;
        } else {
            console.log('Authentication failed - Invalid credentials');
            throw new Error('Invalid username/email or password');
        }
    } catch (error) {
        console.error('Authentication error:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message
        });

        if (error.response?.status === 404) {
            throw new Error('User not found');
        } else if (error.response?.status === 401) {
            throw new Error('Invalid password');
        } else {
            throw new Error(error.response?.data?.message || 'Authentication failed');
        }
    }
};


// add user
export const addUser = async (user) => {
    try {

        if (!user.email || !user.password || !user.username || !user.role) {
            const missingFields = [];
            if (!user.email) missingFields.push('email');
            if (!user.password) missingFields.push('password');
            if (!user.username) missingFields.push('username');
            if (!user.role) missingFields.push('role');

            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        const response = await api.post('/admin/users/add', user);
        console.log('User added:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error adding user:', error);
        // Check if the error response has a message
        if (error.response?.data?.message?.includes("already exists")) {
            throw new Error("Email already exists");
        } else {
            throw new Error(error.response?.data?.message || 'Failed to add user');
        }
    }
};

// update user
export const updateUser = async (id, user) => {
    try {
        const response = await api.put(`/admin/users/edit/${id}`, user);
        console.log('User updated:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
};

// delete user
export const deleteUser = async (id) => {
    try {
        const response = await api.delete(`/admin/users/${id}`);
        console.log('User deleted:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
};


// search users
export const searchUsers = async (params) => {
    try {
        // Convert params to query string
        const searchParams = new URLSearchParams();

        if (params.email) searchParams.append('email', params.email);
        if (params.username) searchParams.append('username', params.username);
        if (params.role) searchParams.append('role', params.role)

        const query = searchParams.toString();

        const response = await api.get(`/admin/users/search?${query}`);
        console.log('Users searched:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error searching users:', error);
        throw error;
    }
};

// Combined login function that matches your LoginScreen
export const login = async (loginData) => {
    try {
        const user = await verifyPassword(loginData);
        return user;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

// Check if username exists (for registration)
export const checkUsernameAvailability = async (username) => {
    try {
        const user = await getUserByUsername(username);
        return !user;
    } catch (error) {
        console.error('Error checking username:', error);
        throw new Error(error.response?.data?.message || 'Failed to check username availability');
    }
};


// Check if email exists (for registration)
export const checkEmailAvailability = async (email) => {
    try {
        const user = await getUserByEmail(email);
        return !user;
    } catch (error) {
        console.error('Error checking email:', error);
        throw new Error(error.response?.data?.message || 'Failed to check email availability');
    }
};