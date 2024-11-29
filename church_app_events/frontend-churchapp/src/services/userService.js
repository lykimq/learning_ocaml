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
        console.error('Error fetching user by email:', error);
        throw error;
    }
};

// add user
export const addUser = async (user) => {
    try {
        // Validate the data format before sending
        if (!user.email || !user.password || !user.name || !user.role) {
            throw new Error('Missing required fields');
        }

        const response = await api.post('/admin/users/add', user);
        console.log('User added:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error adding user:', error);
        throw new Error(error.response?.data?.message || 'Failed to add user');
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
        if (params.name) searchParams.append('name', params.name);
        if (params.role) searchParams.append('role', params.role)

        const response = await api.get(`/admin/users/search?${query}`);
        console.log('Users searched:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error searching users:', error);
        throw error;
    }
};

// LOG
console.log('Android URL for users:', API_URL_ANDROID);
console.log('iOS URL for users:', API_URL_IOS);
console.log('Web URL for users:', API_URL_WEB);