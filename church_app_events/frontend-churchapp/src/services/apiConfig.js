import { Platform } from 'react-native';
import Config from 'react-native-config';
import axios from 'axios';
import { logger } from "react-native-logs";

const isEmulator = () => {
    if (Platform.OS === 'android') {
        return Platform.constants.Brand === 'google' ||
            Platform.constants.Model?.includes('sdk') ||
            Platform.constants.Model?.includes('Simulator');
    } else if (Platform.OS === 'ios') {
        return Platform.constants.isSimulator;
    }
    return false;
};

const getBaseUrl = () => {
    const platform = Platform.OS;
    const emulator = isEmulator();

    let baseUrl;
    if (platform === 'android') {
        baseUrl = emulator
            ? Config.API_URL_ANDROID_EMULATOR
            : Config.API_URL_ANDROID_DEVICE;
    } else if (platform === 'ios') {
        baseUrl = Config.API_URL_IOS;
    } else {
        baseUrl = Config.API_URL_WEB;
    }

    console.log('Platform:', platform);
    console.log('Is Emulator:', emulator);
    console.log('Base URL:', baseUrl);

    return baseUrl;
};

const baseURL = getBaseUrl();

const api = axios.create({
    baseURL,
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
            url: baseURL,
            error: error.message
        });
    }
};

// Run connection test in development
if (__DEV__) {
    testConnection();
}

export const apiConfig = {
    baseURL,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
    timeout: 10000,
};