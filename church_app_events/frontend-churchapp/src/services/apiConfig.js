import { Platform } from 'react-native';
import axios from 'axios';
import Constants from 'expo-constants';

const getBaseUrl = () => {
    if (__DEV__) {
        // When using adb reverse, localhost on the device points to localhost on the computer
        return 'http://localhost:8080';
    }
    return 'https://your-production-url.com';
};

// Create axios instance
const api = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 10000
});

// Add request interceptor
api.interceptors.request.use(
    config => {
        console.log('🚀 Making request:', {
            fullUrl: `${config.baseURL}${config.url}`,
            method: config.method,
            headers: config.headers
        });
        return config;
    },
    error => {
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor
api.interceptors.response.use(
    response => {
        console.log('✅ Response:', {
            status: response.status,
            url: response.config.url,
            data: response.data ? 'Data received' : 'No data'
        });
        return response;
    },
    error => {
        const errorDetails = {
            message: error.message,
            code: error.code,
            url: error.config?.url,
            baseURL: error.config?.baseURL,
            method: error.config?.method,
            status: error.response?.status,
            data: error.response?.data,
            platform: Platform.OS
        };

        console.error('❌ Response Error:', errorDetails);
        return Promise.reject(error);
    }
);

// Simple connection test
const testConnection = async () => {
    try {
        console.log('Testing connection to:', getBaseUrl());
        const response = await fetch(`${getBaseUrl()}/health`);
        const data = await response.json();
        console.log('Connection test successful:', data);
        return true;
    } catch (error) {
        console.error('Connection test failed:', error);
        return false;
    }
};

// Run initial test
testConnection();

export default api;