import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';

const CACHE_KEY_PREFIX = 'workix_wo_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
    
    // Check cache first
    if (!forceRefresh && state.workOrders.length > 0) {
      const cacheTime = await AsyncStorage.getItem(`${CACHE_KEY_PREFIX}timestamp`);
      if (cacheTime && Date.now() - parseInt(cacheTime) < CACHE_DURATION) {
        return;
      }
    }

    try {
      set({ isLoading: !state.workOrders.length, isRefreshing: !!state.workOrders.length, error: null });
      
      const params = {};
      if (state.filters.status) params.status = state.filters.status;
      if (state.filters.priority) params.priority = state.filters.priority;
      
      const response = await apiService.getWorkOrders(params);
      const workOrders = response.data.work_orders;
      
      // Cache the data
      await AsyncStorage.setItem(`${CACHE_KEY_PREFIX}list`, JSON.stringify(workOrders));
      await AsyncStorage.setItem(`${CACHE_KEY_PREFIX}timestamp`, Date.now().toString());
      
      set({ 
        workOrders, 
        isLoading: false, 
        isRefreshing: false,
        error: null 
      });
    } catch (error) {
      // Try to load from cache on error
      try {
        const cachedData = await AsyncStorage.getItem(`${CACHE_KEY_PREFIX}list`);
        if (cachedData) {
          set({ workOrders: JSON.parse(cachedData) });
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
      
      // Cache individual work order
      await AsyncStorage.setItem(`${CACHE_KEY_PREFIX}${id}`, JSON.stringify(workOrder));
      
      set({ 
        currentWorkOrder: workOrder, 
        activities: workOrder.activities || [],
        isLoading: false 
      });
    } catch (error) {
      // Try cache
      try {
        const cached = await AsyncStorage.getItem(`${CACHE_KEY_PREFIX}${id}`);
        if (cached) {
          const workOrder = JSON.parse(cached);
          set({ 
            currentWorkOrder: workOrder, 
            activities: workOrder.activities || []
          });
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
  updateWorkOrderStatus: async (id, status) => {
    try {
      set({ isLoading: true, error: null });
      
      await apiService.updateWorkOrder(id, { status });
      
      // Update local state
      const updatedWorkOrders = get().workOrders.map(wo =>
        wo.id === id ? { ...wo, status } : wo
      );
      
      if (get().currentWorkOrder?.id === id) {
        set({ currentWorkOrder: { ...get().currentWorkOrder, status } });
      }
      
      set({ workOrders: updatedWorkOrders, isLoading: false });
      
      // Invalidate cache
      await AsyncStorage.removeItem(`${CACHE_KEY_PREFIX}timestamp`);
      
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
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
      
      // Invalidate cache
      await AsyncStorage.removeItem(`${CACHE_KEY_PREFIX}${workOrderId}`);
      await AsyncStorage.removeItem(`${CACHE_KEY_PREFIX}timestamp`);
      
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

