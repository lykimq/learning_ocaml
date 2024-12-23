import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './apiConfig';


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
        console.log('API URL being used:', apiUrl);
        console.log('Making request to:', `${apiUrl}/admin/users/verify-password`);

        const requestData = {
            identifier: loginData.identifier,
            password: loginData.password
        };

        const response = await api.post('/admin/users/verify-password', requestData);
        console.log('Response received:', response.data);

        // The response contains { valid: true, user: {...} }
        if (response.data.valid && response.data.user) {
            console.log('Valid user data received:', response.data.user);
            return response.data.user; // Return just the user object
        } else {
            throw new Error('Invalid credentials');
        }
    } catch (error) {
        if (error.response) {
            console.error('Server error:', error.response.data);
            throw new Error(error.response.data?.message || 'Authentication failed');
        } else if (error.request) {
            console.error('No response received:', error.request);
            throw new Error('No response from server');
        } else {
            console.error('Request error:', error.message);
            throw error;
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
export const updateUser = async (id, userData) => {
    try {
        // Ensure we're not sending the role field
        const { role, ...updateData } = userData;

        console.log('Updating user with data:', updateData);

        const response = await api.put(`/admin/users/edit/${id}`, updateData);
        console.log('User updated:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error updating user:', error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        } else if (error.response?.status === 500) {
            throw new Error('Server error occurred while updating user');
        } else {
            throw new Error('Failed to update user: ' + (error.message || 'Unknown error'));
        }
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

const storeToken = async (token) => {
    try {
        await AsyncStorage.setItem('token', token);
    } catch (error) {
        console.error('Error storing token:', error);
        throw error;
    }
};

export const login = async (loginData) => {
    try {
        console.log('Attempting login with:', loginData);

        // Use the configured api instance instead of axios directly
        const response = await api.post('/auth/login', loginData);
        console.log('Login response received:', response.data);

        if (response.data.token) {
            await storeToken(response.data.token);
            // Also store the token in the api instance headers
            api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
            return response.data;
        } else {
            throw new Error('No token received');
        }
    } catch (error) {
        console.error('Login service error:', error);
        if (error.response) {
            throw new Error(error.response.data.message || 'Failed to log in');
        } else if (error.request) {
            throw new Error('Network error - please check your connection');
        } else {
            throw new Error('Failed to log in');
        }
    }
};

export const logout = async () => {
    try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            // Use the configured api instance instead of axios directly
            await api.post('/auth/logout', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        await AsyncStorage.removeItem('token');
        // Remove the token from api headers
        delete api.defaults.headers.common['Authorization'];
    }
};

// Add a function to setup the API with stored token on app start
export const setupApiToken = async () => {
    try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    } catch (error) {
        console.error('Error setting up API token:', error);
    }
};