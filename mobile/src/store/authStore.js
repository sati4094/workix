import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { apiService } from '../services/api';

const TOKEN_KEY = 'workix_auth_token';
const USER_KEY = 'workix_user';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Initialize auth from stored credentials
  initializeAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userJson = await SecureStore.getItemAsync(USER_KEY);
      
      if (token && userJson) {
        const user = JSON.parse(userJson);
        set({ token, user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({ isLoading: false });
    }
  },

  // Login
  login: async (credentials) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiService.login(credentials);
      const { user, token } = response.data;
      
      // Store credentials securely
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      return { success: true };
    } catch (error) {
      set({
        error: error.message || 'Login failed',
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Logout
  logout: async () => {
    try {
      // Call logout API
      await apiService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear stored credentials regardless of API call result
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },

  // Update user profile
  updateUser: (userData) => {
    const updatedUser = { ...get().user, ...userData };
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

