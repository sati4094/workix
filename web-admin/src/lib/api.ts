import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('workix_token') : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('workix_token');
        localStorage.removeItem('workix_user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error.response?.data || error.message);
  }
);

// API methods
export const apiService = {
  // Auth
  login: (credentials: { email: string; password: string }) => 
    api.post('/auth/login', credentials),
  
  getMe: () => api.get('/auth/me'),
  
  logout: () => api.post('/auth/logout'),
  
  // Users
  getUsers: (params?: any) => api.get('/users', { params }),
  
  getUserById: (id: string) => api.get(`/users/${id}`),
  
  createUser: (data: any) => api.post('/auth/register', data),
  
  updateUser: (id: string, data: any) => api.patch(`/users/${id}`, data),
  
  deleteUser: (id: string) => api.delete(`/users/${id}`),
  
  // Enterprises (formerly Clients)
  getEnterprises: (params?: any) => api.get('/enterprises', { params }),
  
  getEnterpriseById: (id: string) => api.get(`/enterprises/${id}`),
  
  createEnterprise: (data: any) => api.post('/enterprises', data),
  
  updateEnterprise: (id: string, data: any) => api.patch(`/enterprises/${id}`, data),
  
  deleteEnterprise: (id: string) => api.delete(`/enterprises/${id}`),
  
  // Legacy Clients methods (for backward compatibility)
  getClients: (params?: any) => api.get('/enterprises', { params }),
  
  getClientById: (id: string) => api.get(`/enterprises/${id}`),
  
  createClient: (data: any) => api.post('/enterprises', data),
  
  updateClient: (id: string, data: any) => api.patch(`/enterprises/${id}`, data),
  
  deleteClient: (id: string) => api.delete(`/enterprises/${id}`),
  
  // Projects
  getProjects: (params?: any) => api.get('/projects', { params }),
  
  getProjectById: (id: string) => api.get(`/projects/${id}`),
  
  createProject: (data: any) => api.post('/projects', data),
  
  updateProject: (id: string, data: any) => api.patch(`/projects/${id}`, data),
  
  // Buildings
  getBuildings: (params?: any) => api.get('/buildings', { params }),
  
  getBuildingById: (id: string) => api.get(`/buildings/${id}`),
  
  createBuilding: (data: any) => api.post('/buildings', data),
  
  updateBuilding: (id: string, data: any) => api.patch(`/buildings/${id}`, data),
  
  deleteBuilding: (id: string) => api.delete(`/buildings/${id}`),
  
  // Sites
  getSites: (params?: any) => api.get('/sites', { params }),
  
  getSiteById: (id: string) => api.get(`/sites/${id}`),
  
  createSite: (data: any) => api.post('/sites', data),
  
  updateSite: (id: string, data: any) => api.patch(`/sites/${id}`, data),
  
  // Assets
  getAssets: (params?: any) => api.get('/assets', { params }),
  
  getAssetById: (id: string) => api.get(`/assets/${id}`),
  
  createAsset: (data: any) => api.post('/assets', data),
  
  updateAsset: (id: string, data: any) => api.patch(`/assets/${id}`, data),
  
  // Work Orders
  getWorkOrders: (params?: any) => api.get('/work-orders', { params }),
  
  getWorkOrderById: (id: string) => api.get(`/work-orders/${id}`),
  
  createWorkOrder: (data: any) => api.post('/work-orders', data),
  
  updateWorkOrder: (id: string, data: any) => api.patch(`/work-orders/${id}`, data),
  
  deleteWorkOrder: (id: string) => api.delete(`/work-orders/${id}`),
  
  // Work Order Activities
  getActivities: (workOrderId: string) => api.get(`/work-orders/${workOrderId}/activities`),
  
  addActivity: (workOrderId: string, data: any) => api.post(`/work-orders/${workOrderId}/activities`, data),
  
  // PPM
  getPPMPlans: (params?: any) => api.get('/ppm/plans', { params }),
  
  createPPMPlan: (data: any) => api.post('/ppm/plans', data),
  
  getPPMSchedules: (params?: any) => api.get('/ppm/schedules', { params }),
  
  createPPMSchedule: (data: any) => api.post('/ppm/schedules', data),
  
  updatePPMSchedule: (id: string, data: any) => api.patch(`/ppm/schedules/${id}`, data),
  
  // Analytics
  getDashboard: () => api.get('/analytics/dashboard'),
  
  getTrends: (params?: any) => api.get('/analytics/trends', { params }),
  
  getAssetReliability: () => api.get('/analytics/asset-reliability'),
  
  getTechnicianPerformance: () => api.get('/analytics/technician-performance'),
};

export default api;

