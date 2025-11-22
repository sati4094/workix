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
