import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { API_CONFIG } from '../config/api';
import { useAuthStore } from '../store/authStore';
import { addToOfflineQueue, isOnline } from './offlineService';

// Create axios instance
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config) => {
    const token = useAuthStore.getState().token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      // Queue request for later if it's a mutation
      if (config.method !== 'get') {
        addToOfflineQueue({
          url: config.url,
          method: config.method,
          data: config.data,
          timestamp: Date.now(),
        });
        
        throw new Error('No internet connection. Request queued for later.');
      } else {
        throw new Error('No internet connection. Please try again when online.');
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    if (error.response) {
      // Server responded with error
      const { status } = error.response;
      
      if (status === 401) {
        // Unauthorized - Clear auth and redirect to login
        useAuthStore.getState().logout();
      }
      
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // Request made but no response
      return Promise.reject({
        message: 'Network error. Please check your connection.',
      });
    } else {
      // Something else happened
      return Promise.reject({
        message: error.message || 'An unexpected error occurred.',
      });
    }
  }
);

// API Methods
export const apiService = {
  // Auth
  login: (credentials) => api.post(API_CONFIG.ENDPOINTS.LOGIN, credentials),
  register: (userData) => api.post(API_CONFIG.ENDPOINTS.REGISTER, userData),
  getMe: () => api.get(API_CONFIG.ENDPOINTS.ME),
  logout: () => api.post(API_CONFIG.ENDPOINTS.LOGOUT),
  changePassword: (data) => api.post(API_CONFIG.ENDPOINTS.CHANGE_PASSWORD, data),
  
  // Work Orders
  getWorkOrders: (params) => api.get(API_CONFIG.ENDPOINTS.WORK_ORDERS, { params }),
  getWorkOrderById: (id) => api.get(`${API_CONFIG.ENDPOINTS.WORK_ORDERS}/${id}`),
  createWorkOrder: (data) => api.post(API_CONFIG.ENDPOINTS.WORK_ORDERS, data),
  updateWorkOrder: (id, data) => api.patch(`${API_CONFIG.ENDPOINTS.WORK_ORDERS}/${id}`, data),
  
  // Work Order Activities
  getActivities: (workOrderId) => api.get(API_CONFIG.ENDPOINTS.WORK_ORDER_ACTIVITIES(workOrderId)),
  addActivity: (workOrderId, data) => api.post(API_CONFIG.ENDPOINTS.WORK_ORDER_ACTIVITIES(workOrderId), data),
  
  // AI
  enhanceText: (text, context) => api.post(API_CONFIG.ENDPOINTS.AI_ENHANCE, { text, context }),
  batchEnhance: (texts) => api.post(API_CONFIG.ENDPOINTS.AI_BATCH_ENHANCE, { texts }),
  
  // Assets
  getAssets: (params) => api.get(API_CONFIG.ENDPOINTS.ASSETS, { params }),
  getAssetById: (id) => api.get(`${API_CONFIG.ENDPOINTS.ASSETS}/${id}`),
  
  // Sites
  getSites: (params) => api.get(API_CONFIG.ENDPOINTS.SITES, { params }),
  getSiteById: (id) => api.get(`${API_CONFIG.ENDPOINTS.SITES}/${id}`),
  
  // PPM
  getPPMSchedules: (params) => api.get(API_CONFIG.ENDPOINTS.PPM_SCHEDULES, { params }),
  updatePPMSchedule: (id, data) => api.patch(`${API_CONFIG.ENDPOINTS.PPM_SCHEDULES}/${id}`, data),
};

export default api;

