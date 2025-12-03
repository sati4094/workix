import { create } from 'zustand';
import { apiService } from '../services/api';
import {
  cacheWorkOrders,
  getCachedWorkOrders,
  isOnline,
} from '../services/offlineService';

export const useWorkOrderStore = create((set, get) => ({
  workOrders: [],
  currentWorkOrder: null,
  activities: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  filters: {
    status: null,
    priority: null,
  },

  // Fetch work orders
  fetchWorkOrders: async (forceRefresh = false) => {
    const state = get();

    try {
      set({ isLoading: !state.workOrders.length, isRefreshing: !!state.workOrders.length, error: null });

      const params = {};
      if (state.filters.status) params.status = state.filters.status;
      if (state.filters.priority) params.priority = state.filters.priority;

      let workOrders = [];
      let shouldCache = true;

      if (!forceRefresh && !isOnline()) {
        shouldCache = false;
        const cached = await getCachedWorkOrders();
        workOrders = cached.workOrders ?? [];
      } else {
        const response = await apiService.getWorkOrders(params);
        workOrders = response.data.work_orders ?? [];
      }

      if (shouldCache) {
        await cacheWorkOrders(workOrders);
      }

      set({ 
        workOrders, 
        isLoading: false, 
        isRefreshing: false,
        error: null 
      });
    } catch (error) {
      try {
        const cached = await getCachedWorkOrders();
        if (cached.workOrders?.length) {
          set({ workOrders: cached.workOrders });
        }
      } catch (cacheError) {
        console.error('Failed to load from cache:', cacheError);
      }
      
      set({ 
        error: error.message || 'Failed to fetch work orders', 
        isLoading: false,
        isRefreshing: false
      });
    }
  },

  // Fetch single work order
  fetchWorkOrderById: async (id) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiService.getWorkOrderById(id);
      const workOrder = response.data.work_order;

      await cacheWorkOrders([workOrder]);

      set({ 
        currentWorkOrder: workOrder, 
        activities: workOrder.activities || [],
        isLoading: false 
      });
    } catch (error) {
      try {
        const cached = await getCachedWorkOrders();
        const workOrder = cached.workOrders?.find((wo) => wo.id === id);
        if (workOrder) {
          set({ currentWorkOrder: workOrder, activities: workOrder.activities || [] });
        }
      } catch (cacheError) {
        console.error('Cache error:', cacheError);
      }
      
      set({ 
        error: error.message || 'Failed to fetch work order', 
        isLoading: false 
      });
    }
  },

  // Update work order status
  updateWorkOrderStatus: async (id, status, options = {}) => {
    const { optimistic = false } = options;
    const previousOrders = get().workOrders;
    try {
      set({ isLoading: !optimistic, error: null });

      if (optimistic) {
        const optimisticOrders = previousOrders.map((wo) =>
          wo.id === id ? { ...wo, status } : wo,
        );
        set({ workOrders: optimisticOrders });
      }

      await apiService.updateWorkOrder(id, { status });
      const refreshedOrders = previousOrders.map((wo) =>
        wo.id === id ? { ...wo, status } : wo,
      );

      if (get().currentWorkOrder?.id === id) {
        set({ currentWorkOrder: { ...get().currentWorkOrder, status } });
      }

      set({ workOrders: refreshedOrders, isLoading: false });
      await cacheWorkOrders(refreshedOrders);

      return { success: true, queued: false };
    } catch (error) {
      const message = error.message ?? 'Failed to update';

      if (message.includes('queued for later')) {
        set({ isLoading: false });
        return { success: true, queued: true };
      }

      if (optimistic) {
        set({ workOrders: previousOrders });
      }

      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Add activity
  addActivity: async (workOrderId, activityData) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiService.addActivity(workOrderId, activityData);
      const newActivity = response.data.activity;
      
      // Update activities
      const updatedActivities = [newActivity, ...get().activities];
      
      set({ 
        activities: updatedActivities, 
        isLoading: false 
      });

      const current = get().currentWorkOrder;
      if (current && current.id === workOrderId) {
        const updatedWorkOrder = { ...current, activities: updatedActivities };
        set({ currentWorkOrder: updatedWorkOrder });
        await cacheWorkOrders([updatedWorkOrder]);
      }
      
      return { success: true, activity: newActivity };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Set filters
  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Clear current work order
  clearCurrentWorkOrder: () => set({ currentWorkOrder: null, activities: [] }),
}));

