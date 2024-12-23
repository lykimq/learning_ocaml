import { Platform, Alert } from 'react-native';
import axios from 'axios';
import {
    API_URL_ANDROID_EMULATOR,
    API_URL_ANDROID_DEVICE,
    API_URL_IOS,
    API_URL_WEB
} from '@env';
import { logger } from "react-native-logs";

const isEmulator = () => {
    if (Platform.OS === 'android') {
        return !!(
            window.navigator.userAgent.includes('Android Emulator') ||
            window.navigator.userAgent.includes('SDK built for x86')
        );
    }
    return false;
}

const getApiUrl = () => {
    if (Platform.OS === 'android') {
        return isEmulator()
            ? API_URL_ANDROID_EMULATOR  // 10.0.2.2:8080 for emulator
            : API_URL_ANDROID_DEVICE;   // 192.168.1.36:8080 for physical device
    } else if (Platform.OS === 'ios') {
        return API_URL_IOS;
    }
    return API_URL_WEB;
};

const validateApiUrl = () => {
    const url = getApiUrl();
    if (!url) {
        throw new Error('API URL is not configured');
    }
    console.log('\n🌐 API Configuration:', {
        url,
        platform: Platform.OS,
        isEmulator: isEmulator(),
        envUrls: {
            android_emulator: API_URL_ANDROID_EMULATOR,
            android_device: API_URL_ANDROID_DEVICE,
            ios: API_URL_IOS,
            web: API_URL_WEB
        },
        timestamp: new Date().toISOString()
    });
    return url;
};

const apiUrl = validateApiUrl();

const api = axios.create({
    baseURL: apiUrl,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
    timeout: 10000,
});

const log = logger.createLogger({
    severity: "debug",
    transport: (msg) => {
        console.log(msg);
    },
    transportOptions: {
        colors: "ansi"
    }
});

// Enhanced request interceptor
api.interceptors.request.use(
    config => {
        const requestInfo = {
            url: `${config.baseURL}${config.url}`,
            method: config.method?.toUpperCase(),
            headers: config.headers,
            data: config.data,
            platform: Platform.OS,
            isEmulator: isEmulator(),
            timestamp: new Date().toISOString()
        };

        console.log('\n🚀 Request:', JSON.stringify(requestInfo, null, 2));

        // Add timing information
        config.requestStartedAt = Date.now();
        return config;
    },
    error => {
        console.error('\n❌ Request Error:', {
            message: error.message,
            stack: error.stack,
            config: error.config
        });
        return Promise.reject(error);
    }
);

// Enhanced response interceptor
api.interceptors.response.use(
    response => {
        const duration = Date.now() - response.config.requestStartedAt;
        const responseInfo = {
            url: `${response.config.baseURL}${response.config.url}`,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data,
            platform: Platform.OS,
            isEmulator: isEmulator(),
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
        };

        console.log('\n✅ Response:', JSON.stringify(responseInfo, null, 2));
        return response;
    },
    error => {
        log.error('API Error:', {
            url: error.config?.url,
            status: error.response?.status,
            message: error.message,
            data: error.response?.data
        });
        return Promise.reject(error);
    }
);

// Test connection on initialization
const testConnection = async () => {
    try {
        await api.get('/health');
        console.log('🟢 API Connection Test: Success');
    } catch (error) {
        console.error('🔴 API Connection Test: Failed', {
            url: apiUrl,
            error: error.message
        });
    }
};

// Run connection test in development
if (__DEV__) {
    testConnection();
}

export default api;