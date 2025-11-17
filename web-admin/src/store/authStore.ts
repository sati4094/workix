import { create } from 'zustand';
import { apiService } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  initializeAuth: () => void;
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initializeAuth: () => {
    try {
      const token = localStorage.getItem('workix_token');
      const userJson = localStorage.getItem('workix_user');
      
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

  login: async (credentials) => {
    try {
      set({ isLoading: true, error: null });
      
      const response: any = await apiService.login(credentials);
      const { user, token } = response.data;
      
      // Store credentials
      localStorage.setItem('workix_token', token);
      localStorage.setItem('workix_user', JSON.stringify(user));
      
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      return { success: true };
    } catch (error: any) {
      set({
        error: error.message || 'Login failed',
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  logout: () => {
    try {
      apiService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      localStorage.removeItem('workix_token');
      localStorage.removeItem('workix_user');
      
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),
}));

