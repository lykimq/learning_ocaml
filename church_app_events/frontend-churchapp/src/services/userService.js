import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from "react-native";
import axios from "axios";
import { API_URL_ANDROID_DEVICE, API_URL_IOS, API_URL_WEB } from "@env"
import NetInfo from "@react-native-community/netinfo";

const getApiUrl = async () => {

    const netInfo = await NetInfo.fetch();
    console.log('NetInfo:', netInfo);

    switch (Platform.OS) {
        case "android":
            if (!__DEV__) {
                return API_URL_ANDROID_DEVICE || 'http://192.168.1.36:8080';
            } else if (netInfo.type === 'wifi') {
                return 'http://10.0.2.2:8080'
            }
            return 'http://10.0.2.2:8080'
        case "ios":
            return API_URL_IOS;
        default:
            return API_URL_WEB;
    }
}

const createApi = async () => {
    const apiUrl = await getApiUrl();
    return axios.create({
        baseURL: apiUrl,
        timeout: Platform.OS === 'web' ? 30000 : 10000,
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Connection": "keep-alive",
        },
        retry: 3,
        retryDelay: (retryCount) => {
            console.log(`Retrying request, attempt ${retryCount + 1}`);
            return 1000 * Math.pow(2, retryCount);
        },
    });

    // Add request interception with timeout handling
    api.interceptors.request.use(async (config) => {
        // Check network status before making request
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
            throw new Error('No internet connection');
        }
        if (__DEV__) {
            console.log('Starting Request:', {
                url: config.url,
                method: config.method,
                baseURL: config.baseURL,
                data: config.data
            });
        }
        return config;
    });

    // Add response interceptor for debugging
    api.interceptors.response.use(
        response => {
            if (__DEV__) {
                console.log('Response:', response);
            }
            return response;
        },
        error => {
            if (__DEV__) {
                console.log('Response Error:', {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status,
                    config: error.config
                });
            }

            // Handle timeout errors specifically
            if (error.code === 'ECONNABORTED') {
                throw new Error('Request timed out');
            }

            // Handle network errors
            if (error.code === 'ENOTFOUND') {
                throw new Error('Network error');
            }

            throw error;
        }
    );

    return instance;
}

// Initialize the API instance
let api;
(async () => {
    api = await createApi();
})();


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
        const response = await api.post('/auth/login', {
            identifier: loginData.identifier,
            password: loginData.password
        });

        console.log('Login successful:', {
            status: response.status,
            tokenReceived: !!response.data.token
        });

        if (response.data.token) {
            // Store the token
            await storeToken(response.data.token);

            // Set the token in axios headers
            api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

            // Return the full response data (includes token, user info, and expires_in)
            return {
                user: response.data.user,
                token: response.data.token,
                expires_in: response.data.expires_in,
                token_type: response.data.token_type
            };
        } else {
            throw new Error('No token received in response');
        }
    } catch (error) {
        console.error('Login error:', error.message);
        throw new Error(error.response?.data?.message || 'Login failed');
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

// Add a function to check if the token is still valid
export const isTokenValid = async () => {
    try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return false;

        // You can add additional token validation here if needed
        // For example, checking if it's expired based on JWT decode

        return true;
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
};