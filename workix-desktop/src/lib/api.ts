import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store';
import type {
  WorkOrder,
  Asset,
  Enterprise,
  Client, // @deprecated - use Enterprise instead
  Project,
  Site,
  User,
  PPMSchedule,
  WorkOrderActivity,
  DashboardStats,
  WorkOrderFilters,
  AssetFilters,
  PaginationParams,
} from '@/types';
import type {
  Building,
  Floor,
  Space,
  Part,
  Storeroom,
  Vendor,
  Team,
  Role,
  AssetCategory,
  AssetType,
} from '@/types/enterprise';

const API_BASE_URL = 'http://localhost:5000/api/v1';
const API_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(error);
    }

    const shouldRetry = !error.response || (error.response.status >= 500 && error.response.status < 600);
    if (shouldRetry && originalRequest && !originalRequest._retry) {
      originalRequest._retryCount = originalRequest._retryCount || 0;
      if (originalRequest._retryCount < MAX_RETRIES) {
        originalRequest._retryCount++;
        originalRequest._retry = true;
        const retryDelay = RETRY_DELAY * Math.pow(2, (originalRequest._retryCount || 1) - 1);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiClient.post('/auth/login', { email, password }),
    register: (data: { name: string; email: string; password: string }) =>
      apiClient.post('/auth/register', data),
    logout: () => apiClient.post('/auth/logout'),
    getProfile: () => apiClient.get('/auth/profile'),
  },

  workOrders: {
    getAll: (params?: WorkOrderFilters & PaginationParams) =>
      apiClient.get('/work-orders', { params }),
    getById: (id: string) => apiClient.get(`/work-orders/${id}`),
    create: (data: Partial<WorkOrder>) => apiClient.post('/work-orders', data),
    update: (id: string, data: Partial<WorkOrder>) => apiClient.patch(`/work-orders/${id}`, data),
    delete: (id: string) => apiClient.delete(`/work-orders/${id}`),
    getActivities: (workOrderId: string) => apiClient.get(`/work-orders/${workOrderId}/activities`),
    addActivity: (workOrderId: string, data: Partial<WorkOrderActivity>) =>
      apiClient.post(`/work-orders/${workOrderId}/activities`, data),
    enhanceDescription: (workOrderId: string, description: string) =>
      apiClient.post(`/work-orders/${workOrderId}/enhance-description`, { description }),
  },

  assets: {
    getAll: (params?: AssetFilters & PaginationParams) => apiClient.get('/assets', { params }),
    getById: (id: string) => apiClient.get(`/assets/${id}`),
    create: (data: Partial<Asset>) => apiClient.post('/assets', data),
    update: (id: string, data: Partial<Asset>) => apiClient.patch(`/assets/${id}`, data),
    delete: (id: string) => apiClient.delete(`/assets/${id}`),
  },

  // Enterprises (Primary naming convention)
  enterprises: {
    getAll: (params?: PaginationParams) => apiClient.get('/enterprises', { params }),
    getById: (id: string) => apiClient.get(`/enterprises/${id}`),
    create: (data: Partial<Enterprise>) => apiClient.post('/enterprises', data),
    update: (id: string, data: Partial<Enterprise>) => apiClient.patch(`/enterprises/${id}`, data),
    delete: (id: string) => apiClient.delete(`/enterprises/${id}`),
    getStats: (id: string) => apiClient.get(`/enterprises/${id}/stats`),
  },

  /** @deprecated Use api.enterprises instead - kept for backward compatibility */
  clients: {
    getAll: (params?: PaginationParams) => apiClient.get('/enterprises', { params }),
    getById: (id: string) => apiClient.get(`/enterprises/${id}`),
    create: (data: Partial<Enterprise>) => apiClient.post('/enterprises', data),
    update: (id: string, data: Partial<Enterprise>) => apiClient.patch(`/enterprises/${id}`, data),
    delete: (id: string) => apiClient.delete(`/enterprises/${id}`),
  },

  projects: {
    getAll: (params?: PaginationParams) => apiClient.get('/projects', { params }),
    getById: (id: string) => apiClient.get(`/projects/${id}`),
    create: (data: Partial<Project>) => apiClient.post('/projects', data),
    update: (id: string, data: Partial<Project>) => apiClient.patch(`/projects/${id}`, data),
    delete: (id: string) => apiClient.delete(`/projects/${id}`),
  },

  sites: {
    getAll: (params?: PaginationParams) => apiClient.get('/sites', { params }),
    getById: (id: string) => apiClient.get(`/sites/${id}`),
    create: (data: Partial<Site>) => apiClient.post('/sites', data),
    update: (id: string, data: Partial<Site>) => apiClient.patch(`/sites/${id}`, data),
    delete: (id: string) => apiClient.delete(`/sites/${id}`),
  },

  users: {
    getAll: (params?: PaginationParams) => apiClient.get('/users', { params }),
    getById: (id: string) => apiClient.get(`/users/${id}`),
    create: (data: Partial<User>) => apiClient.post('/users', data),
    update: (id: string, data: Partial<User>) => apiClient.patch(`/users/${id}`, data),
    delete: (id: string) => apiClient.delete(`/users/${id}`),
  },

  ppm: {
    getAll: (params?: PaginationParams) => apiClient.get('/ppm', { params }),
    getById: (id: string) => apiClient.get(`/ppm/${id}`),
    create: (data: Partial<PPMSchedule>) => apiClient.post('/ppm', data),
    update: (id: string, data: Partial<PPMSchedule>) => apiClient.patch(`/ppm/${id}`, data),
    delete: (id: string) => apiClient.delete(`/ppm/${id}`),
  },

  analytics: {
    getDashboardStats: (params?: { timeRange?: string }) => apiClient.get('/analytics/dashboard', { params }),
    getRealTimeMetrics: () => apiClient.get('/analytics/real-time'),
    getTrends: (period?: string) => apiClient.get('/analytics/trends', { params: { period } }),
    getAssetReliability: () => apiClient.get('/analytics/asset-reliability'),
    getTechnicianPerformance: () => apiClient.get('/analytics/technician-performance'),
    getMTTR: () => apiClient.get('/analytics/mttr'),
    getBySource: () => apiClient.get('/analytics/by-source'),
  },

  templates: {
    getAll: (params?: { category?: string; is_active?: boolean; priority?: string }) => 
      apiClient.get('/templates', { params }),
    getById: (id: string) => apiClient.get(`/templates/${id}`),
    getCategories: () => apiClient.get('/templates/categories'),
    create: (data: any) => apiClient.post('/templates', data),
    update: (id: string, data: any) => apiClient.put(`/templates/${id}`, data),
    delete: (id: string) => apiClient.delete(`/templates/${id}`),
  },

  sla: {
    policies: {
      getAll: (params?: { priority?: string; is_active?: boolean }) => 
        apiClient.get('/sla/policies', { params }),
      getById: (id: string) => apiClient.get(`/sla/policies/${id}`),
      create: (data: any) => apiClient.post('/sla/policies', data),
      update: (id: string, data: any) => apiClient.put(`/sla/policies/${id}`, data),
      delete: (id: string) => apiClient.delete(`/sla/policies/${id}`),
    },
    violations: {
      getAll: (params?: { work_order_id?: string; violation_type?: string; escalation_level?: number }) => 
        apiClient.get('/sla/violations', { params }),
    },
  },

  inventory: {
    items: {
      getAll: (params?: { category?: string; is_active?: boolean; low_stock?: boolean }) => 
        apiClient.get('/inventory/items', { params }),
      getById: (id: string) => apiClient.get(`/inventory/items/${id}`),
      getCategories: () => apiClient.get('/inventory/items/categories'),
      create: (data: any) => apiClient.post('/inventory/items', data),
      update: (id: string, data: any) => apiClient.put(`/inventory/items/${id}`, data),
      delete: (id: string) => apiClient.delete(`/inventory/items/${id}`),
    },
    partsUsage: {
      getAll: (params?: { work_order_id?: string }) => 
        apiClient.get('/inventory/parts-usage', { params }),
      record: (data: any) => apiClient.post('/inventory/parts-usage', data),
    },
    transactions: {
      getAll: (params?: { inventory_item_id?: string; transaction_type?: string }) => 
        apiClient.get('/inventory/transactions', { params }),
    },
  },

  attachments: {
    workOrders: {
      getAll: (params?: { work_order_id?: string }) => 
        apiClient.get('/attachments/work-orders', { params }),
      upload: (formData: FormData) => 
        apiClient.post('/attachments/work-orders', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }),
      delete: (id: string) => apiClient.delete(`/attachments/work-orders/${id}`),
    },
    assets: {
      getAll: (params?: { asset_id?: string; document_type?: string }) => 
        apiClient.get('/attachments/assets', { params }),
      upload: (formData: FormData) => 
        apiClient.post('/attachments/assets', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }),
      delete: (id: string) => apiClient.delete(`/attachments/assets/${id}`),
    },
  },

  notifications: {
    getAll: (params?: { is_read?: boolean; notification_type?: string; priority?: string }) => 
      apiClient.get('/notifications', { params }),
    getUnreadCount: () => apiClient.get('/notifications/unread-count'),
    markAsRead: (id: string) => apiClient.put(`/notifications/${id}/read`),
    markAllAsRead: () => apiClient.put('/notifications/mark-all-read'),
    delete: (id: string) => apiClient.delete(`/notifications/${id}`),
  },

  // ============================================
  // ENTERPRISE ENDPOINTS
  // ============================================

  buildings: {
    getAll: (params?: { site_id?: string; search?: string } & PaginationParams) =>
      apiClient.get('/buildings', { params }),
    getById: (id: number) => apiClient.get(`/buildings/${id}`),
    create: (data: Partial<Building>) => apiClient.post('/buildings', data),
    update: (id: number, data: Partial<Building>) => apiClient.patch(`/buildings/${id}`, data),
    delete: (id: number) => apiClient.delete(`/buildings/${id}`),
  },

  floors: {
    getAll: (params?: { building_id?: number } & PaginationParams) =>
      apiClient.get('/floors', { params }),
    getById: (id: number) => apiClient.get(`/floors/${id}`),
    create: (data: Partial<Floor>) => apiClient.post('/floors', data),
    update: (id: number, data: Partial<Floor>) => apiClient.patch(`/floors/${id}`, data),
    delete: (id: number) => apiClient.delete(`/floors/${id}`),
  },

  spaces: {
    getAll: (params?: { floor_id?: number; space_type?: string } & PaginationParams) =>
      apiClient.get('/spaces', { params }),
    getById: (id: number) => apiClient.get(`/spaces/${id}`),
    create: (data: Partial<Space>) => apiClient.post('/spaces', data),
    update: (id: number, data: Partial<Space>) => apiClient.patch(`/spaces/${id}`, data),
    delete: (id: number) => apiClient.delete(`/spaces/${id}`),
  },

  parts: {
    getAll: (params?: { search?: string; category_id?: number; low_stock?: boolean } & PaginationParams) =>
      apiClient.get('/parts', { params }),
    getById: (id: number) => apiClient.get(`/parts/${id}`),
    getLowStock: () => apiClient.get('/parts/low-stock'),
    create: (data: Partial<Part>) => apiClient.post('/parts', data),
    update: (id: number, data: Partial<Part>) => apiClient.patch(`/parts/${id}`, data),
    delete: (id: number) => apiClient.delete(`/parts/${id}`),
  },

  storerooms: {
    getAll: (params?: { organization_id?: number; site_id?: string } & PaginationParams) =>
      apiClient.get('/storerooms', { params }),
    getById: (id: number) => apiClient.get(`/storerooms/${id}`),
    create: (data: Partial<Storeroom>) => apiClient.post('/storerooms', data),
    update: (id: number, data: Partial<Storeroom>) => apiClient.patch(`/storerooms/${id}`, data),
    delete: (id: number) => apiClient.delete(`/storerooms/${id}`),
  },

  vendors: {
    getAll: (params?: { vendor_type?: string; search?: string } & PaginationParams) =>
      apiClient.get('/vendors', { params }),
    getById: (id: number) => apiClient.get(`/vendors/${id}`),
    create: (data: Partial<Vendor>) => apiClient.post('/vendors', data),
    update: (id: number, data: Partial<Vendor>) => apiClient.patch(`/vendors/${id}`, data),
    delete: (id: number) => apiClient.delete(`/vendors/${id}`),
  },

  teams: {
    getAll: (params?: { organization_id?: number } & PaginationParams) =>
      apiClient.get('/teams', { params }),
    getById: (id: number) => apiClient.get(`/teams/${id}`),
    create: (data: Partial<Team>) => apiClient.post('/teams', data),
    update: (id: number, data: Partial<Team>) => apiClient.patch(`/teams/${id}`, data),
    delete: (id: number) => apiClient.delete(`/teams/${id}`),
    addMember: (teamId: number, userId: number) =>
      apiClient.post(`/teams/${teamId}/members`, { user_id: userId }),
    removeMember: (teamId: number, userId: number) =>
      apiClient.delete(`/teams/${teamId}/members/${userId}`),
  },

  roles: {
    getAll: (params?: { organization_id?: number } & PaginationParams) =>
      apiClient.get('/roles', { params }),
    getById: (id: number) => apiClient.get(`/roles/${id}`),
    create: (data: Partial<Role>) => apiClient.post('/roles', data),
    update: (id: number, data: Partial<Role>) => apiClient.patch(`/roles/${id}`, data),
    delete: (id: number) => apiClient.delete(`/roles/${id}`),
  },

  assetCategories: {
    getAll: (params?: { organization_id?: number; parent_id?: number } & PaginationParams) =>
      apiClient.get('/asset-categories', { params }),
    getById: (id: number) => apiClient.get(`/asset-categories/${id}`),
    create: (data: Partial<AssetCategory>) => apiClient.post('/asset-categories', data),
    update: (id: number, data: Partial<AssetCategory>) => apiClient.patch(`/asset-categories/${id}`, data),
    delete: (id: number) => apiClient.delete(`/asset-categories/${id}`),
  },

  assetTypes: {
    getAll: (params?: { category_id?: number } & PaginationParams) =>
      apiClient.get('/asset-types', { params }),
    getById: (id: number) => apiClient.get(`/asset-types/${id}`),
    create: (data: Partial<AssetType>) => apiClient.post('/asset-types', data),
    update: (id: number, data: Partial<AssetType>) => apiClient.patch(`/asset-types/${id}`, data),
    delete: (id: number) => apiClient.delete(`/asset-types/${id}`),
  },

  // Sync endpoints for offline support
  sync: {
    getStatus: () => apiClient.get('/sync/status'),
    getWorkOrders: (params: { updated_since: number; limit?: number }) =>
      apiClient.get('/sync/work-orders', { params }),
    pushWorkOrders: (data: { work_orders: any[] }) =>
      apiClient.post('/sync/work-orders', data),
    getActivities: (params: { updated_since: number; work_order_id?: string; limit?: number }) =>
      apiClient.get('/sync/activities', { params }),
    pushActivities: (data: { activities: any[] }) =>
      apiClient.post('/sync/activities', data),
  },
};

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    if (axiosError.response?.data) {
      return axiosError.response.data.message || axiosError.response.data.error || 'An error occurred';
    }
    if (axiosError.message) return axiosError.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
};

// Default export
export default apiClient;
