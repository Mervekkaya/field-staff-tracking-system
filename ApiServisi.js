import axios from 'axios';
import { API_URL, REQUEST_TIMEOUT, DEFAULT_HEADERS } from '../config/constants';

// Axios instance oluştur
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT,
  headers: DEFAULT_HEADERS
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Token'ı header'a ekle (eğer varsa)
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const token = await AsyncStorage.default.getItem('auth_token');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Token ekleme hatası:', error);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

class ApiServisi {
  // Test bağlantısı
  async testConnection() {
    try {
      const response = await apiClient.get('/test');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await apiClient.get('/health');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Database test
  async testDatabase() {
    try {
      const response = await apiClient.get('/test/database');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  // Database migration
  async migrateDatabase() {
    try {
      const response = await apiClient.post('/admin/migrate');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  // Genel GET request
  async get(endpoint) {
    try {
      const response = await apiClient.get(endpoint);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  // Genel POST request
  async post(endpoint, data) {
    try {
      const response = await apiClient.post(endpoint, data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // Network error kontrolü
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message.includes('Network Error')) {
        console.error('❌ Network Error:', error.message);
        return {
          success: false,
          error: 'Sunucuya bağlanılamadı. Lütfen backend sunucusunun çalıştığından ve API_URL ayarının doğru olduğundan emin olun.',
          details: { error: 'NETWORK_ERROR', code: error.code }
        };
      }
      
      // Timeout error
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.',
          details: { error: 'TIMEOUT_ERROR' }
        };
      }

      return {
        success: false,
        error: error.message,
        details: error.response?.data || { error: 'UNKNOWN_ERROR' }
      };
    }
  }

  // Konum kaydet
  async saveLocation(locationData) {
    try {
      const response = await apiClient.post('/api/locations', locationData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Konum kaydetme hatası:', error);
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  // Toplu konum kaydet
  async saveBulkLocations(locations) {
    try {
      const response = await apiClient.post('/api/locations/bulk', { locations });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Toplu konum kaydetme hatası:', error);
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  // Son konumları getir
  async getRecentLocations(limit = 100) {
    try {
      const response = await apiClient.get(`/api/locations/recent?limit=${limit}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Konum getirme hatası:', error);
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  // En son konumu getir
  async getLatestLocation() {
    try {
      const response = await apiClient.get('/api/locations/latest');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Son konum getirme hatası:', error);
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }
}

export default new ApiServisi();