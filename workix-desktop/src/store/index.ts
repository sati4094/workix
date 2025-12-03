import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  hydrated: boolean;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      hydrated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false, token: null }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'workix-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

// Settings Store - persisted to localStorage
interface SettingsState {
  language: string;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  darkMode: boolean;
  apiUrl: string;
  setLanguage: (language: string) => void;
  setTimezone: (timezone: string) => void;
  setEmailNotifications: (enabled: boolean) => void;
  setPushNotifications: (enabled: boolean) => void;
  setDarkMode: (enabled: boolean) => void;
  setApiUrl: (url: string) => void;
  resetSettings: () => void;
}

const defaultSettings = {
  language: 'en',
  timezone: 'UTC',
  emailNotifications: true,
  pushNotifications: true,
  darkMode: false,
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setLanguage: (language) => set({ language }),
      setTimezone: (timezone) => set({ timezone }),
      setEmailNotifications: (emailNotifications) => set({ emailNotifications }),
      setPushNotifications: (pushNotifications) => set({ pushNotifications }),
      setDarkMode: (darkMode) => set({ darkMode }),
      setApiUrl: (apiUrl) => set({ apiUrl }),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'workix-settings',
    }
  )
);

// Connection/Offline Status Store
interface ConnectionState {
  isOnline: boolean;
  isBackendReachable: boolean;
  lastChecked: string | null;
  retryCount: number;
  setOnline: (status: boolean) => void;
  setBackendReachable: (status: boolean) => void;
  setLastChecked: (timestamp: string) => void;
  incrementRetry: () => void;
  resetRetry: () => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isBackendReachable: true,
  lastChecked: null,
  retryCount: 0,
  setOnline: (isOnline) => set({ isOnline }),
  setBackendReachable: (isBackendReachable) => set({ isBackendReachable }),
  setLastChecked: (lastChecked) => set({ lastChecked }),
  incrementRetry: () => set((state) => ({ retryCount: state.retryCount + 1 })),
  resetRetry: () => set({ retryCount: 0 }),
}));

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: 'light',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}));

interface DataState {
  workOrders: any[];
  users: any[];
  loading: boolean;
  setWorkOrders: (orders: any[]) => void;
  setUsers: (users: any[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useDataStore = create<DataState>((set) => ({
  workOrders: [],
  users: [],
  loading: false,
  setWorkOrders: (workOrders) => set({ workOrders }),
  setUsers: (users) => set({ users }),
  setLoading: (loading) => set({ loading }),
}));
