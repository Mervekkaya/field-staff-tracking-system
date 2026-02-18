


// Emülatör için 
// export const API_URL = 'http://10.0.2.2:3000';

// Fiziksel cihaz için 
export const API_URL = 'http://192.168.1.104:3000';  

// API Endpoints
export const API_ENDPOINTS = {
    TEST: '/test',
    HEALTH: '/health',
    AUTH: {
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        LOGOUT: '/api/auth/logout'
    },
    LOCATIONS: {
        SAVE: '/api/locations/save',
        GET_ALL: '/api/locations',
        GET_BY_DATE: '/api/locations/date'
    },
    USERS: {
        PROFILE: '/api/users/profile',
        UPDATE: '/api/users/update'
    }
};

// Request timeout (ms)
export const REQUEST_TIMEOUT = 10000;

// Default headers
export const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
};